import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import BodyMap from './BodyMap';
import {
  currentTier,
  MAX_DAYS,
  nextMilestone,
  progressPct,
  TIER_COLORS,
} from '@/lib/bodyMap';

interface Props {
  hitDays: number;
  onOpen: () => void;
}

export default function BodyMapCard({ hitDays, onOpen }: Props) {
  const tier = currentTier(hitDays);
  const pct = progressPct(hitDays);
  const next = nextMilestone(hitDays);
  const tierColor = TIER_COLORS[tier];

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.08 }}
      className="w-full border border-foreground/70 p-4 mb-8 text-left active:bg-foreground/5"
      aria-label="Open body map"
    >
      <div className="flex items-center justify-between mb-3 min-w-0">
        <p className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-0">
          // YOUR ARCHITECTURE
        </p>
        <p className="font-display text-[10px] font-bold tracking-[0.18em] uppercase shrink-0">
          {hitDays} / {MAX_DAYS} D
        </p>
      </div>

      {/* Start → Now split */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex flex-col items-center">
          <BodyMap hitDays={0} view="front" animate={false} dormant className="w-full max-w-[110px] text-foreground/40" />
          <p className="font-display text-[9px] font-bold tracking-[0.22em] uppercase text-foreground/40 mt-1">
            START
          </p>
        </div>
        <ChevronRight size={20} className="text-foreground/50 shrink-0" strokeWidth={2.5} />
        <div className="flex-1 flex flex-col items-center">
          <BodyMap hitDays={hitDays} view="front" animate={false} className="w-full max-w-[110px]" />
          <p className="font-display text-[9px] font-bold tracking-[0.22em] uppercase mt-1" style={{ color: tierColor }}>
            NOW
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-[6px] w-full bg-foreground/10 mb-2 overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: tierColor }} />
      </div>
      <div className="flex items-center justify-between min-w-0">
        <p className="font-display text-xs font-black tracking-[0.1em] uppercase truncate" style={{ color: tierColor }}>
          {tier}
        </p>
        <p className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground/70 shrink-0 ml-2">
          {next ? `NEXT IN ${next.day - hitDays}D` : 'MAX BUILD'}
        </p>
      </div>
    </motion.button>
  );
}
