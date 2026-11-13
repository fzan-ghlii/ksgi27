import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type { DivisionCode, EventAndSpm, Registration, UserProfile } from '@/types';
import { divisionDocId } from '@/lib/constants/divisions';
import { isKadivUp, isPresidiumUp } from '@/lib/auth/permissions';
import { EventInput, EventRegisterInput, EventUpdateInput } from '@/lib/schemas/event';
import { slugify } from '@/lib/utils/content';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { sanitizeCsvCell } from '@/lib/security/guards';
import { writeAudit } from '@/lib/data/audit';
import {
  appendParticipantToSheet,
  batchSyncParticipantsToSheet,
  updateAttendanceInSheet,
} from '@/lib/google/sheets';

const eventsCol = () => adminDb.collection('events');
const registrationsCol = () => adminDb.collection('registrations');

/**
 * Validasi hak akses pengelolaan event:
 * - Creator & Presidium: Semua event lintas divisi.
 * - Kadiv Edukasi: Khusus SPM dan event divisinya.
 * - Kadiv lainnya: Khusus event divisi masing-masing.
 * - Anggota: Hanya baca & absensi.
 */
function assertCanManageEvent(actor: UserProfile, eventData?: Partial<EventAndSpm>) {
  if (isPresidiumUp(actor)) return;

  if (isKadivUp(actor)) {
    if (eventData?.division_code && actor.division_code !== eventData.division_code) {
      throw forbidden(`Anda hanya berwenang mengelola kegiatan di Divisi ${actor.division_code}.`);
    }
    return;
  }

  throw forbidden('Hanya Pengurus dengan tingkatan minimal Kepala Divisi yang dapat mengelola kegiatan.');
}

/**
 * Cari slug unik untuk event.
 */
async function uniqueEventSlug(base: string, selfId?: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const snap = await eventsCol().where('slug', '==', candidate).limit(2).get();
    if (snap.docs.every((d) => d.id === selfId)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export interface ListEventsFilter {
  category?: 'SPM' | 'EVENT';
  division_code?: DivisionCode;
  status?: string;
  published_only?: boolean;
  period_id?: string;
}

export async function listEvents(filter: ListEventsFilter = {}): Promise<EventAndSpm[]> {
  let q = eventsCol().orderBy('created_at', 'desc');

  if (filter.published_only) {
    q = q.where('is_published', '==', true);
  }
  if (filter.category) {
    q = q.where('category', '==', filter.category);
  }
  if (filter.division_code) {
    q = q.where('division_code', '==', filter.division_code);
  }
  if (filter.period_id) {
    q = q.where('period_id', '==', filter.period_id);
  }

  const snap = await q.get();
  let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventAndSpm, 'id'>) }));

  if (filter.status) {
    list = list.filter((e) => e.status === filter.status);
  }

  return list;
}

export async function getEventById(id: string): Promise<EventAndSpm | null> {
  const doc = await eventsCol().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<EventAndSpm, 'id'>) };
}

export async function getEventBySlug(slug: string): Promise<EventAndSpm | null> {
  const snap = await eventsCol().where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<EventAndSpm, 'id'>) };
}

