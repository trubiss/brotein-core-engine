## Goal

The last onboarding slide's "START FREE TRIAL" button currently just dismisses onboarding. Make it open the existing Paywall sheet immediately. Keep the existing later trigger (Dashboard's `shouldShowPaywall` after a few logs / 2 days) untouched.

## Changes

### 1. `src/components/Paywall.tsx`
Add an optional `onClose?: () => void` prop. When provided, render a small "MAYBE LATER" text button at the bottom (mono, tracking-wide, muted) that calls it. No other visual changes.

### 2. `src/components/OnboardingStoryFlow.tsx`
Add an optional prop `onStartTrial?: () => void`. On the final statement screen (`TRY BROTEIN FREE FOR 7 DAYS`), tapping its CTA calls `onStartTrial` if provided, otherwise falls back to the current `next()` behavior. All other CTAs and the SKIP button keep their current behavior (call `onComplete`).

Detection: check `step === TOTAL - 1` inside `next()`. If true and `onStartTrial` exists, call it instead of `onComplete`.

### 3. `src/pages/Index.tsx`
- Import `Paywall` (lazy), and `startTrial` from `@/lib/paywall`.
- Add state `paywallOpen: boolean`.
- Pass `onStartTrial={() => { completeStory(); setPaywallOpen(true); }}` to `OnboardingStoryFlow`.
- When `paywallOpen && user`, render `<Paywall onStart={...} onClose={...} />` as an overlay (it's already `fixed inset-0 z-50`).
  - `onStart`: call `startTrial(user.uid)`, then `setPaywallOpen(false)`.
  - `onClose`: just `setPaywallOpen(false)`.
- The paywall renders on top of whatever screen the user lands on after the story (profile setup `OnboardingFlow` or the dashboard). Dismissing it continues that flow normally. The Dashboard's existing `shouldShowPaywall` keeps working for the later re-trigger.

## Out of scope

- No changes to `lib/paywall.ts`, IAP logic, or dashboard trigger thresholds.
- No copy or visual changes to the onboarding slides themselves.
