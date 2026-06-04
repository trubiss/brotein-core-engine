// Thin wrappers around Capacitor APIs so the web build keeps working.
// All functions are no-ops in the browser.

import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';

/** Initialize native chrome (status bar, splash dismiss). Call once at app boot. */
export async function initNativeShell() {
  if (!isNative()) return;
  // Defensive: clear any stale Capacitor-Preferences key that could feed an
  // empty string to URL.appendingPathComponent in the iOS bridge (iOS 18+
  // traps on that, which crashed App Store build 5).
  try {
    const { Preferences } = await import('@capacitor/preferences');
    for (const key of ['serverBasePath', 'lastBinaryVersionCode', 'lastBinaryVersionName']) {
      const { value } = await Preferences.get({ key });
      if (value === '' || value == null) {
        await Preferences.remove({ key });
      }
    }
  } catch (e) { console.warn('Preferences cleanup failed', e); }
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark }); // dark text on white
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  } catch (e) { console.warn('StatusBar init failed', e); }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch (e) { console.warn('SplashScreen hide failed', e); }
}


/** Light tap — log actions, button presses, option selects. */
export async function tapHaptic() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
}

/** Medium impact — primary CTA presses, Continue buttons. */
export async function mediumHaptic() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* ignore */ }
}

/** Heavy impact — major reveals, milestone moments. */
export async function heavyHaptic() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch { /* ignore */ }
}

/** Success notification — streak milestone, target hit, completion. */
export async function successHaptic() {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* ignore */ }
}

// ---- Local notifications --------------------------------------------------

export interface ScheduledReminder {
  id: number;            // stable numeric id per slot
  title: string;
  body: string;
  hour: number;
  minute: number;
}

export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** Read the current permission state without prompting the user. */
export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (!isNative()) return 'unsupported';
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return 'granted';
    if (status.display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unsupported';
  }
}

/** Ensure permission for local notifications on native iOS/Android. No-op on web. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (e) {
    console.warn('Notification permission failed', e);
    return false;
  }
}

/** Replace any previously scheduled daily reminders with the provided set. */
export async function scheduleDailyReminders(reminders: ScheduledReminder[]): Promise<void> {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    // Cancel anything we previously scheduled
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
    if (!reminders.length) return;
    await LocalNotifications.schedule({
      notifications: reminders.map(r => ({
        id: r.id,
        title: r.title,
        body: r.body,
        schedule: { on: { hour: r.hour, minute: r.minute }, allowWhileIdle: true, repeats: true },
      })),
    });
  } catch (e) {
    console.warn('Schedule reminders failed', e);
  }
}

/** Cancel all scheduled reminders. */
export async function cancelAllReminders(): Promise<void> {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
  } catch { /* ignore */ }
}

// ---- High-level helpers ----------------------------------------------------

interface ReminderSettingsLike {
  enabled: boolean;
  morning: { enabled: boolean; time: string };
  midday: { enabled: boolean; time: string };
  evening: { enabled: boolean; time: string };
}

function parseHM(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/** Schedule (or clear) daily reminders from the user's settings object. */
export async function scheduleFromSettings(settings: ReminderSettingsLike): Promise<void> {
  if (!isNative()) return;
  if (!settings.enabled) {
    await cancelAllReminders();
    return;
  }
  const list: ScheduledReminder[] = [];
  if (settings.morning.enabled) list.push({ id: 1001, title: 'MORNING FUEL', body: 'Start the day with a protein hit.', ...parseHM(settings.morning.time) });
  if (settings.midday.enabled)  list.push({ id: 1002, title: 'MIDDAY CHECK-IN', body: 'Time to log your lunch protein.', ...parseHM(settings.midday.time) });
  if (settings.evening.enabled) list.push({ id: 1003, title: 'EVENING PUSH', body: 'Close the day on target.', ...parseHM(settings.evening.time) });
  await scheduleDailyReminders(list);
}

/** Fire a one-off test notification ~5s out so the user can confirm OS delivery. */
export async function sendTestNotification(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: 9999,
        title: 'BROTEIN TEST',
        body: 'Notifications are working. Stay on target.',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      }],
    });
    return true;
  } catch (e) {
    console.warn('Test notification failed', e);
    return false;
  }
}

/**
 * Get a JPEG data URL from the native camera (or photo library on web fallback).
 * Returns null if the user cancels.
 */
export async function takeFoodPhoto(): Promise<string | null> {
  return getFoodPhoto('camera');
}

export async function pickFoodPhoto(): Promise<string | null> {
  return getFoodPhoto('photos');
}

async function getFoodPhoto(src: 'camera' | 'photos'): Promise<string | null> {
  if (!isNative()) return null; // web flow continues to use <input type="file">
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 82,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: src === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 1024,
      correctOrientation: true,
    });
    return photo.dataUrl ?? null;
  } catch (e: any) {
    if (e?.message?.toLowerCase().includes('cancel')) return null;
    console.error('Camera failed', e);
    throw e;
  }
}
