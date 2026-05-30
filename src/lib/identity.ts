import { DailySummary } from './types';

export type Identity =
  | 'UNRELIABLE'
  | 'CONSISTENT'
  | 'DISCIPLINED'
  | 'COMMITTED'
  | 'ELITE'
  | 'LOCKED_IN';

export interface IdentityTier {
  id: Identity;
  label: string;
  min: number;
  next: Identity | null;
}

export const IDENTITY_TIERS: IdentityTier[] = [
  { id: 'UNRELIABLE',  label: 'UNRELIABLE',  min: 0,  next: 'CONSISTENT' },
  { id: 'CONSISTENT',  label: 'CONSISTENT',  min: 40, next: 'DISCIPLINED' },
  { id: 'DISCIPLINED', label: 'DISCIPLINED', min: 55, next: 'COMMITTED' },
  { id: 'COMMITTED',   label: 'COMMITTED',   min: 70, next: 'ELITE' },
  { id: 'ELITE',       label: 'ELITE',       min: 85, next: 'LOCKED_IN' },
  { id: 'LOCKED_IN',   label: 'LOCKED IN',   min: 95, next: null },
];

export function tierFor(id: Identity): IdentityTier {
  return IDENTITY_TIERS.find(t => t.id === id)!;
}

export function tierIndex(id: Identity): number {
  return IDENTITY_TIERS.findIndex(t => t.id === id);
}

export function identityForScore(score: number): Identity {
  let current: Identity = 'UNRELIABLE';
  for (const t of IDENTITY_TIERS) if (score >= t.min) current = t.id;
  return current;
}

export interface IdentityBreakdown {
  score: number;
  identity: Identity;
  label: string;
  hitRate: number;
  avgCompletion: number;
  daysWithData: number;
  daysHit: number;
}

export function computeIdentityScore(
  summaries: DailySummary[],
  streak: number,
): IdentityBreakdown {
  const usable = summaries.filter(s => (s.targetProtein ?? 0) > 0).slice(0, 30);
  const daysWithData = usable.length;

  if (daysWithData === 0) {
    return {
      score: 0, identity: 'UNRELIABLE', label: 'UNRELIABLE',
      hitRate: 0, avgCompletion: 0, daysWithData: 0, daysHit: 0,
    };
  }

  const daysHit = usable.filter(s => s.hitTarget).length;
  const hitRate = daysHit / daysWithData;
  const avgCompletion =
    usable.reduce((acc, s) => acc + Math.min(1, (s.consumedProtein || 0) / s.targetProtein), 0) /
    daysWithData;
  const streakBoost = Math.min(streak, 14) / 14;
  const score = Math.round(hitRate * 60 + avgCompletion * 30 + streakBoost * 10);
  const identity = identityForScore(score);
  return { score, identity, label: tierFor(identity).label, hitRate, avgCompletion, daysWithData, daysHit };
}

export interface NextProgress {
  pctOfTier: number;
  pointsToNext: number;
  nextId: Identity | null;
  nextLabel: string | null;
}

export function progressToNext(score: number, id: Identity): NextProgress {
  const tier = tierFor(id);
  if (!tier.next) return { pctOfTier: 100, pointsToNext: 0, nextId: null, nextLabel: null };
  const next = tierFor(tier.next);
  const span = next.min - tier.min;
  const into = Math.max(0, Math.min(span, score - tier.min));
  const pct = span === 0 ? 100 : Math.round((into / span) * 100);
  return { pctOfTier: pct, pointsToNext: Math.max(0, next.min - score), nextId: next.id, nextLabel: next.label };
}

const startKey = (uid: string) => `brotein_start_identity:${uid}`;
const legacyRankKey = (uid: string) => `brotein_start_rank:${uid}`;

const LEGACY_MAP: Record<string, Identity> = {
  F: 'UNRELIABLE', D: 'CONSISTENT', C: 'DISCIPLINED',
  B: 'COMMITTED',  A: 'ELITE',      S: 'LOCKED_IN',
};

export function getOrSnapshotStartIdentity(
  uid: string,
  summaries: DailySummary[],
): { id: Identity; label: string } | null {
  if (!uid || typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(startKey(uid));
    if (cached) {
      const parsed = JSON.parse(cached) as { id?: Identity };
      if (parsed?.id) return { id: parsed.id, label: tierFor(parsed.id).label };
    }
    const legacy = localStorage.getItem(legacyRankKey(uid));
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as { rank?: string };
        const mapped = parsed?.rank ? LEGACY_MAP[parsed.rank] : undefined;
        if (mapped) {
          localStorage.setItem(startKey(uid), JSON.stringify({ id: mapped }));
          return { id: mapped, label: tierFor(mapped).label };
        }
      } catch { /* noop */ }
    }
  } catch { /* noop */ }

  const usable = summaries.filter(s => (s.targetProtein ?? 0) > 0);
  if (usable.length < 7) return null;
  const oldest = usable.slice(-7);
  const breakdown = computeIdentityScore(oldest, 0);
  try { localStorage.setItem(startKey(uid), JSON.stringify({ id: breakdown.identity })); } catch { /* noop */ }
  return { id: breakdown.identity, label: breakdown.label };
}
