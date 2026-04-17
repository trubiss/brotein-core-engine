import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { watchAllLogs, deleteLog, updateLog } from '@/lib/firestore';
import { FoodLog } from '@/lib/types';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import QuickLogModal from './QuickLogModal';
import { toast } from 'sonner';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function HistoryScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [editing, setEditing] = useState<FoodLog | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchAllLogs(user.uid, setLogs);
  }, [user]);

  if (!user) return null;

  const grouped: Record<string, FoodLog[]> = {};
  logs.forEach(l => {
    (grouped[l.date] ||= []).push(l);
  });
  const dates = Object.keys(grouped).sort().reverse();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this log?')) return;
    try { await deleteLog(user.uid, id); toast.success('Deleted'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Delete failed'); }
  };

  return (
    <motion.div className="screen-container" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-10 min-w-0">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em] truncate">HISTORY</h1>
      </motion.div>

      {dates.length === 0 ? (
        <motion.div variants={fadeUp} className="border-t-2 border-foreground py-16 text-center">
          <p className="text-sm uppercase tracking-[0.15em] mb-2">NO HISTORY YET</p>
          <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">START TRACKING TO BUILD YOUR RECORD</p>
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
                  <div key={log.id} className="flex items-center justify-between gap-3 py-4 border-b border-border min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm uppercase tracking-[0.12em] truncate">{log.foodName}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {log.mealType ? ` · ${log.mealType.toUpperCase()}` : ''}
                      </p>
                    </div>
                    <span className="font-display text-sm font-bold whitespace-nowrap">{log.proteinGrams}G</span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing(log)} className="p-2 border-2 border-foreground active:scale-95" aria-label="Edit"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(log.id)} className="p-2 border-2 border-foreground active:scale-95" aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
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
