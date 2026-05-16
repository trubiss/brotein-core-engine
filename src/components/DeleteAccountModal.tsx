import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { deleteUserData } from '@/lib/firestore';
import { toast } from 'sonner';
import { track } from '@/lib/track';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ open, onClose }: Props) {
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [busy, setBusy] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && !busy;

  const reset = () => {
    setConfirmText('');
    setPassword('');
    setNeedsReauth(false);
    setBusy(false);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const performDelete = async () => {
    if (!user || !auth.currentUser) return;
    setBusy(true);
    try {
      if (needsReauth) {
        if (!user.email) throw new Error('No email on account');
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      await deleteUserData(user.uid);
      await deleteUser(auth.currentUser);
      // Clear local state
      Object.keys(localStorage)
        .filter((k) => k.startsWith('brotein_'))
        .forEach((k) => localStorage.removeItem(k));
      toast.success('Account deleted');
      reset();
      onClose();
      // Auth listener will route to sign-in
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
        toast.message('Please re-enter your password to confirm');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Incorrect password');
      } else {
        toast.error(err.message ?? 'Deletion failed');
        // Best-effort sign out so user isn't stuck in broken state
        try { await signOut(); } catch { /* ignore */ }
      }
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

            {needsReauth && (
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
          </div>

          <div className="p-6 border-t-2 border-foreground space-y-3">
            <button
              onClick={performDelete}
              disabled={!canDelete || (needsReauth && !password)}
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
