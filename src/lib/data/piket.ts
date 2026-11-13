import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { sanitizeCsvCell } from '@/lib/security/guards';
import type {
  BoardMember,
  DivisionCode,
  PiketAttendance,
  PiketEligibleMember,
  PiketScheduleEntry,
  PiketSettings,
  UserProfile,
} from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import {
  canManagePiket,
  canSubmitPiketAttendance,
  canSupervisePiket,
  canViewAllPiketReports,
} from '@/lib/auth/permissions';
import {
  calculateDistanceMeters,
  DEFAULT_GALERI_COORDS,
  evaluateTimeStatus,
  formatDistance,
  getWibNow,
  isMandatoryPiketMember,
  PIKET_DAY_CODES,
  PIKET_SESSIONS,
} from '@/lib/utils/piket';
import type {
  PiketAttendanceInput,
  PiketScheduleAssignInput,
  PiketSettingsInput,
  PiketSupervisorNoteInput,
  PiketVerifyInput,
} from '@/lib/schemas/piket';
import { badRequest, conflict, forbidden, notFound } from '@/lib/errors';
import { buildAudit, writeAudit } from '@/lib/data/audit';
import { seedInitialPeriodAndDivisions } from '@/lib/auth/bootstrap';

const SETTINGS_DOC = 'piket_settings/default';
const MANAGE_ERR = 'Hanya Kepala Divisi atau Wakil Kepala Divisi Galeri yang dapat mengatur jadwal dan laporan piket.';

const DAY_ORDER: Record<string, number> = {
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
};

const SESSION_ORDER: Record<string, number> = {
  PAGI: 1,
  SIANG: 2,
};

/**
 * Mengambil konfigurasi lokasi & aturan piket Galeri.
 */
export async function getPiketSettings(): Promise<PiketSettings> {
  try {
    const snap = await adminDb.doc(SETTINGS_DOC).get();
    if (!snap.exists) {
      return {
        ...DEFAULT_GALERI_COORDS,
        enforce_radius: false,
        enforce_schedule: false,
        updated_at: new Date().toISOString(),
        updated_by: 'system',
        updated_by_name: 'Default Sistem',
      };
    }
    const data = snap.data() as Partial<PiketSettings>;
    return {
      location_name: data.location_name || DEFAULT_GALERI_COORDS.location_name,
      latitude: typeof data.latitude === 'number' ? data.latitude : DEFAULT_GALERI_COORDS.latitude,
      longitude: typeof data.longitude === 'number' ? data.longitude : DEFAULT_GALERI_COORDS.longitude,
      radius_meters: typeof data.radius_meters === 'number' ? data.radius_meters : DEFAULT_GALERI_COORDS.radius_meters,
      enforce_radius: Boolean(data.enforce_radius),
      enforce_schedule: Boolean(data.enforce_schedule),
      updated_at: data.updated_at || new Date().toISOString(),
      updated_by: data.updated_by || 'system',
      updated_by_name: data.updated_by_name,
    };
  } catch {
    return {
      ...DEFAULT_GALERI_COORDS,
      enforce_radius: false,
      enforce_schedule: false,
      updated_at: new Date().toISOString(),
      updated_by: 'system',
      updated_by_name: 'Default Sistem',
    };
  }
}

/**
 * Memperbarui koordinat lokasi & kebijakan ketat piket (khusus Kadiv/Wakadiv Galeri).
 */
export async function updatePiketSettings(
  actor: UserProfile,
  input: PiketSettingsInput
): Promise<PiketSettings> {
  if (!canManagePiket(actor)) throw forbidden(MANAGE_ERR);

  const settings: PiketSettings = {
    location_name: input.location_name,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_meters: input.radius_meters,
    enforce_radius: input.enforce_radius,
    enforce_schedule: input.enforce_schedule,
    updated_at: new Date().toISOString(),
    updated_by: actor.uid,
    updated_by_name: actor.full_name,
  };

  await adminDb.doc(SETTINGS_DOC).set(settings, { merge: true });
  await writeAudit(actor, {
    action: 'UPDATE',
    target_collection: 'piket_settings',
    target_id: 'default',
    summary: `Memperbarui lokasi piket "${settings.location_name}" (${settings.latitude.toFixed(5)}, ${settings.longitude.toFixed(5)}, radius ${settings.radius_meters}m)`,
  });

  return settings;
}

