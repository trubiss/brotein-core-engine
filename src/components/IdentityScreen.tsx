import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { getRecentSummaries, computeStreak } from '@/lib/firestore';
import { DailySummary } from '@/lib/types';
import {
  IDENTITY_TIERS,
  computeIdentityScore,
  progressToNext,
  getOrSnapshotStartIdentity,
} from '@/lib/identity';
import AnatomyFigure from './identity/AnatomyFigure';
import IdentityShareCard from './identity/IdentityShareCard';
import { AmbientGrid } from './ui/AmbientGrid';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function IdentityScreen({ onBack }: Props) {
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

  const b = useMemo(() => computeIdentityScore(summaries, streak), [summaries, streak]);
  const next = useMemo(() => progressToNext(b.score, b.identity), [b]);
  const start = useMemo(() => getOrSnapshotStartIdentity(uid, summaries), [uid, summaries]);

  const consistencyPct = Math.round(b.hitRate * 100);
  const showTransform = !!start && b.daysWithData > 0;
  const currentIdx = IDENTITY_TIERS.findIndex(t => t.id === b.identity);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://brotein.app';
    const text = next.nextId
      ? `I'm ${b.label} on Brotein. ${next.pointsToNext} pts until ${next.nextLabel}. ${url}`
      : `I'm LOCKED IN on Brotein — max protein identity. ${url}`;
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    try {
      if (nav?.share) {
        await nav.share({ title: 'Protein Identity', text, url });
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(text);
        toast.success('COPIED');
      }
    } catch { /* user dismissed */ }
  };

  return (
    <motion.div
      className="screen-container pb-32 relative isolate"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <AmbientGrid opacity={0.04} />

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8 min-w-0">
        <button onClick={onBack} aria-label="Back" className="p-2 -ml-2 active:opacity-50 transition-opacity">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <p className="label-spaced mb-0 opacity-40 tracking-[0.25em]">PROTEIN IDENTITY</p>
        <span className="w-8" />
      </motion.div>

      {/* Hero silhouette */}
      <motion.div variants={fadeUp} className="mb-10 flex flex-col items-center text-center">
        <motion.div
          key={b.identity}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <AnatomyFigure identity={b.identity} size="hero" className="!w-56" />
        </motion.div>
        <p
          className="font-display font-black tracking-[0.14em] mt-6"
          style={{ fontSize: 'clamp(1.5rem, 7vw, 2.25rem)' }}
        >
          {ready && b.daysWithData > 0 ? b.label : 'UNRANKED'}
        </p>
      </motion.div>

      {/* Start → Now */}
      {showTransform && (
        <motion.div variants={fadeUp} className="border-y border-foreground/20 py-7 mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground/60">START</p>
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground/60">NOW</p>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center min-w-0">
              <AnatomyFigure identity={start!.id} size="lg" />
              <p className="font-display text-[11px] font-black tracking-[0.18em] mt-3 truncate">
                {start!.label}
              </p>
            </div>
            <ArrowRight size={32} strokeWidth={2.5} className="opacity-80" />
            <div className="flex flex-col items-center min-w-0">
              <AnatomyFigure identity={b.identity} size="lg" />
              <p className="font-display text-[11px] font-black tracking-[0.18em] mt-3 truncate">
                {b.label}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress to next */}
      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-baseline justify-between mb-2 min-w-0">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground truncate">
            {next.nextId ? `PROGRESS TO ${next.nextLabel}` : 'MAX IDENTITY'}
          </p>
          {next.nextId && (
            <p className="font-display text-xs font-black tracking-[0.05em] shrink-0">
              {next.pctOfTier}%
            </p>
          )}
        </div>
        <div className="h-[10px] w-full bg-foreground/10 overflow-hidden mb-2">
          <motion.div
            className="h-full bg-foreground"
            initial={false}
            animate={{ width: `${next.nextId ? next.pctOfTier : 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60">
          {next.nextId
            ? `${next.pointsToNext} POINTS UNTIL ${next.nextLabel}`
            : 'LOCKED IN — YOU HAVE REACHED THE TOP'}
        </p>
      </motion.div>

      {/* Stats trio */}
      <motion.div variants={fadeUp} className="mb-10 border-y border-foreground/15">
        {[
          { k: 'CURRENT STREAK', v: `${streak} DAYS` },
          { k: 'LAST 30 DAYS',   v: `${consistencyPct}% CONSISTENCY` },
          { k: 'TARGET HIT',     v: `${b.daysHit} / ${b.daysWithData || 30} DAYS` },
        ].map((row, i, arr) => (
          <div
            key={row.k}
            className={`flex items-center justify-between py-4 min-w-0 ${i < arr.length - 1 ? 'border-b border-foreground/10' : ''}`}
          >
            <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground/70 truncate">{row.k}</p>
            <p className="font-display text-sm font-black tracking-[0.08em] shrink-0">{row.v}</p>
          </div>
        ))}
      </motion.div>

      {/* Identity ladder */}
      <motion.div variants={fadeUp} className="mb-10">
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground mb-3">
          IDENTITY LADDER
        </p>
        <div className="border-2 border-foreground">
          {IDENTITY_TIERS.map((t, i) => {
            const isCurrent = ready && b.daysWithData > 0 && t.id === b.identity;
            const isAbove = ready && i > currentIdx;
            return (
              <div
                key={t.id}
                className={[
                  'flex items-center gap-4 px-4 py-3 min-w-0',
                  i < IDENTITY_TIERS.length - 1 ? 'border-b border-foreground/15' : '',
                  isCurrent ? 'bg-foreground text-background' : '',
                  !isCurrent && isAbove ? 'opacity-40' : '',
                ].join(' ')}
              >
                <div className="shrink-0 w-10 flex justify-center">
                  <AnatomyFigure identity={t.id} size="sm" />
                </div>
                <p className="font-display text-xs font-black tracking-[0.18em] truncate flex-1">
                  {t.label}
                </p>
                <p className="text-[9px] tracking-[0.2em] uppercase opacity-60 shrink-0">{t.min}+</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Share card */}
      <motion.div variants={fadeUp}>
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground mb-3">
          SHARE
        </p>
        <IdentityShareCard identity={b.identity} score={b.score} streak={streak} />
        <button
          onClick={handleShare}
          className="w-full bg-foreground text-background py-3.5 font-display font-black text-sm tracking-[0.14em] mt-3 active:opacity-90 flex items-center justify-center gap-2"
        >
          <Share2 size={16} strokeWidth={2.5} />
          SHARE
        </button>
        <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/50 mt-2 text-center">
          SCREENSHOT TO SAVE
        </p>
      </motion.div>
    </motion.div>
  );
}
