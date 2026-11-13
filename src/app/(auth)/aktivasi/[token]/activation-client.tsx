'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ActivationInvite } from '@/types';
import { registerWithEmail, loginWithGoogle } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, AlertCircle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUrlInput, IMAGE_HELP } from '@/components/shared/image-inputs';

interface ActivationClientProps {
  invite: ActivationInvite;
  token: string;
}

export function ActivationClient({ invite, token }: ActivationClientProps) {
  const router = useRouter();

  // Auth Step
  const [authMethod, setAuthMethod] = React.useState<'choose' | 'email' | 'google'>('choose');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmedPassword, setConfirmedPassword] = React.useState('');
  
  // Profile Data
  const [fullName, setFullName] = React.useState(invite.recipient_name_hint || '');
  const [nim, setNim] = React.useState('');
  const [facultyMajor, setFacultyMajor] = React.useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const cred = await loginWithGoogle();
      const idToken = await cred.user.getIdToken();
      setEmail(cred.user.email || '');
      if (cred.user.displayName && !fullName) {
        setFullName(cred.user.displayName);
      }
      if (cred.user.photoURL && !avatarUrl) {
        setAvatarUrl(cred.user.photoURL);
      }
      setAuthMethod('google');
      // Save ID token temporarily
      sessionStorage.setItem('temp_act_id_token', idToken);
      toast.success('Akun Google berhasil terhubung!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghubungkan Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      let idToken = sessionStorage.getItem('temp_act_id_token');

      // If email auth chosen
      if (authMethod === 'email') {
        if (!password || password.length < 6) {
          throw new Error('Kata sandi minimal 6 karakter.');
        }
        if (password !== confirmedPassword) {
          throw new Error('Konfirmasi kata sandi tidak cocok.');
        }
        const cred = await registerWithEmail(email, password);
        idToken = await cred.user.getIdToken();
      }

      if (!idToken) {
        throw new Error('Autentikasi akun diperlukan. Silakan hubungkan akun Google atau buat kata sandi.');
      }

      // Submit complete activation payload
      const res = await fetch('/api/activation/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          id_token: idToken,
          full_name: fullName,
          nim,
          faculty_major: facultyMajor,
          phone_whatsapp: phoneWhatsapp,
          avatar_url: avatarUrl || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Aktivasi gagal.');
      }

      sessionStorage.removeItem('temp_act_id_token');
      toast.success('Selamat! Akun pengurus berhasil diaktivasi.');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat aktivasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Invite Summary Banner */}
      <div className="rounded-3xl border border-cerulean/30 bg-gradient-to-r from-cerulean-light/50 via-white to-cyan-light/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-light text-[#66532d] text-xs font-bold border border-gold/30">
              <Sparkles className="h-3 w-3" />
              Undangan Resmi Pengurus
            </div>
            <h2 className="text-2xl font-black text-ink mt-2">
              {invite.assigned_position}
            </h2>
            <p className="text-xs text-cerulean-dark font-semibold">
              {invite.division_code} • Periode Kabinet Aktif
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[11px] font-semibold text-ink-muted">Tingkat Hak Akses</span>
            <span className="text-xs font-bold capitalize text-ink mt-0.5">
              {invite.target_role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Activation Card */}
      <Card className="shadow-xl border-line">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-cerulean">
            <UserCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-cerulean-dark">
              Formulir Biodata Pengurus
            </span>
          </div>
          <CardTitle className="text-xl font-bold text-ink">
            Aktivasi Akun & Lengkapi Profil
          </CardTitle>
          <CardDescription className="text-xs text-ink-muted">
            Data ini akan didaftarkan ke sistem keanggotaan dan struktur kepengurusan publik GIBEI UNIMED.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Authentication Method */}
            <div className="space-y-3 pb-6 border-b border-line">
              <Label className="text-sm font-bold text-ink block">
                1. Hubungkan Akun Masuk (Pilih Salah Satu)
              </Label>

              {authMethod === 'google' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-800">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Terhubung dengan Google: <strong>{email}</strong></span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-ink-muted"
                    onClick={() => {
                      setAuthMethod('choose');
                      sessionStorage.removeItem('temp_act_id_token');
                    }}
                  >
                    Ganti
                  </Button>
                </div>
              ) : authMethod === 'email' ? (
                <div className="space-y-3 p-4 rounded-xl bg-surface border border-line">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink">Buat Akun Email & Password</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-ink-muted h-6 p-0"
                      onClick={() => setAuthMethod('choose')}
                    >
                      Kembali ke pilihan
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      placeholder="emailanda@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Kata Sandi (min 6 karakter)</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ulangi Kata Sandi</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmedPassword}
                        onChange={(e) => setConfirmedPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-line hover:border-cerulean text-ink font-semibold gap-2"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    Aktivasi via Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-line hover:border-cerulean text-ink font-semibold"
                    onClick={() => setAuthMethod('email')}
                  >
                    Gunakan Email & Password
                  </Button>
                </div>
              )}
            </div>

            {/* Step 2: Personal Profile Data */}
            <div className="space-y-4">
              <Label className="text-sm font-bold text-ink block">
                2. Identitas Mahasiswa & Kontak
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="full_name">Nama Lengkap & Gelar (Jika Ada)</Label>
                  <Input
                    id="full_name"
                    placeholder="Contoh: Budi Pratama"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</Label>
                  <Input
                    id="nim"
                    placeholder="Contoh: 7213210045"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="faculty_major">Fakultas / Program Studi</Label>
                  <Input
                    id="faculty_major"
                    placeholder="Contoh: FE / Manajemen"
                    value={facultyMajor}
                    onChange={(e) => setFacultyMajor(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Nomor WhatsApp Aktif</Label>
                  <Input
                    id="phone"
                    placeholder="Contoh: 081234567890"
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="avatar">Foto Profil Pengurus (Opsional)</Label>
                    <span className="text-[10px] text-ink-muted">JPG / PNG / WebP</span>
                  </div>
                  <ImageUrlInput
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    placeholder="/gambar/pengurus/foto.webp atau https://..."
                    disabled={loading}
                  />
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    {IMAGE_HELP}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Confirmation Button */}
            <div className="pt-6 border-t border-line">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={loading || authMethod === 'choose'}
                className="w-full h-12 text-base font-extrabold shadow-lg shadow-gold/25 text-ink gap-2"
              >
                <ShieldCheck className="h-5 w-5" />
                {loading ? 'Menyimpan & Mengaktivasi...' : 'Selesaikan Aktivasi Pengurus'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-[11px] text-center text-ink-muted mt-2">
                Setelah tombol ditekan, akun pengurus Anda akan langsung aktif dan tautan ini akan ditandai selesai terpakai.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

