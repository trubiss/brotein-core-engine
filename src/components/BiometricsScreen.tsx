interface Props {
  data: { weight: number; height: number; age: number };
  onUpdate: (d: Partial<Props['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BiometricsScreen({ data, onUpdate, onNext, onBack }: Props) {
  const canProceed = data.weight > 0 && data.height > 0 && data.age > 0;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="pt-20">
        <h1 className="text-3xl font-black tracking-[0.15em] mb-3">STRUCTURAL DATA</h1>
        <div className="w-16 h-0.5 bg-foreground" />
      </div>

      <div className="space-y-8 py-8">
        <div>
          <label className="label-spaced">Body Mass (kg)</label>
          <input
            className="input-underline"
            type="number"
            placeholder="0"
            value={data.weight || ''}
            onChange={e => onUpdate({ weight: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label-spaced">Height (cm)</label>
          <input
            className="input-underline"
            type="number"
            placeholder="0"
            value={data.height || ''}
            onChange={e => onUpdate({ height: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label-spaced">Age</label>
          <input
            className="input-underline"
            type="number"
            placeholder="0"
            value={data.age || ''}
            onChange={e => onUpdate({ age: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-outline flex-1" onClick={onBack}>BACK</button>
        <button
          className="btn-primary flex-1"
          disabled={!canProceed}
          onClick={onNext}
          style={{ opacity: canProceed ? 1 : 0.3 }}
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
