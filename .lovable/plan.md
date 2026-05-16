## Wire RevenueCat iOS key into the app

### Changes

**1. `src/lib/iap.ts`**
- Replace `import.meta.env.VITE_REVENUECAT_IOS_KEY` with a config constant:
  ```ts
  // Public RevenueCat SDK key — safe to ship in the app binary.
  // TODO: swap to live key (appl_…) before App Store submission.
  const REVENUECAT_IOS_KEY = 'test_LIpJqqukaFfMTNtAlMEpeYIfIsw';
  const REVENUECAT_ANDROID_KEY = ''; // fill in when/if Android ships
  ```
- Pick the right key based on `Capacitor.getPlatform()`.
- Guard `Purchases.configure()` so it only runs once and only on native.

**2. `src/main.tsx`**
- After `initNativeShell()`, call `initIAP()` so RevenueCat is configured at app boot.
- Subscribe to Firebase Auth state changes and call `identifyIAPUser(uid)` whenever a user signs in (and `logoutIAPUser()` on sign-out) so purchases are attributed to the right account across devices.

**3. No other files touched.** `Paywall.tsx` already calls the iap helpers; it'll just start working on a real iOS device once you run `npx cap sync ios` and build through Xcode with a sandbox tester account.

### What you still need to do in RevenueCat dashboard (no code)
- Create entitlement `pro`
- Create default Offering with an "Annual" package
- Attach the App Store Connect subscription product (e.g. `brotein_pro_annual`) to that package

### What will work after this
- On web: paywall stays visual-only (no purchase button wired to StoreKit — same as today).
- On iOS device/TestFlight: paywall fetches live StoreKit prices via RevenueCat, "Start Free Trial" triggers the native Apple purchase sheet, "Restore Purchases" works.
