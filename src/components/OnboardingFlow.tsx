import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { track } from '@/lib/track';
import BiometricsScreen from './BiometricsScreen';
import GoalsScreen from './GoalsScreen';
import ResultsScreen from './ResultsScreen';
import ManualTargetScreen from './ManualTargetScreen';
import { ActivityLevel, Goal } from '@/lib/types';

interface OnboardingData {
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

const initialData: OnboardingData = {
  weight: 0, height: 0, age: 0,
  activityLevel: 'active', goal: 'hypertrophy',
};

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

type StepKey = 'bio' | 'goals' | 'results' | 'manual';

export default function OnboardingFlow() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<StepKey>('bio');
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);

  const go = (next: StepKey, dir: number) => {
    setDirection(dir);
    setStep(next);
  };
  const update = (partial: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...partial }));

  const completeFrom = (path: 'auto' | 'manual') => async () => {
    track('onboarding_complete', {
      path,
      goal: data.goal,
      activity_level: data.activityLevel,
      weight: data.weight,
    });
    await refreshProfile();
  };

  const profileBase = {
    name: user?.displayName ?? 'Athlete',
    email: user?.email ?? '',
  };

  const TOTAL = 3;
  const screens: Record<StepKey, JSX.Element> = {
    bio: (
      <BiometricsScreen
        step={1}
        total={TOTAL}
        data={data}
        onUpdate={update}
        onNext={() => go('goals', 1)}
        onBack={() => go('bio', -1)}
        onManualOverride={() => go('manual', 1)}
      />
    ),
    goals: (
      <GoalsScreen
        step={2}
        total={TOTAL}
        data={data}
        onUpdate={update}
        onNext={() => go('results', 1)}
        onBack={() => go('bio', -1)}
      />
    ),
    results: (
      <ResultsScreen
        step={3}
        total={TOTAL}
        data={{ ...profileBase, ...data }}
        onComplete={completeFrom('auto')}
        onBack={() => go('goals', -1)}
      />
    ),
    manual: (
      <ManualTargetScreen
        data={profileBase}
        onComplete={completeFrom('manual')}
        onBack={() => go('bio', -1)}
      />
    ),
  };

  const currentBack: (() => void) | null =
    step === 'bio' ? null :
    step === 'goals' ? () => go('bio', -1) :
    step === 'results' ? () => go('goals', -1) :
    step === 'manual' ? () => go('bio', -1) :
    null;

  return (
    <div className="screen-container overflow-hidden relative" style={{ touchAction: 'pan-y' }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            const { offset, velocity } = info;
            if ((offset.x > 80 || velocity.x > 500) && currentBack) currentBack();
          }}
          className="flex-1 flex flex-col"
        >
          {screens[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
