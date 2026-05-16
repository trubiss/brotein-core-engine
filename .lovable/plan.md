# Paywall — Plan

A single-option, identity-driven paywall for Brotein. Visual only: tapping the CTA marks a local "trial active" flag and proceeds into the app. No real billing.

## Trigger logic

Show the paywall once when ALL of these are true:
- User has finished onboarding (has `profile`)
- Trial/subscription not yet active (no `brotein_trial_started` flag)
- Has not dismissed/seen paywall already this session
- AND either:
  - Has logged **≥ 3 food entries total**, OR
  - It has been **≥ 2 days** since their first app open (`brotein_first_open_at` localStorage timestamp, set on first Dashboard mount)

Once trial is started, never show again. Non-dismissible — only path forward is the CTA.

## Files

**New: `src/components/Paywall.tsx`**
Full-screen black & white component. Layout (top → bottom, centered, mobile-first, max-w ~420px):
1. Headline — `STOP GUESSING. START GROWING.` — Space Mono, very large, tight tracking
2. Subtext — "The difference between guys who build muscle and those who don't isn't the gym. It's whether they hit protein every day." — Space Grotesk, muted
3. Streak context (only if `streak > 0`) — `YOU'RE ON A {n}-DAY STREAK.` — small caps label
4. Three identity bullets with `✓` glyph:
   - Never miss your number
   - Build a streak that proves it
   - Become consistent
5. Price block — `$39 / YEAR`, line below `7-DAY FREE TRIAL`, tiny line `Less than $4/month`
6. Primary CTA — full-width black button, white text, `START 7-DAY TRIAL` — `whileTap scale 0.98`, haptic, instant action
7. Footer micro-text — `Cancel anytime · Payment charged after trial ends` at 40% opacity

Styling: reuse existing brutalist tokens (zero radius, foreground/background, label-spaced class). No new colors, no gradients.

**New: `src/lib/paywall.ts`**
Small helper module exporting:
- `getFirstOpenAt()` / `markFirstOpen()` — localStorage `brotein_first_open_at`
- `isTrialActive()` — checks `brotein_trial_started`
- `startTrial()` — sets `brotein_trial_started = Date.now()`
- `shouldShowPaywall({ logsCount, streak })` — returns boolean per trigger rules above

**Edit: `src/pages/Index.tsx`**
- On mount (when reaching post-onboarding state), call `markFirstOpen()` once.
- Add a small `PaywallGate` wrapper around `Dashboard` that:
  - subscribes to `watchRecentLogs` count and computes streak (or reuses Dashboard's existing logic via a lightweight hook in `paywall.ts`)
  - if `shouldShowPaywall(...)` and not trial active → renders `<Paywall onStart={startTrial} />`
  - else renders `Dashboard`
- Keep it lazy-imported.

Simpler alternative considered: trigger from inside `Dashboard.tsx` using its existing `logs` and `streak` state. This avoids duplicating the Firestore subscription — **going with this approach**. The Dashboard renders `<Paywall />` as an overlay (fixed inset-0, z-50) when `shouldShowPaywall` is true and trial inactive.

**Edit: `src/components/Dashboard.tsx`**
- Import `Paywall`, `shouldShowPaywall`, `startTrial`, `isTrialActive`.
- On first render after profile exists, ensure `markFirstOpen()` ran.
- Conditionally render `<Paywall streak={streak} onStart={() => { startTrial(); forceRerender(); }} />` as the only return when gate is open.

## Interaction
- CTA: immediate — `haptic()` → `startTrial()` → component unmounts → Dashboard appears. No toast, no spinner.
- No close button. No skip link.

## Out of scope
- Real Stripe/Paddle integration (explicitly visual-only per user choice).
- Pricing toggles, plan tiers, comparison tables.
- Settings page to manage subscription.

## Technical notes
- All state in `localStorage` — consistent with existing app pattern (`brotein_welcome_seen`, `brotein_story_seen`).
- No DB migration, no backend changes.
- Uses existing typography classes (`font-mono`, `font-display`, `label-spaced`) and foreground/background tokens.