/**
 * Menggabungkan pengurus dari board_members periode aktif & akun aktif users,
 * sambil menyembunyikan akun sistem internal dan menandai Presidium sebagai Pengawas.
 */
export async function listEligiblePiketMembers(periodId: string): Promise<PiketEligibleMember[]> {
  const [boardSnap, usersSnap] = await Promise.all([
    adminDb.collection('board_members').where('period_id', '==', periodId).get(),
    adminDb.collection('users').get(),
  ]);

  const usersByUid = new Map<string, UserProfile>();
  usersSnap.docs.forEach((d) => {
    const u = { ...d.data(), uid: d.id } as UserProfile;
    if (u.is_active !== false && u.role !== 'creator') {
      usersByUid.set(u.uid, u);
    }
  });

  const seenUserIds = new Set<string>();
  const result: PiketEligibleMember[] = [];

  boardSnap.docs.forEach((d) => {
    const m = d.data() as BoardMember;
    if (m.is_active === false) return;

    const linkedUser = m.user_id ? usersByUid.get(m.user_id) : undefined;
    if (m.user_id) seenUserIds.add(m.user_id);

    const role = linkedUser?.role ?? 'member';
    const divisionCode = (linkedUser?.division_code || m.division_code) as DivisionCode;

    result.push({
      key: m.user_id || m.id,
      user_id: m.user_id || '',
      board_member_id: m.id,
      full_name: linkedUser?.full_name || m.full_name,
      division_code: divisionCode,
      position_title: linkedUser?.position_title || m.position_title,
      role,
      photo_url: linkedUser?.avatar_url || m.photo_url || '',
      has_account: !!linkedUser,
      is_mandatory_piket: isMandatoryPiketMember({ role, division_code: divisionCode }),
    });
  });

  // Sertakan akun aktif yang mungkin belum masuk board_members (kecuali creator)
  usersByUid.forEach((u) => {
    if (seenUserIds.has(u.uid)) return;
    if (!u.division_code) return;
    const divisionCode = u.division_code as DivisionCode;
    result.push({
      key: u.uid,
      user_id: u.uid,
      board_member_id: '',
      full_name: u.full_name,
      division_code: divisionCode,
      position_title: u.position_title || 'Pengurus GIBEI',
      role: u.role,
      photo_url: u.avatar_url || '',
      has_account: true,
      is_mandatory_piket: isMandatoryPiketMember({ role: u.role, division_code: divisionCode }),
    });
  });

  return result.sort((a, b) => {
    const divOrderA = OFFICIAL_DIVISIONS[a.division_code]?.order ?? 99;
    const divOrderB = OFFICIAL_DIVISIONS[b.division_code]?.order ?? 99;
    return divOrderA - divOrderB || a.full_name.localeCompare(b.full_name);
  });
}

/**
 * Daftar jadwal piket mingguan untuk periode tertentu.
 */
export async function listPiketSchedules(periodId: string): Promise<PiketScheduleEntry[]> {
  const snap = await adminDb.collection('piket_schedules').where('period_id', '==', periodId).get();
  const entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PiketScheduleEntry, 'id'>) }));

  return entries.sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    const sesDiff = (SESSION_ORDER[a.session] ?? 99) - (SESSION_ORDER[b.session] ?? 99);
    if (sesDiff !== 0) return sesDiff;
    const divDiff =
      (OFFICIAL_DIVISIONS[a.division_code]?.order ?? 99) -
      (OFFICIAL_DIVISIONS[b.division_code]?.order ?? 99);
    if (divDiff !== 0) return divDiff;
    return a.member_name.localeCompare(b.member_name);
  });
}

/**
 * Menambahkan pengurus ke jadwal piket hari & sesi tertentu (khusus Kadiv/Wakadiv Galeri).
 */