export async function createEvent(input: EventInput, actor: UserProfile): Promise<EventAndSpm> {
  assertCanManageEvent(actor, { division_code: input.division_code });

  const rawSlug = input.slug && input.slug.trim() !== '' ? input.slug : slugify(input.title);
  const slug = await uniqueEventSlug(rawSlug);

  const now = new Date().toISOString();
  const divisionId = divisionDocId(input.period_id, input.division_code);

  const payload: Omit<EventAndSpm, 'id'> = {
    title: input.title,
    slug,
    description: input.description,
    category: input.category,
    category_type: input.category === 'SPM' ? 'SPM' : 'WORKPROGRAM',
    spm_level: input.category === 'SPM' ? input.spm_level : null,
    division_id: divisionId,
    division_code: input.division_code,
    period_id: input.period_id,
    banner_url: input.banner_url || '',
    poster_url: input.banner_url || '',
    location_type: input.location_type,
    location_detail: input.location_detail,
    location_or_link: input.location_detail,
    event_date: input.event_date,
    start_date: input.event_date,
    end_date: input.event_date,
    registration_deadline: input.registration_deadline,
    quota: input.quota,
    registered_count: 0,
    registration_mode: input.registration_mode,
    external_gform_url: input.external_gform_url || '',
    gform_url: input.external_gform_url || '',
    spreadsheet_id: input.spreadsheet_id || '',
    sheet_tab_name: input.sheet_tab_name || 'Pendaftar',
    status: input.status || 'OPEN',
    is_published: input.is_published ?? true,
    created_by: actor.uid,
    created_at: now,
    updated_at: now,
  };

  const ref = await eventsCol().add(payload);

  await writeAudit(actor, {
    action: 'CREATE',
    target_collection: 'events',
    target_id: ref.id,
    summary: `Membuat kegiatan ${input.category}: ${input.title}`,
  });

  return { id: ref.id, ...payload };
}

export async function updateEvent(
  id: string,
  input: EventUpdateInput,
  actor: UserProfile
): Promise<EventAndSpm> {
  const existing = await getEventById(id);
  if (!existing) throw notFound('Kegiatan tidak ditemukan.');

  assertCanManageEvent(actor, existing);

  const patch: Partial<EventAndSpm> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) {
    patch.category = input.category;
    patch.category_type = input.category === 'SPM' ? 'SPM' : 'WORKPROGRAM';
  }
  if (input.spm_level !== undefined) patch.spm_level = input.spm_level;
  if (input.division_code !== undefined) {
    patch.division_code = input.division_code;
    const period = input.period_id || existing.period_id || '';
    patch.division_id = divisionDocId(period, input.division_code);
  }
  if (input.period_id !== undefined) patch.period_id = input.period_id;
  if (input.banner_url !== undefined) {
    patch.banner_url = input.banner_url;
    patch.poster_url = input.banner_url;
  }
  if (input.location_type !== undefined) patch.location_type = input.location_type;
  if (input.location_detail !== undefined) {
    patch.location_detail = input.location_detail;
    patch.location_or_link = input.location_detail;
  }
  if (input.event_date !== undefined) {
    patch.event_date = input.event_date;
    patch.start_date = input.event_date;
    patch.end_date = input.event_date;
  }
  if (input.registration_deadline !== undefined) patch.registration_deadline = input.registration_deadline;
  if (input.quota !== undefined) patch.quota = input.quota;
  if (input.registration_mode !== undefined) patch.registration_mode = input.registration_mode;
  if (input.external_gform_url !== undefined) {
    patch.external_gform_url = input.external_gform_url;
    patch.gform_url = input.external_gform_url;
  }
  if (input.spreadsheet_id !== undefined) patch.spreadsheet_id = input.spreadsheet_id;
  if (input.sheet_tab_name !== undefined) patch.sheet_tab_name = input.sheet_tab_name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.is_published !== undefined) patch.is_published = input.is_published;

  if (input.slug !== undefined && input.slug.trim() !== '' && input.slug !== existing.slug) {
    patch.slug = await uniqueEventSlug(slugify(input.slug), id);
  }

  await eventsCol().doc(id).update(patch);

  await writeAudit(actor, {
    action: 'UPDATE',
    target_collection: 'events',
    target_id: id,
    summary: `Memperbarui kegiatan: ${patch.title || existing.title}`,
  });

  return { ...existing, ...patch };
}

export async function deleteEvent(id: string, actor: UserProfile): Promise<void> {
  const existing = await getEventById(id);
  if (!existing) throw notFound('Kegiatan tidak ditemukan.');

  assertCanManageEvent(actor, existing);

  // Hapus semua data registrasi terkait
  const regSnap = await registrationsCol().where('event_id', '==', id).get();
  const batch = adminDb.batch();
  regSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(eventsCol().doc(id));
  await batch.commit();

  await writeAudit(actor, {
    action: 'DELETE',
    target_collection: 'events',
    target_id: id,
    summary: `Menghapus kegiatan: ${existing.title}`,
  });
}

