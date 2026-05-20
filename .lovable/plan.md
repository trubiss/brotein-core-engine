## Context

`src/components/Paywall.tsx` already has a `RESTORE PURCHASES` button (lines 244–252), but it's gated behind `native && ...`, so it only renders on iOS native builds and is rendered as small, low-contrast tertiary text below the legal microcopy area. Restore does not require an account (it reads RevenueCat `customerInfo` from the App Store receipt on device).

For App Store Review (Guideline 3.1.1), restore must be clearly reachable from the paywall itself — reviewers don't always create an account first.

## Plan

1. **Remove the `native &&` gate** on the restore button so it's always rendered on the paywall. On web it can call `restorePurchases()` which will no-op gracefully (or show "nothing to restore" toast).
2. **Promote its visual weight** so a reviewer can find it without hunting:
   - Move it directly under the primary CTA's helper line (above the footer microcopy)
   - Bump from `text-[10px]` muted-foreground to `text-xs` with a thin underline, full-width tap target, still understated but discoverable
   - Keep brutalist styling (uppercase, mono, wide tracking, no rounded corners)
3. **Keep the existing `restore` handler** — it already wires to `restorePurchases()` from `@/lib/iap` and surfaces toast feedback. No business-logic changes.
4. Leave Terms / Privacy / Maybe Later ordering intact.

## Technical details

- File: `src/components/Paywall.tsx`
- Edit: replace the `{native && (...)}` block with an always-rendered button, repositioned above the "Cancel in Settings · Auto-renews" footer line.
- No changes to `src/lib/iap.ts`, no new dependencies, no routing or backend changes.

## Out of scope

- Changing restore behavior on web (still falls through to the existing iap.ts implementation)
- Subscription panel in Profile (already shipped)
- Any copy changes to legal links
