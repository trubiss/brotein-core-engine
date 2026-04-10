import { useState } from 'react';
import { getProfile, getTodayProtein, getTodayLogs, getStreak, addLog } from '@/lib/store';
import QuickLogModal from './QuickLogModal';
import { User } from 'lucide-react';

interface Props {
  onNavigate: (page: 'history' | 'profile') => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const profile = getProfile()!;
  const [todayProtein, setTodayProtein] = useState(getTodayProtein());
  const [todayLogs, setTodayLogs] = useState(getTodayLogs());
  const [showModal, setShowModal] = useState(false);
  const streak = getStreak();
  const remaining = Math.max(0, profile.dailyProtein - todayProtein);
  const progress = Math.min(100, (todayProtein / profile.dailyProtein) * 100);

  const handleLog = (name: string, protein: number) => {
    addLog({ name, protein });
    setTodayProtein(getTodayProtein());
    setTodayLogs(getTodayLogs());
    setShowModal(false);
  };

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-2xl font-bold tracking-[0.15em]">BROTEIN</h1>
        <button onClick={() => onNavigate('profile')} className="p-2 border-2 border-foreground">
          <User size={20} />
        </button>
      </div>

      {/* Fuel Status */}
      <div className="mb-4">
        <p className="label-spaced">FUEL STATUS</p>
        <p className="text-7xl font-black font-display tracking-tighter">{remaining}g</p>
        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">remaining today</p>
      </div>

      <div className="section-divider" />

      {/* Progress Card */}
      <div className="card-brutal mb-4">
        <div className="flex justify-between items-baseline mb-6">
          <p className="label-spaced mb-0">PROGRESS</p>
          <p className="font-display text-sm font-bold">{todayProtein} / {profile.dailyProtein}g</p>
        </div>
        <div className="progress-bar-track mb-4">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
          <span>{remaining}g remaining</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <button className="btn-primary mt-8" onClick={() => setShowModal(true)}>
          QUICK ADD +
        </button>
      </div>

      <div className="section-divider" />

      {/* Streak */}
      <div className="mb-4">
        <p className="label-spaced">CURRENT STREAK</p>
        <p className="text-4xl font-black font-display mb-6">{streak} DAYS</p>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`day-box ${i < streak ? 'day-box-filled' : ''}`}>
              {i < streak ? '✓' : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider" />

      {/* Recent Logs */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-6">
          <p className="label-spaced mb-0">RECENT LOGS</p>
          <button
            className="text-[10px] font-display tracking-[0.2em] font-bold uppercase border-b-2 border-foreground pb-0.5"
            onClick={() => onNavigate('history')}
          >
            VIEW ALL
          </button>
        </div>
        {todayLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 border-t-2 border-border uppercase tracking-wider">
            No logs yet today
          </p>
        ) : (
          <div className="border-t-2 border-foreground">
            {todayLogs.slice(0, 3).map(log => (
              <div key={log.id} className="flex justify-between py-4 border-b border-border">
                <span className="text-sm uppercase tracking-wider">{log.name}</span>
                <span className="font-display text-sm font-bold">{log.protein}g</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-divider" />

      {/* Insight */}
      <div className="card-brutal">
        <p className="label-spaced">INSIGHT</p>
        <p className="text-sm leading-relaxed tracking-wide">
          Protein synthesis peaks 3-4 hours post-workout. Prioritize density.
        </p>
      </div>

      {showModal && (
        <QuickLogModal onLog={handleLog} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