/**
 * Pendaftaran peserta (Data Teks Murni) dengan Firestore Transaction Atomik & Anti-Duplikat.
 */
export async function registerParticipant(
  eventIdOrSlug: string,
  input: EventRegisterInput
): Promise<{ registration: Registration; event: EventAndSpm; sheetResult: { success: boolean; message?: string } }> {
  // Cari event
  let eventRef = eventsCol().doc(eventIdOrSlug);
  let eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    const slugSnap = await eventsCol().where('slug', '==', eventIdOrSlug).limit(1).get();
    if (slugSnap.empty) {
      throw notFound('Kegiatan yang dimaksud tidak ditemukan.');
    }
    eventRef = slugSnap.docs[0].ref;
    eventDoc = slugSnap.docs[0];
  }

  const cleanNim = input.nim.trim();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.full_name.trim();
  const cleanPhone = input.whatsapp.trim();
  const cleanInst = input.institution.trim();
  const now = new Date();
  const nowIso = now.toISOString();

  // Jalankan transaksi Firestore atomik untuk validasi & pencatatan
  const result = await adminDb.runTransaction(async (tx) => {
    const freshDoc = await tx.get(eventRef);
    if (!freshDoc.exists) {
      throw notFound('Kegiatan tidak ditemukan.');
    }

    const event = { id: freshDoc.id, ...(freshDoc.data() as Omit<EventAndSpm, 'id'>) };

    if (!event.is_published) {
      throw badRequest('Kegiatan ini belum dibuka untuk publik.');
    }

    if (event.status === 'CLOSED' || event.status === 'COMPLETED') {
      throw badRequest('Pendaftaran kegiatan ini sudah ditutup.');
    }

    // Periksa batas waktu pendaftaran
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (now.getTime() > deadline.getTime()) {
        tx.update(eventRef, { status: 'CLOSED' });
        throw badRequest('Batas waktu pendaftaran untuk kegiatan ini telah berakhir.');
      }
    }

    // Periksa kuota
    const currentCount = event.registered_count || 0;
    if (currentCount >= event.quota) {
      tx.update(eventRef, { status: 'CLOSED' });
      throw badRequest('Mohon maaf, kuota peserta untuk kegiatan ini sudah penuh.');
    }

    // Periksa duplikasi NIM dan Email dalam kegiatan yang sama
    const duplicateQuery = registrationsCol()
      .where('event_id', '==', event.id)
      .where('participant_nim', '==', cleanNim)
      .limit(1);

    const dupSnap = await tx.get(duplicateQuery);
    if (!dupSnap.empty) {
      throw badRequest(`NIM ${cleanNim} sudah terdaftar pada kegiatan ini.`);
    }

    const duplicateEmailQuery = registrationsCol()
      .where('event_id', '==', event.id)
      .where('participant_email', '==', cleanEmail)
      .limit(1);

    const dupEmailSnap = await tx.get(duplicateEmailQuery);
    if (!dupEmailSnap.empty) {
      throw badRequest(`Alamat email ${cleanEmail} sudah terdaftar pada kegiatan ini.`);
    }

    // Buat ID registrasi baru
    const newRegRef = registrationsCol().doc();
    const newCount = currentCount + 1;

    const regData: Omit<Registration, 'id'> = {
      event_id: event.id,
      participant_name: cleanName,
      full_name: cleanName,
      participant_email: cleanEmail,
      email: cleanEmail,
      participant_nim: cleanNim,
      nim: cleanNim,
      participant_phone: cleanPhone,
      whatsapp: cleanPhone,
      institution_faculty: cleanInst,
      institution: cleanInst,
      has_rdn: !!input.has_rdn,
      attendance_status: 'Registered',
      notes: input.notes || '',
      synced_to_sheet: false,
      registered_at: nowIso,
    };

    tx.set(newRegRef, regData);

    const eventUpdatePayload: Partial<EventAndSpm> = {
      registered_count: newCount,
      updated_at: nowIso,
    };

    if (newCount >= event.quota) {
      eventUpdatePayload.status = 'CLOSED';
    }

    tx.update(eventRef, eventUpdatePayload);

    return {
      registration: { id: newRegRef.id, ...regData },
      event: { ...event, ...eventUpdatePayload },
    };
  });

  // Sinkronisasi otomatis ke Google Sheet (Non-blocking / Graceful offline)
  let sheetMessage = 'Data tersimpan di database.';
  let sheetSuccess = false;

  if (result.event.spreadsheet_id && result.event.spreadsheet_id.trim() !== '') {
    try {
      const appendRes = await appendParticipantToSheet({
        spreadsheetId: result.event.spreadsheet_id,
        sheetTabName: result.event.sheet_tab_name || 'Pendaftar',
        registrationId: result.registration.id,
        participant: {
          registered_at: nowIso,
          full_name: cleanName,
          nim: cleanNim,
          email: cleanEmail,
          whatsapp: cleanPhone,
          institution: cleanInst,
          has_rdn: !!input.has_rdn,
          attendance_status: 'Registered',
          notes: input.notes,
        },
      });

      if (appendRes.success) {
        await registrationsCol().doc(result.registration.id).update({ synced_to_sheet: true });
        result.registration.synced_to_sheet = true;
        sheetSuccess = true;
        sheetMessage = 'Berhasil disinkronkan ke Google Sheet secara real-time.';
      } else {
        sheetMessage = appendRes.error || 'Google Sheet dilewati.';
      }
    } catch (sheetErr) {
      console.warn('[Sync Sheet Error]', sheetErr);
      sheetMessage = 'Gagal push ke Sheet, data aman di database.';
    }
  }

  return {
    registration: result.registration,
    event: result.event,
    sheetResult: { success: sheetSuccess, message: sheetMessage },
  };
}

