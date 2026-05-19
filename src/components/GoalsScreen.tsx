import { motion } from 'framer-motion';
import { ActivityLevel, Goal } from '@/lib/types';
import OnboardingHeader from './onboarding/OnboardingHeader';

interface Props {
  data: { activityLevel: ActivityLevel; goal: Goal };
  onUpdate: (d: { activityLevel?: ActivityLevel; goal?: Goal }) => void;
  onNext: () => void;
  onBack: () => void;
  step?: number;
  total?: number;
}

const activities: { value: ActivityLevel; label: string }[] = [
  { value: 'active',   label: 'ACTIVE' },
  { value: 'moderate', label: 'MODERATE' },
  { value: 'recovery', label: 'RECOVERY' },
];

const goals: { value: Goal; label: string }[] = [
  { value: 'hypertrophy', label: 'HYPERTROPHY' },
  { value: 'equilibrium', label: 'MAINTENANCE' },
  { value: 'recovery',    label: 'RECOVERY' },
];

function OptionButton({
  label, selected, onClick, delay,
}: { label: string; selected: boolean; onClick: () => void; delay: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.2, 0.8, 0.2, 1] }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`w-full h-14 border-2 border-foreground px-4 text-left font-mono text-sm font-bold uppercase tracking-[0.09em] transition-colors flex items-center justify-between ${
        selected
          ? 'bg-foreground text-background'
          : 'bg-background text-foreground hover:bg-foreground hover:text-background'
      }`}
    >
      <span>{label}</span>
      <motion.span
        initial={false}
        animate={{ opacity: selected ? 1 : 0, x: selected ? 0 : -4 }}
        transition={{ duration: 0.2 }}
        className="font-mono text-xs"
        aria-hidden
      >
        ●
      </motion.span>
    </motion.button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase text-foreground/40 mb-3">
      {children}
    </p>
  );
}

export default function GoalsScreen({ data, onUpdate, onNext, onBack, step = 2, total = 3 }: Props) {
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
          // INPUT 02
        </p>
        <h1 className="font-black leading-[0.92] tracking-[-0.015em] uppercase text-foreground max-w-[280px] text-7xl mx-px my-0 px-0 py-0 border-0 font-mono text-justify">
          KINETIC<br />OBJECTIVES
        </h1>
      </motion.div>

      <div className="flex-1 flex flex-col gap-7 pt-8">
        <div>
          <SectionLabel>// ACTIVITY</SectionLabel>
          <div className="flex flex-col gap-3">
            {activities.map((a, i) => (
              <OptionButton
                key={a.value}
                label={a.label}
                selected={data.activityLevel === a.value}
                onClick={() => onUpdate({ activityLevel: a.value })}
                delay={0.08 + i * 0.05}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>// OBJECTIVE</SectionLabel>
          <div className="flex flex-col gap-3">
            {goals.map((g, i) => (
              <OptionButton
                key={g.value}
                label={g.label}
                selected={data.goal === g.value}
                onClick={() => onUpdate({ goal: g.value })}
                delay={0.25 + i * 0.05}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        className="pt-8"
      >
        <button className="btn-cta" onClick={onNext}>CALCULATE</button>
      </motion.div>
    </div>
  );
}
