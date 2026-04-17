import { useState, useRef, useEffect } from 'react';
import { MealType } from '@/lib/types';

interface Props {
  initial?: {
    foodName: string;
    proteinGrams: number;
    mealType?: MealType;
  };
  title?: string;
  submitLabel?: string;
  onSubmit: (data: { foodName: string; proteinGrams: number; mealType?: MealType }) => void | Promise<void>;
  onClose: () => void;
}

const PRESETS = [20, 30, 40, 50];
const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'BFAST' },
  { value: 'lunch', label: 'LUNCH' },
  { value: 'dinner', label: 'DINNER' },
  { value: 'snack', label: 'SNACK' },
];

export default function QuickLogModal({ initial, title = 'QUICK LOG', submitLabel = 'LOG', onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial?.foodName ?? '');
  const [protein, setProtein] = useState(initial ? String(initial.proteinGrams) : '');
  const [mealType, setMealType] = useState<MealType | undefined>(initial?.mealType);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const canLog = name.trim().length > 0 && Number(protein) > 0;

  const handleSubmit = async () => {
    if (!canLog || busy) return;
    setBusy(true);
    try {
      await onSubmit({ foodName: name.trim(), proteinGrams: Number(protein), mealType });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-background w-full max-w-md p-6 border-t-2 border-foreground animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-12 h-0.5 bg-foreground/30 mx-auto mb-6" />
        <h2 className="text-xl font-black tracking-[0.1em] mb-6">{title}</h2>

        <div className="space-y-5 mb-5">
          <div>
            <label className="label-spaced">FOOD NAME</label>
            <input
              ref={nameRef}
              className="input-underline"
              placeholder="e.g. Chicken Breast"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-spaced">PROTEIN (G)</label>
            <input
              className="input-underline"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={protein}
              onChange={e => setProtein(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {PRESETS.map(g => (
            <button
              key={g}
              className="btn-outline flex-1 min-w-[60px] px-3 py-2 text-xs font-bold tracking-widest"
              onClick={() => setProtein(String(g))}
            >
              +{g}G
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="label-spaced">MEAL TYPE</p>
          <div className="grid grid-cols-4 gap-2">
            {MEALS.map(m => (
              <button
                key={m.value}
                onClick={() => setMealType(mealType === m.value ? undefined : m.value)}
                className={`p-2 border-2 text-[10px] font-bold tracking-widest ${
                  mealType === m.value ? 'border-foreground bg-foreground text-background' : 'border-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-outline flex-1" onClick={onClose} disabled={busy}>CANCEL</button>
          <button
            className="btn-primary flex-1"
            disabled={!canLog || busy}
            onClick={handleSubmit}
            style={{ opacity: canLog && !busy ? 1 : 0.3 }}
          >
            {busy ? '…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
