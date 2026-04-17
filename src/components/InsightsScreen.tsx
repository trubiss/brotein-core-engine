import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Lock, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { watchAllSummaries, computeStreak } from '@/lib/firestore';
import { DailySummary } from '@/lib/types';
import { computeAnalytics, computeAchievements } from '@/lib/analytics';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function InsightsScreen({ onBack }: Props) {
  const { user, profile } = useAuth();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  useEffect(() => {
    if (!user) return;
    return watchAllSummaries(user.uid, setSummaries);
  }, [user]);

  const target = profile?.dailyProtein ?? 0;
  const analytics = useMemo(() => computeAnalytics(summaries, target), [summaries, target]);
  const currentStreak = useMemo(() => computeStreak(summaries), [summaries]);
  const achievements = useMemo(() => computeAchievements({
    currentStreak,
    bestStreak: analytics.bestStreak,
    totalHitDays: analytics.totalHitDays,
    overallHitPct: analytics.overallHitPct,
  }), [currentStreak, analytics]);

  if (!user || !profile) return null;

  const TrendIcon = analytics.trend === 'improving' ? TrendingUp
    : analytics.trend === 'declining' ? TrendingDown : Minus;

  return (
    <motion.div className="screen-container pb-12" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8 min-w-0">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em] truncate">INSIGHTS</h1>
      </motion.div>

      {/* 7-DAY CONSISTENCY */}
      <motion.div variants={fadeUp} className="mb-8">
        <p className="label-spaced">7-DAY CONSISTENCY</p>
        <div className="border-t-2 border-foreground pt-4">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {analytics.weeklyConsistency.map((d, i) => {
              const pct = d.target > 0 ? Math.min(100, (d.consumed / d.target) * 100) : 0;
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full h-20 border-2 border-foreground relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-foreground"
                      style={{ height: `${pct}%` }}
                    />
                    {d.hit && (
                      <Check size={10} className="absolute top-1 right-1 text-foreground mix-blend-difference" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-[9px] font-display tracking-wider">{DAY_LABELS[new Date(d.date + 'T00:00:00').getDay()]}</span>
                  <span className="text-[8px] text-muted-foreground tracking-wider">{d.consumed}G</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* WEEKLY STATS */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-8">
        <div className="border-2 border-foreground p-4 min-w-0">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">WEEKLY AVG</p>
          <p className="font-display text-3xl font-black leading-none">{analytics.weeklyAvg}<span className="text-sm">G</span></p>
          <p className="text-[10px] tracking-[0.2em] uppercase mt-2 text-muted-foreground">PER DAY</p>
        </div>
        <div className="border-2 border-foreground p-4 min-w-0">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">7-DAY HIT %</p>
          <p className="font-display text-3xl font-black leading-none">{analytics.weeklyHitPct}<span className="text-sm">%</span></p>
          <p className="text-[10px] tracking-[0.2em] uppercase mt-2 text-muted-foreground">DAYS ON TARGET</p>
        </div>
      </motion.div>

      {/* 30-DAY ADHERENCE + TREND */}
      <motion.div variants={fadeUp} className="mb-8">
        <p className="label-spaced">30-DAY ADHERENCE</p>
        <div className="border-2 border-foreground p-4">
          <div className="flex items-baseline justify-between mb-3 gap-2 min-w-0">
            <p className="font-display text-5xl font-black leading-none">{analytics.monthlyAdherence}<span className="text-xl">%</span></p>
            <div className="flex items-center gap-2 border-2 border-foreground px-2 py-1 shrink-0">
              <TrendIcon size={14} strokeWidth={2.5} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{analytics.trend}</span>
            </div>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${analytics.monthlyAdherence}%`, transition: 'width 0.6s ease-out' }}
            />
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-3">
            {analytics.totalHitDays}/{analytics.totalTrackedDays} TRACKED DAYS HIT TARGET
          </p>
        </div>
      </motion.div>

      {/* ACHIEVEMENTS */}
      <motion.div variants={fadeUp}>
        <p className="label-spaced">ACHIEVEMENTS</p>
        <div className="border-t-2 border-foreground">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`flex items-center justify-between gap-3 py-4 border-b border-border min-w-0 ${
                a.unlocked ? '' : 'opacity-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {a.unlocked ? <Check size={12} strokeWidth={3} /> : <Lock size={12} />}
                  <p className="text-sm uppercase tracking-[0.12em] truncate font-bold">{a.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 tracking-wider uppercase truncate">{a.description}</p>
              </div>
              <span className="font-display text-[11px] font-bold whitespace-nowrap tracking-widest">
                {a.progress}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