export async function assignPiketSchedule(
  actor: UserProfile,
  input: PiketScheduleAssignInput
): Promise<PiketScheduleEntry> {
  if (!canManagePiket(actor)) throw forbidden(MANAGE_ERR);

  const members = await listEligiblePiketMembers(input.period_id);
  const target = members.find(
    (m) => m.key === input.member_key || m.user_id === input.member_key || m.board_member_id === input.member_key
  );
  if (!target) {
    throw notFound('Pengurus tidak ditemukan pada periode kepengurusan ini.');
  }
  if (!target.is_mandatory_piket) {
    throw badRequest('Presidium bertindak sebagai pengawas dan tidak dimasukkan ke jadwal piket rutin.');
  }

  const safeMemberKey = target.key.replace(/[^a-zA-Z0-9_-]/g, '_');
  const docId = `${input.period_id}_${input.day}_${input.session}_${safeMemberKey}`;
  const ref = adminDb.collection('piket_schedules').doc(docId);

  const now = new Date().toISOString();
  const entry: PiketScheduleEntry = {
    id: docId,
    period_id: input.period_id,
    day: input.day,
    session: input.session,
    user_id: target.user_id,
    board_member_id: target.board_member_id,
    member_name: target.full_name,
    division_code: target.division_code,
    position_title: target.position_title,
    role: target.role,
    created_by: actor.uid,
    created_at: now,
    updated_at: now,
  };

  await adminDb.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      throw conflict(
        `${target.full_name} sudah terjadwal pada hari ${input.day} (${PIKET_SESSIONS[input.session].label}).`
      );
    }
    tx.set(ref, entry);
    const audit = buildAudit(actor, {
      action: 'CREATE',
      target_collection: 'piket_schedules',
      target_id: docId,
      summary: `Menjadwalkan piket ${target.full_name} (${target.division_code}) pada ${input.day} ${PIKET_SESSIONS[input.session].label}`,
    });
    tx.set(audit.ref, audit.data);
  });

  return entry;
}

/**
 * Menghapus slot jadwal piket (khusus Kadiv/Wakadiv Galeri).
 */
export async function removePiketSchedule(actor: UserProfile, id: string): Promise<void> {
  if (!canManagePiket(actor)) throw forbidden(MANAGE_ERR);

  const ref = adminDb.collection('piket_schedules').doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound('Jadwal piket tidak ditemukan.');
    const entry = snap.data() as PiketScheduleEntry;
    tx.delete(ref);
    const audit = buildAudit(actor, {
      action: 'DELETE',
      target_collection: 'piket_schedules',
      target_id: id,
      summary: `Menghapus jadwal piket ${entry.member_name} (${entry.day} ${entry.session})`,
    });
    tx.set(audit.ref, audit.data);
  });
}

/**
 * Mengambil riwayat absensi piket:
 * - Kadiv/Wakadiv Galeri & Presidium melihat semua data periode.
 * - Pengurus lain hanya melihat riwayat absensi miliknya sendiri.
 */
export async function listPiketAttendances(
  actor: UserProfile,
  periodId: string
): Promise<PiketAttendance[]> {
  if (canViewAllPiketReports(actor)) {
    const snap = await adminDb
      .collection('piket_attendances')
      .where('period_id', '==', periodId)
      .get();
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<PiketAttendance, 'id'>) }))
      .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
      .slice(0, 300);
  }

  const snap = await adminDb
    .collection('piket_attendances')
    .where('user_id', '==', actor.uid)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PiketAttendance, 'id'>) }))
    .filter((a) => !periodId || a.period_id === periodId)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
    .slice(0, 100);
}

/**
 * Mengirimkan absensi piket pengurus dengan bukti foto kamera & koordinat GPS.
 */
