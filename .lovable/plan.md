## Haptic on protein tap (onboarding "TAP TO ADD PROTEIN" slide only)

In `src/components/OnboardingStoryFlow.tsx`, update `handleAdd` (the `+ 20G PROTEIN` button handler on the `interactive-add` slide) to fire a short haptic:

- Web: `navigator.vibrate(8)` (matches the Dashboard pattern), wrapped in a try/catch and feature check.
- Native (iOS/Android via Capacitor): also call `tapHaptic()` from `@/lib/native`, which already wraps `@capacitor/haptics` with `ImpactStyle.Light` and no-ops off-device.

Scope is strictly the `handleAdd` function on this slide — no other onboarding interactions (Continue, Skip, choices, swipes) get haptics.

No changes to UI, layout, or motion.