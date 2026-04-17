import { ActivityLevel, Goal } from '@/lib/types';

interface Props {
  data: { activityLevel: ActivityLevel; goal: Goal };
  onUpdate: (d: { activityLevel?: ActivityLevel; goal?: Goal }) => void;
  onNext: () => void;
  onBack: () => void;
}

const activities = [
  { value: 'active', label: 'ACTIVE', desc: 'High Performance' },
  { value: 'moderate', label: 'MODERATE', desc: 'Maintenance' },
  { value: 'recovery', label: 'RECOVERY', desc: 'Recovery Phase' },
] as const;

const goals = [
  { value: 'hypertrophy', label: 'HYPERTROPHY', desc: 'Muscle Gain · 1.8 g/kg' },
  { value: 'equilibrium', label: 'MAINTENANCE', desc: 'Maintain · 1.4 g/kg' },
  { value: 'recovery', label: 'RECOVERY', desc: 'Repair · 1.2 g/kg' },
] as const;

export default function GoalsScreen({ data, onUpdate, onNext, onBack }: Props) {
  return (
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <div className="pt-16">
        <h1 className="text-2xl font-black tracking-[0.15em] mb-3 break-words">KINETIC OBJECTIVES</h1>
        <div className="w-16 h-0.5 bg-foreground" />
      </div>

      <div className="space-y-8 py-6 flex-1">
        <div>
          <p className="label-spaced mb-4">ACTIVITY COEFFICIENT</p>
          <div className="space-y-3">
            {activities.map(a => (
              <button
                key={a.value}
                onClick={() => onUpdate({ activityLevel: a.value })}
                className={`w-full text-left p-4 border-2 transition-all ${
                  data.activityLevel === a.value ? 'border-foreground bg-foreground text-background' : 'border-foreground'
                }`}
              >
                <span className="font-display text-sm font-bold tracking-widest">{a.label}</span>
                <span className="text-xs ml-3 opacity-60">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label-spaced mb-4">PHYSICAL TRAJECTORY</p>
          <div className="space-y-3">
            {goals.map(g => (
              <button
                key={g.value}
                onClick={() => onUpdate({ goal: g.value })}
                className={`w-full text-left p-4 border-2 transition-all ${
                  data.goal === g.value ? 'border-foreground bg-foreground text-background' : 'border-foreground'
                }`}
              >
                <span className="font-display text-sm font-bold tracking-widest">{g.label}</span>
                <span className="text-xs ml-3 opacity-60">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-outline flex-1" onClick={onBack}>BACK</button>
        <button className="btn-primary flex-1" onClick={onNext}>NEXT</button>
      </div>
    </div>
  );
}
