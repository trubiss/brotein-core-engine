// Lightweight wrapper around RevenueCat for iOS in-app purchases.
// Apple requires StoreKit for digital subscriptions — Stripe/web checkout will be rejected.
// On non-iOS platforms, all functions no-op and the caller falls back to the existing
// web-only trial flow (`startTrial` in src/lib/paywall.ts).
//
// Setup checklist (one-time, outside of code):
//   1. Create a RevenueCat account, add an iOS app, paste your App Store Connect shared secret.
//   2. Create a subscription product in App Store Connect: id `brotein_yearly_3999`, price $39.99/yr,
//      with a 7-day free intro offer attached. Attach it to a RevenueCat Offering named "default"
//      with a single Package using the "Annual" identifier.
//   3. Paste the RevenueCat public iOS SDK key below (REVENUECAT_IOS_API_KEY).
//   4. After adding the iOS platform with Capacitor, run `npx cap sync ios` so the native
//      RevenueCat pod is installed.

import { isIOS, isNative } from './native';
import { track } from './track';

// PUBLIC SDK key — safe to ship in client bundles. Replace before shipping to production.
const REVENUECAT_IOS_API_KEY = 'appl_REPLACE_WITH_YOUR_RC_PUBLIC_IOS_KEY';
const ENTITLEMENT_ID = 'pro';
const OFFERING_ID = 'default';

let initPromise: Promise<void> | null = null;

async function ensureInit(userId?: string | null) {
  if (!isNative() || !isIOS()) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({
      apiKey: REVENUECAT_IOS_API_KEY,
      appUserID: userId ?? undefined,
    });
  })().catch(err => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

/** Call after sign-in so purchases attribute to the right Firebase UID. */
export async function identifyPurchaser(userId: string | null) {
  if (!isNative() || !isIOS()) return;
  try {
    await ensureInit(userId);
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    if (userId) await Purchases.logIn({ appUserID: userId });
    else await Purchases.logOut();
  } catch (e) { console.warn('RevenueCat identify failed', e); }
}

export interface NativeOffer {
  identifier: string;
  priceString: string; // localized, e.g. "$39.99"
  introPriceString?: string;
  period: string; // "P1Y"
}

export async function getYearlyOffer(): Promise<NativeOffer | null> {
  if (!isNative() || !isIOS()) return null;
  await ensureInit();
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  const { current } = await Purchases.getOfferings();
  const pkg = current?.annual ?? current?.availablePackages?.[0];
  if (!pkg) return null;
  const p = pkg.product;
  return {
    identifier: pkg.identifier,
    priceString: p.priceString,
    introPriceString: p.introPrice?.priceString,
    period: p.subscriptionPeriod ?? 'P1Y',
  };
}

/**
 * Launch native StoreKit purchase sheet for the annual plan.
 * Returns true if entitled (purchase OR existing active sub), false if user cancels.
 * Throws on real errors.
 */
export async function purchaseYearly(): Promise<boolean> {
  if (!isNative() || !isIOS()) {
    throw new Error('Native purchases only available on iOS');
  }
  await ensureInit();
  const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
  const { current } = await Purchases.getOfferings();
  const pkg = current?.annual ?? current?.availablePackages?.[0];
  if (!pkg) throw new Error('No subscription offering available');
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const active = !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
    track('paywall_purchase', { active });
    return active;
  } catch (e: any) {
    if (e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || /cancel/i.test(e?.message ?? '')) {
      return false;
    }
    throw e;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative() || !isIOS()) return false;
  await ensureInit();
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  const info = await Purchases.restorePurchases();
  const active = !!info.customerInfo.entitlements.active[ENTITLEMENT_ID];
  track('paywall_restore', { active });
  return active;
}

/** True if the user currently has an active "pro" entitlement on this device. */
export async function hasProEntitlement(): Promise<boolean> {
  if (!isNative() || !isIOS()) return false;
  try {
    await ensureInit();
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch { return false; }
}

export { OFFERING_ID, ENTITLEMENT_ID };
