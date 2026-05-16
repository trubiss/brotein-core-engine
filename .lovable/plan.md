## iOS Launch Readiness — Brotein

You currently have a working **web app** (React + Firebase Auth/Firestore + Analytics). To ship to the **App Store**, here's everything that still needs to happen, in order.

---

### 1. Wrap the web app as a native iOS app (Capacitor)

Capacitor is required to ship a native iOS binary. Setup work I'd do for you in Lovable:

- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
- Create `capacitor.config.ts` with appId `app.lovable.376913f36f06467e8b0ed64dbb833936`, appName `brotein`
- Configure for hot-reload from the Lovable sandbox during dev
- Add iOS status-bar / safe-area handling (notch padding for the brutalist UI)

Then you (one-time on a Mac with Xcode):
1. Export project to GitHub → `git pull`
2. `npm i && npx cap add ios && npx cap sync`
3. `npx cap open ios` to launch Xcode

### 2. Native plugins your app actually needs

Based on the features I've seen:
- **`@capacitor/camera`** — for the AI food scanner (currently uses web file input; native gives real camera + permissions sheet)
- **`@capacitor/preferences`** — to migrate localStorage to native storage (survives app deletions less aggressively, faster)
- **`@capacitor/haptics`** — small taps on streak/log actions, fits the brutalist feel
- **`@capacitor/splash-screen`** — branded splash
- **`@capacitor/status-bar`** — match the B&W theme
- *(optional)* `@capacitor/push-notifications` if you want reminder pushes later — your current reminders look like local web notifications

### 3. Apple Sign-In (required by App Store)

**This is mandatory** if you offer any third-party sign-in (you have Google). Apple will reject the app without it. Need to:
- Add Apple provider to Firebase Auth
- Add Sign in with Apple button to login screen
- Configure Apple Developer Services ID + .p8 key
- Wire `@capacitor-community/apple-sign-in` for the native sheet

### 4. Paywall / payments — switch to StoreKit

You have a paywall (`paywall.ts`). Apple **requires** in-app purchases for digital subscriptions — Stripe/Paddle web checkout will get the app rejected. Options:
- **RevenueCat** (recommended) — wraps StoreKit, also gives you cross-platform receipts. Plugin: `@revenuecat/purchases-capacitor`
- Raw `@capacitor-community/in-app-purchases`

Either way you'll need to: create the subscription product in App Store Connect, configure the paywall to call StoreKit on iOS (and keep Stripe/web for non-iOS later).

### 5. App Store assets & metadata

You'll need to produce/upload:
- **App icon** (1024×1024 + all sizes — generated from a single source via `@capacitor/assets`)
- **Splash screen** asset
- **Screenshots** for 6.7", 6.5", 5.5" iPhones (min 3 per size)
- **App name** ("Brotein"), subtitle (30 char), keywords (100 char), description
- **Privacy Policy URL** — you already have `/legal/privacy`, just needs to be on a public live URL
- **Support URL**
- **Privacy "nutrition label"** in App Store Connect — declare what data Firebase Auth/Analytics/Firestore collects (email, user ID, usage data, diagnostics)

### 6. Apple Developer account + signing

- Enroll in Apple Developer Program ($99/yr) if you haven't
- Create App ID matching `app.lovable.376913f36f06467e8b0ed64dbb833936` (or change the bundle ID to something brandable like `com.brotein.app` — recommended)
- Provisioning profile + distribution cert (Xcode handles most of this with "Automatically manage signing")

### 7. Pre-submission polish (small code changes)

- Account **deletion flow visible from settings** (you have `DeleteAccountModal` — Apple checks this exists for any app with sign-in)
- Terms + Privacy links visible in the app (you have these — make sure they're linked from settings AND signup)
- Confirm no crashes on iOS Safari WebView (test on physical device)
- Add `NSCameraUsageDescription` to `Info.plist` ("Brotein uses the camera to scan food for nutrition info")
- Add `NSPhotoLibraryUsageDescription` if you allow picking from library

### 8. Submission

- Upload build via Xcode → App Store Connect
- Fill TestFlight info → internal testing first
- Submit for review (typically 24–48 h response)

---

### My recommended order

1. Capacitor wrap + status bar + splash (1 session)
2. Native camera plugin for the scanner (1 session)
3. Apple Sign-In (1 session)
4. RevenueCat + StoreKit paywall (1–2 sessions — the biggest unknown)
5. Icon/splash assets + Info.plist permission strings (1 session)
6. You handle: Apple Developer enrollment, App Store Connect listing, screenshots, submission

---

### What I need from you to proceed

- **Bundle ID**: keep `app.lovable.376913f36f06467e8b0ed64dbb833936` or change to something like `com.brotein.app`?
- **Where to start?** I'd suggest **Capacitor setup first** so you can run on a device, then **Apple Sign-In** (most likely rejection blocker), then **StoreKit paywall**.
- Do you already have an Apple Developer account?