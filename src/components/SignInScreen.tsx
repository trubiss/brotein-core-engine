import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import ForgotPasswordFlow from './ForgotPasswordFlow';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
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
