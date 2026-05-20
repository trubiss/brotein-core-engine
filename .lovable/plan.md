## Add legal links to Paywall

Apple requires subscription paywalls to display Terms of Service and Privacy Policy links. The app already has both pages routed at `/terms` and `/privacy`.

### Change

In `src/components/Paywall.tsx`, add a small row of links directly below the "Cancel in Settings · Auto-renews" footer text:

- `TERMS` → opens `/terms` in a new tab
- `PRIVACY` → opens `/privacy` in a new tab

Styling matches the existing brutalist micro-text: `text-[10px]`, uppercase, `tracking-[0.25em]`, `opacity-50`, separated by a `·`.

### Why

Missing ToS/Privacy links on a subscription paywall is a common App Store rejection reason (Guideline 3.1.2). This is the only remaining blocker I found in the paywall review.

Switch to build mode to apply.