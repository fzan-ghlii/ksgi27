import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { UserProfile, Role } from '@/types';
import { hasMinRole } from '@/lib/auth/roles';
import { checkAndBootstrapCreator } from '@/lib/auth/bootstrap';

export const SESSION_COOKIE_NAME = '__session';
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export async function createSession(idToken: string): Promise<{ profile: UserProfile; cookieString: string }> {
  // 1. Verify ID token
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const uid = decodedToken.uid;
  const email = decodedToken.email || '';

  // 2. Check if user is eligible for Creator bootstrap
  let profile = await checkAndBootstrapCreator(uid, email);

  // 3. If not bootstrapped, check existing user in Firestore
  if (!profile) {
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new Error('Akun Anda belum terdaftar sebagai pengurus aktif. Silakan gunakan Link Aktivasi resmi.');
    }
    profile = userSnap.data() as UserProfile;
    if (!profile.is_active) {
      throw new Error('Akun pengurus Anda sedang dinonaktifkan. Hubungi Presidium atau HRD.');
    }
    // Update last login
    await adminDb.collection('users').doc(uid).update({
      last_login: new Date().toISOString(),
    });
  }

  // 4. Create Firebase session cookie
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: FIVE_DAYS_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: Math.floor(FIVE_DAYS_MS / 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return { profile, cookieString: sessionCookie };
}

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    // Verify session cookie with revocation check
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userSnap.exists) return null;

    const profile = userSnap.data() as UserProfile;
    if (!profile.is_active) return null;

    return profile;
  } catch {
    return null;
  }
});

export async function requireUser(minRole: Role = 'member'): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  if (!hasMinRole(user.role, minRole)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

