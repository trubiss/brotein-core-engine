## Goal

The screenshot shows the old paywall (US$ 79.99/yr, no trial messaging). Update it to match the new App Store Connect plan: **$39.99/year with a 7-day free trial** (plus the $4.99/month secondary option already wired up).

## Changes (src/components/Paywall.tsx only)

1. **Price panel** — when a trial is available, show the trial as the headline and the price as supporting text:
   - Big line: `7-DAY FREE TRIAL`
   - Sub line: `THEN $39.99 / YEAR · BILLED YEARLY`
   - Keep the "MOST POPULAR" tag.
   - When no trial (e.g. returning user), fall back to the current `$39.99 / YEAR · BILLED YEARLY` layout.

2. **Primary CTA**
   - Trial available → `START 7-DAY FREE TRIAL`
   - No trial → `SUBSCRIBE $39.99/YR`
   (Already partly done — just confirm copy and remove the `US$` formatting drift seen in the screenshot.)

3. **Fine-print under CTA**
   - Trial: `Free for 7 days, then $39.99/year. Cancel anytime in Settings.`
   - No trial: `$39.99 per year. Cancel anytime in Settings.`

4. **Footer micro-text** — keep `CANCEL IN SETTINGS · AUTO-RENEWS YEARLY` on native, web copy unchanged.

5. **Defaults** — `annualPrice` fallback stays `$39.99`; `monthlyPrice` stays `$4.99`. Live prices from RevenueCat (`offers.annual.priceString`) continue to override on device, so localized formats like `US$ 39,99` will still render correctly.

No changes to `iap.ts`, entitlements, or purchase flow — product IDs (`brotein_yearly_3999`, `brotein_monthly_499`) already match what you set up in App Store Connect.

## Out of scope

- RevenueCat / App Store Connect config (already in progress in chat).
- Monthly link styling — stays as-is.
