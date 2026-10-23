// Firebase Client Configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const isEmulatorMode = import.meta.env.MODE === 'emulator';
const emulatorConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'localhost',
  projectId: 'demo-attendance-rules',
  storageBucket: 'demo-attendance-rules.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:demo'
};
const firebaseConfig = isEmulatorMode ? emulatorConfig : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
];
const isPlaceholder = value => !value || value.includes('your_') || value.includes('your-project-id');
const hasFirebaseValues = Object.values(firebaseConfig).some(value => !isPlaceholder(value));
export const isFirebaseConfigured = isEmulatorMode
  || requiredConfig.every(value => !isPlaceholder(value));

if (!isEmulatorMode && hasFirebaseValues && !isFirebaseConfigured) {
  throw new Error('Firebase configuration is incomplete. Check the required VITE_FIREBASE_* settings.');
}

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (isEmulatorMode) {
    if (firebaseConfig.projectId !== 'demo-attendance-rules') {
      throw new Error('Emulator mode must use the demo-attendance-rules project.');
    }
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 54323);
  }
}

export { app, auth, db };
export default firebaseConfig;
