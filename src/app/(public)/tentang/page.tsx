import Link from 'next/link';
import { History, ArrowRight, Sparkles, Trophy, Award, Building2 } from 'lucide-react';
import { DIVISION_LIST } from '@/lib/constants/divisions';
import { getPublicAchievements } from '@/lib/data/public';
import { Button } from '@/components/ui/button';
import { PublicPageHeader } from '@/components/public/page-header';
import { GibeiLogo } from '@/components/shared/logo';

export const revalidate = 60;

export const metadata = {
  title: 'Tentang Organisasi | GIBEI UNIMED',
  description: 'Profil organisasi, 6 divisi resmi, serta prestasi Galeri Investasi BEI Universitas Negeri Medan.',
};

export default async function TentangPage() {
  const achievements = await getPublicAchievements();
  return (
    <div className="py-12 sm:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-16 sm:space-y-20">
        <PublicPageHeader
          badge="Profil Organisasi"
          title="Tentang GIBEI UNIMED"
          description="Galeri Investasi Bursa Efek Indonesia Universitas Negeri Medan (GIBEI UNIMED) adalah laboratorium edukasi dan pusat literasi pasar modal yang didirikan atas kerja sama tripartit antara PT Bursa Efek Indonesia, Perusahaan Sekuritas Mitra, dan Fakultas Ekonomi Universitas Negeri Medan."
        />

        {/* Banner Link ke Sejarah & Makna Logo */}
        <div className="rounded-3xl border border-cerulean/30 bg-gradient-to-r from-cerulean-light/50 via-white to-cyan-light/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <GibeiLogo className="h-16 w-16 shadow-md shadow-cerulean/20" iconClassName="h-8 w-8" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-cerulean-dark uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                Halaman Khusus
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-ink">
                Sejarah, Makna Filosofi Logo, & Visi Misi GIBEI
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted">
                Ketahui historikal pendirian GIBEI, arti setiap guratan pada logo resmi, dan kompas pergerakan kami.
              </p>
            </div>
          </div>

          <Link href="/sejarah#visi-misi" className="shrink-0 w-full sm:w-auto">
            <Button variant="cerulean" className="w-full sm:w-auto gap-2 font-bold shadow-sm">
              <History className="h-4 w-4" />
              Lihat Sejarah, Logo &amp; Visi Misi
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* 6 Divisions Focus Areas */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              6 Divisi Resmi Organisasi
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              Fokus kerja terstruktur untuk memastikan tercapainya seluruh pilar Tridharma Perguruan Tinggi di sektor keuangan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIVISION_LIST.map((div) => (
              <div key={div.code} className="bento-card p-6 bg-white border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cerulean-dark bg-cerulean-light px-2.5 py-0.5 rounded-full border border-cerulean/20">
                    {div.code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink">{div.name}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {div.shortDesc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Prestasi GIBEI UNIMED (Dinamis dari Firestore, dikelola Presidium) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7a6026] uppercase tracking-wider mb-1">
                <Trophy className="h-4 w-4 text-gold" />
                Rekam Jejak Keunggulan
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
                Prestasi GIBEI UNIMED
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Penghargaan, capaian nasional maupun regional, dan dedikasi mahasiswa GIBEI UNIMED di pasar modal Indonesia.
              </p>
            </div>
          </div>

          {achievements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-gold-light text-[#7a6026] border border-gold/30 flex items-center justify-center mx-auto">
                <Trophy className="h-6 w-6 text-gold" />
              </div>
              <h3 className="text-base font-bold text-ink">Daftar Prestasi Sedang Diperbarui</h3>
              <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
                Presidium GIBEI UNIMED sedang mengkurasi dokumentasi penghargaan dan prestasi organisasi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="bento-card bg-white border border-line overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {item.image_url ? (
                      <div className="h-44 bg-surface border-b border-line overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gold text-ink shadow-xs">
                          {item.year}
                        </span>
                      </div>
                    ) : null}

                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cerulean-light text-cerulean-dark border border-cerulean/20">
                          <Award className="h-3 w-3" />
                          {item.level}
                        </span>
                        {!item.image_url && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold-light text-[#66532d] border border-gold/30">
                            {item.year}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-ink leading-snug">{item.title}</h3>

                      {item.category && (
                        <p className="text-xs font-semibold text-cerulean-dark">{item.category}</p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.organizer}</span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-ink-muted leading-relaxed pt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
