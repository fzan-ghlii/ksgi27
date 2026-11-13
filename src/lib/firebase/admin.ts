import 'server-only';
import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;

let app: App;
if (getApps().length > 0) {
  app = getApp();
} else {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    app = initializeApp({
      projectId,
    });
  }
}

export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app);
export { FieldValue, Timestamp };
