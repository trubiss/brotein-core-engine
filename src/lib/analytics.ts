import { DailySummary, todayKey } from './types';

export interface Analytics {
  weeklyAvg: number;
  weeklyHitPct: number;
  weeklyConsistency: { date: string; consumed: number; target: number; hit: boolean }[];
  monthlyAdherence: number; // % of days hitting target over last 30 days
  trend: 'improving' | 'stable' | 'declining';
  bestStreak: number;
  totalHitDays: number;
  totalTrackedDays: number;
  overallHitPct: number;
}

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(todayKey(d));
    d.setDate(d.getDate() - 1);
  }
  return out;
}

export function computeAnalytics(summaries: DailySummary[], target: number): Analytics {
  const map = new Map(summaries.map(s => [s.date, s]));

  const last7 = lastNDates(7);
  const weeklyConsistency = last7.map(date => {
    const s = map.get(date);
    return {
      date,
      consumed: s?.consumedProtein ?? 0,
      target: s?.targetProtein ?? target,
      hit: !!s?.hitTarget,
    };
  }).reverse(); // oldest -> newest for visual

  const weekConsumed = weeklyConsistency.map(d => d.consumed);
  const weeklyAvg = Math.round(weekConsumed.reduce((a, b) => a + b, 0) / 7);
  const weeklyHitDays = weeklyConsistency.filter(d => d.hit).length;
  const weeklyHitPct = Math.round((weeklyHitDays / 7) * 100);

  const last30 = lastNDates(30);
  const monthlyHits = last30.filter(d => map.get(d)?.hitTarget).length;
  const monthlyAdherence = Math.round((monthlyHits / 30) * 100);

  // Trend: compare last 7 days avg vs prior 7 days avg
  const prior7 = lastNDates(14).slice(7);
  const priorAvg = prior7.reduce((sum, d) => sum + (map.get(d)?.consumedProtein ?? 0), 0) / 7;
  let trend: Analytics['trend'] = 'stable';
  const diff = weeklyAvg - priorAvg;
  const pct = priorAvg > 0 ? (diff / priorAvg) * 100 : (weeklyAvg > 0 ? 100 : 0);
  if (pct > 10) trend = 'improving';
  else if (pct < -10) trend = 'declining';

  // Best streak across all summaries (sorted by date ascending)
  const sorted = [...summaries].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let cur = 0;
  let prevDate: Date | null = null;
  for (const s of sorted) {
    const d = new Date(s.date + 'T00:00:00');
    if (!s.hitTarget) {
      cur = 0;
      prevDate = d;
      continue;
    }
    if (prevDate) {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
      cur = diffDays === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    if (cur > best) best = cur;
    prevDate = d;
  }

  const trackedDays = summaries.length;
  const hitDays = summaries.filter(s => s.hitTarget).length;
  const overallHitPct = trackedDays > 0 ? Math.round((hitDays / trackedDays) * 100) : 0;

  return {
    weeklyAvg,
    weeklyHitPct,
    weeklyConsistency,
    monthlyAdherence,
    trend,
    bestStreak: best,
    totalHitDays: hitDays,
    totalTrackedDays: trackedDays,
    overallHitPct,
  };
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  progress?: string;
}

export function computeAchievements(opts: {
  currentStreak: number;
  bestStreak: number;
  totalHitDays: number;
  overallHitPct: number;
}): Achievement[] {
  const { currentStreak, bestStreak, totalHitDays, overallHitPct } = opts;
  const milestones: { id: string; label: string; days: number }[] = [
    { id: 'first', label: 'FIRST DAY HIT', days: 1 },
    { id: 's3', label: '3-DAY STREAK', days: 3 },
    { id: 's7', label: '7-DAY STREAK', days: 7 },
    { id: 's14', label: '14-DAY STREAK', days: 14 },
    { id: 's30', label: '30-DAY STREAK', days: 30 },
  ];
  const achievements: Achievement[] = milestones.map(m => ({
    id: m.id,
    label: m.label,
    description: m.days === 1 ? 'Hit your protein target once' : `Hit your target ${m.days} days in a row`,
    unlocked: bestStreak >= m.days || (m.days === 1 && totalHitDays >= 1),
    progress: bestStreak >= m.days ? 'UNLOCKED' : `${Math.min(bestStreak, m.days)}/${m.days}`,
  }));

  achievements.push({
    id: 'best',
    label: 'BEST STREAK',
    description: 'Your longest consecutive run',
    unlocked: bestStreak > 0,
    progress: `${bestStreak} DAYS`,
  });

  achievements.push({
    id: 'hitpct',
    label: 'TARGET HIT %',
    description: 'Lifetime adherence rate',
    unlocked: overallHitPct >= 50,
    progress: `${overallHitPct}%`,
  });

  return achievements;
}
