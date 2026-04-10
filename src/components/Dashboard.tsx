import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getProfile, getTodayProtein, getTodayLogs, getStreak, addLog } from '@/lib/store';
import QuickLogModal from './QuickLogModal';
import { User } from 'lucide-react';

interface Props {
  onNavigate: (page: 'history' | 'profile') => void;
}

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function Dashboard({ onNavigate }: Props) {
  const profile = getProfile()!;
  const [todayProtein, setTodayProtein] = useState(getTodayProtein());
  const [todayLogs, setTodayLogs] = useState(getTodayLogs());
  const [showModal, setShowModal] = useState(false);
  const [streak, setStreak] = useState(getStreak());
  const currentDateRef = useRef(new Date().toISOString().split('T')[0]);
  const remaining = Math.max(0, profile.dailyProtein - todayProtein);
  const progress = Math.min(100, (todayProtein / profile.dailyProtein) * 100);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString().split('T')[0];
      if (now !== currentDateRef.current) {
        currentDateRef.current = now;
        setTodayProtein(getTodayProtein());
        setTodayLogs(getTodayLogs());
        setStreak(getStreak());
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLog = (name: string, protein: number) => {
    addLog({ name, protein });
    setTodayProtein(getTodayProtein());
    setTodayLogs(getTodayLogs());
    setStreak(getStreak());
    setShowModal(false);
  };

  return (
    <motion.div className="screen-container" variants={stagger} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-14">
        <h1 className="text-2xl font-black tracking-[0.15em]">BROTEIN</h1>
        <button onClick={() => onNavigate('profile')} className="p-2 border-2 border-foreground active:scale-95 transition-transform">
          <User size={20} />
        </button>
      </motion.div>

      {/* Fuel Status */}
      <motion.div variants={fadeUp} className="mb-4">
        <p className="label-spaced">FUEL STATUS</p>
        <p className="text-7xl font-black font-display tracking-tighter leading-none mt-2">{remaining}g</p>
        <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-[0.25em]">REMAINING TODAY</p>
      </motion.div>

      <div className="section-divider" />

      {/* Progress Card */}
      <motion.div variants={fadeUp} className="card-brutal mb-4">
        <div className="flex justify-between items-baseline mb-6">
          <p className="label-spaced mb-0">PROGRESS</p>
          <p className="font-display text-sm font-bold">{todayProtein} / {profile.dailyProtein}G</p>
        </div>
        <div className="progress-bar-track mb-4">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <span>{remaining}G REMAINING</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <button className="btn-primary mt-8" onClick={() => setShowModal(true)}>
          QUICK ADD +
        </button>
      </motion.div>

      <div className="section-divider" />

      {/* Streak */}
      <motion.div variants={fadeUp} className="mb-4">
        <p className="label-spaced">CURRENT STREAK</p>
        <p className="text-4xl font-black font-display mb-6">{streak} DAYS</p>
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`day-box ${i < streak ? 'day-box-filled' : ''}`}>
              {i < streak ? '✓' : ''}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="section-divider" />

      {/* Recent Logs */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex justify-between items-center mb-6">
          <p className="label-spaced mb-0">RECENT LOGS</p>
          <button
            className="text-[10px] font-display tracking-[0.2em] font-bold uppercase border-b-2 border-foreground pb-0.5 active:opacity-60 transition-opacity"
            onClick={() => onNavigate('history')}
          >
            VIEW ALL
          </button>
        </div>
        {todayLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 border-t-2 border-border uppercase tracking-[0.15em]">
            No logs yet today
          </p>
        ) : (
          <div className="border-t-2 border-foreground">
            {todayLogs.slice(0, 3).map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex justify-between py-4 border-b border-border"
              >
                <span className="text-sm uppercase tracking-[0.12em]">{log.name}</span>
                <span className="font-display text-sm font-bold">{log.protein}G</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="section-divider" />

      {/* Insight */}
      <motion.div variants={fadeUp} className="card-brutal">
        <p className="label-spaced">INSIGHT</p>
        <p className="text-sm leading-relaxed tracking-wide">
          Protein synthesis peaks 3-4 hours post-workout. Prioritize density.
        </p>
      </motion.div>

      {showModal && (
        <QuickLogModal onLog={handleLog} onClose={() => setShowModal(false)} />
      )}
    </motion.div>
  );
}
