import { getLogs } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function HistoryScreen({ onBack }: Props) {
  const logs = getLogs();

  // Group by date
  const grouped: Record<string, typeof logs> = {};
  logs.forEach(log => {
    if (!grouped[log.date]) grouped[log.date] = [];
    grouped[log.date].push(log);
  });

  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="screen-container">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 border-2 border-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-[0.1em]">HISTORY</h1>
      </div>

      {/* Insight */}
      <div className="card-brutal bg-card mb-8">
        <p className="label-spaced">Insight</p>
        <p className="text-sm leading-relaxed">
          Protein synthesis peaks 3-4 hours post-workout. Prioritize density.
        </p>
      </div>

      {dates.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No logs yet. Start tracking to see your history.
        </p>
      ) : (
        dates.map(date => (
          <div key={date} className="mb-6">
            <p className="label-spaced mb-2">{formatDate(date)}</p>
            <div className="border-t border-border">
              {grouped[date].map(log => (
                <div key={log.id} className="flex justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm">{log.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold">{log.protein}g</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <span className="label-spaced">
                Total: {grouped[date].reduce((s, l) => s + l.protein, 0)}g
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
