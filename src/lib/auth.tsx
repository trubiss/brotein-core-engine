import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, updateProfile, sendPasswordResetEmail,
  verifyPasswordResetCode, confirmPasswordReset, User,
  OAuthProvider, signInWithCredential, signInWithPopup,
} from 'firebase/auth';
import { auth } from './firebase';
import { getProfile } from './firestore';
import { UserProfile } from './types';
import { identifyUser, track } from './track';
import { isNative, isIOS } from './native';

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      try {
        if (u) {
          setUser(u);
          identifyUser(u.uid);
          try {
            const p = await getProfile(u.uid);
            setProfile(p);
          } catch (err) {
            console.error('getProfile failed (continuing without profile):', err);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
          identifyUser(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
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
    // Native iOS: use the Apple Sign-In sheet, then exchange the identityToken with Firebase.
    if (isNative() && isIOS()) {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
      const nonce = cryptoNonce();
      const res = await SignInWithApple.authorize({
        clientId: 'com.brotein.app', // must match Services ID configured in Firebase
        redirectURI: 'https://brotein.firebaseapp.com/__/auth/handler',
        scopes: 'email name',
        nonce,
      });
      const idToken = res.response?.identityToken;
      if (!idToken) throw new Error('Apple sign-in failed: no identity token');
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce: nonce });
      const cred = await signInWithCredential(auth, credential);
      // First-time: Apple only returns givenName/familyName on the very first auth.
      const given = res.response?.givenName ?? '';
      const family = res.response?.familyName ?? '';
      const fullName = `${given} ${family}`.trim();
      if (fullName && !cred.user.displayName) await updateProfile(cred.user, { displayName: fullName });
      track('sign_in', { method: 'apple' });
      return cred.user;
    }
    // Web fallback: popup flow.
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

function cryptoNonce(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
