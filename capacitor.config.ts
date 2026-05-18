/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

// Set CAP_DEV=1 when you want the native shell to hot-reload from the Lovable
// sandbox. Production / App Store builds MUST run without it so the bundled
// `dist/` is loaded — Apple rejects apps that fetch their JS from a remote URL.
const isDev = process.env.CAP_DEV === '1';

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
    contentInset: 'always',
    backgroundColor: '#ffffff',
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
      skipNativeAuth: false,
      providers: ['apple.com', 'google.com'],
    },
  },
};

export default config;