/**
 * Daftar peserta suatu kegiatan.
 */
export async function listRegistrations(eventId: string, actor: UserProfile): Promise<Registration[]> {
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  // Anggota divisi dapat melihat peserta kegiatan divisinya, Presidium/Creator bisa melihat semua
  if (!isPresidiumUp(actor) && actor.division_code !== event.division_code) {
    throw forbidden('Anda tidak memiliki hak akses untuk melihat peserta kegiatan ini.');
  }

  const snap = await registrationsCol()
    .where('event_id', '==', eventId)
    .orderBy('registered_at', 'desc')
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Registration, 'id'>) }));
}

/**
 * Update kehadiran peserta (Registered / Attended / Absent)
 */
export async function updateAttendance(
  eventId: string,
  registrationId: string,
  attendanceStatus: 'Registered' | 'Attended' | 'Absent',
  actor: UserProfile
): Promise<Registration> {
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  if (!isPresidiumUp(actor) && actor.division_code !== event.division_code) {
    throw forbidden('Anda tidak memiliki wewenang mencatat kehadiran kegiatan ini.');
  }

  const regRef = registrationsCol().doc(registrationId);
  const regDoc = await regRef.get();
  if (!regDoc.exists) throw notFound('Data pendaftar tidak ditemukan.');

  const regData = regDoc.data() as Registration;

  await regRef.update({
    attendance_status: attendanceStatus,
  });

  // Update juga ke Google Sheet jika ada spreadsheet_id
  if (event.spreadsheet_id && event.spreadsheet_id.trim() !== '') {
    updateAttendanceInSheet({
      spreadsheetId: event.spreadsheet_id,
      sheetTabName: event.sheet_tab_name || 'Pendaftar',
      registrationId,
      attendanceStatus,
    }).catch((err) => console.warn('[Update Attendance Sheet Error]', err));
  }

  await writeAudit(actor, {
    action: 'UPDATE',
    target_collection: 'events',
    target_id: eventId,
    summary: `${event.title} - Presensi ${regData.participant_name || regData.full_name}: ${attendanceStatus}`,
  });

  return { ...regData, id: registrationId, attendance_status: attendanceStatus };
}

