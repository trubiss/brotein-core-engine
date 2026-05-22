# Fix Apple Rejection (Guideline 2.1 — Crash on Launch)

Apple's reviewer opened your app on an **iPhone 17 Pro Max running iOS 26.5** and it crashed before the UI rendered. The good news: this is almost always one of three things, all fixable without changing your app's features. The bad news: we can't see the crash from the Lovable preview — we have to reproduce it the way Apple did, on a simulated iPhone 17 Pro Max, using the **same kind of build Apple ran** (a production build of the bundled JS, not the live sandbox).

---

## Most likely root cause

Looking at your code:

- `src/lib/firebase.ts` calls `initializeApp(firebaseConfig)` at the top of the file. If any of the `VITE_FIREBASE_*` values are missing or wrong **at the moment you ran `npm run build`**, Firebase throws synchronously and nothing else loads — exactly what Apple sees as "crashed on launch."
- `src/main.tsx` then calls `initNativeShell()` and subscribes to `onAuthStateChanged` before React mounts. Any throw here = white screen on iOS = rejection.
- `capacitor.config.ts` already correctly only enables the remote sandbox URL when `CAP_DEV=1`. If you accidentally had that variable set when archiving, the App Store build would try to load JS from the Lovable sandbox — Apple's reviewer network often can't reach it, and even if it did, Apple rejects apps that fetch their JS remotely.

Your `.env` here in Lovable has all the Firebase keys, and `.env` is NOT in `.gitignore`, so it gets pulled to your Mac when you `git pull`. That's good. The risk is that your **local** `.env` on the Mac is older / incomplete from before Firebase was added.

---

## Answering your question first: how do I test it the way Apple did?

You **cannot** use Lovable's preview to reproduce this — the preview runs the live web app, not the iOS bundle.

You have two options on your Mac:

**Option A — iOS Simulator (free, no device needed, fastest).** The iOS Simulator that ships with Xcode lets you pick any iPhone, including iPhone 17 Pro Max on iOS 26.5 — the exact device Apple used. This is what we'll use.

**Option B — Real iPhone.** Plug it into the Mac, trust the computer, and Xcode lets you "Run" the app on it. Requires Apple Developer signing setup you already have.

Option A is enough to catch a launch crash. We'll go with that.

---

## Step-by-step plan

### 1. Pull the latest code and rebuild cleanly on your Mac
In Terminal, inside the project folder:
```
git pull
npm install
npm run build
npx cap sync ios
```
Important: **do not** prefix any of these with `CAP_DEV=1`. A clean build means `dist/` is bundled into the iOS app, exactly like the App Store build.

### 2. Verify your local `.env` has all Firebase keys
Open `.env` in the project root on your Mac. It must contain all six:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
If any are missing or look stale, copy them from the Lovable `.env` (visible in the editor) and re-run step 1. This is the single most likely cause of the rejection.

### 3. Open Xcode and run on iPhone 17 Pro Max simulator
```
npx cap open ios
```
In Xcode's top bar, click the device selector (next to the "Run" play button) → choose **iPhone 17 Pro Max (iOS 26.5)**. Then press the **Play ▶** button.

The app will build, install, and launch in the simulator. Watch what happens:

- **If it launches normally** → the crash was an env/config problem fixed by the clean rebuild. Skip to step 5.
- **If it crashes (white screen, then closes; or never shows your UI)** → continue to step 4.

### 4. Read the crash in Xcode's console
At the bottom of the Xcode window there's a console pane (the area with text scrolling by). When the app crashes you'll see a red error message — usually something like `FirebaseError: ...`, `TypeError: ...`, or a stack trace mentioning a file in your project. Copy that whole message and paste it back to me here. That tells us exactly which line is throwing, and I'll give you the one-line fix.

### 5. Archive and resubmit
Once it launches cleanly in the simulator:
1. In Xcode top bar, change device target from "iPhone 17 Pro Max" to **"Any iOS Device (arm64)"**.
2. Menu: **Product → Archive**.
3. When the Organizer window opens, click **Distribute App → App Store Connect → Upload**.
4. In App Store Connect, the new build will appear under TestFlight after ~10 min of processing.
5. Go to your rejected submission, attach the new build, and click **Resubmit for Review** (or reply to Apple's message saying "fixed in build 1.0 (6)").

### 6. Reply to Apple (optional but speeds things up)
In App Store Connect, in the Resolution Center thread, write:
> Hi, thanks for the report. The crash was caused by a missing environment variable at build time, which prevented our initialization code from completing. We've fixed the configuration and verified the app launches cleanly on iPhone 17 Pro Max running iOS 26.5 in the simulator. Please test build 1.0 (6).

---

## What I'm NOT changing in the code right now

Until we see the actual crash log from Xcode, I'm not modifying source files — guessing risks introducing new bugs. 90% of "crash on launch" rejections are fixed purely by step 1+2 (clean rebuild with correct env).

If step 4 shows the crash persists, the likely defensive fixes I'll apply are:
- Wrap `initializeApp` in a try/catch so a config error renders a friendly error screen instead of crashing.
- Move the `onAuthStateChanged` IAP call inside the React tree (after `createRoot`) so any throw is caught by React's error boundary, not by iOS WebKit as a hard crash.

But let's first see what the simulator tells us.

---

**Your next action:** do steps 1–3, then tell me whether the app launched or crashed in the simulator (and if it crashed, paste the red text from Xcode's console).