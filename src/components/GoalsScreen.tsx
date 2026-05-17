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
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-14 border-2 border-foreground px-4 text-left font-mono text-sm font-bold uppercase tracking-[0.09em] transition-colors active:scale-[0.99] ${
        selected
          ? 'bg-foreground text-background'
          : 'bg-background text-foreground hover:bg-foreground hover:text-background'
      }`}
    >
      {label}
    </button>
  );
}

export default function GoalsScreen({ data, onUpdate, onNext, onBack, step = 2, total = 3 }: Props) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <OnboardingHeader step={step} total={total} onBack={onBack} />

      <div className="px-1 pt-6">
        <h1 className="font-mono font-black text-[40px] leading-[0.92] tracking-[-0.015em] uppercase">
          KINETIC<br />OBJECTIVES
        </h1>
      </div>

      <div className="flex-1 flex flex-col gap-8 pt-10">
        <div className="flex flex-col gap-3">
          {activities.map(a => (
            <OptionButton
              key={a.value}
              label={a.label}
              selected={data.activityLevel === a.value}
              onClick={() => onUpdate({ activityLevel: a.value })}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {goals.map(g => (
            <OptionButton
              key={g.value}
              label={g.label}
              selected={data.goal === g.value}
              onClick={() => onUpdate({ goal: g.value })}
            />
          ))}
        </div>
      </div>

      <div className="pt-8">
        <button className="btn-cta" onClick={onNext}>CALCULATE</button>
      </div>
    </div>
  );
}
