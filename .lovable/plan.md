# Paywall Pricing Update

Add a monthly option as a secondary plan, keep yearly with 7-day trial as the recommended primary.

## Pricing

| Plan | Price | Trial | Notes |
|---|---|---|---|
| Yearly *(primary)* | $39.99 / yr | 7-day free trial | Default selection, big CTA |
| Monthly *(secondary)* | $4.99 / mo | No trial | Quiet text link below primary |

Primary CTA: `START 7-DAY TRIAL`
Subtext: `7-day free trial, then $39.99 / year. Cancel anytime.`
Secondary: `Or subscribe monthly — $4.99 / mo →` (text-style link, opens monthly purchase)

## UI changes (`src/components/Paywall.tsx`)

- Remove the centered single-price block.
- Add a compact "selected plan" panel showing `$39.99 / YEAR · 7-DAY FREE TRIAL` with a tiny `MOST POPULAR` ribbon.
- Below the primary CTA, add the monthly text-link that switches the active package and triggers native purchase (no trial copy).
- Keep restore-purchases link and footer micro-text. Footer adapts to the selected plan.
- Preserve current brutalist visuals, type tokens, and entry animations — no design overhaul.

## Native purchase flow (`src/lib/iap.ts`)

- Replace single-offer fetch with two-package fetch from the `default` RevenueCat Offering: `annual` and `monthly`.
- New `getOffers()` returns `{ annual: NativeOffer | null; monthly: NativeOffer | null }`.
- `purchaseYearly()` stays. Add `purchaseMonthly()` (same shape).
- Generalize to `purchasePlan('annual' | 'monthly')` internally; export both named helpers for clarity.
- Track which plan was purchased: `track('paywall_purchase', { plan, active })`.

## RevenueCat setup the user needs to do (outside code)

In App Store Connect:
1. Create monthly subscription `brotein_monthly_499` at $4.99/mo, no intro offer, same subscription group as yearly.
2. Keep yearly `brotein_yearly_3999` with its 7-day intro offer.

In RevenueCat dashboard:
1. Add both products to the `default` Offering.
2. Identifiers: `$rc_annual` (annual package) + `$rc_monthly` (monthly package).
3. Make `annual` the default package.

These are dashboard/App Store steps — I'll add a checklist comment at the top of `iap.ts` so it's documented in code.

## Web fallback (`src/lib/paywall.ts`)

- Web flow stays trial-only (no real billing on web). Monthly link on web simply starts the same local trial — the App Store is the only place real money moves.

## Analytics (`src/lib/track.ts`)

Existing events stay. Extend payloads:
- `paywall_viewed` → add `default_plan: 'annual'`
- `paywall_purchase` → add `plan: 'annual' | 'monthly'`
- New: `paywall_plan_selected` when user taps the monthly link

## Out of scope

- No lifetime plan, no weekly plan.
- No changes to when the paywall triggers (still 3 logs OR 2 days).
- No price changes for the existing yearly product.
- No Stripe/web checkout — Apple still requires StoreKit for digital subs.
