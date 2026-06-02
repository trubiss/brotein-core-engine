/// <reference types="@capacitor-firebase/authentication" />

// ──────────────────────────────────────────────────────────────────────────────
// iOS Info.plist REQUIRED purpose strings (Apple ITMS-90683)
// After `npx cap add ios` or regenerating the ios/ folder, ensure
// ios/App/App/Info.plist contains:
//   NSCameraUsageDescription           — required by @capacitor/camera
//   NSPhotoLibraryUsageDescription     — required by @capacitor/camera
//   NSPhotoLibraryAddUsageDescription  — saving scanned meal photos
//   NSMicrophoneUsageDescription       — referenced by bundled SDKs
// Missing any of these = App Store rejection.
// ──────────────────────────────────────────────────────────────────────────────



import type { CapacitorConfig } from '@capacitor/cli';

// Set CAP_DEV=1 when you want the native shell to hot-reload from the Lovable
// sandbox. Production / App Store builds MUST run without it so the bundled
// `dist/` is loaded — Apple rejects apps that fetch their JS from a remote URL.
const isDev = process.env.CAP_DEV === '1';

if (isDev) {
  // Loud warning so a dev build can never silently slip into an App Store archive.
  // eslint-disable-next-line no-console
  console.warn('[capacitor.config] CAP_DEV=1 — building with remote server URL. DO NOT SHIP.');
}

const config: CapacitorConfig = {
  appId: 'com.brotein.app',
  appName: 'Brotein',
  webDir: 'dist',
  ...(isDev
    ? {
        server: {
          url: 'https://376913f3-6f06-467e-8b0e-d64dbb833936.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
  ios: {
    // 'never' so the webview sits under the status bar and we rely on
    // env(safe-area-inset-top) in CSS as the single source of truth.
    // 'always' double-pads on notched devices (system inset + safe-area)
    // pushing all top content noticeably down.
    contentInset: 'never',
    backgroundColor: '#ffffff',
    // Explicit scheme — never leave empty. Foundation on iOS 18+ traps when
    // URL.appendingPathComponent receives an empty string, which is what
    // caused the App Store crash on build 5.
    scheme: 'App',
    // Ensure we never resolve a relative path to "" inside the bridge.
    path: 'App',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#ffffff',
      iosSpinnerStyle: 'small',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['apple.com', 'google.com'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#000000',
      sound: 'default',
    },
  },
};

export default config;
