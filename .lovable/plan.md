## Goal
Make the Paywall the final step before the app — after onboarding story AND structural data (biometrics / goals / results).

## Current flow (wrong)
SignIn → Story (CTA can open Paywall mid-story) → OnboardingFlow (bio/goals/results) → Dashboard

The paywall fires from inside the Story via `onStartTrial`, so the structural data screens come AFTER it.

## Desired flow
SignIn → Story → OnboardingFlow (bio/goals/results, creates profile) → **Paywall** → Dashboard

Paywall becomes a hard gate keyed per user, shown exactly once after the profile is created.

## Changes (all in `src/pages/Index.tsx`)

1. Add a new per-user flag `brotein_paywall_seen:{uid}` with state `paywallSeen`, hydrated in the same effect that hydrates `storySeen`.
2. Remove the mid-story paywall trigger:
   - Drop `onStartTrial` prop passed to `<OnboardingStoryFlow>` (the story's "Start trial" CTA now just completes the story — paywall will appear later automatically).
   - Remove `handleStartTrial` and the `paywallOpen` state used for mid-flow opening.
3. Replace the conditional render order so the gate runs in this order:
   ```
   if (!user) SignIn
   else if (!storySeen) OnboardingStoryFlow
   else if (!profile) OnboardingFlow
   else if (!paywallSeen) Paywall   ← new gate
   else Dashboard
   ```
4. Paywall handlers:
   - `onStart`: call `startTrial(user.uid)`, set `paywallSeen=true`, persist flag.
   - `onClose`: set `paywallSeen=true`, persist flag (user dismissed — don't re-show; matches "last thing before entering the app").
5. Render Paywall full-screen (not as the floating overlay it is today) by returning it directly from the gate instead of mounting it alongside `mainContent`.

## Notes
- No changes to `OnboardingFlow.tsx`, `OnboardingStoryFlow.tsx`, or `Paywall.tsx` internals — only the orchestration in `Index.tsx`.
- `OnboardingStoryFlow`'s `onStartTrial` prop is optional (already typed `?`), so dropping it is safe.
- Existing users who already have a profile but never saw the paywall will see it once on next load — acceptable since trial hasn't started for them.

## Summary
Reorder gates in `Index.tsx` so Paywall renders after profile creation, and remove the mid-story paywall trigger.