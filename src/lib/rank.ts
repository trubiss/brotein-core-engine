import { DailySummary } from './types';

export type Rank = 'F' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface RankTier {
  rank: Rank;
  label: string;
  min: number; // inclusive lower bound on 0–100 score
  next: Rank | null;
}

export const RANK_TIERS: RankTier[] = [
  { rank: 'F', label: 'BEGINNER',    min: 0,  next: 'D' },
  { rank: 'D', label: 'CONSISTENT',  min: 40, next: 'C' },
  { rank: 'C', label: 'DISCIPLINED', min: 55, next: 'B' },
  { rank: 'B', label: 'ADVANCED',    min: 70, next: 'A' },
  { rank: 'A', label: 'ELITE',       min: 85, next: 'S' },
  { rank: 'S', label: 'LOCKED IN',   min: 95, next: null },
];

export function tierFor(rank: Rank): RankTier {
  return RANK_TIERS.find(t => t.rank === rank)!;
}

export function rankForScore(score: number): Rank {
  let current: Rank = 'F';
  for (const t of RANK_TIERS) {
    if (score >= t.min) current = t.rank;
  }
  return current;
}

export interface RankBreakdown {
  score: number;          // 0–100
  rank: Rank;
  label: string;
  hitRate: number;        // 0–1
  avgCompletion: number;  // 0–1
  daysWithData: number;
  daysHit: number;
}

/**
 * Score components:
 *   hitRate         × 60   (consistency of fully-hit days)
 *   avgCompletion   × 30   (how close to target on average)
 *   streakBoost     × 10   (recent momentum, capped at 14d)
 * Total: 0–100.
 */
export function computeRankScore(summaries: DailySummary[], streak: number): RankBreakdown {
  const usable = summaries.filter(s => (s.targetProtein ?? 0) > 0).slice(0, 30);
  const daysWithData = usable.length;

  if (daysWithData === 0) {
    return { score: 0, rank: 'F', label: 'BEGINNER', hitRate: 0, avgCompletion: 0, daysWithData: 0, daysHit: 0 };
  }

  const daysHit = usable.filter(s => s.hitTarget).length;
  const hitRate = daysHit / daysWithData;
  const avgCompletion =
    usable.reduce((acc, s) => acc + Math.min(1, (s.consumedProtein || 0) / s.targetProtein), 0) /
    daysWithData;
  const streakBoost = Math.min(streak, 14) / 14;

  const score = Math.round(hitRate * 60 + avgCompletion * 30 + streakBoost * 10);
  const rank = rankForScore(score);
  return { score, rank, label: tierFor(rank).label, hitRate, avgCompletion, daysWithData, daysHit };
}

export interface NextRankProgress {
  pctOfTier: number;     // 0–100, within current tier toward next
  pointsToNext: number;  // remaining points to next.min
  nextRank: Rank | null;
  nextLabel: string | null;
}

export function progressToNext(score: number, rank: Rank): NextRankProgress {
  const tier = tierFor(rank);
  if (!tier.next) {
    return { pctOfTier: 100, pointsToNext: 0, nextRank: null, nextLabel: null };
  }
  const next = tierFor(tier.next);
  const span = next.min - tier.min;
  const into = Math.max(0, Math.min(span, score - tier.min));
  const pct = span === 0 ? 100 : Math.round((into / span) * 100);
  return {
    pctOfTier: pct,
    pointsToNext: Math.max(0, next.min - score),
    nextRank: next.rank,
    nextLabel: next.label,
  };
}

const startRankKey = (uid: string) => `brotein_start_rank:${uid}`;

/**
 * START rank — the user's earliest measurable rank, snapshotted once they
 * have ≥7 days of data so it stays stable as the window moves forward.
 * Returns null when there isn't enough history yet.
 */
export function getOrSnapshotStartRank(
  uid: string,
  summaries: DailySummary[],
): { rank: Rank; label: string } | null {
  if (!uid || typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(startRankKey(uid));
    if (cached) {
      const parsed = JSON.parse(cached) as { rank: Rank };
      if (parsed?.rank) return { rank: parsed.rank, label: tierFor(parsed.rank).label };
    }
  } catch { /* noop */ }

  const usable = summaries.filter(s => (s.targetProtein ?? 0) > 0);
  if (usable.length < 7) return null;

  // Oldest 7 days (summaries arrive newest-first from Firestore).
  const oldest = usable.slice(-7);
  const breakdown = computeRankScore(oldest, 0);
  try {
    localStorage.setItem(startRankKey(uid), JSON.stringify({ rank: breakdown.rank }));
  } catch { /* noop */ }
  return { rank: breakdown.rank, label: breakdown.label };
}
