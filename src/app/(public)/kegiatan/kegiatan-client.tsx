'use client';

import * as React from 'react';
import { EventAndSpm } from '@/types';
import { EventCard } from '@/components/public/event-card';
import { Sparkles, Calendar, BookOpen, Award, Layers, Search } from 'lucide-react';

interface KegiatanClientProps {
  events: EventAndSpm[];
}

export function KegiatanClient({ events }: KegiatanClientProps) {
  const [tab, setTab] = React.useState<'ALL' | 'SPM' | 'EVENT'>('ALL');
  const [search, setSearch] = React.useState('');

  const filtered = events.filter((e) => {
    const isSpm = e.category === 'SPM' || e.category_type === 'SPM';
    if (tab === 'SPM' && !isSpm) return false;
    if (tab === 'EVENT' && isSpm) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const title = e.title.toLowerCase();
      const desc = (e.description || '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-12">
      {/* SPM Educational Roadmap */}
      <div className="rounded-3xl border border-line bg-surface/50 p-6 sm:p-10 shadow-xs">
        <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
          <Award className="h-5 w-5 text-gold" />
          Jenjang Kurikulum Sekolah Pasar Modal (SPM) BEI & GIBEI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bento-card p-4 sm:p-5 bg-white border border-line space-y-2 rounded-2xl">
            <span className="text-xs font-bold text-cyan uppercase tracking-wider">Level 1</span>
            <h3 className="font-bold text-ink text-sm sm:text-base">Pengenalan Investasi</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Pengenalan instrumen efek pasar modal, konsep dasar investasi, dan pembukaan Rekening Dana Nasabah (RDN) resmi.
            </p>
          </div>
          <div className="bento-card p-4 sm:p-5 bg-white border border-line space-y-2 rounded-2xl">
            <span className="text-xs font-bold text-cerulean uppercase tracking-wider">Level 2</span>
            <h3 className="font-bold text-ink text-sm sm:text-base">Belajar tentang Saham</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Mekanisme perdagangan bursa efek, dasar-dasar instrumen saham, dan pemahaman profil risiko investor.
            </p>
          </div>
          <div className="bento-card p-4 sm:p-5 bg-white border border-line space-y-2 rounded-2xl">
            <span className="text-xs font-bold text-[#66532d] uppercase tracking-wider">Level Lanjutan</span>
            <h3 className="font-bold text-ink text-sm sm:text-base">Analisis Fundamental</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Membaca laporan keuangan emiten, rasio valuasi (PER, PBV, ROE, DER), serta prospek makroekonomi bisnis.
            </p>
          </div>
          <div className="bento-card p-4 sm:p-5 bg-white border border-line space-y-2 rounded-2xl">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Level Lanjutan</span>
            <h3 className="font-bold text-ink text-sm sm:text-base">Analisis Teknikal</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Strategi charting candlestick, indikator tren (Moving Average), momentum (RSI), timing entry/exit, dan manajemen modal.
            </p>
          </div>
        </div>
      </div>

      {/* Navigasi Tab Pemisah SPM vs Event Proker */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-line rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'ALL'
                ? 'bg-white text-cerulean shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Semua Agenda ({events.length})
          </button>
          <button
            onClick={() => setTab('SPM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'SPM'
                ? 'bg-white text-cerulean shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Sekolah Pasar Modal (SPM)
          </button>
          <button
            onClick={() => setTab('EVENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'EVENT'
                ? 'bg-white text-cerulean shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Program Kerja & Seminar
          </button>
        </div>

        {/* Pencarian */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari kegiatan atau materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white border border-line focus:ring-2 focus:ring-cerulean focus:outline-none"
          />
        </div>
      </div>

      {/* Grid Kartu Kegiatan */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line p-12 text-center bg-surface/30">
          <BookOpen className="h-10 w-10 text-cerulean mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-ink">Agenda Belum Tersedia</h3>
          <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
            Tidak ada agenda yang cocok dengan kategori atau kata kunci pencarian Anda. Jadwal pendaftaran batch berikutnya akan segera dibuka!
          </p>
        </div>
      )}
    </div>
  );
}