/**
 * Sinkronkan ulang seluruh peserta yang belum masuk ke Google Sheet.
 */
export async function syncEventToGoogleSheet(
  eventId: string,
  actor: UserProfile
): Promise<{ syncedCount: number; message: string }> {
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  assertCanManageEvent(actor, event);

  if (!event.spreadsheet_id || event.spreadsheet_id.trim() === '') {
    throw badRequest('Kegiatan ini belum memiliki ID Google Spreadsheet.');
  }

  const snap = await registrationsCol()
    .where('event_id', '==', eventId)
    .where('synced_to_sheet', '==', false)
    .get();

  if (snap.empty) {
    return { syncedCount: 0, message: 'Seluruh data peserta sudah tersinkronisasi di Google Sheet.' };
  }

  const participants = snap.docs.map((d) => {
    const data = d.data() as Registration;
    return {
      registrationId: d.id,
      data: {
        registered_at: data.registered_at,
        full_name: data.participant_name || data.full_name || '',
        nim: data.participant_nim || data.nim || '',
        email: data.participant_email || data.email || '',
        whatsapp: data.participant_phone || data.whatsapp || '',
        institution: data.institution_faculty || data.institution || '',
        has_rdn: !!data.has_rdn,
        attendance_status: data.attendance_status || 'Registered',
        notes: data.notes || '',
      },
    };
  });

  const res = await batchSyncParticipantsToSheet({
    spreadsheetId: event.spreadsheet_id,
    sheetTabName: event.sheet_tab_name || 'Pendaftar',
    participants,
  });

  if (res.syncedCount > 0) {
    const batch = adminDb.batch();
    for (const doc of snap.docs) {
      if (!res.failedIds.includes(doc.id)) {
        batch.update(doc.ref, { synced_to_sheet: true });
      }
    }
    await batch.commit();
  }

  await writeAudit(actor, {
    action: 'SYNC_SHEET',
    target_collection: 'events',
    target_id: eventId,
    summary: `Sync Google Sheet: ${event.title} (${res.syncedCount} peserta)`,
  });

  if (res.error) {
    return {
      syncedCount: res.syncedCount,
      message: `Tersinkron ${res.syncedCount} peserta. Sebagian gagal: ${res.error}`,
    };
  }

  return {
    syncedCount: res.syncedCount,
    message: `Berhasil mensinkronkan ${res.syncedCount} data peserta ke Google Sheet.`,
  };
}

/**
 * Ekspor data peserta ke CSV.
 */
export async function exportRegistrationsCsv(eventId: string, actor: UserProfile): Promise<string> {
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  if (!isKadivUp(actor) && actor.division_code !== event.division_code) {
    throw forbidden('Anda tidak memiliki wewenang mengunduh data peserta.');
  }

  const snap = await registrationsCol()
    .where('event_id', '==', eventId)
    .orderBy('registered_at', 'asc')
    .get();

  const headers = [
    'No',
    'Waktu Pendaftaran',
    'Nama Lengkap',
    'NIM',
    'Email',
    'WhatsApp',
    'Fakultas/Instansi',
    'Punya RDN',
    'Kehadiran',
    'Catatan',
  ];

  const rows = snap.docs.map((doc, idx) => {
    const d = doc.data() as Registration;
    return [
      idx + 1,
      sanitizeCsvCell(d.registered_at),
      sanitizeCsvCell(d.participant_name || d.full_name),
      sanitizeCsvCell(d.participant_nim || d.nim),
      sanitizeCsvCell(d.participant_email || d.email),
      sanitizeCsvCell(d.participant_phone || d.whatsapp),
      sanitizeCsvCell(d.institution_faculty || d.institution),
      sanitizeCsvCell(d.has_rdn ? 'Sudah Ada' : 'Belum Ada'),
      sanitizeCsvCell(d.attendance_status || 'Registered'),
      sanitizeCsvCell(d.notes || ''),
    ].join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

