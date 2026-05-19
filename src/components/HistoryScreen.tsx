import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { watchAllLogs, deleteLog, updateLog } from '@/lib/firestore';
import { FoodLog, MealType } from '@/lib/types';
import { ArrowLeft, Search } from 'lucide-react';
import QuickLogModal from './QuickLogModal';
import SwipeableLogRow from './SwipeableLogRow';
import { toast } from 'sonner';
import { AmbientGrid } from './ui/AmbientGrid';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

const MEAL_FILTERS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'breakfast', label: 'BFAST' },
  { value: 'lunch', label: 'LUNCH' },
  { value: 'dinner', label: 'DINNER' },
  { value: 'snack', label: 'SNACK' },
];

export default function HistoryScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [editing, setEditing] = useState<FoodLog | null>(null);
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');

  useEffect(() => {
    if (!user) return;
    return watchAllLogs(user.uid, setLogs);
  }, [user]);

  // Stats from full dataset (unfiltered)
  const stats = useMemo(() => {
    const byName = new Map<string, { name: string; count: number; total: number; max: number }>();
    for (const l of logs) {
      const key = l.foodName.toLowerCase();
      const existing = byName.get(key) ?? { name: l.foodName, count: 0, total: 0, max: 0 };
      existing.count += 1;
      existing.total += l.proteinGrams;
      existing.max = Math.max(existing.max, l.proteinGrams);
      byName.set(key, existing);
    }
    const arr = Array.from(byName.values());
    const mostLogged = [...arr].sort((a, b) => b.count - a.count).slice(0, 5);
    const highestProtein = [...arr].sort((a, b) => b.max - a.max).slice(0, 5);
    return { mostLogged, highestProtein };
  }, [logs]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return logs.filter(l => {
      if (mealFilter !== 'all' && l.mealType !== mealFilter) return false;
      if (s && !l.foodName.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [logs, search, mealFilter]);

  if (!user) return null;

  const grouped: Record<string, FoodLog[]> = {};
  filtered.forEach(l => { (grouped[l.date] ||= []).push(l); });
  const dates = Object.keys(grouped).sort().reverse();

  const handleDelete = async (id: string) => {
    try { await deleteLog(user.uid, id); toast.success('DELETED'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Delete failed'); }
  };

  return (
    <motion.div className="screen-container pb-12 relative isolate" variants={stagger} initial="initial" animate="animate">
      <AmbientGrid opacity={0.035} />
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8 min-w-0">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em] truncate">HISTORY</h1>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            className="input-underline pl-7"
            placeholder="Search logged foods..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Meal filter */}
      <motion.div variants={fadeUp} className="mb-8">
        <p className="label-spaced">FILTER BY MEAL</p>
        <div className="grid grid-cols-5 gap-1">
          {MEAL_FILTERS.map(m => (
            <button
              key={m.value}
              onClick={() => setMealFilter(m.value)}
              className={`p-2 border-2 text-[10px] font-bold tracking-widest ${
                mealFilter === m.value ? 'border-foreground bg-foreground text-background' : 'border-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats: most logged + highest protein (only when no search/filter active to keep it relevant) */}
      {logs.length > 0 && (
        <>
          <motion.div variants={fadeUp} className="mb-8">
            <p className="label-spaced">MOST LOGGED FOODS</p>
            <div className="border-t-2 border-foreground">
              {stats.mostLogged.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-3 py-3 border-b border-border min-w-0">
                  <p className="text-sm uppercase tracking-[0.12em] truncate">{s.name}</p>
                  <span className="font-display text-xs font-bold whitespace-nowrap">×{s.count} · {s.total}G</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-10">
            <p className="label-spaced">HIGHEST PROTEIN FOODS</p>
            <div className="border-t-2 border-foreground">
              {stats.highestProtein.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-3 py-3 border-b border-border min-w-0">
                  <p className="text-sm uppercase tracking-[0.12em] truncate">{s.name}</p>
                  <span className="font-display text-xs font-bold whitespace-nowrap">{s.max}G MAX</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Logs */}
      <motion.div variants={fadeUp} className="mb-2">
        <p className="label-spaced">LOG ENTRIES</p>
        <p className="text-[9px] text-muted-foreground tracking-[0.25em] uppercase">
          TAP TO EDIT · SWIPE LEFT TO DELETE
        </p>
      </motion.div>

      {dates.length === 0 ? (
        <motion.div variants={fadeUp} className="border-t-2 border-foreground py-16 text-center">
          <p className="text-sm uppercase tracking-[0.15em] mb-2">
            {logs.length === 0 ? 'NO HISTORY YET' : 'NO MATCHES'}
          </p>
          <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
            {logs.length === 0 ? 'START TRACKING TO BUILD YOUR RECORD' : 'TRY A DIFFERENT SEARCH OR FILTER'}
          </p>
        </motion.div>
      ) : (
        dates.map(date => {
          const dayLogs = grouped[date];
          const total = dayLogs.reduce((s, l) => s + l.proteinGrams, 0);
          return (
            <motion.div key={date} variants={fadeUp} className="mb-10">
              <div className="flex justify-between items-baseline mb-3 min-w-0">
                <p className="label-spaced mb-0 truncate">{formatDate(date)}</p>
                <p className="label-spaced mb-0 whitespace-nowrap">{total}G TOTAL</p>
              </div>
              <div className="border-t-2 border-foreground">
                {dayLogs.map(log => (
                  <SwipeableLogRow
                    key={log.id}
                    onTap={() => setEditing(log)}
                    onDelete={() => handleDelete(log.id)}
                  >
                    <div className="flex items-center justify-between gap-3 py-4 px-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm uppercase tracking-[0.12em] truncate">{log.foodName}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {log.mealType ? ` · ${log.mealType.toUpperCase()}` : ''}
                        </p>
                      </div>
                      <span className="font-display text-sm font-bold whitespace-nowrap">{log.proteinGrams}G</span>
                    </div>
                  </SwipeableLogRow>
                ))}
              </div>
            </motion.div>
          );
        })
      )}

      {editing && (
        <QuickLogModal
          title="EDIT LOG"
          submitLabel="SAVE"
          initial={{ foodName: editing.foodName, proteinGrams: editing.proteinGrams, mealType: editing.mealType }}
          onSubmit={async ({ foodName, proteinGrams, mealType }) => {
            try {
              await updateLog(user.uid, editing.id, { foodName, proteinGrams, mealType });
              toast.success('Updated');
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : 'Update failed');
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </motion.div>
  );
}

function formatDate(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}
