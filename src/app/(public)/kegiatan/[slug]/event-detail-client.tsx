'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventAndSpm } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TurnstileWidget, isTurnstileClientEnabled } from '@/components/shared/turnstile-widget';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Share2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface EventDetailClientProps {
  event: EventAndSpm;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
  const router = useRouter();

  // Registration Form State
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [nim, setNim] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [institution, setInstitution] = React.useState('');
  const [hasRdn, setHasRdn] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [companyWebsite, setCompanyWebsite] = React.useState('');
  const [turnstileToken, setTurnstileToken] = React.useState('');
  const [turnstileReset, setTurnstileReset] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [registeredSuccess, setRegisteredSuccess] = React.useState(false);

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  React.useEffect(() => {
    const deadlineStr = event.registration_deadline || event.event_date;
    if (!deadlineStr) return;

    const targetDate = new Date(deadlineStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [event.registration_deadline, event.event_date]);

  const count = event.registered_count || 0;
  const quota = event.quota || 1;
  const percent = Math.min(100, Math.round((count / quota) * 100));
  const isFull = count >= quota;
  const isClosed = event.status === 'CLOSED' || isFull || timeLeft.isExpired;
  const isSpm = event.category === 'SPM' || event.category_type === 'SPM';
  const divisionName = OFFICIAL_DIVISIONS[event.division_code]?.name || event.division_code;

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !nim.trim() || !whatsapp.trim() || !institution.trim()) {
      toast.error('Harap lengkapi semua kolom wajib.');
      return;
    }

    if (isTurnstileClientEnabled && !turnstileToken) {
      toast.error('Harap selesaikan verifikasi keamanan terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          nim: nim.trim(),
          whatsapp: whatsapp.trim(),
          institution: institution.trim(),
          has_rdn: hasRdn,
          notes: notes.trim() || undefined,
          turnstile_token: turnstileToken || undefined,
          company_website: companyWebsite || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pendaftaran gagal.');
      }

      toast.success('Pendaftaran Anda berhasil dicatat!');
      setRegisteredSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mendaftar.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      if (isTurnstileClientEnabled) {
        setTurnstileReset((v) => v + 1);
        setTurnstileToken('');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Ikuti ${event.title} bersama GIBEI UNIMED!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan kegiatan berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Tombol Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <Link
          href="/kegiatan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-cerulean transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Semua Kegiatan & SPM
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink px-3 py-1.5 rounded-xl border border-line bg-white shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-cerulean" />
          Bagikan Agenda
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri / Utama: Detail Kegiatan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Poster Banner */}
          <div className="bg-white rounded-3xl border border-line overflow-hidden shadow-sm">
            {event.banner_url || event.poster_url ? (
              <div className="h-64 sm:h-96 w-full relative">
                <img
                  src={event.banner_url || event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            <div className="p-6 sm:p-8 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {isSpm ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold-light text-[#66532d] border border-gold/40">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    Sekolah Pasar Modal {event.spm_level || 'Reguler'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    Program Kerja
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface text-ink-muted border border-line">
                  {divisionName}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isClosed
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {isClosed ? 'Pendaftaran Ditutup' : 'Pendaftaran Dibuka'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Info Cards (Waktu, Tempat, Kuota) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-surface/60 border border-line space-y-1">
                  <div className="flex items-center gap-2 text-cerulean">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold">Waktu Pelaksanaan</span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    {event.event_date
                      ? new Date(event.event_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface/60 border border-line space-y-1">
                  <div className="flex items-center gap-2 text-cyan">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold">Lokasi / Tautan</span>
                  </div>
                  <p className="text-xs font-semibold text-ink break-words">
                    [{event.location_type || 'ONLINE'}] {event.location_detail || event.location_or_link || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface/60 border border-line space-y-1">
                  <div className="flex items-center gap-2 text-gold">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">Kapasitas Kursi</span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    {quota} Peserta ({quota - count} Kursi Tersisa)
                  </p>
                </div>
              </div>

              {/* Deskripsi Lengkap */}
              <div className="pt-4 border-t border-line space-y-3">
                <h3 className="text-base font-bold text-ink">Deskripsi & Rincian Agenda</h3>
                <div className="prose prose-sm max-w-none text-ink leading-relaxed whitespace-pre-line text-sm">
                  {event.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Countdown & Formulir Pendaftaran */}
        <div className="space-y-6">
          {/* Card 1: Countdown Timer & Kuota */}
          <div className="bg-white rounded-3xl p-6 border border-line shadow-sm space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                Batas Waktu Pendaftaran
              </span>
              <h3 className="text-sm font-bold text-ink mt-0.5">
                {event.registration_deadline
                  ? new Date(event.registration_deadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sesuai Jadwal'}
              </h3>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-surface border border-line">
                <span className="text-xl font-black text-ink block">{timeLeft.days}</span>
                <span className="text-[10px] text-ink-muted font-semibold">Hari</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-line">
                <span className="text-xl font-black text-ink block">{timeLeft.hours}</span>
                <span className="text-[10px] text-ink-muted font-semibold">Jam</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-line">
                <span className="text-xl font-black text-ink block">{timeLeft.minutes}</span>
                <span className="text-[10px] text-ink-muted font-semibold">Menit</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-line">
                <span className="text-xl font-black text-ink block">{timeLeft.seconds}</span>
                <span className="text-[10px] text-ink-muted font-semibold">Detik</span>
              </div>
            </div>

            {/* Quota Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-line">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">Status Kursi</span>
                <span className="font-bold text-ink">
                  {count} / {quota} Terisi ({percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan to-cerulean transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Formulir Pendaftaran Teks Murni / Redirect Google Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-line shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cerulean" />
                Pendaftaran Peserta
              </h3>
              <p className="text-xs text-ink-muted">
                {event.registration_mode === 'EXTERNAL_GFORM'
                  ? 'Pendaftaran dialihkan melalui Google Form resmi kepanitiaan.'
                  : 'Isi data teks di bawah ini untuk mengamankan kursi Anda.'}
              </p>
            </div>

            {isClosed ? (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-rose-800">Pendaftaran Telah Ditutup</h4>
                <p className="text-xs text-rose-600">
                  {isFull
                    ? 'Mohon maaf, kuota kursi untuk kegiatan ini telah terpenuhi.'
                    : 'Batas waktu pendaftaran untuk kegiatan ini telah berakhir.'}
                </p>
              </div>
            ) : registeredSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">Pendaftaran Berhasil!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Data Anda telah terdaftar resmi dalam sistem GIBEI UNIMED. Tim kepanitiaan akan menghubungi Anda melalui WhatsApp atau Email untuk informasi teknis pelaksanaan.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRegisteredSuccess(false)}
                  className="text-xs font-semibold"
                >
                  Daftarkan Peserta Lain
                </Button>
              </div>
            ) : event.registration_mode === 'EXTERNAL_GFORM' ? (
              <div className="space-y-4">
                <p className="text-xs text-ink-muted leading-relaxed">
                  Panitia menyelenggarakan pendaftaran kegiatan ini melalui formulir eksternal Google Form. Klik tombol di bawah untuk membuka formulir pendaftaran:
                </p>
                <a
                  href={event.external_gform_url || event.gform_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-gold hover:bg-gold-hover text-ink shadow-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-ink" />
                  Buka Google Form Pendaftaran
                </a>
              </div>
            ) : (
              /* Mode INTERNAL_FORM: Data Teks Murni Anti-Duplikat */
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-ink">Nama Lengkap</Label>
                  <Input
                    placeholder="Nama sesuai identitas..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-ink">Alamat Email Aktif</Label>
                  <Input
                    type="email"
                    placeholder="contoh: nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-ink">NIM / NIK / ID</Label>
                    <Input
                      placeholder="NIM mahasiswa..."
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-ink">Nomor WhatsApp</Label>
                    <Input
                      type="tel"
                      placeholder="081234567890"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-ink">Fakultas / Prodi / Instansi</Label>
                  <Input
                    placeholder="Contoh: FE UNIMED - Pendidikan Ekonomi"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    required
                  />
                </div>

                {/* Status Kepemilikan RDN (khusus SPM) */}
                {isSpm && (
                  <div className="p-3 rounded-xl bg-surface border border-line space-y-2">
                    <Label className="text-xs font-semibold text-ink block">
                      Apakah Anda sudah memiliki Rekening Dana Nasabah (RDN)?
                    </Label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="rdn"
                          checked={hasRdn === true}
                          onChange={() => setHasRdn(true)}
                          className="text-cerulean focus:ring-cerulean"
                        />
                        <span>Sudah Punya</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="rdn"
                          checked={hasRdn === false}
                          onChange={() => setHasRdn(false)}
                          className="text-cerulean focus:ring-cerulean"
                        />
                        <span>Belum Ada</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-ink">Catatan / Pertanyaan (Opsional)</Label>
                  <Textarea
                    rows={2}
                    placeholder="Motivasi atau pertanyaan terkait materi..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Honeypot anti-bot tersembunyi */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="company_website">Website</label>
                  <input
                    id="company_website"
                    name="company_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>

                <TurnstileWidget
                  action="event_register"
                  onTokenChange={setTurnstileToken}
                  resetSignal={turnstileReset}
                />

                <Button
                  type="submit"
                  disabled={submitting || (isTurnstileClientEnabled && !turnstileToken)}
                  className="w-full bg-gold hover:bg-gold-hover text-ink font-black text-xs py-3 rounded-2xl shadow-sm transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-ink" />
                      Memverifikasi Data...
                    </>
                  ) : (
                    'Konfirmasi & Daftar Sekarang'
                  )}
                </Button>

                <p className="text-[10px] text-center text-ink-muted">
                  Sistem menerapkan validasi anti-duplikat. Satu NIM dan Email hanya dapat mendaftar sekali.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

