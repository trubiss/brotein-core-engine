import { useState } from 'react';

interface Props {
  onLog: (name: string, protein: number) => void;
  onClose: () => void;
}

export default function QuickLogModal({ onLog, onClose }: Props) {
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');

  const canLog = name.trim() && Number(protein) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative bg-background w-full max-w-md p-6 border-t-2 border-foreground">
        <h2 className="text-xl font-bold tracking-[0.1em] mb-8">QUICK LOG</h2>

        <div className="space-y-6 mb-8">
          <div>
            <label className="label-spaced">Food Name</label>
            <input
              className="input-underline"
              placeholder="e.g. Chicken Breast"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label-spaced">Protein Amount (g)</label>
            <input
              className="input-underline"
              type="number"
              placeholder="0"
              value={protein}
              onChange={e => setProtein(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button className="btn-outline flex-1" onClick={onClose}>CANCEL</button>
          <button
            className="btn-primary flex-1"
            disabled={!canLog}
            onClick={() => canLog && onLog(name.trim(), Number(protein))}
            style={{ opacity: canLog ? 1 : 0.3 }}
          >
            LOG
          </button>
        </div>
      </div>
    </div>
  );
}
