import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, updateProfile, sendPasswordResetEmail,
  verifyPasswordResetCode, confirmPasswordReset, User,
  OAuthProvider, GoogleAuthProvider, signInWithPopup, signInWithCredential,
  reauthenticateWithCredential, reauthenticateWithPopup,
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
  signInWithGoogle: () => Promise<User>;
  reauthenticateWithApple: () => Promise<void>;
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
  const signOut = async () => {
    track('sign_out');
    // Clear local onboarding state so sign-out always returns to the splash
    // screen and a fresh onboarding session (no carry-over answers, no paywall
    // resume, no story-seen short-circuit).
    try {
      const uid = auth.currentUser?.uid;
      sessionStorage.removeItem('brotein_onboarding_auth_resume');
      if (uid) {
        localStorage.removeItem(`brotein_story_seen:${uid}`);
        localStorage.removeItem(`brotein_paywall_seen:${uid}`);
      }
    } catch { /* ignore storage errors */ }
    await fbSignOut(auth);
  };

  const signInWithApple = async (): Promise<User> => {
    if (isNative()) {
      console.log('[apple] native flow start');
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      console.log('[apple] plugin loaded, calling signInWithApple');
      const result = await FirebaseAuthentication.signInWithApple({
        skipNativeAuth: true,
        scopes: ['email', 'name'],
      });
      console.log('[apple] plugin returned', {
        hasIdToken: !!result.credential?.idToken,
        hasNonce: !!result.credential?.nonce,
      });
      const idToken = result.credential?.idToken;
      const rawNonce = result.credential?.nonce;
      if (!idToken) throw new Error('Apple did not return an identity token.');
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce });
      console.log('[apple] exchanging credential with Firebase Web SDK…');
      try {
        const cred = await signInWithCredential(auth, credential);
        console.log('[apple] signed in', cred.user.uid);
        track('sign_in', { method: 'apple' });
        return cred.user;
      } catch (err) {
        console.error('[apple] signInWithCredential failed', err);
        throw err;
      }
    }
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const cred = await signInWithPopup(auth, provider);
    track('sign_in', { method: 'apple' });
    return cred.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    if (isNative()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error('Google did not return an identity token.');
      const credential = GoogleAuthProvider.credential(idToken);
      const cred = await signInWithCredential(auth, credential);
      track('sign_in', { method: 'google' });
      return cred.user;
    }
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const cred = await signInWithPopup(auth, provider);
    track('sign_in', { method: 'google' });
    return cred.user;
  };

  const reauthenticateWithApple = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not signed in');
    if (isNative()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithApple({
        skipNativeAuth: true,
        scopes: ['email', 'name'],
      });
      const idToken = result.credential?.idToken;
      const rawNonce = result.credential?.nonce;
      if (!idToken) throw new Error('Apple did not return an identity token.');
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce });
      await reauthenticateWithCredential(auth.currentUser, credential);
      return;
    }
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    await reauthenticateWithPopup(auth.currentUser, provider);
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
        user, profile, loading, signUp, signIn, signInWithApple, signInWithGoogle, reauthenticateWithApple, signOut, refreshProfile,
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
