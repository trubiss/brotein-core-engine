# Fix Apple Review Rejections (Submission 14)

Both issues from Apple's May 27 rejection are still in the code. Neither was fixed in a prior round.

## Issue 1 — Guideline 4 (Design): Malformed Apple logo

**Where:** `src/components/SignInScreen.tsx` line 107

```tsx
import { Apple } from 'lucide-react';
...
<Apple size={14} strokeWidth={2.5} fill="currentColor" />
CONTINUE WITH APPLE
```

The lucide `Apple` icon is a **fruit** (apple with a leaf/stem). Apple's HIG requires the official Apple logomark () on Sign in with Apple buttons. That's exactly what "the Apple logo is malformed" means.

**Fix:** Replace the lucide icon with the official Apple logomark as an inline SVG (the standard glyph used in HIG examples). Keep it the same size/color (`currentColor`) so it stays themed.

```tsx
// Inline Apple logomark SVG (no lucide import)
<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
  <path d="M16.365 1.43c0 1.14-.42 2.22-1.26 3.06-.84.84-1.98 1.32-3.06 1.26-.06-1.08.42-2.22 1.26-3.06.84-.84 1.98-1.32 3.06-1.26zM20.49 17.34c-.36.78-.78 1.5-1.32 2.16-.72.9-1.5 1.74-2.7 1.74-1.14 0-1.5-.66-2.82-.66-1.32 0-1.74.66-2.82.66-1.2 0-2.04-.9-2.76-1.8-1.5-1.86-2.64-5.28-1.08-7.62.78-1.14 2.16-1.86 3.66-1.92 1.14-.06 2.22.78 2.82.78.6 0 1.92-.96 3.24-.84.54.06 2.1.24 3.12 1.74-.06.06-1.86 1.08-1.86 3.18.06 2.52 2.28 3.36 2.34 3.36-.06.18-.36 1.26-1.02 2.22z"/>
</svg>
```

Also remove `import { Apple } from 'lucide-react'`.

## Issue 2 — Guideline 3.1.2(c): Free trial more prominent than billed amount

**Where:** `src/components/Paywall.tsx` lines 207–233 (annual card) and lines 280–284 (footer copy)

Current layout on the annual card:
- `7-DAY FREE TRIAL` — `text-3xl font-black` (huge)
- `THEN $39.99 / YEAR · BILLED YEARLY` — `text-[11px] opacity-70` (tiny)
- `JUST $0.77 / WEEK` — also competes

Apple requires the **billed amount** ($39.99/year) to be the **most clear and conspicuous** element. Free trial / per-week pricing must be subordinate in size, weight, and position.

**Fix the annual card hierarchy:**

```
┌─ Annual card ─────────────────────────┐
│ $39.99 / YEAR             ← LARGEST   │  (text-3xl font-black, was the trial text)
│ Billed yearly                         │  (subordinate, small mono)
│                                       │
│ Includes 7-day free trial             │  (subordinate, small mono, NOT large)
│ (~$0.77/week)                         │  (subordinate, smallest)
└───────────────────────────────────────┘
```

Concretely, replace the `trialAvailable ? (...) : (...)` block (lines 207–230) with a single layout where:
- `{annualPrice} / YEAR` is the largest element (`font-display font-black text-3xl`)
- `BILLED YEARLY` stays small mono underneath
- `INCLUDES 7-DAY FREE TRIAL` only appears as a small subordinate line (same size as "BILLED YEARLY", `text-[11px] opacity-70`) — never larger than the price
- `JUST {perWeek} / WEEK` stays smallest (`text-[10px] opacity-50`)

**Fix the CTA button (lines 115–119):** Currently shows `START 7-DAY FREE TRIAL` with no price. Change to lead with the billed amount, e.g. `SUBSCRIBE {annualPrice}/YR · 7-DAY FREE TRIAL` — billed amount first, trial as secondary qualifier.

**Fix the footer disclosure (lines 280–284):** Currently `Free for 7 days, then $39.99/year.` Reorder to `$39.99/year after a 7-day free trial. Cancel anytime in Settings.` — billed amount first.

## Out of scope

- No changes to RevenueCat, StoreKit, products, or pricing values themselves.
- No changes to monthly card (already shows price as the dominant element).
- No copy changes beyond what's needed to satisfy 3.1.2(c).

## After implementing

You'll need to:
1. `npm run build` locally and `npx cap sync ios` in your `~/brotein-core-engine` project
2. Increment build number in Xcode (15 → 16)
3. Archive, upload, and resubmit through App Store Connect

Want me to switch to build mode and apply these changes?
