import { getInviteByToken } from '@/lib/data/invites';
import { ActivationClient } from './activation-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ActivationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { invite, isValid, statusMessage } = await getInviteByToken(token);

  if (!isValid || !invite) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl border-line text-center p-6 sm:p-8">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold text-ink">
            Tautan Tidak Valid
          </CardTitle>
          <CardDescription className="text-sm text-ink-muted mt-2 leading-relaxed">
            {statusMessage}
          </CardDescription>

          <div className="pt-6 mt-6 border-t border-line flex flex-col gap-2.5">
            <Link href="/login">
              <Button variant="cerulean" className="w-full">
                Menuju Halaman Login Pengurus
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Beranda Publik
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <ActivationClient invite={invite} token={token} />;
}

