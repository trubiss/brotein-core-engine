import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { addLog, watchLogsForDate, watchSummary, watchAllSummaries, computeStreak, updateLog, deleteLog } from '@/lib/firestore';
import { todayKey, FoodLog, DailySummary } from '@/lib/types';
import { getSuggestions } from '@/lib/suggestions';
import { evaluateReminders, getReminderSettings } from '@/lib/reminders';
import QuickLogModal from './QuickLogModal';
import ProteinPace from './ProteinPace';
import FoodScanModal from './FoodScanModal';
import SwipeableLogRow from './SwipeableLogRow';
import { User, Plus, BarChart3, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (page: 'history' | 'profile' | 'insights') => void;
}

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function Dashboard({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [today, setToday] = useState(todayKey());
  const [viewDate, setViewDate] = useState(todayKey());
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [streak, setStreak] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [editing, setEditing] = useState<FoodLog | null>(null);

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
    const u1 = watchLogsForDate(user.uid, viewDate, setLogs);
    const u2 = watchSummary(user.uid, viewDate, setSummary);
    const u3 = watchAllSummaries(user.uid, all => setStreak(computeStreak(all)));
    return () => { u1(); u2(); u3(); };
  }, [user, viewDate]);

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
  const progress = Math.min(100, (consumed / target) * 100);
  const suggestions = getSuggestions(remaining);

  const log = async (foodName: string, proteinGrams: number, mealType?: FoodLog['mealType']) => {
    try {
      await addLog(user.uid, { foodName, proteinGrams, mealType }, viewDate);
      toast.success(`+${proteinGrams}G LOGGED${isToday ? '' : ` · ${dateLabel}`}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to log');
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteLog(user.uid, id); toast.success('DELETED'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Delete failed'); }
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

      <motion.div variants={fadeUp} className="mb-4 min-w-0">
        <p className="label-spaced">FUEL STATUS</p>
        <p className="text-7xl font-black font-display tracking-tighter leading-none mt-2">{remaining}g</p>
        <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-[0.25em]">REMAINING TODAY</p>
        {logs.length === 0 && (
          <div className="mt-4 border-2 border-foreground p-3">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold">NO LOGS YET TODAY</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-1">ADD YOUR FIRST MEAL TO GET STARTED</p>
          </div>
        )}
      </motion.div>

      <div className="section-divider" />

      <motion.div variants={fadeUp} className="card-brutal mb-4">
        <div className="flex justify-between items-baseline mb-6 gap-2 min-w-0">
          <p className="label-spaced mb-0 truncate">PROGRESS</p>
          <p className="font-display text-sm font-bold whitespace-nowrap">{consumed} / {target}G</p>
        </div>
        <div className="progress-bar-track mb-4">
          <motion.div
            className="progress-bar-fill"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <span>{remaining}G REMAINING</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-8">
          <button className="btn-primary w-full" onClick={() => setShowModal(true)}>
            QUICK ADD +
          </button>
        </div>
        <button
          className="w-full mt-2 bg-background text-foreground px-4 py-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform border-2 border-foreground"
          onClick={() => setShowScan(true)}
        >
          <Camera size={16} strokeWidth={2.5} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase font-display">SCAN FOOD WITH AI</span>
        </button>
      </motion.div>

      {suggestions.length > 0 && (
        <>
          <div className="section-divider" />
          <motion.div variants={fadeUp}>
            <p className="label-spaced">SMART SUGGESTIONS</p>
            <div className="border-t-2 border-foreground">
              {suggestions.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-3 py-3 border-b border-border min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm uppercase tracking-[0.12em] truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider">~{s.protein}G PROTEIN</p>
                  </div>
                  <button
                    onClick={() => log(s.name, s.protein)}
                    className="border-2 border-foreground px-3 py-1.5 text-[10px] font-bold tracking-widest active:scale-95 transition-transform shrink-0"
                  >
                    +{s.protein}G
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      <div className="section-divider" />

      <ProteinPace logs={logs} consumed={consumed} target={target} />

      <div className="section-divider" />

      <motion.div variants={fadeUp} className="mb-4">
        <p className="label-spaced">CURRENT STREAK</p>
        {streak > 0 ? (
          <p className="text-4xl font-black font-display mb-6">{streak} DAYS</p>
        ) : (
          <p className="text-sm font-bold uppercase tracking-[0.15em] mb-6">LOG TODAY TO START YOUR STREAK 🔥</p>
        )}
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`day-box ${i < streak ? 'day-box-filled' : ''}`}>
              {i < streak ? '✓' : ''}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="section-divider" />

      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex justify-between items-center mb-6 gap-2 min-w-0">
          <p className="label-spaced mb-0 truncate">TODAY TIMELINE</p>
          <button
            className="text-[10px] font-display tracking-[0.2em] font-bold uppercase border-b-2 border-foreground pb-0.5 active:opacity-60 shrink-0"
            onClick={() => onNavigate('history')}
          >
            VIEW ALL
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="border-t-2 border-foreground py-10 text-center">
            <p className="text-sm uppercase tracking-[0.15em] mb-2">NO PROTEIN LOGGED TODAY</p>
            <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mb-6">ADD YOUR FIRST INTAKE</p>
            <button className="btn-outline" onClick={() => setShowModal(true)}>+ ADD FIRST LOG</button>
          </div>
        ) : (
          <div className="border-t-2 border-foreground">
            {[...logs].sort((a, b) => a.timestamp - b.timestamp).map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="flex items-start gap-3 py-4 border-b border-border min-w-0"
              >
                <span className="font-display text-[11px] font-bold whitespace-nowrap pt-0.5 w-12 shrink-0">
                  {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm uppercase tracking-[0.12em] truncate">{l.foodName}</p>
                  {l.mealType && (
                    <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-0.5">{l.mealType}</p>
                  )}
                </div>
                <span className="font-display text-sm font-bold whitespace-nowrap shrink-0">{l.proteinGrams}G</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Floating + */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-foreground text-background border-2 border-foreground flex items-center justify-center active:scale-95 transition-transform shadow-lg"
        aria-label="Add log"
      >
        <Plus size={24} strokeWidth={3} />
      </button>

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
                source: 'ai-scan',
                aiDetectedName: ai.foodName,
                aiEstimatedGrams: ai.proteinGrams,
                aiConfidence: ai.confidence,
                aiPortion: ai.portion,
                aiEdited: edited,
              });
              toast.success(`+${proteinGrams}G LOGGED · AI SCAN`);
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : 'Failed to log');
            }
          }}
        />
      )}
    </motion.div>
  );
}
