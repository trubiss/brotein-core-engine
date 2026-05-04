import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { addLog, watchLogsForDate, watchSummary, getRecentSummaries, computeStreak } from '@/lib/firestore';
import { todayKey, FoodLog, DailySummary } from '@/lib/types';

import { evaluateReminders, getReminderSettings } from '@/lib/reminders';

import { User, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { computePace } from '@/lib/pace';

const QuickLogModal = lazy(() => import('./QuickLogModal'));
const FoodScanModal = lazy(() => import('./FoodScanModal'));

/** Counter that tweens between values for a satisfying count-up/down on log. */
function AnimatedGrams({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => `${Math.round(v)}g`);
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.2,
      ease: 'easeOut',
      from: prev.current,
    });
    prev.current = value;
    return controls.stop;
  }, [value, mv]);
  return (
    <motion.p className="text-[5.5rem] font-black font-display leading-[0.95]" style={{ letterSpacing: '-0.04em' }}>
      {display}
    </motion.p>
  );
}

interface Props {
  onNavigate: (page: 'history' | 'profile' | 'insights') => void;
}

const stagger = { animate: { transition: { staggerChildren: 0.02 } } };
const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' as const } },
};

const haptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(8); } catch { /* noop */ }
  }
};

export default function Dashboard({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [today, setToday] = useState(todayKey());
  const [viewDate, setViewDate] = useState(todayKey());
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryReady, setSummaryReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  
  const [streakBump, setStreakBump] = useState(0);

  const isToday = viewDate === today;

  // Roll over at midnight
  useEffect(() => {
    const id = setInterval(() => {
      const k = todayKey();
      if (k !== today) {
        setViewDate(prev => (prev === today ? k : prev));
        setToday(k);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [today]);

  useEffect(() => {
    if (!user) return;
    // Reset state immediately so stale cached values from a previous day/session
    // don't flash before the live snapshot arrives.
    setLogs([]);
    setSummary(null);
    setSummaryReady(false);
    const u1 = watchLogsForDate(user.uid, viewDate, setLogs);
    const u2 = watchSummary(user.uid, viewDate, s => {
      setSummary(s);
      setSummaryReady(true);
    });
    return () => { u1(); u2(); };
  }, [user, viewDate]);

  // Streak: one-shot, deferred to idle, refetched after mutations.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = () => {
      getRecentSummaries(user.uid, 30)
        .then(all => { if (!cancelled) setStreak(computeStreak(all)); })
        .catch(() => {});
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(run) : window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      const w2 = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (w2.cancelIdleCallback) w2.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, [user, streakBump]);

  const shiftDate = (days: number) => {
    const [y, m, d] = viewDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const next = todayKey(dt);
    if (next > today) return; // do not allow future
    setViewDate(next);
  };

  const dateLabel = (() => {
    if (isToday) return 'TODAY';
    const [y, m, d] = viewDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (todayKey(dt) === todayKey(yest)) return 'YESTERDAY';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  })();

  // In-app reminder evaluator: checks every minute and surfaces toasts.
  // Push notifications can replace `toast` later without touching the logic.
  useEffect(() => {
    if (!profile) return;
    const settings = getReminderSettings(profile);
    const tick = () => {
      const events = evaluateReminders(settings, {
        consumed: summary?.consumedProtein ?? 0,
        target: profile.dailyProtein,
      });
      events.forEach(e => toast(e.title, { description: e.body }));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [profile, summary]);

  if (!profile || !user) return null;

  const consumed = summary?.consumedProtein ?? 0;
  const target = profile.dailyProtein;
  const remaining = Math.max(0, target - consumed);
  const pace = useMemo(() => computePace(consumed, target, new Date()), [consumed, target]);

  // Action-driven status copy. Direct, no passive language.
  const status = (() => {
    if (consumed >= target) {
      return { headline: 'LOCKED IN', sub: 'TARGET HIT.' };
    }
    if (pace.status === 'ahead') {
      return { headline: 'AHEAD OF PACE', sub: "YOU'RE CRUSHING IT. KEEP GOING." };
    }
    if (pace.status === 'behind') {
      const need = Math.max(0, target - consumed);
      // Deadline = end of active eating window (22:00). Show as HH:MM.
      return { headline: 'BEHIND', sub: `NEED ${need}G BEFORE 22:00` };
    }
    return { headline: 'ON TRACK', sub: 'STAY CONSISTENT.' };
  })();


  const log = (foodName: string, proteinGrams: number, mealType?: FoodLog['mealType']) => {
    // Optimistic: toast immediately, write in background. Firestore's local cache
    // will reflect the new log via onSnapshot before the server round-trip completes.
    toast.success(`+${proteinGrams}G LOGGED${isToday ? '' : ` · ${dateLabel}`}`);
    setStreakBump(b => b + 1);
    return addLog(user.uid, { foodName, proteinGrams, mealType, date: viewDate }, profile.dailyProtein)
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : 'Failed to log');
      });
  };


  return (
    <motion.div className="screen-container pb-32" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-12 min-w-0">
        <h1 className="font-black tracking-[0.15em] font-sans text-3xl truncate">BROTEIN</h1>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onNavigate('insights')} className="p-2 border-2 border-foreground active:scale-95 transition-transform" aria-label="Insights">
            <BarChart3 size={20} />
          </button>
          <button onClick={() => onNavigate('profile')} className="p-2 border-2 border-foreground active:scale-95 transition-transform" aria-label="Profile">
            <User size={20} />
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-2 min-w-0">
        {/* Inline date control — sits with FUEL STATUS, owns the day's context */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="label-spaced mb-0 opacity-40 tracking-[0.25em]">FUEL STATUS</p>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1 active:opacity-50 transition-opacity"
              aria-label="Previous day"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <span className="font-display text-[10px] font-bold tracking-[0.2em] uppercase min-w-[68px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-1 active:opacity-50 transition-opacity disabled:opacity-20"
              aria-label="Next day"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        {summaryReady ? (
          <AnimatedGrams value={remaining} />
        ) : (
          <p className="text-[5.5rem] font-black font-display leading-[0.95] opacity-30" style={{ letterSpacing: '-0.04em' }}>—</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-[0.2em]">
          REMAINING {isToday ? 'TODAY' : `· ${dateLabel}`}
        </p>
      </motion.div>

      {/* Status — direct, action-based. Pulses when headline changes. Tightly grouped as one unit. */}
      <motion.div
        key={status.headline}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-7 min-w-0"
      >
        <p className="font-display text-lg font-black tracking-[0.12em] truncate leading-tight">
          {status.headline}
        </p>
        <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 mt-0.5 truncate leading-tight">
          {status.sub}
        </p>
      </motion.div>

      {/* Boxed progress card — primary tool panel */}
      <motion.div variants={fadeUp} className="border border-foreground/70 p-4 mb-3">
        <div className="flex items-baseline justify-between mb-2 min-w-0">
          <p className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-0">PROGRESS</p>
          <p className="font-display text-xs font-black tracking-[0.04em] shrink-0">
            {consumed} / {target}G
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-[10px] w-full bg-foreground/10 mb-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-foreground"
            initial={false}
            animate={{ width: `${Math.min(100, target > 0 ? (consumed / target) * 100 : 0)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between mb-4 min-w-0">
          <p className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground/60 truncate">
            {remaining}G REMAINING
          </p>
          <p className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground/60 shrink-0">
            {target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0}%
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="w-full bg-foreground text-background py-3.5 font-display font-black text-sm tracking-[0.12em] mb-2.5 active:opacity-90"
        >
          QUICK ADD +
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowScan(true)}
          className="w-full border border-foreground/80 py-3.5 font-display font-black text-sm tracking-[0.12em] active:bg-foreground/5"
        >
          SCAN FOOD WITH AI
        </motion.button>
      </motion.div>

      {/* Secondary one-tap shortcuts — feel like extensions of the card */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-1.5 mb-8">
        {[20, 30, 40].map(g => (
          <motion.button
            key={g}
            whileTap={{ scale: 0.96 }}
            onClick={() => log(`+${g}g protein`, g)}
            className="border border-foreground/70 py-2.5 font-display font-black text-base tracking-[0.06em] active:bg-foreground/5"
            aria-label={`Quick add ${g} grams`}
          >
            +{g}G
          </motion.button>
        ))}
      </motion.div>

      {/* Minimal streak — low visual weight, breathes above */}
      <motion.div variants={fadeUp} className="mb-2">
        <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/55">
          STREAK · {streak} {streak === 1 ? 'DAY' : 'DAYS'}
        </p>
      </motion.div>

      {(showModal || showScan) && (
        <Suspense fallback={null}>
          {showModal && (
            <QuickLogModal
              onSubmit={async ({ foodName, proteinGrams, mealType }) => {
                await log(foodName, proteinGrams, mealType);
              }}
              onScan={() => { setShowModal(false); setShowScan(true); }}
              onClose={() => setShowModal(false)}
            />
          )}

          {showScan && (
            <FoodScanModal
              onClose={() => setShowScan(false)}
              onConfirm={async ({ foodName, proteinGrams, mealType, ai, edited }) => {
                try {
                  await addLog(user.uid, {
                    foodName,
                    proteinGrams,
                    mealType,
                    date: viewDate,
                    source: 'ai-scan',
                    aiDetectedName: ai.foodName,
                    aiEstimatedGrams: ai.proteinGrams,
                    aiConfidence: ai.confidence,
                    aiPortion: ai.portion,
                    aiEdited: edited,
                  }, profile.dailyProtein);
                  setStreakBump(b => b + 1);
                  toast.success(`+${proteinGrams}G LOGGED · AI SCAN`);
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : 'Failed to log');
                }
              }}
            />
          )}
        </Suspense>
      )}
    </motion.div>
  );
}
