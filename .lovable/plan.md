## Pre-resubmission checklist

Apple Sign-In works now — good. But before you resubmit, there are real rejection risks in the current build. Here's what to do, in order.

### 1. Swap RevenueCat test key for the live key (CRITICAL)

`src/lib/iap.ts` currently ships with the **test** RevenueCat key:
```
const REVENUECAT_IOS_API_KEY = 'test_LIpJqqukaFfMTNtAlMEpeYIfIsw';
```
With this key in production, real purchases will not work and Apple's reviewer will fail to subscribe → guaranteed rejection (Guideline 2.1).

**Action:** I'll swap it for the live key (starts with `appl_…`) from RevenueCat → Project Settings → API Keys. You'll need to provide this key.

### 2. Confirm App Store Connect subscription products are "Ready to Submit"

In App Store Connect, both products must exist, be priced, have localized metadata + screenshot, and be attached to **this build** in the submission form:
- `brotein_yearly_3999` — $39.99/year with 7-day free intro offer
- `brotein_monthly_499` — $4.99/month

If they show "Missing Metadata" or aren't attached to the build, Apple rejects on Guideline 2.1.

### 3. Fix Terms of Service language about the trial

`src/components/legal/TermsOfService.tsx` section 4 still says:
> "While in beta, the trial flow is visual only — no payment is collected."

That contradicts shipping real StoreKit billing. Reviewers read this. **Action:** rewrite section 4 with proper auto-renewing subscription disclosure (price, period, auto-renewal, cancel via Settings, link to Terms & Privacy) — Apple requires this verbatim-ish language near the purchase button AND in the terms (Guideline 3.1.2).

### 4. Add required subscription disclosure on the Paywall screen

Apple requires the following to appear on the paywall itself, near the CTA:
- Title of subscription
- Length of subscription
- Price per period
- Statement that it auto-renews unless cancelled 24h before period end
- Statement that the account is charged for renewal within 24h prior to period end
- Links to Terms of Use and Privacy Policy

I'll audit `Paywall.tsx` and add anything missing.

### 5. Verify `GoogleService-Info.plist` is in the App Store archive

Now that Firebase works locally, double-check the plist is added to the **App** target's "Copy Bundle Resources" build phase (not just dragged into the project). Otherwise it'll crash for the reviewer the same way it crashed for you.

### 6. Rebuild, archive, upload, attach IAPs, submit

```
npm run build
npx cap sync ios
# In Xcode: Product → Archive → Distribute → App Store Connect
# In App Store Connect: edit the new build's submission, attach both IAP products, submit for review
```

## What I need from you to proceed in build mode

1. The **live** RevenueCat iOS API key (starts with `appl_`)
2. Confirmation that both IAP products exist in App Store Connect and are at minimum in "Ready to Submit" state

Once you give me the key, I'll make changes 1, 3, and 4 in one pass. Items 2, 5, and 6 are on you (Xcode + App Store Connect — outside the codebase).
