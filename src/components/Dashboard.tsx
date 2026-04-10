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
      <div className="mb-8">
        <p className="label-spaced">Fuel Status</p>
        <p className="text-6xl font-bold font-display tracking-tight">{remaining}g</p>
        <p className="text-sm text-muted-foreground mt-1">remaining today</p>
      </div>

      {/* Progress Card */}
      <div className="card-brutal mb-8">
        <div className="flex justify-between items-baseline mb-4">
          <p className="label-spaced mb-0">Progress</p>
          <p className="font-display text-sm font-bold">{todayProtein} / {profile.dailyProtein}g</p>
        </div>
        <div className="progress-bar-track mb-4">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remaining}g remaining</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <button className="btn-primary mt-6" onClick={() => setShowModal(true)}>
          QUICK ADD +
        </button>
      </div>

      {/* Streak */}
      <div className="mb-8">
        <p className="label-spaced">Current Streak</p>
        <p className="text-3xl font-bold font-display mb-4">{streak} days</p>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`day-box ${i < streak ? 'day-box-filled' : ''}`}>
              {i < streak ? '✓' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <p className="label-spaced mb-0">Recent Logs</p>
          <button
            className="text-xs font-display tracking-widest underline"
            onClick={() => onNavigate('history')}
          >
            VIEW ALL
          </button>
        </div>
        {todayLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 border-t border-border">
            No logs yet today
          </p>
        ) : (
          <div className="border-t border-border">
            {todayLogs.slice(0, 3).map(log => (
              <div key={log.id} className="flex justify-between py-3 border-b border-border">
                <span className="text-sm">{log.name}</span>
                <span className="font-display text-sm font-bold">{log.protein}g</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insight */}
      <div className="card-brutal bg-card">
        <p className="label-spaced">Insight</p>
        <p className="text-sm leading-relaxed">
          Protein synthesis peaks 3-4 hours post-workout. Prioritize density.
        </p>
      </div>

      {showModal && (
        <QuickLogModal onLog={handleLog} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
