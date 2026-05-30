import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { DailySummary } from '@/lib/types';
import { computeIdentityScore, progressToNext } from '@/lib/identity';
import AnatomyFigure from './identity/AnatomyFigure';

interface Props {
  summaries: DailySummary[];
  streak: number;
  onOpen: () => void;
}

export default function IdentityCard({ summaries, streak, onOpen }: Props) {
  const b = useMemo(() => computeIdentityScore(summaries, streak), [summaries, streak]);
  const next = useMemo(() => progressToNext(b.score, b.identity), [b]);
  const empty = b.daysWithData === 0;

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.06 }}
      className="w-full border-2 border-foreground p-4 mb-3 text-left active:opacity-95"
      aria-label="Open Protein Identity"
    >
      <div className="flex items-center justify-between mb-3 min-w-0">
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
          PROTEIN IDENTITY
        </p>
        <ChevronRight size={14} strokeWidth={2.5} className="opacity-50 shrink-0" />
      </div>

      <div className="flex items-stretch gap-5 min-w-0">
        <div className="shrink-0 flex items-center justify-center">
          <AnatomyFigure identity={b.identity} size="md" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <motion.p
            key={b.identity}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="font-display text-2xl font-black tracking-[0.1em] leading-none truncate"
          >
            {empty ? 'UNRANKED' : b.label}
          </motion.p>

          {empty ? (
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-4">
              LOG 7 DAYS TO UNLOCK
            </p>
          ) : next.nextId ? (
            <div className="mt-4">
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/70 mb-1.5 truncate">
                {next.pctOfTier}% → {next.nextLabel}
              </p>
              <div className="h-[6px] w-full bg-foreground/10 overflow-hidden">
                <motion.div
                  className="h-full bg-foreground"
                  initial={false}
                  animate={{ width: `${next.pctOfTier}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/80 mt-4">
              MAX IDENTITY REACHED
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
