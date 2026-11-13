'use client';

import * as React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Send,
  ShieldCheck,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EventAndSpm, EventAttendanceProofType, EventReport, UserProfile } from '@/types';
import { EventReportSchema } from '@/lib/schemas/event-report';
import { canReviewEventReport, canSubmitEventReport, isPresidiumUp } from '@/lib/auth/permissions';
import { Modal } from '@/components/ui/modal';
import { Field, Textarea } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch, zodFieldErrors } from '@/lib/api-client';

const MAX_PDF_BYTES = 700 * 1024;

function toDateInputValue(raw?: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const match = /^\d{4}-\d{2}-\d{2}/.exec(raw.trim());
  return match ? match[0] : new Date().toISOString().slice(0, 10);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas PDF.'));
    reader.readAsDataURL(file);
  });
}

export function EventReportModal({
  open,
  onOpenChange,
  event,
  existingReport,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventAndSpm | null;
  existingReport: EventReport | null;
  user: UserProfile;
  onSaved: (report: EventReport) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Pelaporan Kegiatan"
      description={
        event
          ? `Laporan pelaksanaan kegiatan "${event.title}" dari Divisi ke Presidium GIBEI UNIMED.`
          : undefined
      }
      size="lg"
    >
      {open && event ? (
        <EventReportForm
          key={`${event.id}-${existingReport?.updated_at ?? 'new'}`}
          event={event}
          existingReport={existingReport}
          user={user}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function EventReportForm({
  event,
  existingReport,
  user,
  onClose,
  onSaved,
}: {
  event: EventAndSpm;
  existingReport: EventReport | null;
  user: UserProfile;
  onClose: () => void;
  onSaved: (report: EventReport) => void;
}) {
  const canReview = canReviewEventReport(user);
  const canSubmit = canSubmitEventReport(user, event.division_code);
  const isApprovedLocked = existingReport?.status === 'APPROVED' && !isPresidiumUp(user);
  const readOnly = !canSubmit || isApprovedLocked;

  const [eventTitle, setEventTitle] = React.useState(
    () => existingReport?.event_title ?? event.title
  );
  const [eventDate, setEventDate] = React.useState(() =>
    existingReport?.event_date ? existingReport.event_date : toDateInputValue(event.event_date)
  );
  const [participantCount, setParticipantCount] = React.useState(() =>
    String(existingReport?.participant_count ?? event.registered_count ?? 0)
  );
  const [location, setLocation] = React.useState(
    () =>
      existingReport?.location ??
      event.location_detail ??
      event.location_or_link ??
      (event.location_type === 'ONLINE' ? 'Online' : '')
  );
  const [proofType, setProofType] = React.useState<EventAttendanceProofType>(
    () => existingReport?.attendance_proof_type ?? 'PDF'
  );
  const [pdfUrl, setPdfUrl] = React.useState(() =>
    existingReport?.attendance_proof_type === 'PDF' ? existingReport.attendance_proof_url : ''
  );
  const [pdfName, setPdfName] = React.useState(() =>
    existingReport?.attendance_proof_type === 'PDF' ? existingReport.attendance_proof_name || 'absensi.pdf' : ''
  );
  const [linkUrl, setLinkUrl] = React.useState(() =>
    existingReport?.attendance_proof_type === 'LINK' ? existingReport.attendance_proof_url : ''
  );
  const [notes, setNotes] = React.useState(() => existingReport?.notes ?? '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // State verifikasi Presidium
  const [reviewNote, setReviewNote] = React.useState(() => existingReport?.review_note ?? '');
  const [reviewing, setReviewing] = React.useState(false);

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdfMime =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfMime) {
      toast.error('Hanya berkas format PDF (.pdf) yang diperbolehkan.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error('Ukuran file PDF maksimal 700 KB.');
      e.target.value = '';
      return;
    }

    try {
      setUploadingPdf(true);
      const base64 = await fileToBase64(file);
      const res = await apiFetch<{ url: string; name: string }>(
        `/api/events/${event.id}/report/pdf`,
        {
          method: 'POST',
          body: { name: file.name, base64 },
        }
      );
      setPdfUrl(res.url);
      setPdfName(res.name);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.attendance_proof_url;
        return copy;
      });
      toast.success('Berkas PDF absensi berhasil diunggah.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah berkas PDF.');
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const proofUrl = proofType === 'PDF' ? pdfUrl : linkUrl;
    const proofName = proofType === 'PDF' ? pdfName : 'Link Absensi Eksternal';

    const parsed = EventReportSchema.safeParse({
      event_title: eventTitle,
      event_date: eventDate,
      participant_count: participantCount,
      location,
      attendance_proof_type: proofType,
      attendance_proof_url: proofUrl,
      attendance_proof_name: proofName,
      notes,
    });

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      const res = await apiFetch<{ report: EventReport }>(`/api/events/${event.id}/report`, {
        method: 'POST',
        body: parsed.data,
      });
      toast.success('Laporan kegiatan berhasil dikirim ke Presidium.');
      onSaved(res.report);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan laporan kegiatan.');
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (decision: 'approve' | 'revise') => {
    if (decision === 'revise' && reviewNote.trim().length < 5) {
      toast.error('Masukkan catatan revisi minimal 5 karakter sebelum meminta perbaikan.');
      return;
    }
    try {
      setReviewing(true);
      const res = await apiFetch<{ report: EventReport }>(`/api/events/${event.id}/report`, {
        method: 'PATCH',
        body: { decision, note: reviewNote.trim() },
      });
      toast.success(
        decision === 'approve'
          ? 'Laporan kegiatan disetujui Presidium.'
          : 'Permintaan revisi dikirim ke Kadiv/Wakadiv.'
      );
      onSaved(res.report);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memverifikasi laporan.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {existingReport ? (
        <div
          className={`rounded-2xl border p-4 text-xs space-y-1 ${
            existingReport.status === 'APPROVED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : existingReport.status === 'REVISION_NEEDED'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-cerulean-light/50 border-cerulean/30 text-ink'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold inline-flex items-center gap-1.5">
              {existingReport.status === 'APPROVED' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : existingReport.status === 'REVISION_NEEDED' ? (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-cerulean" />
              )}
              Status:{' '}
              {existingReport.status === 'APPROVED'
                ? 'Disetujui Presidium'
                : existingReport.status === 'REVISION_NEEDED'
                ? 'Perlu Revisi'
                : 'Menunggu Verifikasi Presidium'}
            </span>
            <span className="text-[11px] text-ink-muted">
              Pelapor: <strong>{existingReport.submitted_by_name}</strong>
              {existingReport.submitted_by_position ? ` (${existingReport.submitted_by_position})` : ''}
            </span>
          </div>
          {existingReport.review_note ? (
            <p className="pt-1 leading-relaxed">
              <strong>Catatan Presidium ({existingReport.reviewed_by_name || 'Presidium'}):</strong>{' '}
              {existingReport.review_note}
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Kegiatan" htmlFor="rep-title" required error={errors.event_title}>
          <Input
            id="rep-title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            disabled={readOnly}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tanggal Pelaksanaan" htmlFor="rep-date" required error={errors.event_date}>
            <Input
              id="rep-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={readOnly}
            />
          </Field>

          <Field
            label="Jumlah Peserta Hadir"
            htmlFor="rep-count"
            required
            error={errors.participant_count}
          >
            <Input
              id="rep-count"
              type="number"
              min={0}
              max={50000}
              value={participantCount}
              onChange={(e) => setParticipantCount(e.target.value)}
              disabled={readOnly}
            />
          </Field>
        </div>

        <Field label="Lokasi Kegiatan" htmlFor="rep-loc" required error={errors.location}>
          <Input
            id="rep-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Misal: Aula Gedung Digital Library UNIMED / Zoom Meeting"
            disabled={readOnly}
          />
        </Field>

        {/* Bukti Absensi: PDF only OR Link Spreadsheet/GForm */}
        <Field
          label="Bukti Absensi"
          required
          error={errors.attendance_proof_url}
          hint="Pilih unggah berkas PDF (.pdf maks. 700 KB) atau lampirkan link Google Spreadsheet / Google Form absensi."
        >
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setProofType('PDF')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  proofType === 'PDF'
                    ? 'bg-cerulean text-white border-cerulean'
                    : 'bg-surface text-ink-muted border-line hover:text-ink'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Upload PDF Only
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setProofType('LINK')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  proofType === 'LINK'
                    ? 'bg-cerulean text-white border-cerulean'
                    : 'bg-surface text-ink-muted border-line hover:text-ink'
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                Link Spreadsheet / Google Form
              </button>
            </div>

            {proofType === 'PDF' ? (
              <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={handlePdfUpload}
                  disabled={readOnly || uploadingPdf}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {pdfUrl ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink min-w-0">
                      <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="truncate">{pdfName || 'Bukti Absensi.pdf'}</span>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cerulean-dark hover:underline shrink-0"
                      >
                        Lihat PDF <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-muted">Belum ada berkas PDF diunggah.</span>
                  )}

                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingPdf}
                      onClick={() => fileRef.current?.click()}
                      className="gap-1.5"
                    >
                      {uploadingPdf ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {pdfUrl ? 'Ganti File PDF' : 'Pilih File PDF'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/... atau https://forms.gle/..."
                  disabled={readOnly}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {!readOnly && event.spreadsheet_id ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLinkUrl(`https://docs.google.com/spreadsheets/d/${event.spreadsheet_id}`)
                      }
                      className="text-[11px] font-semibold text-cerulean-dark hover:underline cursor-pointer"
                    >
                      + Gunakan Spreadsheet Event ini
                    </button>
                  ) : null}
                  {!readOnly && event.external_gform_url ? (
                    <button
                      type="button"
                      onClick={() => setLinkUrl(event.external_gform_url || '')}
                      className="text-[11px] font-semibold text-cerulean-dark hover:underline cursor-pointer"
                    >
                      + Gunakan Google Form Event ini
                    </button>
                  ) : null}
                  {linkUrl ? (
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-ink-muted hover:text-cerulean-dark inline-flex items-center gap-1 ml-auto"
                    >
                      Buka Tautan <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </Field>

        <Field label="Catatan Pelaksanaan (Opsional)" htmlFor="rep-notes" error={errors.notes}>
          <Textarea
            id="rep-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ringkasan jalannya acara, evaluasi singkat, atau kendala lapangan..."
            rows={2}
            disabled={readOnly}
          />
        </Field>

        {!readOnly && (
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Tutup
            </Button>
            <Button type="submit" variant="gold" disabled={saving || uploadingPdf} className="gap-1.5 font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {existingReport ? 'Kirim Ulang Laporan' : 'Kirim Laporan ke Presidium'}
            </Button>
          </div>
        )}
      </form>

      {/* Panel Verifikasi Khusus Presidium */}
      {canReview && existingReport ? (
        <div className="rounded-2xl border border-gold/40 bg-gold-light/20 p-4 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#66532d]">
            Verifikasi Presidium
          </div>
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Catatan verifikasi atau poin perbaikan jika meminta revisi..."
            rows={2}
            disabled={reviewing}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reviewing}
              onClick={() => handleReview('revise')}
              className="text-rose-600 hover:bg-rose-50 hover:border-rose-200"
            >
              Minta Revisi
            </Button>
            <Button
              type="button"
              variant="cerulean"
              size="sm"
              disabled={reviewing}
              onClick={() => handleReview('approve')}
              className="gap-1.5"
            >
              {reviewing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Setujui Laporan
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

