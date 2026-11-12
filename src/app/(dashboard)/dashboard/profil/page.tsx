import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/badge';
import { User, Mail, Phone, BookOpen, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function DashboardProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
          Profil Biodata Pengurus
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-1">
          Informasi keanggotaan dan akun resmi yang terdaftar di sistem GIBEI UNIMED.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left ID Card */}
        <div className="bento-card p-6 bg-white border border-line flex flex-col items-center text-center space-y-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-28 w-28 rounded-2xl object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="h-28 w-28 rounded-2xl bg-cerulean-light text-cerulean flex items-center justify-center font-bold text-3xl shadow-sm">
              {user.full_name.charAt(0)}
            </div>
          )}

          <div>
            <h2 className="font-bold text-lg text-ink">{user.full_name}</h2>
            <p className="text-xs font-semibold text-cerulean-dark mt-0.5">
              {user.position_title || 'Pengurus GIBEI UNIMED'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <RoleBadge role={user.role} />
            {user.division_code && (
              <span className="text-xs font-bold text-ink-muted bg-surface px-2.5 py-1 rounded-md border border-line">
                {user.division_code}
              </span>
            )}
          </div>
        </div>

        {/* Right Details Card */}
        <Card className="md:col-span-2 shadow-sm border-line">
          <CardHeader className="pb-4 border-b border-line">
            <CardTitle className="text-base font-bold text-ink">
              Data Akademik & Kontak
            </CardTitle>
            <CardDescription className="text-xs text-ink-muted">
              Data ini diisi saat aktivasi pertama kali menggunakan link undangan.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-surface/50 border border-line space-y-1">
                <span className="text-xs text-ink-muted font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-cerulean" />
                  Nomor Induk Mahasiswa (NIM)
                </span>
                <div className="font-bold text-ink">{user.nim || '-'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/50 border border-line space-y-1">
                <span className="text-xs text-ink-muted font-medium flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-cyan" />
                  Fakultas / Program Studi
                </span>
                <div className="font-bold text-ink">{user.faculty_major || '-'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/50 border border-line space-y-1">
                <span className="text-xs text-ink-muted font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cerulean" />
                  Alamat Email Terdaftar
                </span>
                <div className="font-bold text-ink truncate">{user.email}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/50 border border-line space-y-1">
                <span className="text-xs text-ink-muted font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gold" />
                  Nomor WhatsApp
                </span>
                <div className="font-bold text-ink">{user.phone_whatsapp || '-'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/50 border border-line space-y-1 sm:col-span-2">
                <span className="text-xs text-ink-muted font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Terdaftar Sejak
                </span>
                <div className="font-bold text-ink">{formatDate(user.created_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