export async function submitPiketAttendance(
  actor: UserProfile,
  input: PiketAttendanceInput
): Promise<PiketAttendance> {
  if (!canSubmitPiketAttendance(actor)) {
    throw forbidden('Presidium bertugas sebagai pengawas dan tidak melakukan pengisian absen piket.');
  }

  const periodId = await seedInitialPeriodAndDivisions();
  const [settings, schedules, ownSnap] = await Promise.all([
    getPiketSettings(),
    listPiketSchedules(periodId),
    adminDb.collection('piket_attendances').where('user_id', '==', actor.uid).get(),
  ]);

  const wib = getWibNow();
  const timeStatus = evaluateTimeStatus(input.session, wib.hour, wib.minute);

  // Cocokkan apakah user dijadwalkan pada hari & sesi ini
  const userSchedules = schedules.filter((s) => s.user_id === actor.uid);
  const matchingSchedule = userSchedules.find(
    (s) => s.day === wib.dayCode && s.session === input.session
  );
  const isScheduledMatch = Boolean(matchingSchedule);

  // Penegakan aturan jadwal ketat bila diaktifkan oleh Kadiv/Wakadiv Galeri
  if (settings.enforce_schedule) {
    const isWeekday = (PIKET_DAY_CODES as readonly string[]).includes(wib.dayCode);
    if (!isWeekday) {
      throw badRequest('Absensi piket hanya dibuka pada hari kerja Senin sampai Jumat.');
    }
    if (!isScheduledMatch) {
      throw badRequest(
        `Anda tidak terdaftar pada jadwal piket hari ${wib.dayCode} (${PIKET_SESSIONS[input.session].label}).`
      );
    }
    if (timeStatus === 'DI_LUAR_SESI') {
      throw badRequest(
        `Waktu saat ini (${wib.timeStr}) berada di luar rentang ${PIKET_SESSIONS[input.session].timeRange}.`
      );
    }
  }

  // Hitung jarak ke Galeri Investasi BEI UNIMED
  const distanceMeters = calculateDistanceMeters(
    input.latitude,
    input.longitude,
    settings.latitude,
    settings.longitude
  );
  const locationStatus = distanceMeters <= settings.radius_meters ? 'IN_AREA' : 'OUT_OF_AREA';

  if (settings.enforce_radius && locationStatus === 'OUT_OF_AREA') {
    throw badRequest(
      `Lokasi Anda berjarak ${formatDistance(distanceMeters)} dari ${settings.location_name}. Maksimal radius yang diizinkan adalah ${settings.radius_meters} m.`
    );
  }

  // Cegah duplikasi absensi pada tanggal & sesi yang sama (kecuali bila sebelumnya REJECTED)
  const existingToday = ownSnap.docs
    .map((d) => d.data() as PiketAttendance)
    .find(
      (a) =>
        a.date === wib.dateStr &&
        a.session === input.session &&
        a.verification_status !== 'REJECTED'
    );

  if (existingToday) {
    throw conflict(
      `Anda sudah mengirim absensi piket untuk hari ini (${wib.dateStr}) pada ${PIKET_SESSIONS[input.session].label}.`
    );
  }

  const ref = adminDb.collection('piket_attendances').doc();
  const now = new Date().toISOString();

  const record: PiketAttendance = {
    id: ref.id,
    period_id: periodId,
    schedule_id: matchingSchedule?.id ?? null,
    user_id: actor.uid,
    user_name: actor.full_name,
    user_email: actor.email,
    division_code: actor.division_code || 'GALERI',
    position_title: actor.position_title || 'Pengurus GIBEI',
    date: wib.dateStr,
    day: wib.dayCode,
    session: input.session,
    checked_in_at: now,
    checked_in_wib: wib.timeStr,
    photo_url: input.photo_url,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy_meters: Math.round(input.accuracy_meters ?? 0),
    distance_meters: distanceMeters,
    location_status: locationStatus,
    time_status: timeStatus,
    is_scheduled_match: isScheduledMatch,
    notes: input.notes || '',
    verification_status: 'PENDING',
    verified_by: null,
    verified_by_name: null,
    verified_at: null,
    verification_note: null,
    supervisor_note: null,
    supervisor_name: null,
    supervisor_at: null,
  };

  const batch = adminDb.batch();
  batch.set(ref, record);
  const audit = buildAudit(actor, {
    action: 'CREATE',
    target_collection: 'piket_attendances',
    target_id: ref.id,
    summary: `Absen piket ${actor.full_name} (${wib.dateStr} ${PIKET_SESSIONS[input.session].label}, jarak ${formatDistance(distanceMeters)})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  return record;
}

/**
 * Verifikasi hasil absensi piket oleh Kadiv / Wakadiv Galeri.
 */
export async function verifyPiketAttendance(
  actor: UserProfile,
  attendanceId: string,
  input: PiketVerifyInput
): Promise<PiketAttendance> {
  if (!canManagePiket(actor)) throw forbidden(MANAGE_ERR);

  const ref = adminDb.collection('piket_attendances').doc(attendanceId);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Catatan absensi piket tidak ditemukan.');
  const existing = snap.data() as PiketAttendance;

  const now = new Date().toISOString();
  const patch = {
    verification_status: input.verification_status,
    verification_note: input.verification_note || null,
    verified_by: input.verification_status === 'PENDING' ? null : actor.uid,
    verified_by_name: input.verification_status === 'PENDING' ? null : actor.full_name,
    verified_at: input.verification_status === 'PENDING' ? null : now,
  };

  const batch = adminDb.batch();
  batch.update(ref, patch);
  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'piket_attendances',
    target_id: attendanceId,
    summary: `Verifikasi piket ${existing.user_name} (${existing.date} ${existing.session}) -> ${input.verification_status}`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  return { ...existing, ...patch, id: attendanceId };
}

/**
 * Menambahkan catatan pengawasan dari Presidium.
 */
export async function addPiketSupervisorNote(
  actor: UserProfile,
  attendanceId: string,
  input: PiketSupervisorNoteInput
): Promise<PiketAttendance> {
  if (!canSupervisePiket(actor)) {
    throw forbidden('Hanya Presidium pengawas yang dapat menambahkan catatan pengawasan.');
  }

  const ref = adminDb.collection('piket_attendances').doc(attendanceId);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Catatan absensi piket tidak ditemukan.');
  const existing = snap.data() as PiketAttendance;

  const now = new Date().toISOString();
  const patch = {
    supervisor_note: input.supervisor_note,
    supervisor_name: actor.full_name,
    supervisor_at: now,
  };

  const batch = adminDb.batch();
  batch.update(ref, patch);
  const audit = buildAudit(actor, {
    action: 'UPDATE',
    target_collection: 'piket_attendances',
    target_id: attendanceId,
    summary: `Catatan pengawas oleh ${actor.full_name} pada piket ${existing.user_name} (${existing.date})`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  return { ...existing, ...patch, id: attendanceId };
}

/**
 * Ekspor CSV Laporan Hasil Absensi Piket (untuk Kadiv/Wakadiv Galeri & Presidium Pengawas).
 */
export async function exportPiketAttendancesCsv(
  actor: UserProfile,
  periodId: string
): Promise<string> {
  if (!canViewAllPiketReports(actor)) {
    throw forbidden('Anda tidak memiliki wewenang mengunduh laporan absensi piket.');
  }

  const list = await listPiketAttendances(actor, periodId);

  const headers = [
    'No',
    'Tanggal',
    'Hari',
    'Sesi',
    'Jam Absen (WIB)',
    'Nama Pengurus',
    'Divisi',
    'Jabatan',
    'Kesesuaian Jadwal',
    'Status Waktu',
    'Jarak dari Galeri (m)',
    'Status Lokasi',
    'Koordinat GPS',
    'Link Google Maps',
    'Status Verifikasi',
    'Diverifikasi Oleh',
    'Catatan Pengurus',
    'Catatan Verifikasi Galeri',
    'Catatan Pengawas Presidium',
  ];

  const rows = list.map((a, idx) =>
    [
      idx + 1,
      sanitizeCsvCell(a.date),
      sanitizeCsvCell(a.day),
      sanitizeCsvCell(PIKET_SESSIONS[a.session]?.label || a.session),
      sanitizeCsvCell(a.checked_in_wib),
      sanitizeCsvCell(a.user_name),
      sanitizeCsvCell(a.division_code),
      sanitizeCsvCell(a.position_title),
      sanitizeCsvCell(a.is_scheduled_match ? 'Sesuai Jadwal' : 'Di Luar Jadwal / Pengganti'),
      sanitizeCsvCell(a.time_status),
      a.distance_meters,
      sanitizeCsvCell(a.location_status === 'IN_AREA' ? 'Dalam Area Galeri' : 'Di Luar Radius'),
      sanitizeCsvCell(`${a.latitude}, ${a.longitude}`),
      sanitizeCsvCell(`https://maps.google.com/?q=${a.latitude},${a.longitude}`),
      sanitizeCsvCell(a.verification_status),
      sanitizeCsvCell(a.verified_by_name || '-'),
      sanitizeCsvCell(a.notes || ''),
      sanitizeCsvCell(a.verification_note || ''),
      sanitizeCsvCell(a.supervisor_note ? `${a.supervisor_note} (${a.supervisor_name || 'Presidium'})` : ''),
    ].join(',')
  );

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

