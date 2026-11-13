import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { EventReport, EventReportStatus, UserProfile } from '@/types';
import type { EventReportInput, EventReportReviewInput } from '@/lib/schemas/event-report';
import {
  canAccessEventDashboard,
  canReviewEventReport,
  canSubmitEventReport,
  canViewEventReport,
  isPresidiumUp,
} from '@/lib/auth/permissions';
import { getEventById } from '@/lib/data/events';
import { buildAudit } from '@/lib/data/audit';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { isSafeDocId, isValidPdfBuffer } from '@/lib/security/guards';

const reportsCol = () => adminDb.collection('event_reports');
const pdfFilesCol = () => adminDb.collection('event_report_files');

const MAX_PDF_BYTES = 700 * 1024; // ~700 KB raw -> <950 KB base64 (di bawah batas 1 MB dokumen Firestore)

const bySubmittedDesc = (a: EventReport, b: EventReport) =>
  b.submitted_at.localeCompare(a.submitted_at);

/** Daftar laporan kegiatan sesuai kewenangan aktor (Presidium semua; Kadiv/Wakadiv divisinya). */
export async function listEventReportsForActor(actor: UserProfile): Promise<EventReport[]> {
  if (isPresidiumUp(actor)) {
    const snap = await reportsCol().get();
    return snap.docs.map((d) => d.data() as EventReport).sort(bySubmittedDesc);
  }
  if (!canAccessEventDashboard(actor) || !actor.division_code) {
    return [];
  }
  const snap = await reportsCol().where('division_code', '==', actor.division_code).get();
  return snap.docs.map((d) => d.data() as EventReport).sort(bySubmittedDesc);
}

export async function getEventReportByEventId(
  eventId: string,
  actor: UserProfile
): Promise<EventReport | null> {
  if (!isSafeDocId(eventId)) throw badRequest('ID kegiatan tidak valid.');
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  if (!canViewEventReport(actor, event.division_code)) {
    throw forbidden('Anda tidak memiliki akses melihat laporan kegiatan ini.');
  }

  const doc = await reportsCol().doc(eventId).get();
  return doc.exists ? (doc.data() as EventReport) : null;
}

