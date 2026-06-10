import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from './types';
import { identifyUser, track } from './track';
import { isNative } from './native';

type FirebaseAuthApi = typeof import('firebase/auth');

let firebaseAuthApiPromise: Promise<FirebaseAuthApi> | null = null;

function loadFirebaseAuthApi(): Promise<FirebaseAuthApi> {
  if (!firebaseAuthApiPromise) firebaseAuthApiPromise = import('firebase/auth');
  return firebaseAuthApiPromise;
}

async function loadFirebaseAuth() {
  const [{ auth }, authApi] = await Promise.all([
    import('./firebase'),
    loadFirebaseAuthApi(),
  ]);
  return { auth, authApi };
}

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
    let cancelled = false;
    let unsub: (() => void) | undefined;
    const startupTimeout = window.setTimeout(() => {
      if (!settled) {
        console.warn('Auth startup timed out; continuing without a cached session.');
        setLoading(false);
      }
    }, 8000);

    void loadFirebaseAuth()
      .then(({ auth, authApi }) => {
        if (cancelled) return;
        unsub = authApi.onAuthStateChanged(auth, async (u) => {
          setLoading(true);
          try {
            if (u) {
              setUser(u);
              identifyUser(u.uid);
              void import('./iap').then(m => m.identifyPurchaser(u.uid)).catch(() => {});
              try {
                const { getProfile } = await import('./firestore');
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
      })
      .catch((err) => {
        console.error('Auth init failed; continuing without a cached session:', err);
        settled = true;
        clearTimeout(startupTimeout);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(startupTimeout);
      unsub?.();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { auth, authApi } = await loadFirebaseAuth();
    const cred = await authApi.createUserWithEmailAndPassword(auth, email, password);
    if (name) await authApi.updateProfile(cred.user, { displayName: name });
    track('sign_up', { method: 'password' });
    return cred.user;
  };
  const signIn = async (email: string, password: string) => {
    const { auth, authApi } = await loadFirebaseAuth();
    const cred = await authApi.signInWithEmailAndPassword(auth, email, password);
    track('sign_in', { method: 'password' });
    return cred.user;
  };
  const signOut = async () => {
    track('sign_out');
    // Clear local onboarding state so sign-out always returns to the splash
    // screen and a fresh onboarding session (no carry-over answers, no paywall
    // resume, no story-seen short-circuit).
    try {
      const { auth } = await loadFirebaseAuth();
      const uid = auth.currentUser?.uid;
      sessionStorage.removeItem('brotein_onboarding_auth_resume');
      if (uid) {
        localStorage.removeItem(`brotein_story_seen:${uid}`);
        localStorage.removeItem(`brotein_paywall_seen:${uid}`);
      }
    } catch { /* ignore storage errors */ }
    const { auth, authApi } = await loadFirebaseAuth();
    await authApi.signOut(auth);
  };

  const signInWithApple = async (): Promise<User> => {
    const { auth, authApi } = await loadFirebaseAuth();
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
      const provider = new authApi.OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce });
      console.log('[apple] exchanging credential with Firebase Web SDK…');
      try {
        const cred = await authApi.signInWithCredential(auth, credential);
        console.log('[apple] signed in', cred.user.uid);
        track('sign_in', { method: 'apple' });
        return cred.user;
      } catch (err) {
        console.error('[apple] signInWithCredential failed', err);
        throw err;
      }
    }
    const provider = new authApi.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const cred = await authApi.signInWithPopup(auth, provider);
    track('sign_in', { method: 'apple' });
    return cred.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    const { auth, authApi } = await loadFirebaseAuth();
    if (isNative()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error('Google did not return an identity token.');
      const credential = authApi.GoogleAuthProvider.credential(idToken);
      const cred = await authApi.signInWithCredential(auth, credential);
      track('sign_in', { method: 'google' });
      return cred.user;
    }
    const provider = new authApi.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const cred = await authApi.signInWithPopup(auth, provider);
    track('sign_in', { method: 'google' });
    return cred.user;
  };

  const reauthenticateWithApple = async (): Promise<void> => {
    const { auth, authApi } = await loadFirebaseAuth();
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
      const provider = new authApi.OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce });
      await authApi.reauthenticateWithCredential(auth.currentUser, credential);
      return;
    }
    const provider = new authApi.OAuthProvider('apple.com');
    provider.addScope('email');
    await authApi.reauthenticateWithPopup(auth.currentUser, provider);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const { getProfile } = await import('./firestore');
        setProfile(await getProfile(user.uid));
      }
      catch (err) { console.error('refreshProfile failed:', err); }
    }
  };

  const sendPasswordReset = async (email: string) => {
    const { auth, authApi } = await loadFirebaseAuth();
    await authApi.sendPasswordResetEmail(auth, email, { url: window.location.origin });
    track('password_reset_requested');
  };
  const verifyResetCode = async (code: string) => {
    const { auth, authApi } = await loadFirebaseAuth();
    return authApi.verifyPasswordResetCode(auth, code);
  };
  const confirmReset = async (code: string, newPassword: string) => {
    const { auth, authApi } = await loadFirebaseAuth();
    await authApi.confirmPasswordReset(auth, code, newPassword);
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
