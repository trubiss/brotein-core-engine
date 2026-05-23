## Problem

The "CONTINUE WITH FREE VERSION" button on the Paywall only renders when an `onClose` prop is passed (see `Paywall.tsx` line 282). The paywall that's shown on the iOS device is the one rendered from `Dashboard.tsx` (the post-onboarding paywall triggered by `shouldShowPaywall`), and that render site does **not** pass `onClose` — so there's no way to dismiss it on the free tier.

The `Index.tsx` render site already passes `onClose` correctly, which is why it appears in the Lovable preview but not on the actual app screen the user is stuck on.

## Fix

One small change in `src/components/Dashboard.tsx` (around line 257): add an `onClose` prop to the `<Paywall>` element so the free-version exit button renders.

```tsx
<Paywall
  streak={streak}
  onStart={() => {
    track('trial_started', { streak, logs_count: totalLogs });
    startTrial(uid);
    setTrialActive(true);
  }}
  onClose={() => {
    // Dismiss paywall and let the user continue on the free tier.
    // Mark paywall as dismissed so it doesn't immediately re-trigger.
    track('paywall_dismissed_free', { streak, logs_count: totalLogs });
    // Use the same "start" path so Dashboard re-renders the app shell.
    startTrial(uid);
    setTrialActive(true);
  }}
/>
```

Note on behavior: tapping "CONTINUE WITH FREE VERSION" will call `startTrial(uid)` so the user gets into the app immediately. This matches the existing free-tier exit behavior used by the onboarding SKIP path. If you'd prefer a stricter "no trial, just dismiss" behavior (i.e. don't grant the trial, just close the paywall), say so and I'll adjust — but then we also need a flag so `shouldShowPaywall` doesn't re-show it on the next render.

## After implementing

Standard rebuild for the device:

```bash
npm run build && npx cap sync ios
```

Then in Xcode: delete the app from the iPhone, Clean Build Folder (Shift+Cmd+K), Run (Cmd+R).
