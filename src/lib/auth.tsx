import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, updateProfile, sendPasswordResetEmail,
  verifyPasswordResetCode, confirmPasswordReset, User,
} from 'firebase/auth';
import { auth } from './firebase';
import { getProfile } from './firestore';
import { UserProfile } from './types';
import { identifyUser, track } from './track';

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
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
    return cred.user;
  };
  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };
  const signOut = async () => { await fbSignOut(auth); };
  const refreshProfile = async () => {
    if (user) {
      try { setProfile(await getProfile(user.uid)); }
      catch (err) { console.error('refreshProfile failed:', err); }
    }
  };
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email, { url: window.location.origin });
  };
  const verifyResetCode = async (code: string) => verifyPasswordResetCode(auth, code);
  const confirmReset = async (code: string, newPassword: string) => {
    await confirmPasswordReset(auth, code, newPassword);
  };

  return (
    <Ctx.Provider
      value={{
        user, profile, loading, signUp, signIn, signOut, refreshProfile,
        sendPasswordReset, verifyResetCode, confirmReset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
