import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { addLog, deleteLog, watchLogsForDate, watchSummary, getRecentSummaries, computeStreak } from '@/lib/firestore';
import SwipeableLogRow from './SwipeableLogRow';
import { todayKey, FoodLog, DailySummary } from '@/lib/types';

import { evaluateReminders, getReminderSettings } from '@/lib/reminders';

import { User, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { computePace } from '@/lib/pace';
import { markFirstOpen, shouldShowPaywall, startTrial, isTrialActive } from '@/lib/paywall';
import { track } from '@/lib/track';

const QuickLogModal = lazy(() => import('./QuickLogModal'));
const FoodScanModal = lazy(() => import('./FoodScanModal'));
const Paywall = lazy(() => import('./Paywall'));

import { AmbientGrid, BlinkingCursor } from './ui/AmbientGrid';

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
    <motion.p className="text-[clamp(4rem,11vw,5.5rem)] font-black font-display leading-none" style={{ letterSpacing: '-0.04em' }}>
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

function relTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'JUST NOW';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}M AGO`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  return `${d}D AGO`;
}

export default function Dashboard({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? '';
  const [today, setToday] = useState(todayKey());
  const [viewDate, setViewDate] = useState(todayKey());
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryReady, setSummaryReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [summaries30, setSummaries30] = useState<DailySummary[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);

  const [streakBump, setStreakBump] = useState(0);
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [trialActive, setTrialActive] = useState(() => isTrialActive(uid));
  const [totalLogs, setTotalLogs] = useState(0);
  const [lastEntry, setLastEntry] = useState<FoodLog | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  // Keep trialActive in sync when uid changes (login/logout) — preserves expiry semantics.
  useEffect(() => { setTrialActive(isTrialActive(uid)); }, [uid]);

  useEffect(() => { if (uid) markFirstOpen(uid); }, [uid]);

  // Safety: ensure dashboard always opens scrolled to the top
  useEffect(() => {
    const reset = () => {
      try { window.scrollTo(0, 0); } catch { /* noop */ }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    };
    reset();
    const raf = requestAnimationFrame(reset);
    const t = window.setTimeout(reset, 80);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);

  // Check RevenueCat entitlement on boot. If the user already has Pro
  // (returning subscriber, restored on reinstall), bypass the paywall.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void import('@/lib/iap')
      .then(m => m.hasProEntitlement())
      .then(active => { if (!cancelled) setHasEntitlement(active); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [uid]);

  // Track total log count for paywall trigger.
  useEffect(() => {
    if (!user || trialActive || hasEntitlement) return;
    let cancelled = false;
    getRecentSummaries(user.uid, 30)
      .then(all => {
        if (cancelled) return;
        const sum = all.reduce((acc, s) => acc + (s.logCount ?? 0), 0);
        setTotalLogs(sum);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, trialActive, hasEntitlement, streakBump]);

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
    setLogs([]);
    setSummary(null);
    setSummaryReady(false);
    const u1 = watchLogsForDate(user.uid, viewDate, logs => {
      setLogs(logs);
      setSummaryReady(true);
    });
    const u2 = watchSummary(user.uid, viewDate, s => {
      setSummary(s);
      setSummaryReady(true);
    });
    return () => { u1(); u2(); };
  }, [user, viewDate]);

  // Fire target_hit once per date when the user crosses their daily goal.
  // Key is namespaced by uid so two users on the same device don't collide.
  useEffect(() => {
    if (!summary?.hitTarget || !uid) return;
    const key = `brotein_target_hit:${uid}:${summary.date}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    track('target_hit', {
      date: summary.date,
      consumed: summary.consumedProtein,
      target: summary.targetProtein,
    });
  }, [summary?.hitTarget, summary?.date, summary?.consumedProtein, summary?.targetProtein, uid]);

  // Streak: one-shot, deferred to idle, refetched after mutations.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = () => {
      getRecentSummaries(user.uid, 30)
        .then(all => {
          if (cancelled) return;
          setSummaries30(all);
          setStreak(computeStreak(all));
        })
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

  // Tick every 30s so per-entry relative times stay fresh.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // In-app reminder evaluator (toast fallback) + native push scheduling
  useEffect(() => {
    if (!profile || !uid) return;
    const settings = getReminderSettings(profile);
    const tick = () => {
      const events = evaluateReminders(uid, settings, {
        consumed: summary?.consumedProtein ?? 0,
        target: profile.dailyProtein,
      });
      events.forEach(e => toast(e.title, { description: e.body }));
    };
    tick();
    const id = setInterval(tick, 60_000);

    // Native: schedule repeating daily local notifications from the same settings
    (async () => {
      const { isNative, ensureNotificationPermission, scheduleFromSettings, cancelAllReminders } =
        await import('@/lib/native');
      if (!isNative()) return;
      if (!settings.enabled) { await cancelAllReminders(); return; }
      const ok = await ensureNotificationPermission();
      if (!ok) return;
      await scheduleFromSettings(settings);
    })();

    return () => clearInterval(id);
  }, [profile, summary, uid]);

  // Pace — safe to compute even when profile not yet loaded (target=0 → on-pace)
  // Derive consumed from local logs (instant from Firestore cache) instead of
  // waiting on the summary doc round-trip — makes quick-add feel instant.
  const consumed = useMemo(
    () => logs.reduce((s, l) => s + (l.proteinGrams || 0), 0),
    [logs]
  );
  const target = profile?.dailyProtein ?? 0;
  const pace = useMemo(() => computePace(consumed, target, new Date()), [consumed, target]);

  // Paywall tracking (must be declared before any conditional return)
  const showPaywall =
    !!profile && !trialActive && !hasEntitlement && shouldShowPaywall({ uid, logsCount: totalLogs, hasEntitlement });

  useEffect(() => {
    if (showPaywall) track('paywall_viewed', { logs_count: totalLogs, streak, default_plan: 'annual' });
  }, [showPaywall, totalLogs, streak]);

  // ───────── early returns AFTER all hooks ─────────
  if (!profile || !user) return null;

  const remaining = Math.max(0, target - consumed);
  const isToday = viewDate === today;

  const shiftDate = (days: number) => {
    const [y, m, d] = viewDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const next = todayKey(dt);
    if (next > today) return;
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

  const status = (() => {
    if (consumed >= target) {
      return { headline: 'LOCKED IN', sub: 'TARGET HIT.' };
    }
    if (pace.status === 'ahead') {
      return { headline: 'AHEAD OF PACE', sub: "YOU'RE CRUSHING IT. KEEP GOING." };
    }
    if (pace.status === 'behind') {
      const need = Math.max(0, target - consumed);
      return { headline: 'BEHIND', sub: `NEED ${need}G BEFORE 22:00` };
    }
    return { headline: 'ON TRACK', sub: 'STAY CONSISTENT.' };
  })();

  const log = (foodName: string, proteinGrams: number, mealType?: FoodLog['mealType']) => {
    haptic();
    toast.success(`+${proteinGrams}G LOGGED${isToday ? '' : ` · ${dateLabel}`}`, { duration: 1000 });
    setStreakBump(b => b + 1);
    track('food_logged', { grams: proteinGrams, meal: mealType ?? 'unspecified', source: 'manual', is_today: isToday });
    return addLog(user.uid, { foodName, proteinGrams, mealType, date: viewDate }, profile.dailyProtein)
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : 'Failed to log');
      });
  };

  if (showPaywall) {
    return (
      <Suspense fallback={null}>
        <Paywall
          streak={streak}
          onStart={() => {
            track('trial_started', { streak, logs_count: totalLogs });
            startTrial(uid);
            setTrialActive(true);
          }}
          onClose={() => {
            track('paywall_dismissed', { streak, logs_count: totalLogs, source: 'dashboard_free_version' });
            startTrial(uid);
            setTrialActive(true);
          }}
        />
      </Suspense>
    );
  }

  return (
    <motion.div className="screen-container pb-32 relative isolate" variants={stagger} initial="initial" animate="animate">
      <AmbientGrid opacity={0.04} />

      <motion.div variants={fadeUp} className="flex items-center justify-between mb-12 min-w-0 gap-3">
        <h1 className="font-black tracking-[0.15em] font-sans text-3xl truncate">BROTEIN</h1>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/55 mr-1 whitespace-nowrap">
            STREAK · {streak}D <BlinkingCursor className="text-foreground/40" />
          </p>
          <button onClick={() => onNavigate('insights')} className="p-2 border-2 border-foreground active:scale-95 transition-transform" aria-label="Insights">
            <BarChart3 size={20} />
          </button>
          <button onClick={() => onNavigate('profile')} className="p-2 border-2 border-foreground active:scale-95 transition-transform" aria-label="Profile">
            <User size={20} />
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6 min-w-0">
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
          <p className="text-[clamp(4rem,11vw,5.5rem)] font-black font-display leading-none opacity-30" style={{ letterSpacing: '-0.04em' }}>—</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-5 uppercase tracking-[0.2em]">
          REMAINING {isToday ? 'TODAY' : `· ${dateLabel}`}
        </p>
      </motion.div>

      {/* Status — direct, action-based. Pulses when headline changes. Tightly grouped as one unit. */}
      <motion.div
        key={status.headline}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
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
            className="h-full bg-foreground relative overflow-hidden"
            initial={false}
            animate={{ width: `${Math.min(100, target > 0 ? (consumed / target) * 100 : 0)}%` }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {consumed < target && target > 0 && (
              <span
                aria-hidden
                className="absolute inset-y-0 w-1/3 animate-shimmer-sweep motion-reduce:hidden"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, hsl(var(--background) / 0.55) 50%, transparent 100%)',
                }}
              />
            )}
          </motion.div>
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
          transition={{ duration: 0.06 }}
          onClick={() => { haptic(); setShowModal(true); }}
          className="w-full bg-foreground text-background py-3.5 font-display font-black text-sm tracking-[0.12em] mb-2.5 active:opacity-90"
        >
          QUICK ADD +
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.06 }}
          onClick={() => { haptic(); setShowScan(true); }}
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
            transition={{ duration: 0.06 }}
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
          STREAK · {streak} {streak === 1 ? 'DAY' : 'DAYS'} <BlinkingCursor className="text-foreground/40" />
        </p>
      </motion.div>

      {lastEntry && (
        <motion.div variants={fadeUp} className="mb-2">
          <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/55 truncate">
            LAST · {lastEntry.foodName.toUpperCase()} · {lastEntry.proteinGrams}G · {relTime(lastEntry.timestamp, nowTick)}
          </p>
        </motion.div>
      )}

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
                  track('ai_scan_logged', {
                    grams: proteinGrams,
                    ai_grams: ai.proteinGrams,
                    confidence: ai.confidence,
                    edited,
                    meal: mealType ?? 'unspecified',
                  });
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
