// Client wrapper for the physique simulator + free-tier tracking.
// One free simulation per user (device-local); subsequent uses are premium-gated.

import type { Goal } from './types';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate-physique`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface SimulateRequest {
  imageDataUrl: string;
  goal: Goal;
  weeks?: number;
  proteinTarget?: number;
}

export interface SimulateResult {
  imageDataUrl: string;
}

export async function simulatePhysique(req: SimulateRequest): Promise<SimulateResult> {
  const resp = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({
      imageDataUrl: req.imageDataUrl,
      goal: req.goal,
      weeks: req.weeks ?? 12,
      proteinTarget: req.proteinTarget,
    }),
  });

  if (!resp.ok) {
    let msg = 'Simulation failed';
    try { msg = (await resp.json()).error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return (await resp.json()) as SimulateResult;
}

// ---- Free-tier tracking ---------------------------------------------------

const freeUsedKey = (uid: string) => `brotein_physique_free_used:${uid}`;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function hasUsedFreeSimulation(uid: string): boolean {
  const s = storage();
  if (!s || !uid) return false;
  return s.getItem(freeUsedKey(uid)) === '1';
}

export function markFreeSimulationUsed(uid: string) {
  const s = storage();
  if (!s || !uid) return;
  s.setItem(freeUsedKey(uid), '1');
}
