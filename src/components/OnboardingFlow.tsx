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

  const profileBase = {
    name: user?.displayName ?? 'Athlete',
    email: user?.email ?? '',
  };

  const screens: Record<StepKey, JSX.Element> = {
    bio: (
      <BiometricsScreen
        data={data}
        onUpdate={update}
        onNext={() => go('goals', 1)}
        onBack={() => go('bio', -1)}
        onManualOverride={() => go('manual', 1)}
      />
    ),
    goals: (
      <GoalsScreen
        data={data}
        onUpdate={update}
        onNext={() => go('results', 1)}
        onBack={() => go('bio', -1)}
      />
    ),
    results: (
      <ResultsScreen
        data={{ ...profileBase, ...data }}
        onComplete={refreshProfile}
        onBack={() => go('goals', -1)}
      />
    ),
    manual: (
      <ManualTargetScreen
        data={profileBase}
        onComplete={refreshProfile}
        onBack={() => go('bio', -1)}
      />
    ),
  };

  return (
    <div className="screen-container overflow-hidden relative">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex-1 flex flex-col"
        >
          {screens[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
