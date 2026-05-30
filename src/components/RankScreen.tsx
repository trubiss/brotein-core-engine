import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getRecentSummaries, computeStreak } from '@/lib/firestore';
import { DailySummary } from '@/lib/types';
import {
  RANK_TIERS,
  computeRankScore,
  progressToNext,
  getOrSnapshotStartRank,
  tierFor,
} from '@/lib/rank';
import { AmbientGrid } from './ui/AmbientGrid';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function RankScreen({ onBack }: Props) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [streak, setStreak] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getRecentSummaries(uid, 30)
      .then(all => {
        if (cancelled) return;
        setSummaries(all);
        setStreak(computeStreak(all));
        setReady(true);
      })
      .catch(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [uid]);

  const breakdown = useMemo(() => computeRankScore(summaries, streak), [summaries, streak]);
  const next = useMemo(() => progressToNext(breakdown.score, breakdown.rank), [breakdown]);
  const start = useMemo(() => getOrSnapshotStartRank(uid, summaries), [uid, summaries]);

  const consistencyPct = Math.round(breakdown.hitRate * 100);
  const showTransformation = !!start && breakdown.daysWithData > 0;

  return (
    <motion.div
      className="screen-container pb-32 relative isolate"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <AmbientGrid opacity={0.04} />

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-10 min-w-0">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 -ml-2 active:opacity-50 transition-opacity"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <p className="label-spaced mb-0 opacity-40 tracking-[0.25em]">PROTEIN RANK</p>
        <span className="w-8" />
      </motion.div>

      {/* Hero rank */}
      <motion.div variants={fadeUp} className="mb-10 flex flex-col items-center text-center">
        <motion.p
          key={breakdown.rank}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="font-display font-black leading-none tabular-nums"
          style={{ fontSize: 'clamp(8rem, 42vw, 14rem)', letterSpacing: '-0.07em' }}
        >
          {ready && breakdown.daysWithData > 0 ? breakdown.rank : '—'}
        </motion.p>
        <p className="font-display text-lg font-black tracking-[0.18em] mt-3">
          {ready && breakdown.daysWithData > 0 ? breakdown.label : 'UNRANKED'}
        </p>
      </motion.div>

      {/* Start → Now */}
      {showTransformation && (
        <motion.div
          variants={fadeUp}
          className="border-y border-foreground/20 py-6 mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground/60">START</p>
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground/60">NOW</p>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-center min-w-0">
              <p
                className="font-display font-black leading-none tabular-nums"
                style={{ fontSize: 'clamp(3rem, 14vw, 5rem)', letterSpacing: '-0.05em' }}
              >
                {start!.rank}
              </p>
              <p className="font-display text-[10px] font-black tracking-[0.18em] mt-2 truncate">
                {start!.label}
              </p>
            </div>
            <ArrowRight size={32} strokeWidth={2.5} className="opacity-80" />
            <div className="text-center min-w-0">
              <p
                className="font-display font-black leading-none tabular-nums"
                style={{ fontSize: 'clamp(3rem, 14vw, 5rem)', letterSpacing: '-0.05em' }}
              >
                {breakdown.rank}
              </p>
              <p className="font-display text-[10px] font-black tracking-[0.18em] mt-2 truncate">
                {breakdown.label}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress to next */}
      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-baseline justify-between mb-2 min-w-0">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
            {next.nextRank ? `PROGRESS TO ${next.nextLabel}` : 'MAX RANK'}
          </p>
          {next.nextRank && (
            <p className="font-display text-xs font-black tracking-[0.05em] shrink-0">
              {next.pctOfTier}%
            </p>
          )}
        </div>
        <div className="h-[10px] w-full bg-foreground/10 overflow-hidden mb-2">
          <motion.div
            className="h-full bg-foreground"
            initial={false}
            animate={{ width: `${next.nextRank ? next.pctOfTier : 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60">
          {next.nextRank
            ? `${next.pointsToNext} POINTS UNTIL ${next.nextLabel}`
            : 'LOCKED IN — YOU HAVE REACHED THE TOP'}
        </p>
      </motion.div>

      {/* Stats trio */}
      <motion.div variants={fadeUp} className="mb-10 border-y border-foreground/15">
        {[
          { k: 'CURRENT STREAK', v: `${streak} DAYS` },
          { k: 'LAST 30 DAYS',   v: `${consistencyPct}% CONSISTENCY` },
          { k: 'TARGET HIT',     v: `${breakdown.daysHit} / ${breakdown.daysWithData || 30} DAYS` },
        ].map((row, i, arr) => (
          <div
            key={row.k}
            className={`flex items-center justify-between py-4 min-w-0 ${i < arr.length - 1 ? 'border-b border-foreground/10' : ''}`}
          >
            <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground/70 truncate">
              {row.k}
            </p>
            <p className="font-display text-sm font-black tracking-[0.08em] shrink-0">
              {row.v}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Rank ladder */}
      <motion.div variants={fadeUp}>
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground mb-3">
          RANK LADDER
        </p>
        <div className="border-2 border-foreground">
          {RANK_TIERS.map((t, i) => {
            const isCurrent = ready && breakdown.daysWithData > 0 && t.rank === breakdown.rank;
            const tierIndex = RANK_TIERS.findIndex(x => x.rank === breakdown.rank);
            const isAbove = ready && i > tierIndex;
            return (
              <div
                key={t.rank}
                className={[
                  'flex items-center justify-between px-4 py-3.5 min-w-0',
                  i < RANK_TIERS.length - 1 ? 'border-b border-foreground/15' : '',
                  isCurrent ? 'bg-foreground text-background' : '',
                  !isCurrent && isAbove ? 'opacity-40' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <p
                    className="font-display font-black tabular-nums shrink-0"
                    style={{ fontSize: '1.5rem', letterSpacing: '-0.04em' }}
                  >
                    {t.rank}
                  </p>
                  <p className="font-display text-xs font-black tracking-[0.18em] truncate">
                    {t.label}
                  </p>
                </div>
                <p className="text-[9px] tracking-[0.2em] uppercase opacity-60 shrink-0">
                  {t.min}+
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50 mt-3">
          SCORE = CONSISTENCY × 60 + AVG COMPLETION × 30 + STREAK × 10
        </p>
      </motion.div>
    </motion.div>
  );
}
