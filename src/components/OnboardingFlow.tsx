import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthScreen from './AuthScreen';
import BiometricsScreen from './BiometricsScreen';
import GoalsScreen from './GoalsScreen';
import ResultsScreen from './ResultsScreen';

interface OnboardingData {
  name: string;
  email: string;
  password: string;
  weight: number;
  height: number;
  age: number;
  activityLevel: 'active' | 'moderate' | 'recovery';
  goal: 'hypertrophy' | 'equilibrium';
}

const initialData: OnboardingData = {
  name: '',
  email: '',
  password: '',
  weight: 0,
  height: 0,
  age: 0,
  activityLevel: 'active',
  goal: 'hypertrophy',
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);

  const next = () => { setDirection(1); setStep(s => s + 1); };
  const back = () => { setDirection(-1); setStep(s => s - 1); };

  const update = (partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const screens = [
    <AuthScreen key="auth" data={data} onUpdate={update} onNext={next} />,
    <BiometricsScreen key="bio" data={data} onUpdate={update} onNext={next} onBack={back} />,
    <GoalsScreen key="goals" data={data} onUpdate={update} onNext={next} onBack={back} />,
    <ResultsScreen key="results" data={data} onComplete={onComplete} onBack={back} />,
  ];

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
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1 flex flex-col"
        >
          {screens[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
