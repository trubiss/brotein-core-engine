import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/firestore';
import { toast } from 'sonner';

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
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <div className="pt-16">
        <h1 className="text-2xl font-black tracking-[0.15em] mb-3 break-words">SET YOUR TARGET</h1>
        <div className="w-16 h-0.5 bg-foreground" />
        <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mt-4">
          ENTER YOUR DAILY PROTEIN GOAL
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <p className="label-spaced text-center">DAILY PROTEIN TARGET</p>
        <div className="flex items-baseline gap-1 mt-2">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            placeholder="180"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-40 text-7xl font-black font-display tracking-tighter text-center bg-transparent border-b-2 border-foreground outline-none focus:ring-0"
          />
          <span className="text-4xl font-black font-display">G</span>
        </div>
        <p className="text-[10px] text-muted-foreground tracking-[0.25em] uppercase mt-6">
          RECOMMENDED RANGE: 80G – 250G
        </p>
      </div>

      <div className="flex gap-4">
        <button className="btn-outline flex-1" onClick={onBack} disabled={busy}>BACK</button>
        <button
          className="btn-primary flex-1"
          disabled={!valid || busy}
          onClick={handleStart}
          style={{ opacity: valid && !busy ? 1 : 0.3 }}
        >
          {busy ? 'SAVING…' : 'START TRACKING'}
        </button>
      </div>
    </div>
  );
}
