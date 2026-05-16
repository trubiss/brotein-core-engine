import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brotein.app',
  appName: 'Brotein',
  webDir: 'dist',
  // Hot-reload from the Lovable sandbox while developing on a device.
  // Remove the `server` block (or replace `url` with your production domain)
  // before producing a release build for the App Store.
  server: {
    url: 'https://376913f3-6f06-467e-8b0e-d64dbb833936.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
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
  },
};

export default config;
