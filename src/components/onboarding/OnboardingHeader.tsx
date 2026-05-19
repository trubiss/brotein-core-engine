import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface Props {
  step: number;        // 1-indexed
  total: number;
  onBack?: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Minimal header — back chevron, thin progress line, step counter. */
export default function OnboardingHeader({ step, total, onBack }: Props) {
  const pct = Math.max(0, Math.min(100, (step / total) * 100));
  return (
    <div className="pt-4 pb-2 flex items-center gap-4">
      <button
        onClick={onBack}
        aria-label="Back"
        disabled={!onBack}
        className="text-foreground hover:opacity-60 transition-opacity disabled:opacity-0 shrink-0"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>
      <div className="flex-1 flex justify-center">
        <div className="w-[65%] h-[2px] bg-foreground/15 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full bg-foreground"
          />
        </div>
      </div>
      <motion.span
        key={step}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/50 shrink-0 tabular-nums"
      >
        {pad(step)}<span className="opacity-40"> / {pad(total)}</span>
      </motion.span>
    </div>
  );
}
