import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import ForgotPasswordFlow from './ForgotPasswordFlow';
// Official Apple logomark (HIG-compliant) — inline SVG, not the lucide fruit icon.
const AppleLogo = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M17.05 12.04c-.02-2.05 1.67-3.04 1.75-3.09-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.04-1.43 2.48-.37 6.16 1.03 8.18.68.99 1.5 2.1 2.56 2.06 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.6.66 2.69.64 1.11-.02 1.81-1 2.49-2 .78-1.15 1.11-2.26 1.12-2.32-.02-.01-2.15-.83-2.2-3.29zM15.05 5.62c.56-.69.94-1.64.84-2.59-.81.03-1.8.54-2.39 1.22-.52.6-.98 1.58-.86 2.51.91.07 1.84-.46 2.41-1.14z"/>
  </svg>
);

export default function SignInScreen() {
  const { signIn, signUp, signInWithApple } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const canProceed = email && password.length >= 6 && (mode === 'signin' || name);

  const submit = async () => {
    if (!canProceed || busy) return;
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(email.trim(), password, name.trim());
      else await signIn(email.trim(), password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      toast.error(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  const apple = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInWithApple();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Apple sign-in failed';
      if (!/cancel/i.test(msg)) toast.error(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  if (forgot) {
    return <ForgotPasswordFlow onBack={() => setForgot(false)} initialEmail={email} />;
  }

  return (
    <div className="screen-container">
      <div className="pt-16">
        <h1 className="text-5xl font-black tracking-[0.2em] mb-6 break-words">BROTEIN</h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs uppercase tracking-[0.15em]">
          Architectural nutrition for the disciplined athlete.
        </p>
        <div className="w-16 h-0.5 bg-foreground mt-6" />
      </div>

      <div className="space-y-8 py-12 flex-1">
        {mode === 'signup' && (
          <div>
            <label className="label-spaced">NAME</label>
            <input className="input-underline" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label-spaced">EMAIL</label>
          <input className="input-underline" type="email" autoComplete="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label-spaced">PASSWORD</label>
          <input className="input-underline" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => setForgot(true)}
              className="mt-3 text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground active:opacity-60"
            >
              FORGOT PASSWORD?
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 pb-4">
        <button
          className="btn-primary"
          disabled={!canProceed || busy}
          onClick={submit}
          style={{ opacity: canProceed && !busy ? 1 : 0.3 }}
        >
          {busy ? 'WORKING…' : mode === 'signin' ? 'SIGN IN' : 'INITIALIZE SYSTEM'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-foreground/20" />
          <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-foreground/20" />
        </div>

        <button
          onClick={apple}
          disabled={busy}
          className="w-full border-2 border-foreground bg-foreground text-background py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] uppercase active:scale-[0.98] transition-transform"
          style={{ opacity: busy ? 0.5 : 1 }}
        >
          <AppleLogo size={14} />
          CONTINUE WITH APPLE
        </button>

        <button
          className="text-[10px] tracking-[0.3em] uppercase font-bold w-full text-center text-muted-foreground active:opacity-60"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'NEW HERE? CREATE ACCOUNT' : 'HAVE AN ACCOUNT? SIGN IN'}
        </button>
      </div>
    </div>
  );
}