export async function upsertEventReport(
  eventId: string,
  input: EventReportInput,
  actor: UserProfile
): Promise<EventReport> {
  if (!isSafeDocId(eventId)) throw badRequest('ID kegiatan tidak valid.');
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  if (!canSubmitEventReport(actor, event.division_code)) {
    throw forbidden(
      'Hanya Kadiv/Wakadiv divisi pelaksana atau Presidium yang dapat melaporkan kegiatan ini.'
    );
  }
  if (event.status !== 'COMPLETED') {
    throw badRequest('Laporan kegiatan hanya dapat dibuat setelah kegiatan berstatus Selesai (COMPLETED).');
  }

  if (input.attendance_proof_type === 'PDF') {
    const fileId = input.attendance_proof_url.replace('/api/event-reports/pdf/', '');
    const fileDoc = await pdfFilesCol().doc(fileId).get();
    if (!fileDoc.exists || fileDoc.data()?.event_id !== eventId) {
      throw badRequest('File PDF absensi tidak ditemukan atau tidak sesuai dengan kegiatan ini.');
    }
  }

  const ref = reportsCol().doc(eventId);
  const existingSnap = await ref.get();
  const existing = existingSnap.exists ? (existingSnap.data() as EventReport) : null;
  if (existing?.status === 'APPROVED' && !isPresidiumUp(actor)) {
    throw badRequest('Laporan kegiatan ini sudah disetujui oleh Presidium.');
  }

  const now = new Date().toISOString();
  const report: EventReport = {
    id: eventId,
    event_id: eventId,
    division_code: event.division_code,
    event_title: input.event_title,
    event_date: input.event_date,
    participant_count: input.participant_count,
    location: input.location,
    attendance_proof_type: input.attendance_proof_type,
    attendance_proof_url: input.attendance_proof_url,
    attendance_proof_name: input.attendance_proof_name || '',
    notes: input.notes || '',
    status: 'SUBMITTED',
    submitted_by: actor.uid,
    submitted_by_name: actor.full_name,
    submitted_by_position: actor.position_title || '',
    submitted_at: existing?.submitted_at || now,
    reviewed_by: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_note: null,
    updated_at: now,
  };

  const batch = adminDb.batch();
  batch.set(ref, report);
  const audit = buildAudit(actor, {
    action: existing ? 'UPDATE' : 'CREATE',
    target_collection: 'event_reports',
    target_id: eventId,
    summary: `${existing ? 'Memperbarui' : 'Mengirim'} laporan kegiatan "${report.event_title}" (${report.participant_count} peserta)`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  return report;
}

export async function reviewEventReport(
  eventId: string,
  input: EventReportReviewInput,
  actor: UserProfile
): Promise<EventReport> {
  if (!isSafeDocId(eventId)) throw badRequest('ID kegiatan tidak valid.');
  if (!canReviewEventReport(actor)) {
    throw forbidden('Hanya Presidium yang dapat memverifikasi laporan kegiatan.');
  }

  const ref = reportsCol().doc(eventId);
  const snap = await ref.get();
  if (!snap.exists) throw notFound('Laporan kegiatan belum dikirim oleh divisi pelaksana.');
  const existing = snap.data() as EventReport;

  const now = new Date().toISOString();
  const status: EventReportStatus = input.decision === 'approve' ? 'APPROVED' : 'REVISION_NEEDED';
  const patch: Partial<EventReport> = {
    status,
    reviewed_by: actor.uid,
    reviewed_by_name: actor.full_name,
    reviewed_at: now,
    review_note: input.note?.trim() || null,
    updated_at: now,
  };

  const batch = adminDb.batch();
  batch.update(ref, patch);
  const audit = buildAudit(actor, {
    action: status === 'APPROVED' ? 'PUBLISH' : 'REJECT',
    target_collection: 'event_reports',
    target_id: eventId,
    summary:
      status === 'APPROVED'
        ? `Menyetujui laporan kegiatan "${existing.event_title}"`
        : `Meminta revisi laporan kegiatan "${existing.event_title}": ${input.note}`,
  });
  batch.set(audit.ref, audit.data);
  await batch.commit();

  return { ...existing, ...patch };
}

export async function saveEventReportPdf(
  eventId: string,
  body: { name?: unknown; base64?: unknown },
  actor: UserProfile
): Promise<{ id: string; url: string; name: string; size: number }> {
  if (!isSafeDocId(eventId)) throw badRequest('ID kegiatan tidak valid.');
  const event = await getEventById(eventId);
  if (!event) throw notFound('Kegiatan tidak ditemukan.');

  if (!canSubmitEventReport(actor, event.division_code)) {
    throw forbidden('Anda tidak berwenang mengunggah bukti absensi untuk kegiatan ini.');
  }
  if (event.status !== 'COMPLETED') {
    throw badRequest('Kegiatan harus berstatus Selesai (COMPLETED) terlebih dahulu.');
  }

  if (typeof body.base64 !== 'string' || !body.base64.trim()) {
    throw badRequest('Data berkas PDF kosong.');
  }
  const cleanB64 = body.base64.replace(/^data:application\/pdf;base64,/i, '').trim();
  const approxBytes = Math.ceil((cleanB64.length * 3) / 4);
  if (approxBytes > MAX_PDF_BYTES) {
    throw badRequest('Ukuran PDF melebihi batas maksimal 700 KB.');
  }

  const buffer = Buffer.from(cleanB64, 'base64');
  if (buffer.length > MAX_PDF_BYTES || !isValidPdfBuffer(buffer)) {
    throw badRequest('Berkas wajib berupa file PDF yang valid.');
  }

  const rawName = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'absensi.pdf';
  const safeBase = rawName.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const cleanName = safeBase.toLowerCase().endsWith('.pdf') ? safeBase : `${safeBase}.pdf`;
  const fileId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  await pdfFilesCol().doc(fileId).set({
    id: fileId,
    event_id: eventId,
    division_code: event.division_code,
    name: cleanName,
    mime_type: 'application/pdf',
    base64: buffer.toString('base64'),
    size: buffer.length,
    uploaded_by: actor.uid,
    uploaded_by_name: actor.full_name,
    created_at: new Date().toISOString(),
  });

  return {
    id: fileId,
    url: `/api/event-reports/pdf/${fileId}`,
    name: cleanName,
    size: buffer.length,
  };
}

export async function getEventReportPdf(
  fileId: string,
  actor: UserProfile
): Promise<{ buffer: Buffer; name: string }> {
  if (!isSafeDocId(fileId)) throw badRequest('ID berkas PDF tidak valid.');
  const doc = await pdfFilesCol().doc(fileId).get();
  if (!doc.exists) throw notFound('Berkas PDF tidak ditemukan.');

  const data = doc.data();
  if (!data || typeof data.base64 !== 'string' || !data.base64) {
    throw notFound('Isi berkas PDF tidak valid.');
  }

  const canRead =
    canViewEventReport(actor, data.division_code) || data.uploaded_by === actor.uid;
  if (!canRead) {
    throw forbidden('Anda tidak berwenang mengakses berkas absensi kegiatan ini.');
  }

  return {
    buffer: Buffer.from(data.base64, 'base64'),
    name: typeof data.name === 'string' && data.name ? data.name : 'absensi.pdf',
  };
}

