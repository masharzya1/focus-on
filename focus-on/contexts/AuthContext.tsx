import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getProStatus, setProStatus } from '@/services/sync';
import { WEB_CLIENT_ID, ANDROID_CLIENT_ID } from '@/services/auth';
import AppBlocking from '@/modules/AppBlocking';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  isPro: boolean;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProStatus: () => Promise<void>;
  grantPro: (transactionId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Listen for Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const pro = await getProStatus(firebaseUser.uid);
        setIsPro(pro);
        // Sync to native so overlay knows
        AppBlocking.setProStatus(pro);
      } else {
        setIsPro(false);
        AppBlocking.setProStatus(false);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken, accessToken } = response.authentication!;
      const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken);
      signInWithCredential(auth, credential).catch((e) => {
        Alert.alert('Sign-in failed', e.message);
      });
    }
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setIsPro(false);
  }, []);

  const refreshProStatus = useCallback(async () => {
    if (!user) return;
    const pro = await getProStatus(user.uid);
    setIsPro(pro);
  }, [user]);

  const grantPro = useCallback(async (transactionId: string) => {
    if (!user) return;
    await setProStatus(user.uid, true, transactionId);
    setIsPro(true);
    AppBlocking.setProStatus(true);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, isPro, authLoading,
      signInWithGoogle, signOut,
      refreshProStatus, grantPro,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}