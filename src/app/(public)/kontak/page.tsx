'use client';

import * as React from 'react';
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Send,
  HelpCircle,
  ChevronDown,
  Globe,
  Sparkles,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const FAQS = [
  {
    q: 'Apa itu Sekolah Pasar Modal (SPM) dan siapa saja yang boleh mendaftar?',
    a: 'Sekolah Pasar Modal (SPM) adalah program edukasi resmi bersertifikat dari Bursa Efek Indonesia (BEI) yang diselenggarakan oleh GIBEI UNIMED. SPM terbuka untuk seluruh mahasiswa UNIMED dari semua fakultas, dosen, staf, serta masyarakat umum yang ingin memahami investasi saham dari dasar.',
  },
  {
    q: 'Berapa biaya pendaftaran SPM dan apakah mendapatkan Rekening Saham (RDN)?',
    a: 'Pendaftaran SPM umumnya gratis atau hanya memerlukan deposit awal minimal (misal Rp100.000) yang 100% langsung masuk menjadi saldo Rekening Dana Nasabah (RDN) pribadi Anda di perusahaan sekuritas mitra resmi kami (tanpa potongan biaya pelatihan).',
  },
  {
    q: 'Apakah peserta SPM akan mendapatkan sertifikat resmi?',
    a: 'Ya, seluruh peserta yang menyelesaikan sesi pelatihan dan evaluasi akan memperoleh E-Certificate resmi dari Bursa Efek Indonesia (BEI) dan GIBEI UNIMED yang dapat digunakan sebagai portofolio keahlian literasi keuangan.',
  },
  {
    q: 'Bagaimana cara bergabung menjadi pengurus aktif GIBEI UNIMED?',
    a: 'Perekrutan pengurus (Open Recruitment) diadakan setahun sekali pada masa pergantian periode kabinet oleh Divisi HRD. Calon pengurus yang lolos seleksi berkas dan wawancara akan menerima Link Aktivasi Akun resmi untuk didaftarkan ke dalam sistem manajemen GIBEI UNIMED.',
  },
  {
    q: 'Apakah bisa berkonsultasi langsung di Galeri Investasi BEI UNIMED?',
    a: 'Bisa! Anda dapat mengunjungi Sekretariat Galeri Investasi BEI UNIMED di Gedung Fakultas Ekonomi pada jam operasional kerja (Senin–Jumat, 09.00–16.00 WIB) untuk asistensi pembukaan akun saham, riset emiten, atau informasi kompetisi.',
  },
];

export default function KontakPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Pesan Anda berhasil dikirim ke Humas GIBEI UNIMED!');
  };

  return (
    <div className="py-12 sm:py-16 bg-background min-h-[70vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-16">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cerulean/10 text-cerulean text-xs font-bold uppercase tracking-wider mb-3 border border-cerulean/20">
            Hubungi Kami
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight">
            Sekretariat & Layanan Konsultasi RDN
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-muted">
            Kunjungi Galeri Investasi BEI UNIMED atau hubungi tim kami untuk asistensi pembukaan rekening saham, pertanyaan SPM, dan kolaborasi literasi.
          </p>
        </div>

        {/* Baris 1: Detail Kontak & Formulir Pesan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detail Kontak & Jam Operasional */}
          <div className="space-y-6">
            <div className="bento-card p-6 sm:p-7 bg-white border border-line rounded-3xl shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-ink">Informasi Layanan & Sekretariat</h3>

              <div className="space-y-4 text-xs text-ink-muted leading-relaxed">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-cerulean shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-ink text-sm">Lokasi Galeri:</strong>
                    <span>Gedung Fakultas Ekonomi Lantai 1, Universitas Negeri Medan, Jl. Willem Iskandar Pasar V, Medan Estate, Sumatera Utara</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-cyan shrink-0" />
                  <div>
                    <strong className="block text-ink text-sm">Email Resmi:</strong>
                    <span>gibei@unimed.ac.id</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gold shrink-0" />
                  <div>
                    <strong className="block text-ink text-sm">WhatsApp Humas:</strong>
                    <span>+62 812-6000-2027</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-line">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-ink text-sm">Jam Layanan RDN & SPM:</strong>
                    <span>Senin – Jumat: 09.00 – 16.00 WIB</span>
                    <span className="block text-[11px] text-ink-muted/80">Konsultasi tatap muka & daring via Zoom</span>
                  </div>
                </div>
              </div>

              {/* Tautan Sosial Media */}
              <div className="pt-4 border-t border-line space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                  Media Sosial Resmi
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://instagram.com/gibei_unimed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-surface border border-line text-cerulean hover:bg-cerulean hover:text-white transition-all shadow-xs inline-flex items-center justify-center"
                    title="Instagram GIBEI UNIMED"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com/company/gibei-unimed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-surface border border-line text-cerulean hover:bg-cerulean hover:text-white transition-all shadow-xs inline-flex items-center justify-center"
                    title="LinkedIn GIBEI UNIMED"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <a
                    href="https://idx.co.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-surface border border-line text-cerulean hover:bg-cerulean hover:text-white transition-all shadow-xs"
                    title="Bursa Efek Indonesia"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Formulir Pesan */}
          <div className="bento-card p-6 sm:p-8 bg-white border border-line rounded-3xl shadow-sm lg:col-span-2 space-y-5">
            <h3 className="text-xl font-bold text-ink">Kirim Pertanyaan atau Pengajuan Kerja Sama</h3>
            <p className="text-xs text-ink-muted">
              Pesan Anda akan otomatis diteruskan kepada Divisi Media, Edukasi, dan Presidium GIBEI UNIMED.
            </p>

            {submitted ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 space-y-3">
                <h4 className="font-bold text-base">Pesan Anda Berhasil Terkirim!</h4>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Terima kasih telah menghubungi Galeri Investasi BEI UNIMED. Pengurus kami akan membalas melalui email atau WhatsApp sesegera mungkin.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Kirim Pesan Lain
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-ink">Nama Lengkap</Label>
                    <Input placeholder="Nama Anda" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-ink">Alamat Email</Label>
                    <Input type="email" placeholder="nama@email.com" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-ink">Subjek Pertanyaan / Kerja Sama</Label>
                  <Input placeholder="Contoh: Konsultasi Pembukaan RDN Mahasiswa / Kolaborasi Seminar" required />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-ink">Isi Pesan</Label>
                  <Textarea
                    rows={4}
                    placeholder="Tuliskan pertanyaan, latar belakang prodi/instansi, atau kebutuhan kerja sama..."
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-gold hover:bg-gold-hover text-ink font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm gap-2"
                  >
                    <Send className="h-4 w-4 text-ink" />
                    Kirim Pesan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Baris 2: FAQ Interaktif Sekolah Pasar Modal & Keanggotaan */}
        <div className="space-y-6 pt-6 border-t border-line">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-cerulean flex items-center gap-1.5 mb-1">
              <HelpCircle className="w-4 h-4 text-cerulean" />
              Frequently Asked Questions (FAQ)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Tanya Jawab Seputar SPM & Organisasi
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Pertanyaan umum yang sering diajukan mengenai pendaftaran Sekolah Pasar Modal, akun saham, dan keanggotaan GIBEI UNIMED.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-line bg-white overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-ink hover:text-cerulean transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-ink-muted transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180 text-cerulean' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-ink-muted leading-relaxed border-t border-line/60 bg-surface/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
