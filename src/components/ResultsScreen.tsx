import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/firestore';
import { ActivityLevel, Goal, calculateMacros } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  data: {
    name: string;
    email: string;
    weight: number;
    height: number;
    age: number;
    activityLevel: ActivityLevel;
    goal: Goal;
  };
  onComplete: () => void | Promise<void>;
  onBack: () => void;
}

export default function ResultsScreen({ data, onComplete, onBack }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const macros = calculateMacros(data.weight, data.activityLevel, data.goal);

  const handleStart = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await createOrUpdateProfile({
        uid: user.uid,
        name: data.name,
        email: data.email,
        weight: data.weight,
        height: data.height,
        age: data.age,
        activityLevel: data.activityLevel,
        goal: data.goal,
        dailyProtein: macros.protein,
        dailyCalories: macros.calories,
        dailyCarbs: macros.carbs,
        dailyFats: macros.fats,
        mealFrequency: macros.mealFrequency,
        notifications: true,
      });
      await onComplete();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save profile');
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <div className="pt-16">
        <h1 className="text-2xl font-black tracking-[0.15em] mb-3 break-words">CALCULATION COMPLETE</h1>
        <div className="w-16 h-0.5 bg-foreground" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <p className="label-spaced text-center">DAILY PROTEIN TARGET</p>
        <p className="text-7xl font-bold font-display tracking-tight mb-1">{macros.protein}g</p>
        <div className="w-16 h-0.5 bg-foreground my-8" />

        <div className="grid grid-cols-3 gap-6 w-full max-w-xs text-center">
          <div className="min-w-0">
            <p className="label-spaced">CALORIES</p>
            <p className="text-xl font-bold font-display">{macros.calories}</p>
          </div>
          <div className="min-w-0">
            <p className="label-spaced">CARBS</p>
            <p className="text-xl font-bold font-display">{macros.carbs}g</p>
          </div>
          <div className="min-w-0">
            <p className="label-spaced">FATS</p>
            <p className="text-xl font-bold font-display">{macros.fats}g</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="label-spaced text-center">MEAL FREQUENCY</p>
          <p className="text-xl font-bold font-display text-center">{macros.mealFrequency}x / DAY</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-outline flex-1" onClick={onBack} disabled={busy}>BACK</button>
        <button className="btn-primary flex-1" onClick={handleStart} disabled={busy} style={{ opacity: busy ? 0.5 : 1 }}>
          {busy ? 'SAVING…' : 'START TRACKING'}
        </button>
      </div>
    </div>
  );
}
