import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

function getClientAuth(): Auth {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Konfigurasi FIREBASE_API_KEY belum tersedia.');
  }

  // Lazy init agar prerender SSR halaman /login tidak gagal saat env kosong
  const firebaseApp: FirebaseApp =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
        });

  return getAuth(firebaseApp);
}

export async function loginWithEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(getClientAuth(), email, pass);
}

export async function registerWithEmail(email: string, pass: string) {
  return await createUserWithEmailAndPassword(getClientAuth(), email, pass);
}

export async function loginWithGoogle() {
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(getClientAuth(), googleProvider);
}
