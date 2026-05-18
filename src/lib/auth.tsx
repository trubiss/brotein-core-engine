import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, updateProfile, sendPasswordResetEmail,
  verifyPasswordResetCode, confirmPasswordReset, User,
  OAuthProvider, signInWithPopup, signInWithCredential,
} from 'firebase/auth';
import { auth } from './firebase';
import { getProfile } from './firestore';
import { UserProfile } from './types';
import { identifyUser, track } from './track';
import { isNative } from './native';

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithApple: () => Promise<User>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyResetCode: (code: string) => Promise<string>;
  confirmReset: (code: string, newPassword: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    const startupTimeout = window.setTimeout(() => {
      if (!settled) {
        console.warn('Auth startup timed out; continuing without a cached session.');
        setLoading(false);
      }
    }, 8000);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      try {
        if (u) {
          setUser(u);
          identifyUser(u.uid);
          void import('./iap').then(m => m.identifyPurchaser(u.uid)).catch(() => {});
          try {
            const p = await withTimeout(getProfile(u.uid), 6000, null);
            setProfile(p);
          } catch (err) {
            console.error('getProfile failed (continuing without profile):', err);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
          identifyUser(null);
          void import('./iap').then(m => m.identifyPurchaser(null)).catch(() => {});
        }
      } finally {
        settled = true;
        clearTimeout(startupTimeout);
        setLoading(false);
      }
    });
    return () => {
      clearTimeout(startupTimeout);
      unsub();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    track('sign_up', { method: 'password' });
    return cred.user;
  };
  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    track('sign_in', { method: 'password' });
    return cred.user;
  };
  const signOut = async () => { track('sign_out'); await fbSignOut(auth); };

  const signInWithApple = async (): Promise<User> => {
    if (isNative()) {
      throw new Error(
        'Apple Sign-In is not available in this build. The native Apple Sign-In plugin needs to be reinstalled to enable it on iOS.'
      );
    }
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const cred = await signInWithPopup(auth, provider);
    track('sign_in', { method: 'apple' });
    return cred.user;
  };

  const refreshProfile = async () => {
    if (user) {
      try { setProfile(await getProfile(user.uid)); }
      catch (err) { console.error('refreshProfile failed:', err); }
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email, { url: window.location.origin });
    track('password_reset_requested');
  };
  const verifyResetCode = async (code: string) => verifyPasswordResetCode(auth, code);
  const confirmReset = async (code: string, newPassword: string) => {
    await confirmPasswordReset(auth, code, newPassword);
  };

  return (
    <Ctx.Provider
      value={{
        user, profile, loading, signUp, signIn, signInWithApple, signOut, refreshProfile,
        sendPasswordReset, verifyResetCode, confirmReset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(fallback), ms);
    promise
      .then(resolve)
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timeout));
  });
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
