import { UserProfile } from './types';
import { updateProfileFields } from './firestore';

export interface ReminderSettings {
  enabled: boolean;
  morning: { enabled: boolean; time: string };   // "HH:MM"
  midday: { enabled: boolean; time: string };
  evening: { enabled: boolean; time: string };
  behindTarget: { enabled: boolean; thresholdPct: number }; // notify if % of target by evening below this
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  morning: { enabled: true, time: '08:00' },
  midday: { enabled: true, time: '13:00' },
  evening: { enabled: true, time: '19:00' },
  behindTarget: { enabled: true, thresholdPct: 60 },
};

export function getReminderSettings(profile: UserProfile | null): ReminderSettings {
  // Backwards-compat: profile may not have `reminders` yet.
  // The legacy `notifications` boolean acts as the master toggle.
  const r = (profile as unknown as { reminders?: ReminderSettings })?.reminders;
  if (r) return { ...DEFAULT_REMINDERS, ...r, enabled: profile?.notifications ?? r.enabled };
  return { ...DEFAULT_REMINDERS, enabled: profile?.notifications ?? true };
}

export async function saveReminderSettings(uid: string, settings: ReminderSettings) {
  await updateProfileFields(uid, {
    notifications: settings.enabled,
    // Persist the structured reminders object alongside the profile.
    ...({ reminders: settings } as Partial<UserProfile>),
  });
}

// ---- Scheduling logic ------------------------------------------------------
// Push isn't wired yet. We expose a scheduler that the caller can mount once
// (e.g. on the Dashboard) — it computes due reminders and surfaces them via
// an injected callback (`onFire`). When push is added later, swap `onFire`
// for an actual notification dispatcher.

export interface ReminderEvent {
  id: 'morning' | 'midday' | 'evening' | 'behind';
  title: string;
  body: string;
  firedAt: number;
}

const storageKey = (uid: string) => `brotein:reminderState:${uid}`;

interface StoredState {
  // last fired key per reminder, e.g. "2026-04-17:morning"
  lastFired: Record<string, string>;
}

function readState(uid: string): StoredState {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw) return JSON.parse(raw) as StoredState;
  } catch { /* ignore */ }
  return { lastFired: {} };
}

function writeState(uid: string, s: StoredState) {
  try { localStorage.setItem(storageKey(uid), JSON.stringify(s)); } catch { /* ignore */ }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface PaceContext {
  consumed: number;
  target: number;
}

export function evaluateReminders(
  uid: string,
  settings: ReminderSettings,
  pace: PaceContext,
  now: Date = new Date(),
): ReminderEvent[] {
  if (!settings.enabled || !uid) return [];
  const events: ReminderEvent[] = [];
  const state = readState(uid);
  const today = dateKey(now);
  const minutes = now.getHours() * 60 + now.getMinutes();

  const slots: { key: 'morning' | 'midday' | 'evening'; cfg: { enabled: boolean; time: string }; title: string; body: string }[] = [
    { key: 'morning', cfg: settings.morning, title: 'MORNING FUEL', body: 'Start the day with a protein hit.' },
    { key: 'midday', cfg: settings.midday, title: 'MIDDAY CHECK-IN', body: 'Time to log your lunch protein.' },
    { key: 'evening', cfg: settings.evening, title: 'EVENING PUSH', body: 'Close the day on target.' },
  ];

  for (const s of slots) {
    if (!s.cfg.enabled) continue;
    const due = timeToMinutes(s.cfg.time);
    if (minutes < due) continue;
    const stamp = `${today}:${s.key}`;
    if (state.lastFired[s.key] === stamp) continue;
    state.lastFired[s.key] = stamp;
    events.push({ id: s.key, title: s.title, body: s.body, firedAt: now.getTime() });
  }

  // Behind-target: fire once after evening time if pace below threshold.
  if (settings.behindTarget.enabled && pace.target > 0) {
    const eveningMin = timeToMinutes(settings.evening.time);
    const pct = (pace.consumed / pace.target) * 100;
    if (minutes >= eveningMin && pct < settings.behindTarget.thresholdPct) {
      const stamp = `${today}:behind`;
      if (state.lastFired.behind !== stamp) {
        state.lastFired.behind = stamp;
        const missing = Math.max(0, pace.target - pace.consumed);
        events.push({
          id: 'behind',
          title: 'BEHIND TARGET',
          body: `You're ${missing}G short — squeeze it in before bed.`,
          firedAt: now.getTime(),
        });
      }
    }
  }

  if (events.length) writeState(uid, state);
  return events;
}
