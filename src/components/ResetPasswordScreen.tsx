import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Props {
  oobCode: string;
  onDone: () => void;
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function ResetPasswordScreen({ oobCode, onDone }: Props) {
  const { verifyResetCode, confirmReset } = useAuth();
  const [stage, setStage] = useState<'verifying' | 'form' | 'success' | 'invalid'>('verifying');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const e = await verifyResetCode(oobCode);
        if (!cancelled) {
          setEmail(e);
          setStage('form');
        }
      } catch {
        if (!cancelled) setStage('invalid');
      }
    })();
    return () => { cancelled = true; };
  }, [oobCode, verifyResetCode]);

  const lengthOk = pw.length >= 8;
  const matches = pw.length > 0 && pw === confirm;
  const canSubmit = lengthOk && matches && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await confirmReset(oobCode, pw);
      setStage('success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not update password';
      toast.error(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen-container">
      <AnimatePresence mode="wait">
        {stage === 'verifying' && (
          <motion.div
            key="verify"
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center"
          >
            <p className="label-spaced opacity-50">VERIFYING LINK…</p>
          </motion.div>
        )}

        {stage === 'invalid' && (
          <motion.div
            key="invalid"
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            <div className="pt-16 text-center">
              <h1 className="text-3xl font-black tracking-[0.15em] mb-5">LINK EXPIRED</h1>
              <div className="w-12 h-0.5 bg-foreground mx-auto" />
              <p className="text-sm text-muted-foreground leading-relaxed mt-6 max-w-[280px] mx-auto">
                This reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <div className="flex-1" />
            <div className="pb-4">
              <button className="btn-primary" onClick={onDone}>BACK TO LOGIN</button>
            </div>
          </motion.div>
        )}

        {stage === 'form' && (
          <motion.div
            key="form"
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <div className="pt-16 text-center">
              <h1 className="text-3xl font-black tracking-[0.15em] mb-5">CREATE NEW PASSWORD</h1>
              <div className="w-12 h-0.5 bg-foreground mx-auto" />
              {email && (
                <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase mt-6 break-all">
                  {email}
                </p>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-8 pb-12">
              <div>
                <label className="label-spaced">NEW PASSWORD</label>
                <input
                  className="input-underline"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
                <p className={`mt-2 text-[10px] tracking-[0.25em] uppercase font-bold ${lengthOk ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {lengthOk ? '✓ AT LEAST 8 CHARACTERS' : 'MIN 8 CHARACTERS'}
                </p>
              </div>
              <div>
                <label className="label-spaced">CONFIRM PASSWORD</label>
                <input
                  className="input-underline"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                {confirm.length > 0 && !matches && (
                  <p className="mt-2 text-[10px] tracking-[0.25em] uppercase font-bold text-destructive">
                    PASSWORDS DO NOT MATCH
                  </p>
                )}
              </div>
            </div>

            <div className="pb-4">
              <button
                className="btn-primary"
                disabled={!canSubmit}
                onClick={submit}
                style={{ opacity: canSubmit ? 1 : 0.3 }}
              >
                {busy ? 'UPDATING…' : 'UPDATE PASSWORD'}
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'success' && (
          <motion.div
            key="success"
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <div className="pt-16 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                className="inline-flex items-center justify-center w-16 h-16 bg-foreground text-background mb-8"
              >
                <Check size={28} strokeWidth={3} />
              </motion.div>
              <h1 className="text-3xl font-black tracking-[0.15em] mb-5">PASSWORD UPDATED</h1>
              <div className="w-12 h-0.5 bg-foreground mx-auto" />
              <p className="text-sm text-muted-foreground leading-relaxed mt-6 max-w-[280px] mx-auto">
                You can now sign in with your new password.
              </p>
            </div>

            <div className="flex-1" />

            <div className="pb-4">
              <button className="btn-primary" onClick={onDone}>BACK TO LOGIN</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
