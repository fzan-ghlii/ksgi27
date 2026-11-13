import 'server-only';
import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;

function formatPrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  // Hapus kutip ganda/tunggal di awal dan akhir jika ikut ter-copy dari .env
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

let app: App;
if (getApps().length > 0) {
  app = getApp();
} else {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (err) {
      console.error('[Firebase Admin Init Error]', err);
      // Fallback ke inisialisasi default agar tidak membunuh modul saat startup
      app = initializeApp({ projectId });
    }
  } else {
    app = initializeApp({
      projectId,
    });
  }
}

export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app);
export { FieldValue, Timestamp };
