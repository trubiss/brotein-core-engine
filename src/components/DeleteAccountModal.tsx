import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { deleteUserData } from '@/lib/firestore';
import { toast } from 'sonner';
import { track } from '@/lib/track';
import { X, Apple } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ReauthMethod = 'password' | 'apple' | null;

function detectProvider(): 'password' | 'apple.com' | 'other' {
  const providers = auth.currentUser?.providerData ?? [];
  if (providers.some((p) => p.providerId === 'apple.com')) return 'apple.com';
  if (providers.some((p) => p.providerId === 'password')) return 'password';
  return 'other';
}

export default function DeleteAccountModal({ open, onClose }: Props) {
  const { user, signOut, reauthenticateWithApple } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [reauthMethod, setReauthMethod] = useState<ReauthMethod>(null);
  const [busy, setBusy] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && !busy;

  const reset = () => {
    setConfirmText('');
    setPassword('');
    setReauthMethod(null);
    setBusy(false);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const finalizeDelete = async () => {
    if (!user || !auth.currentUser) return;
    await deleteUserData(user.uid);
    await deleteUser(auth.currentUser);
    track('account_deleted');
    Object.keys(localStorage)
      .filter((k) => k.startsWith('brotein_'))
      .forEach((k) => localStorage.removeItem(k));
    toast.success('Account deleted');
    reset();
    onClose();
  };

  const handleError = async (e: unknown) => {
    const err = e as { code?: string; message?: string };
    if (err.code === 'auth/requires-recent-login') {
      const provider = detectProvider();
      if (provider === 'apple.com') {
        setReauthMethod('apple');
        toast.message('Please confirm with Apple to continue');
      } else if (provider === 'password') {
        setReauthMethod('password');
        toast.message('Please re-enter your password to confirm');
      } else {
        toast.error('Please sign in again to delete your account');
        try { await signOut(); } catch { /* ignore */ }
      }
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      toast.error('Incorrect password');
    } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      toast.message('Re-authentication cancelled');
    } else {
      toast.error(err.message ?? 'Deletion failed');
      try { await signOut(); } catch { /* ignore */ }
    }
  };

  const performDelete = async () => {
    if (!user || !auth.currentUser) return;
    setBusy(true);
    try {
      if (reauthMethod === 'password') {
        if (!user.email) throw new Error('No email on account');
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      await finalizeDelete();
    } catch (e: unknown) {
      await handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const confirmWithApple = async () => {
    if (!user || !auth.currentUser) return;
    setBusy(true);
    try {
      await reauthenticateWithApple();
      await finalizeDelete();
    } catch (e: unknown) {
      await handleError(e);
    } finally {
      setBusy(false);
    }
  };


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-6 border-b-2 border-foreground">
            <p className="label-spaced">DANGER ZONE</p>
            <button
              onClick={close}
              disabled={busy}
              className="p-2 border-2 border-foreground active:scale-95 transition-transform disabled:opacity-40"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div>
              <h1 className="text-4xl font-black font-display leading-none mb-6">
                DELETE<br />ACCOUNT?
              </h1>
              <p className="font-sans text-[15px] leading-relaxed">
                This permanently removes your profile, food logs, streak history, favorites, and
                login. <span className="font-bold">It cannot be undone.</span>
              </p>
            </div>

            <div className="border-2 border-foreground p-4 space-y-2">
              <p className="label-spaced">WHAT WILL BE DELETED</p>
              <ul className="font-sans text-sm space-y-1">
                <li>— Your profile and protein target</li>
                <li>— Every food log you've ever entered</li>
                <li>— Your streak and daily summaries</li>
                <li>— Saved favorites and reminder settings</li>
                <li>— Your sign-in credentials</li>
              </ul>
            </div>

            <div>
              <label className="label-spaced">
                TYPE <span className="font-bold text-foreground">DELETE</span> TO CONFIRM
              </label>
              <input
                className="input-underline uppercase tracking-[0.2em]"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                autoCapitalize="characters"
                disabled={busy}
              />
            </div>

            {reauthMethod === 'password' && (
              <div>
                <label className="label-spaced">RE-ENTER PASSWORD</label>
                <input
                  className="input-underline"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy}
                />
              </div>
            )}

            {reauthMethod === 'apple' && (
              <div>
                <label className="label-spaced">CONFIRM YOUR IDENTITY</label>
                <p className="font-sans text-sm mt-2 mb-3">
                  For security, please confirm with Apple to permanently delete your account.
                </p>
                <button
                  onClick={confirmWithApple}
                  disabled={busy || !canDelete}
                  className="w-full h-12 border-2 border-foreground bg-background font-mono font-black tracking-[0.18em] uppercase text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-30 disabled:active:scale-100"
                >
                  <Apple size={14} strokeWidth={2.5} fill="currentColor" />
                  {busy ? 'CONFIRMING…' : 'CONFIRM WITH APPLE'}
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border-t-2 border-foreground space-y-3">
            <button
              onClick={performDelete}
              disabled={
                !canDelete ||
                (reauthMethod === 'password' && !password) ||
                reauthMethod === 'apple'
              }
              className="w-full h-14 bg-foreground text-background font-mono font-black tracking-[0.18em] uppercase text-sm active:scale-[0.98] transition-transform disabled:opacity-30 disabled:active:scale-100"
            >
              {busy ? 'DELETING…' : 'DELETE FOREVER'}
            </button>
            <button
              onClick={close}
              disabled={busy}
              className="btn-outline w-full disabled:opacity-40"
            >
              CANCEL
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
