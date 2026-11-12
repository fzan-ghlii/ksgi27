'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { EventAndSpm, Period, UserProfile } from '@/types';
import { OFFICIAL_DIVISIONS } from '@/lib/constants/divisions';
import { isPresidiumUp } from '@/lib/auth/permissions';
import { Calendar, Users, FileSpreadsheet, ExternalLink, Loader2 } from 'lucide-react';
import { ImageUrlInput } from '@/components/shared/image-inputs';

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: EventAndSpm | null;
  user: UserProfile;
  periods: Period[];
  onSuccess?: () => void;
}

export function EventModal({
  open,
  onOpenChange,
  eventToEdit,
  user,
  periods,
  onSuccess,
}: EventModalProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const isPresidium = isPresidiumUp(user);
  const userDivision = user.division_code;

  // Form State
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<'SPM' | 'EVENT'>('SPM');
  const [spmLevel, setSpmLevel] = React.useState<'Level 1' | 'Level 2' | 'Level 3'>('Level 1');
  const [divisionCode, setDivisionCode] = React.useState(userDivision || 'EDUKASI');
  const [periodId, setPeriodId] = React.useState(periods.find((p) => p.is_current)?.id || periods[0]?.id || '');
  const [bannerUrl, setBannerUrl] = React.useState('');
  const [locationType, setLocationType] = React.useState<'ONLINE' | 'OFFLINE' | 'HYBRID'>('ONLINE');
  const [locationDetail, setLocationDetail] = React.useState('');
  const [eventDate, setEventDate] = React.useState('');
  const [regDeadline, setRegDeadline] = React.useState('');
  const [quota, setQuota] = React.useState<number>(100);
  const [regMode, setRegMode] = React.useState<'INTERNAL_FORM' | 'EXTERNAL_GFORM'>('INTERNAL_FORM');
  const [externalGformUrl, setExternalGformUrl] = React.useState('');
  const [spreadsheetId, setSpreadsheetId] = React.useState('');
  const [sheetTabName, setSheetTabName] = React.useState('Pendaftar');
  const [status, setStatus] = React.useState<'OPEN' | 'DRAFT' | 'CLOSED' | 'COMPLETED'>('OPEN');
  const [isPublished, setIsPublished] = React.useState(true);

  // Sinkronkan form saat modal dibuka atau saat eventToEdit berubah
  React.useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setSlug(eventToEdit.slug || '');
      setDescription(eventToEdit.description || '');
      setCategory(eventToEdit.category || (eventToEdit.category_type === 'SPM' ? 'SPM' : 'EVENT'));
      setSpmLevel((eventToEdit.spm_level as any) || 'Level 1');
      setDivisionCode(eventToEdit.division_code || 'EDUKASI');
      setPeriodId(eventToEdit.period_id || periods[0]?.id || '');
      setBannerUrl(eventToEdit.banner_url || eventToEdit.poster_url || '');
      setLocationType(eventToEdit.location_type || 'ONLINE');
      setLocationDetail(eventToEdit.location_detail || eventToEdit.location_or_link || '');
      setEventDate(eventToEdit.event_date ? eventToEdit.event_date.slice(0, 16) : '');
      setRegDeadline(eventToEdit.registration_deadline ? eventToEdit.registration_deadline.slice(0, 16) : '');
      setQuota(eventToEdit.quota || 100);
      setRegMode(eventToEdit.registration_mode || 'INTERNAL_FORM');
      setExternalGformUrl(eventToEdit.external_gform_url || eventToEdit.gform_url || '');
      setSpreadsheetId(eventToEdit.spreadsheet_id || '');
      setSheetTabName(eventToEdit.sheet_tab_name || 'Pendaftar');
      setStatus(eventToEdit.status || 'OPEN');
      setIsPublished(eventToEdit.is_published ?? true);
    } else {
      // Default baru
      setTitle('');
      setSlug('');
      setDescription('');
      const defaultCat = userDivision === 'EDUKASI' ? 'SPM' : 'EVENT';
      setCategory(defaultCat);
      setSpmLevel('Level 1');
      setDivisionCode(userDivision || 'KEGIATAN');
      setPeriodId(periods.find((p) => p.is_current)?.id || periods[0]?.id || '');
      setBannerUrl('/gambar/artikel/dummy.jpg');
      setLocationType('ONLINE');
      setLocationDetail('Zoom Meeting GIBEI UNIMED');
      
      const inTwoWeeks = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16);
      const inTwelveDays = new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().slice(0, 16);
      setEventDate(inTwoWeeks);
      setRegDeadline(inTwelveDays);
      setQuota(100);
      setRegMode('INTERNAL_FORM');
      setExternalGformUrl('');
      setSpreadsheetId('');
      setSheetTabName('Pendaftar');
      setStatus('OPEN');
      setIsPublished(true);
    }
  }, [eventToEdit, open, periods, userDivision]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Judul dan deskripsi kegiatan wajib diisi.');
      return;
    }

    if (category === 'SPM' && !spmLevel) {
      toast.error('Pilih tingkat Level untuk Sekolah Pasar Modal (SPM).');
      return;
    }

    if (regMode === 'EXTERNAL_GFORM' && !externalGformUrl.trim()) {
      toast.error('Tautan Google Form wajib diisi jika mode pendaftaran eksternal dipilih.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        category,
        spm_level: category === 'SPM' ? spmLevel : null,
        division_code: divisionCode,
        period_id: periodId,
        banner_url: bannerUrl.trim() || undefined,
        location_type: locationType,
        location_detail: locationDetail.trim(),
        event_date: new Date(eventDate).toISOString(),
        registration_deadline: new Date(regDeadline).toISOString(),
        quota: Number(quota),
        registration_mode: regMode,
        external_gform_url: externalGformUrl.trim() || undefined,
        spreadsheet_id: spreadsheetId.trim(),
        sheet_tab_name: sheetTabName.trim() || 'Pendaftar',
        status,
        is_published: isPublished,
      };

      const url = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
      const method = eventToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan kegiatan.');
      }

      toast.success(eventToEdit ? 'Kegiatan berhasil diperbarui.' : 'Kegiatan baru berhasil dibuat.');
      onOpenChange(false);
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            {eventToEdit ? 'Edit Kegiatan & SPM' : 'Buat Kegiatan / SPM Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Baris 1: Kategori & Tingkat SPM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-secondary/30 border border-border">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Kategori Kegiatan</Label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as 'SPM' | 'EVENT';
                  setCategory(val);
                  if (val === 'SPM') {
                    setDivisionCode('EDUKASI');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="SPM">Sekolah Pasar Modal (SPM)</option>
                <option value="EVENT">Program Kerja / Seminar / Kompetisi</option>
              </select>
            </div>

            {category === 'SPM' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Level SPM</Label>
                <select
                  value={spmLevel}
                  onChange={(e) => setSpmLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Level 1">Level 1 — Pengenalan Investasi</option>
                  <option value="Level 2">Level 2 — Belajar tentang Saham</option>
                  <option value="Level Lanjutan - Fundamental">Level Lanjutan — Analisis Fundamental</option>
                  <option value="Level Lanjutan - Teknikal">Level Lanjutan — Analisis Teknikal</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Divisi Penyelenggara</Label>
                <select
                  value={divisionCode}
                  disabled={!isPresidium && !!userDivision}
                  onChange={(e) => setDivisionCode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-border focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-muted"
                >
                  {Object.values(OFFICIAL_DIVISIONS).map((div) => (
                    <option key={div.code} value={div.code}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Baris 2: Judul & Slug */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Judul Kegiatan</Label>
              <Input
                placeholder="Contoh: Sekolah Pasar Modal Level 1 Batch 2027"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Slug URL (Opsional)</Label>
                <Input
                  placeholder="otomatis dari judul jika dikosongkan"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Periode Kabinet</Label>
                <select
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      Periode {p.year_range}{p.cabinet_name ? ` (${p.cabinet_name})` : ''} {p.is_current ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Deskripsi Lengkap Kegiatan</Label>
            <Textarea
              rows={4}
              placeholder="Tuliskan tujuan, silabus materi, narasumber, atau persyaratan peserta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Lokasi & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tipe Lokasi</Label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="ONLINE">Online (Daring)</option>
                <option value="OFFLINE">Offline (Tatap Muka)</option>
                <option value="HYBRID">Hybrid (Campuran)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Detail Lokasi / Tautan Meeting</Label>
              <Input
                placeholder="Contoh: Gedung Digital Library Lt. 3 / Tautan Zoom"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tanggal & Kuota */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tanggal & Waktu Acara</Label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Batas Waktu Pendaftaran</Label>
              <Input
                type="datetime-local"
                value={regDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Maksimal Kuota (Orang)</Label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  max={5000}
                  className="pl-9"
                  value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Banner & Poster Image */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Tautan Banner / Poster Gambar</Label>
            <ImageUrlInput
              value={bannerUrl}
              onChange={setBannerUrl}
              placeholder="Unggah gambar poster (PNG/JPG) atau ketik URL..."
            />
          </div>

          {/* Mode Pendaftaran & Google Ecosystem */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Metode Pendaftaran Peserta</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white cursor-pointer hover:border-primary transition-all">
                  <input
                    type="radio"
                    name="regMode"
                    value="INTERNAL_FORM"
                    checked={regMode === 'INTERNAL_FORM'}
                    onChange={() => setRegMode('INTERNAL_FORM')}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Formulir Internal GIBEI</p>
                    <p className="text-muted-foreground text-[11px]">Daftar langsung di web + anti-duplikat</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-white cursor-pointer hover:border-primary transition-all">
                  <input
                    type="radio"
                    name="regMode"
                    value="EXTERNAL_GFORM"
                    checked={regMode === 'EXTERNAL_GFORM'}
                    onChange={() => setRegMode('EXTERNAL_GFORM')}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Google Form Eksternal</p>
                    <p className="text-muted-foreground text-[11px]">Mengarahkan tombol ke Google Form</p>
                  </div>
                </label>
              </div>
            </div>

            {regMode === 'EXTERNAL_GFORM' && (
              <div className="space-y-1.5 animate-fadeIn">
                <Label className="text-xs font-semibold text-foreground">Tautan Google Form (URL)</Label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="https://forms.gle/..."
                    className="pl-9"
                    value={externalGformUrl}
                    onChange={(e) => setExternalGformUrl(e.target.value)}
                    required={regMode === 'EXTERNAL_GFORM'}
                  />
                </div>
              </div>
            )}

            {/* Google Sheets API Integration */}
            <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  ID Google Spreadsheet (Opsional)
                </Label>
                <Input
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nama Tab Lembar Kerja</Label>
                <Input
                  placeholder="Default: Pendaftar"
                  value={sheetTabName}
                  onChange={(e) => setSheetTabName(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Jika ID Google Spreadsheet diisi, data pendaftar internal akan otomatis ditambahkan ke Google Sheet secara real-time.
            </p>
          </div>

          {/* Status & Publikasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Status Pendaftaran</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="OPEN">OPEN (Pendaftaran Dibuka)</option>
                <option value="DRAFT">DRAFT (Disimpan Internal)</option>
                <option value="CLOSED">CLOSED (Pendaftaran Ditutup)</option>
                <option value="COMPLETED">COMPLETED (Kegiatan Selesai)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <Label htmlFor="isPublished" className="text-xs font-semibold text-foreground cursor-pointer">
                Tampilkan di Halaman Publik Kegiatan
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold hover:bg-gold-hover text-ink font-bold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-ink" />
                  Menyimpan...
                </>
              ) : eventToEdit ? (
                'Simpan Perubahan'
              ) : (
                'Terbitkan Kegiatan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

