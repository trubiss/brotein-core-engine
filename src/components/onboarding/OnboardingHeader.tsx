import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface Props {
  step: number;        // 1-indexed
  total: number;
  title: string;
  onBack?: () => void;
  /** Optional kicker shown above title, e.g. "A · MEASUREMENTS" */
  kicker?: string;
}

export default function OnboardingHeader({ step, total, title, onBack, kicker }: Props) {
  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-6 h-6">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 -ml-1 px-1 py-1 text-foreground active:opacity-60"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">BACK</span>
          </button>
        ) : <span />}
        <span className="font-mono text-[11px] font-bold tracking-[0.25em] uppercase text-foreground/60">
          {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      {/* Segmented progress */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-foreground/10 overflow-hidden">
            <motion.div
              className="h-full bg-foreground"
              initial={false}
              animate={{ width: i < step ? '100%' : '0%' }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        ))}
      </div>

      {kicker && (
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/40 mb-2">
          {kicker}
        </p>
      )}
      <h1 className="font-mono font-black text-[34px] leading-[0.95] tracking-[-0.01em] uppercase text-foreground">
        {title}
      </h1>
      <div className="w-12 h-[3px] bg-foreground mt-4" />
    </div>
  );
}
