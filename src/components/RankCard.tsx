import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { DailySummary } from '@/lib/types';
import { computeRankScore, progressToNext } from '@/lib/rank';

interface Props {
  summaries: DailySummary[];
  streak: number;
  onOpen: () => void;
}

export default function RankCard({ summaries, streak, onOpen }: Props) {
  const breakdown = useMemo(() => computeRankScore(summaries, streak), [summaries, streak]);
  const next = useMemo(() => progressToNext(breakdown.score, breakdown.rank), [breakdown]);

  const empty = breakdown.daysWithData === 0;
  const consistencyPct = Math.round(breakdown.hitRate * 100);

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.06 }}
      className="w-full border-2 border-foreground p-4 mb-3 text-left active:opacity-95"
      aria-label="Open Protein Rank"
    >
      <div className="flex items-center justify-between mb-3 min-w-0">
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
          PROTEIN RANK
        </p>
        <ChevronRight size={14} strokeWidth={2.5} className="opacity-50 shrink-0" />
      </div>

      <div className="flex items-end gap-5 mb-4 min-w-0">
        <motion.p
          key={breakdown.rank}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="font-display font-black leading-none tabular-nums shrink-0"
          style={{ fontSize: 'clamp(5.5rem, 22vw, 8.5rem)', letterSpacing: '-0.06em' }}
        >
          {empty ? '—' : breakdown.rank}
        </motion.p>
        <div className="min-w-0 flex-1 pb-2">
          <p className="font-display text-base font-black tracking-[0.14em] truncate leading-tight">
            {empty ? 'START LOGGING' : breakdown.label}
          </p>
          {!empty && (
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/70 mt-1.5 truncate">
              CONSISTENCY {consistencyPct}% · STREAK {streak}D
            </p>
          )}
        </div>
      </div>

      {empty ? (
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60">
          LOG 7 DAYS TO UNLOCK
        </p>
      ) : next.nextRank ? (
        <>
          <div className="flex items-baseline justify-between mb-1 min-w-0">
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/70 truncate">
              {next.pctOfTier}% → {next.nextLabel}
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60 shrink-0">
              {next.pointsToNext} PTS
            </p>
          </div>
          <div className="h-[6px] w-full bg-foreground/10 overflow-hidden">
            <motion.div
              className="h-full bg-foreground"
              initial={false}
              animate={{ width: `${next.pctOfTier}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </>
      ) : (
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/80">
          LOCKED IN — MAX RANK
        </p>
      )}
    </motion.button>
  );
}
