import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/firestore';
import { toast } from 'sonner';
import OnboardingHeader from './onboarding/OnboardingHeader';

interface Props {
  data: { name: string; email: string };
  onComplete: () => void | Promise<void>;
  onBack: () => void;
}

export default function ManualTargetScreen({ data, onComplete, onBack }: Props) {
  const { user } = useAuth();
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const grams = Number(target);
  const valid = grams >= 30 && grams <= 500;

  const handleStart = async () => {
    if (!user || !valid || busy) return;
    setBusy(true);
    try {
      await createOrUpdateProfile({
        uid: user.uid,
        name: data.name,
        email: data.email,
        weight: 0,
        height: 0,
        age: 0,
        activityLevel: 'moderate',
        goal: 'equilibrium',
        dailyProtein: grams,
        dailyCalories: 0,
        dailyCarbs: 0,
        dailyFats: 0,
        mealFrequency: grams > 150 ? 5 : grams > 100 ? 4 : 3,
        notifications: true,
      });
      await onComplete();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save target');
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <OnboardingHeader step={1} total={1} onBack={onBack} />

      <div className="px-1 pt-6">
        <h1 className="font-black leading-[0.92] tracking-[-0.015em] uppercase text-foreground max-w-[280px] text-7xl mx-px my-0 px-0 py-0 border-0 font-mono text-justify">
          SET YOUR<br />TARGET
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50 mb-4">
          DAILY PROTEIN TARGET
        </p>
        <div className="flex items-baseline gap-1">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            placeholder="180"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-44 text-[88px] font-black font-display tracking-[-0.03em] leading-none text-center bg-transparent border-b-[3px] border-foreground outline-none focus:ring-0 placeholder:text-foreground/15"
          />
          <span className="font-mono font-bold text-3xl text-foreground/60">G</span>
        </div>
        <p className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase text-foreground/40 mt-6">
          RECOMMENDED 80G – 250G
        </p>
      </div>

      <button className="btn-cta" disabled={!valid || busy} onClick={handleStart}>
        {busy ? 'SAVING…' : 'START TRACKING'}
      </button>
    </div>
  );
}
