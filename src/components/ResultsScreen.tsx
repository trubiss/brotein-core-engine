import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
      // ease-out-cubic
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

  const stagger = (i: number) => ({
    initial: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: reduce ? 0 : 1.05 + i * 0.08, ease: [0.2, 0.8, 0.2, 1] as const },
  });

  return (
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <OnboardingHeader
        step={step}
        total={total}
        title="CALCULATION COMPLETE"
        kicker="C · OUTPUT"
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50 mb-3">
          DAILY PROTEIN TARGET
        </p>
        <div className="flex items-baseline gap-1">
          <motion.span
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="font-mono font-black text-[88px] leading-none tracking-[-0.03em]"
          >
            {proteinDisplay}
          </motion.span>
          <span className="font-mono font-bold text-3xl text-foreground/60">G</span>
        </div>

        <motion.div
          initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.95, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformOrigin: 'left' }}
          className="w-32 h-[3px] bg-foreground my-8"
        />

        <div className="grid grid-cols-3 gap-6 w-full max-w-xs text-center">
          {[
            { label: 'CALORIES', value: macros.calories },
            { label: 'CARBS',    value: `${macros.carbs}g` },
            { label: 'FATS',     value: `${macros.fats}g` },
          ].map((m, i) => (
            <motion.div key={m.label} {...stagger(i)} className="min-w-0">
              <p className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-foreground/50 mb-1">
                {m.label}
              </p>
              <p className="font-mono text-xl font-black tracking-tight">{m.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...stagger(3)} className="mt-8 text-center">
          <p className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-foreground/50 mb-1">
            MEAL FREQUENCY
          </p>
          <p className="font-mono text-xl font-black tracking-tight">{macros.mealFrequency}× / DAY</p>
        </motion.div>
      </div>

      <button className="btn-cta group" onClick={handleStart} disabled={busy}>
        <span>{busy ? 'SAVING…' : 'START TRACKING'}</span>
        <ArrowRight className="w-4 h-4 transition-transform group-active:translate-x-1" strokeWidth={2.5} />
      </button>
    </div>
  );
}
