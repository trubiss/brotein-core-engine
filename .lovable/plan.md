# Harden Paywall against StoreKit failures

Goal: prevent the raw "Failed to load products" error iPad reviewers saw, and make the paywall degrade gracefully when StoreKit/RevenueCat can't return offers.

## Changes (all in `src/components/Paywall.tsx`)

1. **Track offer-load state**
   - Add `offersStatus: 'loading' | 'ready' | 'error'` alongside the existing `offers` state.
   - In the `useEffect`, set `'loading'` on start, `'ready'` on success, `'error'` on catch (instead of swallowing silently).

2. **Friendly error banner (native + error only)**
   - When `native && offersStatus === 'error'`, show a small block above the plan cards: "Couldn't reach the App Store. Check your connection and try again." with a "RETRY" button that re-runs the fetch.
   - Don't show any raw exception strings, ever.

3. **Disable purchase CTA when offers unavailable**
   - On native: disable the primary CTA and both plan cards while `offersStatus !== 'ready'`.
   - CTA label becomes `LOADING…` while loading, `TAP RETRY ABOVE` when errored.
   - Keep RESTORE PURCHASES enabled in the error state (lets returning subscribers recover without needing offers).

4. **Guard `purchase()`**
   - Early-return with a toast `"Subscriptions unavailable right now. Pull to retry."` if `native && offersStatus !== 'ready'`, so a stale tap can't reach StoreKit in a broken state.

5. **No business-logic changes**
   - Web fallback path (`!native`) is unchanged.
   - `iap.ts`, pricing math, plan IDs, analytics events all untouched.

## Why this addresses the rejection
The reviewer saw an error because subscriptions weren't attached to the build, so `getOffers()` threw. With this change, even if that ever happens again, the user sees a polished retry UI instead of a stack-trace-looking toast — which is what App Review actually flags.
