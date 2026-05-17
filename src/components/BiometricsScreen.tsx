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

const fields: { key: 'weight' | 'height' | 'age'; label: string }[] = [
  { key: 'weight', label: 'WEIGHT (KG)' },
  { key: 'height', label: 'HEIGHT (CM)' },
  { key: 'age',    label: 'AGE' },
];

export default function BiometricsScreen({
  data, onUpdate, onNext, onBack, onManualOverride, step = 1, total = 3,
}: Props) {
  const canProceed = data.weight > 0 && data.height > 0 && data.age > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <OnboardingHeader step={step} total={total} onBack={onBack} />

      <div className="px-1 pt-6">
        <h1 className="font-mono font-black text-[40px] leading-[0.92] tracking-[-0.015em] uppercase">
          STRUCTURAL<br />DATA
        </h1>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8">
        {fields.map(f => (
          <div key={f.key}>
            <label
              htmlFor={`bio-${f.key}`}
              className="block font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/50 mb-2"
            >
              {f.label}
            </label>
            <input
              id={`bio-${f.key}`}
              className="input-bio"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={data[f.key] || ''}
              onChange={e => onUpdate({ [f.key]: Number(e.target.value) } as Partial<Props['data']>)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-8">
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
      </div>
    </div>
  );
}
