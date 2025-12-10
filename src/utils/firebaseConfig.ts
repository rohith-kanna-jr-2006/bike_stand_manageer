import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to safely access environment variables
const getEnv = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env;
    }
  } catch (e) {
    console.warn("Error accessing environment variables", e);
  }
  return {};
};

const env = getEnv();
const getVal = (keySuffix: string) => {
    return env[`VITE_${keySuffix}`] || env[`REACT_APP_${keySuffix}`];
};

const firebaseConfig = {
  apiKey: getVal('FIREBASE_API_KEY') || 'AIzaSyDt3m-WzLkX55isB0zzVPU3eWdjrzAYyxc',
  authDomain: getVal('FIREBASE_AUTH_DOMAIN') || 'securecycle-demo.firebaseapp.com',
  projectId: getVal('FIREBASE_PROJECT_ID') || 'securecycle-demo',
  storageBucket: getVal('FIREBASE_STORAGE_BUCKET') || 'securecycle-demo.appspot.com',
  messagingSenderId: getVal('FIREBASE_MESSAGING_SENDER_ID') || '1234567890',
  appId: getVal('FIREBASE_APP_ID') || '1:1234567890:web:abcdef123456',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app as any);
// Use type casting to resolve the mismatch between Modular FirebaseApp and Compat requirements
const db = getFirestore(app as any);

export { app, auth, db };