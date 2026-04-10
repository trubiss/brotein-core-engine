import { motion } from 'framer-motion';
import { getLogs } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function HistoryScreen({ onBack }: Props) {
  const logs = getLogs();

  const grouped: Record<string, typeof logs> = {};
  logs.forEach(log => {
    if (!grouped[log.date]) grouped[log.date] = [];
    grouped[log.date].push(log);
  });

  const dates = Object.keys(grouped).sort().reverse();

  return (
    <motion.div className="screen-container" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em]">HISTORY</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="card-brutal bg-card mb-10">
        <p className="label-spaced">INSIGHT</p>
        <p className="text-sm leading-relaxed tracking-wide">
          Protein synthesis peaks 3-4 hours post-workout. Prioritize density.
        </p>
      </motion.div>

      {dates.length === 0 ? (
        <motion.p variants={fadeUp} className="text-sm text-muted-foreground py-8 text-center uppercase tracking-[0.15em]">
          No logs yet. Start tracking to see your history.
        </motion.p>
      ) : (
        dates.map(date => (
          <motion.div key={date} variants={fadeUp} className="mb-8">
            <p className="label-spaced mb-3">{formatDate(date)}</p>
            <div className="border-t-2 border-foreground">
              {grouped[date].map(log => (
                <div key={log.id} className="flex justify-between py-4 border-b border-border">
                  <div>
                    <p className="text-sm uppercase tracking-[0.12em]">{log.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold">{log.protein}G</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <span className="label-spaced">
                TOTAL: {grouped[date].reduce((s, l) => s + l.protein, 0)}G
              </span>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

function formatDate(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'TODAY';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'YESTERDAY';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}
