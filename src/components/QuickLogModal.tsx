import { useState, useRef, useEffect } from 'react';

interface Props {
  onLog: (name: string, protein: number) => void;
  onClose: () => void;
}

const PRESETS = [20, 30, 50];

export default function QuickLogModal({ onLog, onClose }: Props) {
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const canLog = name.trim() && Number(protein) > 0;

  const handleLog = () => {
    if (!canLog) return;
    onLog(name.trim(), Number(protein));
    onClose();
  };

  const applyPreset = (grams: number) => {
    setProtein(String(grams));
    if (!name.trim()) {
      nameRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-background w-full max-w-md p-6 border-t-2 border-foreground animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-0.5 bg-foreground/30 mx-auto mb-6" />
        <h2 className="text-xl font-black tracking-[0.1em] mb-8">QUICK LOG</h2>

        <div className="space-y-6 mb-6">
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
              placeholder="0"
              value={protein}
              onChange={e => setProtein(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {PRESETS.map(g => (
            <button
              key={g}
              className="btn-outline px-4 py-2 text-sm font-bold tracking-widest"
              onClick={() => applyPreset(g)}
            >
              {g}G
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button className="btn-outline flex-1" onClick={onClose}>CANCEL</button>
          <button
            className="btn-primary flex-1"
            disabled={!canLog}
            onClick={handleLog}
            style={{ opacity: canLog ? 1 : 0.3 }}
          >
            LOG
          </button>
        </div>
      </div>
    </div>
  );
}
