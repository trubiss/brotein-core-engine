import { motion } from 'framer-motion';
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

const fields: { key: 'weight' | 'height' | 'age'; label: string; unit: string }[] = [
  { key: 'weight', label: 'WEIGHT', unit: 'KG' },
  { key: 'height', label: 'HEIGHT', unit: 'CM' },
  { key: 'age',    label: 'AGE',    unit: 'YRS' },
];

export default function BiometricsScreen({
  data, onUpdate, onNext, onBack, onManualOverride, step = 1, total = 3,
}: Props) {
  const canProceed = data.weight > 0 && data.height > 0 && data.age > 0;

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
          // INPUT 01
        </p>
        <h1 className="font-black leading-[0.92] tracking-[-0.015em] uppercase text-foreground max-w-[280px] text-7xl mx-px my-0 px-0 py-0 border-0 font-mono text-justify">
          STRUCTURAL<br />DATA
        </h1>
        <p className="font-sans text-[13px] font-medium leading-[1.45] tracking-[0.01em] text-foreground/55 mt-3 max-w-[260px]">
          Three numbers. Used once to compute your target.
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-8">
        {fields.map((f, i) => {
          const filled = data[f.key] > 0;
          return (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <label
                  htmlFor={`bio-${f.key}`}
                  className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/50"
                >
                  {f.label}
                </label>
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/30">
                  {f.unit}
                </span>
              </div>
              <div className="relative">
                <input
                  id={`bio-${f.key}`}
                  className="input-bio"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={data[f.key] || ''}
                  onChange={e => onUpdate({ [f.key]: Number(e.target.value) } as Partial<Props['data']>)}
                />
                <motion.span
                  initial={false}
                  animate={{ opacity: filled ? 1 : 0, scale: filled ? 1 : 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-1 bottom-3 w-2 h-2 bg-foreground"
                  aria-hidden
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="flex flex-col items-center gap-4 pt-8"
      >
        <button className="btn-cta" disabled={!canProceed} onClick={onNext}>
          CONTINUE
        </button>
        {onManualOverride && (
          <button
            onClick={onManualOverride}
            className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground active:opacity-60 py-2"
          >
            ALREADY KNOW YOUR TARGET →
          </button>
        )}
      </motion.div>
    </div>
  );
}
