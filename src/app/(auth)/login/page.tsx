'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithEmail, loginWithGoogle } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GibeiLogo } from '@/components/shared/logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const processIdToken = async (idToken: string) => {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal membuat sesi login.');
    }

    toast.success(`Selamat datang, ${data.user.full_name}!`);
    router.push(nextUrl);
    router.refresh();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const cred = await loginWithEmail(email, password);
      const idToken = await cred.user.getIdToken();
      await processIdToken(idToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        setError('Email atau password salah.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const cred = await loginWithGoogle();
      const idToken = await cred.user.getIdToken();
      await processIdToken(idToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in gagal.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-line">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <GibeiLogo className="h-14 w-14 shadow-md shadow-cerulean/20" iconClassName="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-black text-ink">
          Portal Pengurus GIBEI
        </CardTitle>
        <CardDescription className="text-xs text-ink-muted mt-1">
          Masuk ke dashboard manajemen internal GIBEI UNIMED.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-line hover:border-cerulean text-ink font-semibold gap-2.5"
          onClick={handleGoogleLogin}
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
          Masuk dengan Akun Google
        </Button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-line w-full" />
          <span className="bg-white px-3 text-[11px] uppercase font-bold text-slate-400 absolute">
            atau dengan email
          </span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Pengurus</Label>
            <Input
              id="email"
              type="email"
              placeholder="pengurus@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="cerulean"
            className="w-full h-11 font-bold text-sm shadow-md shadow-cerulean/20"
            disabled={loading}
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col text-center space-y-2 border-t border-line/60 pt-4">
        <p className="text-xs text-ink-muted leading-relaxed">
          Belum memiliki akun pengurus? Pendaftaran internal hanya dibuka melalui <strong>Link Aktivasi</strong> resmi dari Presidium / Divisi HRD.
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="text-xs text-ink-muted">Memuat portal login...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
