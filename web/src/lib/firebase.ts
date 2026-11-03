import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Only Firestore lives here. Auth, Functions and Storage have their own modules (auth.ts,
// functions.ts, storage.ts) so public pages don't download SDKs they never use.

const env = import.meta.env;

export const useEmulators = env.VITE_USE_EMULATORS === 'true';

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-lisha',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const db = getFirestore(app);

if (useEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080);
