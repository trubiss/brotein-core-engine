import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import BodyMap from './BodyMap';
import { currentTier, MAX_DAYS, nextMilestone, progressPct } from '@/lib/bodyMap';

interface Props {
  hitDays: number;
  onOpen: () => void;
}

export default function BodyMapCard({ hitDays, onOpen }: Props) {
  const tier = currentTier(hitDays);
  const pct = progressPct(hitDays);
  const next = nextMilestone(hitDays);

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
          // ARCHITECTURE
        </p>
        <p className="font-display text-[10px] font-bold tracking-[0.18em] uppercase shrink-0">
          {hitDays} / {MAX_DAYS} DAYS
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 shrink-0">
          <BodyMap hitDays={hitDays} view="front" animate={false} />
        </div>
        <div className="w-20 shrink-0">
          <BodyMap hitDays={hitDays} view="back" animate={false} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xl font-black tracking-[0.08em] uppercase leading-none mb-2">
            {tier}
          </p>
          <div className="h-[6px] w-full bg-foreground/10 mb-2 overflow-hidden">
            <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
          </div>
          {next ? (
            <p className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground/70 leading-tight">
              NEXT · {next.label} IN {next.day - hitDays}D
            </p>
          ) : (
            <p className="text-[9px] tracking-[0.18em] uppercase text-foreground leading-tight">
              MAX BUILD ACHIEVED
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-foreground/40 shrink-0" />
      </div>
    </motion.button>
  );
}
