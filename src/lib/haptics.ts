// Graded haptic feedback. Uses native Capacitor Haptics on iOS/Android,
// falls back to navigator.vibrate() on the web. Silent no-op when neither
// is available. Components must call these helpers — never the vibration
// API directly — so intensity stays consistent across the app.

import { isNative } from './native';

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch { /* silent */ }
}

/** Light tap — frequent, low-stakes interactions (quick-add, date nav, toggles). */
export async function lightTap(): Promise<void> {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    } catch { /* fall through */ }
  }
  vibrate(10);
}

/** Medium tap — primary actions (QUICK ADD, SCAN, LOG MEAL confirm). */
export async function mediumTap(): Promise<void> {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    } catch { /* fall through */ }
  }
  vibrate(20);
}

/** Success — achievement moments. Distinct double-pulse on web. */
export async function success(): Promise<void> {
  if (isNative()) {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
      return;
    } catch { /* fall through */ }
  }
  vibrate([15, 60, 25]);
}

/** Warning — destructive or negative moments. Single longer pulse. */
export async function warning(): Promise<void> {
  if (isNative()) {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    } catch { /* fall through */ }
  }
  vibrate(50);
}
