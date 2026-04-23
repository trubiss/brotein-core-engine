import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
  initialEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
};

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function ForgotPasswordFlow({ onBack, initialEmail = '' }: Props) {
  const { sendPasswordReset } = useAuth();
  const [stage, setStage] = useState<'request' | 'sent'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);

  const valid = EMAIL_RE.test(email.trim());

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setStage('sent');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send reset email';
      toast.error(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      toast.success('Reset link resent');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not resend';
      toast.error(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="pt-6">
        <button
          onClick={stage === 'request' ? onBack : () => setStage('request')}
          className="p-2 -ml-2 active:opacity-50 transition-opacity"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'request' ? (
          <motion.div
            key="request"
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <div className="pt-16 text-center">
              <h1 className="text-3xl font-black tracking-[0.15em] mb-5">RESET PASSWORD</h1>
              <div className="w-12 h-0.5 bg-foreground mx-auto" />
              <p className="text-sm text-muted-foreground leading-relaxed mt-6 max-w-[280px] mx-auto">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center pb-12">
              <div className="space-y-2">
                <label className="label-spaced">EMAIL</label>
                <input
                  className="input-underline"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  autoFocus
                />
              </div>
            </div>

            <div className="pb-4">
              <button
                className="btn-primary"
                disabled={!valid || busy}
                onClick={submit}
                style={{ opacity: valid && !busy ? 1 : 0.3 }}
              >
                {busy ? 'SENDING…' : 'SEND RESET LINK'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <div className="pt-16 text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-8"
              >
                <Mail size={26} strokeWidth={2.4} />
              </motion.div>
              <h1 className="text-3xl font-black tracking-[0.15em] mb-5">CHECK YOUR EMAIL</h1>
              <div className="w-12 h-0.5 bg-foreground mx-auto" />
              <p className="text-sm text-muted-foreground leading-relaxed mt-6 max-w-[300px] mx-auto">
                We've sent a password reset link to
              </p>
              <p className="font-display text-sm font-bold tracking-[0.15em] uppercase mt-2 break-all">
                {maskEmail(email.trim())}
              </p>
            </div>

            <div className="flex-1" />

            <div className="space-y-4 pb-4">
              <button
                className="btn-primary"
                onClick={() => {
                  window.location.href = 'mailto:';
                }}
              >
                OPEN EMAIL APP
              </button>
              <button
                className="text-[10px] tracking-[0.3em] uppercase font-bold w-full text-center text-muted-foreground active:opacity-60 disabled:opacity-30"
                onClick={resend}
                disabled={busy}
              >
                {busy ? 'RESENDING…' : 'RESEND EMAIL'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
