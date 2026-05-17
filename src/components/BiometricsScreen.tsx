import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import OnboardingHeader from './onboarding/OnboardingHeader';

interface Props {
  data: { weight: number; height: number; age: number };
  onUpdate: (d: Partial<Props['data']>) => void;
  onNext: () => void;
  onBack: () => void;
  onManualOverride?: () => void;
  step?: number;
  total?: number;
}

const fields: { key: 'weight' | 'height' | 'age'; label: string; unit: string; placeholder: string; min: number; max: number }[] = [
  { key: 'weight', label: 'BODY MASS',  unit: 'KG', placeholder: '0', min: 30, max: 250 },
  { key: 'height', label: 'HEIGHT',     unit: 'CM', placeholder: '0', min: 100, max: 230 },
  { key: 'age',    label: 'AGE',        unit: 'YR', placeholder: '0', min: 13, max: 100 },
];

export default function BiometricsScreen({
  data, onUpdate, onNext, onBack, onManualOverride, step = 1, total = 3,
}: Props) {
  const canProceed = data.weight > 0 && data.height > 0 && data.age > 0;

  return (
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <OnboardingHeader
        step={step}
        total={total}
        title="STRUCTURAL DATA"
        kicker="A · MEASUREMENTS"
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col justify-center gap-2">
        {fields.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 + i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
            className="bio-row"
          >
            <label
              htmlFor={`bio-${f.key}`}
              className="font-mono text-[11px] font-bold tracking-[0.25em] uppercase text-foreground/60"
            >
              {f.label}
            </label>
            <div className="flex items-baseline gap-2">
              <input
                id={`bio-${f.key}`}
                className="bio-input"
                type="number"
                inputMode="numeric"
                placeholder={f.placeholder}
                value={data[f.key] || ''}
                min={f.min}
                max={f.max}
                onChange={e => onUpdate({ [f.key]: Number(e.target.value) } as Partial<Props['data']>)}
              />
              <span className="font-mono text-sm font-bold tracking-[0.15em] text-foreground/50 w-7 text-left">
                {f.unit}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-8">
        <button className="btn-cta" disabled={!canProceed} onClick={onNext}>
          <span>CONTINUE</span>
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
        {onManualOverride && (
          <button
            onClick={onManualOverride}
            className="w-full border-2 border-foreground/15 py-3 flex items-center justify-between px-4 active:opacity-60 transition-opacity"
          >
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/60">
              ALREADY KNOW YOUR TARGET?
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-foreground/60" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
