import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/firestore';
import { ActivityLevel, Goal, calculateMacros } from '@/lib/types';
import { toast } from 'sonner';
import OnboardingHeader from './onboarding/OnboardingHeader';

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
  step?: number;
  total?: number;
}

function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

export default function ResultsScreen({ data, onComplete, onBack, step = 3, total = 3 }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const macros = calculateMacros(data.weight, data.activityLevel, data.goal);
  const reduce = useReducedMotion();
  const proteinDisplay = useCountUp(macros.protein, 900, !reduce);

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
    <div className="flex-1 flex flex-col min-w-0">
      <OnboardingHeader step={step} total={total} onBack={onBack} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="px-1 pt-6"
      >
        <p className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase text-foreground/40 mb-3">
          // OUTPUT
        </p>
        <h1 className="font-mono font-black text-[40px] leading-[0.92] tracking-[-0.015em] uppercase">
          CALCULATION<br />COMPLETE
        </h1>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50 mb-3"
        >
          DAILY PROTEIN TARGET
        </motion.p>
        <div className="flex items-baseline gap-1">
          <motion.span
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="font-mono font-black text-[88px] leading-none tracking-[-0.03em] tabular-nums"
          >
            {proteinDisplay}
          </motion.span>
          <span className="font-mono font-bold text-3xl text-foreground/60">G</span>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformOrigin: 'center' }}
          className="w-24 h-[2px] bg-foreground mt-8"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.85 }}
          className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50 mt-4 mb-6"
        >
          SUPPORTING METRICS
        </motion.p>

        <div className="grid grid-cols-4 gap-4 w-full max-w-sm text-center">
          {cells.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.95 + i * 0.06, ease: 'easeOut' }}
              className="min-w-0"
            >
              <p className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-foreground/50 mb-1">
                {c.label}
              </p>
              <p className="font-mono text-base font-black tracking-tight tabular-nums">{c.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.2 }}
        className="btn-cta"
        onClick={handleStart}
        disabled={busy}
      >
        {busy ? 'SAVING…' : 'START TRACKING'}
      </motion.button>
    </div>
  );
}
