import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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

const activities = [
  { value: 'active',   label: 'ACTIVE',   desc: 'High Performance', meta: '5–7×/WK' },
  { value: 'moderate', label: 'MODERATE', desc: 'Maintenance',      meta: '3–4×/WK' },
  { value: 'recovery', label: 'RECOVERY', desc: 'Recovery Phase',   meta: '0–2×/WK' },
] as const;

const goals = [
  { value: 'hypertrophy', label: 'HYPERTROPHY', desc: 'Muscle Gain', meta: '1.8 G/KG' },
  { value: 'equilibrium', label: 'MAINTENANCE', desc: 'Maintain',    meta: '1.4 G/KG' },
  { value: 'recovery',    label: 'RECOVERY',    desc: 'Repair',      meta: '1.2 G/KG' },
] as const;

type Item = { value: string; label: string; desc: string; meta: string };

function OptionRow({
  item, index, selected, onClick,
}: { item: Item; index: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full h-16 border-2 border-foreground overflow-hidden text-left active:scale-[0.99] transition-transform`}
    >
      {/* Sweep-in fill */}
      <motion.span
        initial={false}
        animate={{ scaleX: selected ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transformOrigin: 'left' }}
        className="absolute inset-0 bg-foreground z-0"
      />
      <div className={`relative z-10 h-full px-4 flex items-center justify-between gap-3 ${selected ? 'text-background' : 'text-foreground'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`font-mono text-[10px] font-bold tracking-[0.2em] ${selected ? 'text-background/60' : 'text-foreground/40'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="font-mono text-sm font-bold tracking-[0.15em] uppercase truncate">{item.label}</div>
            <div className={`font-sans text-[11px] truncate ${selected ? 'text-background/70' : 'text-foreground/50'}`}>{item.desc}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono text-[10px] font-bold tracking-[0.15em] ${selected ? 'text-background/70' : 'text-foreground/50'}`}>
            {item.meta}
          </span>
          <motion.span
            initial={false}
            animate={{ opacity: selected ? 1 : 0, x: selected ? 0 : -4 }}
            transition={{ duration: 0.18 }}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </motion.span>
        </div>
      </div>
    </button>
  );
}

export default function GoalsScreen({ data, onUpdate, onNext, onBack, step = 2, total = 3 }: Props) {
  return (
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <OnboardingHeader
        step={step}
        total={total}
        title="KINETIC OBJECTIVES"
        kicker="B · TRAJECTORY"
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col gap-7 py-6 min-h-0">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/40 mb-3">
            ACTIVITY COEFFICIENT
          </p>
          <div className="space-y-2">
            {activities.map((a, i) => (
              <OptionRow
                key={a.value}
                item={a}
                index={i}
                selected={data.activityLevel === a.value}
                onClick={() => onUpdate({ activityLevel: a.value })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/40 mb-3">
            PHYSICAL TRAJECTORY
          </p>
          <div className="space-y-2">
            {goals.map((g, i) => (
              <OptionRow
                key={g.value}
                item={g}
                index={i}
                selected={data.goal === g.value}
                onClick={() => onUpdate({ goal: g.value })}
              />
            ))}
          </div>
        </div>
      </div>

      <button className="btn-cta" onClick={onNext}>
        <span>CALCULATE</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
