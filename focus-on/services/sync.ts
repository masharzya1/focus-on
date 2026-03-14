import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppState } from '@/types/study';

// Firestore path: users/{uid}/data/app
function userDocRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'app');
}

export async function syncToFirestore(uid: string, state: AppState): Promise<void> {
  try {
    await setDoc(
      userDocRef(uid),
      {
        ...state,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error('[Sync] Error syncing to Firestore:', e);
  }
}

export async function loadFromFirestore(uid: string): Promise<AppState | null> {
  try {
    const snap = await getDoc(userDocRef(uid));
    if (snap.exists()) {
      const data = snap.data();
      delete data.updatedAt;
      return data as AppState;
    }
    return null;
  } catch (e) {
    console.error('[Sync] Error loading from Firestore:', e);
    return null;
  }
}

export function subscribeToFirestore(
  uid: string,
  onChange: (state: AppState) => void
): () => void {
  return onSnapshot(userDocRef(uid), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      delete data.updatedAt;
      onChange(data as AppState);
    }
  });
}

// Pro status — separate doc so it can't be tampered locally
export async function setProStatus(uid: string, isPro: boolean, transactionId?: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'data', 'pro'),
    {
      isPro,
      purchasedAt: isPro ? serverTimestamp() : null,
      transactionId: transactionId || null,
    },
    { merge: true }
  );
}

export async function getProStatus(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'pro'));
    if (snap.exists()) return snap.data().isPro === true;
    return false;
  } catch {
    return false;
  }
}