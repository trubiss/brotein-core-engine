// Lightweight analytics wrapper around Firebase Analytics.
// Falls back to a no-op (with optional console log in dev) when
// VITE_FIREBASE_MEASUREMENT_ID is not configured, so the app never breaks.

import { app } from './firebase';
import type { Analytics } from 'firebase/analytics';

type AnalyticsModule = typeof import('firebase/analytics');

let analyticsPromise: Promise<Analytics | null> | null = null;
let mod: AnalyticsModule | null = null;

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined;
const isDev = import.meta.env.DEV;

async function getAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (!measurementId) return null;
  if (analyticsPromise) return analyticsPromise;

  analyticsPromise = (async () => {
    try {
      mod = await import('firebase/analytics');
      const supported = await mod.isSupported();
      if (!supported) return null;
      return mod.getAnalytics(app);
    } catch (e) {
      console.warn('[track] analytics init failed', e);
      return null;
    }
  })();
  return analyticsPromise;
}

// Eagerly warm up on module load so first event has no cold-start delay.
if (typeof window !== 'undefined' && measurementId) {
  void getAnalytics();
}

export type TrackEvent =
  | 'sign_up'
  | 'sign_in'
  | 'sign_out'
  | 'onboarding_complete'
  | 'food_logged'
  | 'ai_scan_started'
  | 'ai_scan_completed'
  | 'ai_scan_failed'
  | 'ai_scan_logged'
  | 'target_hit'
  | 'paywall_viewed'
  | 'trial_started'
  | 'account_deleted'
  | 'password_reset_requested';

type Params = Record<string, string | number | boolean | undefined | null>;

export function track(event: TrackEvent, params?: Params): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[track]', event, params ?? {});
  }
  void (async () => {
    const a = await getAnalytics();
    if (!a || !mod) return;
    try {
      // Cast to any: Firebase has strict overloads for reserved event names,
      // but logEvent accepts arbitrary strings at runtime.
      (mod.logEvent as unknown as (a: Analytics, e: string, p?: Params) => void)(a, event, params);
    } catch (e) {
      console.warn('[track] logEvent failed', e);
    }
  })();
}

export function identifyUser(uid: string | null): void {
  void (async () => {
    const a = await getAnalytics();
    if (!a || !mod) return;
    try {
      mod.setUserId(a, uid);
    } catch (e) {
      console.warn('[track] setUserId failed', e);
    }
  })();
}

export function setUserProps(props: Record<string, string | number | boolean>): void {
  void (async () => {
    const a = await getAnalytics();
    if (!a || !mod) return;
    try {
      mod.setUserProperties(a, props as Record<string, string>);
    } catch (e) {
      console.warn('[track] setUserProperties failed', e);
    }
  })();
}
