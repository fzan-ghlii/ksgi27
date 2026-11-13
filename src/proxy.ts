import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAllowedMutationOrigin } from '@/lib/security/guards';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lapis kedua proteksi CSRF untuk seluruh mutasi API (kecuali webhook eksternal bertoken)
  if (pathname.startsWith('/api/')) {
    const originCheck = isAllowedMutationOrigin({
      method: request.method,
      pathname,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      fetchSite: request.headers.get('sec-fetch-site'),
    });

    if (!originCheck.allowed) {
      return NextResponse.json(
        { error: 'Permintaan lintas origin ditolak.' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('__session')?.value;

  // Protect internal dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === '/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/login'],
};

