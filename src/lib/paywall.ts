// Visual-only paywall state. All persisted via localStorage — no backend.

const FIRST_OPEN_KEY = 'brotein_first_open_at';
const TRIAL_KEY = 'brotein_trial_started';

export function markFirstOpen() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(FIRST_OPEN_KEY)) {
    localStorage.setItem(FIRST_OPEN_KEY, String(Date.now()));
  }
}

export function getFirstOpenAt(): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(FIRST_OPEN_KEY);
  return v ? Number(v) : null;
}

export function isTrialActive(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(TRIAL_KEY);
}

export function startTrial() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRIAL_KEY, String(Date.now()));
}

const MIN_LOGS = 3;
const MIN_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export function shouldShowPaywall({ logsCount }: { logsCount: number }): boolean {
  if (isTrialActive()) return false;
  const first = getFirstOpenAt();
  const ageOk = first !== null && Date.now() - first >= MIN_DAYS_MS;
  return logsCount >= MIN_LOGS || ageOk;
}
