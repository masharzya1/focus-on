import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// NOTE: firebase/messaging is browser service-worker only — not React Native.
// For push notifications in RN, use expo-notifications instead.

const firebaseConfig = {
  apiKey: 'AIzaSyB65RJwakLa9BAwTov9nPRYkDmjVt8M17s',
  authDomain: 'focus-on-e4016.firebaseapp.com',
  projectId: 'focus-on-e4016',
  storageBucket: 'focus-on-e4016.firebasestorage.app',
  messagingSenderId: '702598065897',
  appId: '1:702598065897:android:1d79404f65d2253664ca78',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;