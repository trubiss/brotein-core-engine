// Thin wrappers around Capacitor APIs so the web build keeps working.
// All functions are no-ops in the browser.

import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';

/** Initialize native chrome (status bar, splash dismiss). Call once at app boot. */
export async function initNativeShell() {
  if (!isNative()) return;
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

/** Light tap — log actions, button presses. */
export async function tapHaptic() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
}

/** Success notification — streak milestone, target hit. */
export async function successHaptic() {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* ignore */ }
}

/**
 * Get a JPEG data URL from the native camera (or photo library on web fallback).
 * Returns null if the user cancels.
 */
export async function takeFoodPhoto(): Promise<string | null> {
  if (!isNative()) return null; // web flow continues to use <input type="file">
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 82,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // user picks camera vs library
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
