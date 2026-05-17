// Visual-only paywall state. Persisted per-user in localStorage.
//
// NOTE: This is device-scoped. For multi-device anti-abuse, mirror
// `trialStartedAt` onto the user's Firestore profile and read from there.
// Kept device-local for now to avoid an extra Firestore round-trip on boot.

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_LOGS = 3;
const MIN_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const firstOpenKey = (uid: string) => `brotein_first_open_at:${uid}`;
const trialKey = (uid: string) => `brotein_trial_started:${uid}`;

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function markFirstOpen(uid: string) {
  const s = safeStorage();
  if (!s || !uid) return;
  if (!s.getItem(firstOpenKey(uid))) {
    s.setItem(firstOpenKey(uid), String(Date.now()));
  }
}

export function getFirstOpenAt(uid: string): number | null {
  const s = safeStorage();
  if (!s || !uid) return null;
  const v = s.getItem(firstOpenKey(uid));
  return v ? Number(v) : null;
}

export function getTrialStartedAt(uid: string): number | null {
  const s = safeStorage();
  if (!s || !uid) return null;
  const v = s.getItem(trialKey(uid));
  return v ? Number(v) : null;
}

export function isTrialActive(uid: string): boolean {
  const started = getTrialStartedAt(uid);
  if (started == null) return false;
  return Date.now() - started < TRIAL_DURATION_MS;
}

export function startTrial(uid: string) {
  const s = safeStorage();
  if (!s || !uid) return;
  // Don't overwrite if already started — preserves original start time
  // so users can't restart the trial by tapping again.
  if (!s.getItem(trialKey(uid))) {
    s.setItem(trialKey(uid), String(Date.now()));
  }
}

export interface PaywallContext {
  uid: string;
  logsCount: number;
  /** True if RevenueCat reports an active "Brotein Pro" entitlement. */
  hasEntitlement?: boolean;
}

export function shouldShowPaywall({ uid, logsCount, hasEntitlement }: PaywallContext): boolean {
  if (hasEntitlement) return false;
  if (isTrialActive(uid)) return false;
  const first = getFirstOpenAt(uid);
  const ageOk = first !== null && Date.now() - first >= MIN_DAYS_MS;
  return logsCount >= MIN_LOGS || ageOk;
}
