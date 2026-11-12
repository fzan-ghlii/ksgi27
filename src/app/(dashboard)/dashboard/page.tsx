import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  FileText, 
  Link2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { CalendarAndAnnouncements } from '@/components/dashboard/calendar-and-announcements';
import { EventAndSpm, Announcement } from '@/types';

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Fetch quick metrics & calendar data
  let totalMembers = 0;
  let activeInvites = 0;
  let totalArticles = 0;
  let events: EventAndSpm[] = [];
  let announcements: Announcement[] = [];

  try {
    const [membersSnap, invitesSnap, articlesSnap, eventsSnap, announcementsSnap] = await Promise.all([
      adminDb.collection('board_members').count().get(),
      adminDb.collection('activation_invites').where('status', '==', 'PENDING').count().get(),
      adminDb.collection('articles').count().get(),
      adminDb.collection('events').limit(20).get().catch(() => null),
      adminDb.collection('announcements').orderBy('pinned', 'desc').orderBy('created_at', 'desc').limit(15).get().catch(() => null),
    ]);
    totalMembers = membersSnap.data().count;
    activeInvites = invitesSnap.data().count;
    totalArticles = articlesSnap.data().count;
    if (eventsSnap) {
      events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EventAndSpm));
    }
    if (announcementsSnap) {
      announcements = announcementsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
    }
  } catch {
    // Fallback for initial empty DB
  }

  const isCreator = user.role === 'creator';
  const isPresidium = user.role === 'master_presidium';
  const isKadiv = user.role === 'admin_kadiv';
  const isKadivHrd = isKadiv && user.division_code === 'HRD';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1e3b2f] via-[#172e25] to-[#12221b] p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-forest/15">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} />
              {user.division_code && (
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md text-white">
                  {user.division_code}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat Datang, {user.full_name}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              {user.position_title ? `${user.position_title} • ` : ''}Portal manajemen internal terpadu Galeri Investasi BEI UNIMED.
            </p>
          </div>

          {(isCreator || isPresidium || isKadivHrd) && (
            <Link href="/dashboard/aktivasi">
              <Button variant="gold" size="lg" className="gap-2 font-bold shadow-md shadow-gold/25 text-sm">
                <Link2 className="h-4 w-4" />
                Kelola Link Aktivasi
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Adaptive Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pengurus"
          value={totalMembers}
          subtitle="Tercatat di struktur aktif"
          icon={Users}
          variant="cerulean"
        />

        <StatCard
          title="Tautan Aktivasi"
          value={activeInvites}
          subtitle="Menunggu pendaftaran"
          icon={Link2}
          variant="cyan"
        />

        <StatCard
          title="Artikel & Riset"
          value={totalArticles}
          subtitle="Kajian pasar modal"
          icon={FileText}
          variant="gold"
        />

        <StatCard
          title="Divisi Resmi"
          value="6 + Presidium"
          subtitle="Struktur baku terkunci"
          icon={Layers}
          variant="default"
        />
      </div>

      {/* Internal Announcements & Calendar with Google Calendar Integration */}
      <CalendarAndAnnouncements
        events={events}
        initialAnnouncements={announcements}
        user={user}
      />

      {/* Role-Specific Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Status */}
        <div className="bento-card p-6 bg-white border border-line lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <h3 className="font-bold text-lg text-ink flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cerulean" />
              Aksi Cepat Menu ({user.role.replace('_', ' ')})
            </h3>
            <span className="text-xs text-ink-muted">Tahap 1 Aktif</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(isCreator || isPresidium || isKadivHrd) && (
              <Link href="/dashboard/aktivasi" className="p-4 rounded-2xl border border-line hover:border-cerulean bg-surface/50 hover:bg-white transition-all space-y-2 block group">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-gold-light text-[#66532d] flex items-center justify-center">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cerulean group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-sm text-ink">Generator Link Aktivasi</h4>
                <p className="text-xs text-ink-muted">Buat tautan undangan sekali pakai untuk pengurus baru.</p>
              </Link>
            )}

            <Link href="/dashboard/profil" className="p-4 rounded-2xl border border-line hover:border-cerulean bg-surface/50 hover:bg-white transition-all space-y-2 block group">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-cerulean-light text-cerulean flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cerulean group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-bold text-sm text-ink">Profil Biodata Saya</h4>
              <p className="text-xs text-ink-muted">Periksa NIM, nomor kontak WhatsApp, dan foto pengurus.</p>
            </Link>

            <Link href="/dashboard/artikel" className="p-4 rounded-2xl border border-line hover:border-cerulean bg-surface/50 hover:bg-white transition-all space-y-2 block group">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-cyan-light text-[#556343] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cerulean group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-bold text-sm text-ink">Tulis / Moderasi Artikel</h4>
              <p className="text-xs text-ink-muted">Kelola draf riset emiten dan alur persetujuan publikasi.</p>
            </Link>

            {isCreator && (
              <Link href="/dashboard/sistem" className="p-4 rounded-2xl border border-gold/40 hover:border-gold bg-gold-light/20 hover:bg-white transition-all space-y-2 block group">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-gold text-ink flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-sm text-ink">Pengaturan Sistem Internal</h4>
                <p className="text-xs text-ink-muted">Audit log aktivitas, konfigurasi integrasi Firebase & Sheets.</p>
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Organization Info & Guidelines */}
        <div className="bento-card p-6 bg-white border border-line space-y-4">
          <h3 className="font-bold text-base text-ink pb-2 border-b border-line">
            Pedoman Hak Akses Pengurus
          </h3>
          <div className="text-xs text-ink-muted space-y-3 leading-relaxed">
            <p>
              Sistem menerapkan <strong>Role-Based Access Control (RBAC)</strong> yang terstruktur sesuai wewenang organisasi:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-ink">•</span>
                <span><strong>Presidium:</strong> Manajemen organisasi lintas divisi, verifikasi dan pengesahan seluruh kegiatan serta pembuatan link aktivasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-ink">•</span>
                <span><strong>Kadiv:</strong> CRUD proker divisi sendiri, persetujuan artikel. (Khusus HRD: buat link anggota).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-ink">•</span>
                <span><strong>Anggota:</strong> Tulis draf tulisan, antrean galeri, profil mandiri.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
