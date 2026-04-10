interface Props {
  data: { activityLevel: string; goal: string };
  onUpdate: (d: { activityLevel?: 'active' | 'moderate' | 'recovery'; goal?: 'hypertrophy' | 'equilibrium' }) => void;
  onNext: () => void;
  onBack: () => void;
}

const activities = [
  { value: 'active', label: 'ACTIVE', desc: 'High Performance' },
  { value: 'moderate', label: 'MODERATE', desc: 'Maintenance' },
  { value: 'recovery', label: 'RECOVERY', desc: 'Recovery Phase' },
] as const;

const goals = [
  { value: 'hypertrophy', label: 'HYPERTROPHY', desc: 'Muscle Gain' },
  { value: 'equilibrium', label: 'EQUILIBRIUM', desc: 'Maintenance' },
] as const;

export default function GoalsScreen({ data, onUpdate, onNext, onBack }: Props) {
  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="pt-20">
        <h1 className="text-3xl font-black tracking-[0.15em] mb-3">KINETIC OBJECTIVES</h1>
        <div className="w-16 h-0.5 bg-foreground" />
      </div>

      <div className="space-y-10 py-4">
        <div>
          <p className="label-spaced mb-4">Activity Coefficient</p>
          <div className="space-y-3">
            {activities.map(a => (
              <button
                key={a.value}
                onClick={() => onUpdate({ activityLevel: a.value })}
                className={`w-full text-left p-4 border-2 transition-all ${
                  data.activityLevel === a.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground'
                }`}
              >
                <span className="font-display text-sm font-bold tracking-widest">{a.label}</span>
                <span className="text-xs ml-3 opacity-60">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label-spaced mb-4">Physical Trajectory</p>
          <div className="space-y-3">
            {goals.map(g => (
              <button
                key={g.value}
                onClick={() => onUpdate({ goal: g.value })}
                className={`w-full text-left p-4 border-2 transition-all ${
                  data.goal === g.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground'
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
