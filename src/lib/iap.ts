// Lightweight wrapper around RevenueCat for iOS in-app purchases.
// Apple requires StoreKit for digital subscriptions — Stripe/web checkout will be rejected.
// On non-iOS platforms, all functions no-op and the caller falls back to the existing
// web-only trial flow (`startTrial` in src/lib/paywall.ts).
//
// Setup checklist (one-time, outside of code):
//   1. Create a RevenueCat account, add an iOS app, paste your App Store Connect shared secret.
//   2. In App Store Connect, create two subscription products in the SAME subscription group:
//        • `brotein_yearly_3999`  — $39.99 / year, attach a 7-DAY FREE intro offer.
//        • `brotein_monthly_499`  — $4.99 / month, NO intro offer.
//   3. In RevenueCat → Offerings, edit the `default` Offering and add BOTH products as packages:
//        • Package `$rc_annual`  → brotein_yearly_3999  (set as default)
//        • Package `$rc_monthly` → brotein_monthly_499
//   4. Paste the RevenueCat public iOS SDK key below (REVENUECAT_IOS_API_KEY).
//   5. After adding the iOS platform with Capacitor, run `npx cap sync ios` so the native
//      RevenueCat pod is installed.

import { isIOS, isNative } from './native';
import { track } from './track';

// PUBLIC SDK key — safe to ship in client bundles (designed to live in the app binary).
// Live iOS key from RevenueCat → Project Settings → API Keys.
const REVENUECAT_IOS_API_KEY = 'appl_GMNzqrpWvFAfMqRzNyusqJgZTLw';
const REVENUECAT_ANDROID_API_KEY = ''; // fill in if/when Android ships
const ENTITLEMENT_ID = 'Brotein Pro';
const OFFERING_ID = 'default';
const KNOWN_PRODUCT_IDS = ['brotein_yearly_3999', 'brotein_monthly_499'];

export type PlanId = 'annual' | 'monthly';

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

async function getCurrentOffering() {
  await ensureInit();
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  const { current } = await Purchases.getOfferings();
  return current ?? null;
}

function pkgToOffer(pkg: any): NativeOffer | null {
  if (!pkg) return null;
  const p = pkg.product;
  return {
    identifier: pkg.identifier,
    priceString: p.priceString,
    introPriceString: p.introPrice?.priceString,
    period: p.subscriptionPeriod ?? '',
  };
}

function hasActivePro(customerInfo: any): boolean {
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};
  if (activeEntitlements[ENTITLEMENT_ID]) return true;
  if (Object.keys(activeEntitlements).length > 0) return true;

  const activeSubscriptions: string[] = customerInfo?.activeSubscriptions ?? [];
  if (activeSubscriptions.length > 0) return true;

  const subsByProduct = customerInfo?.subscriptionsByProductIdentifier ?? {};
  return KNOWN_PRODUCT_IDS.some((id) => {
    const sub = subsByProduct[id];
    if (!sub) return false;
    const expires = sub.expiresDate ?? sub.expirationDate;
    return !expires || Date.parse(expires) > Date.now();
  });
}

async function waitForActivePro(customerInfo?: any): Promise<boolean> {
  if (hasActivePro(customerInfo)) return true;
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  for (const delay of [500, 1000, 1500, 2500]) {
    await new Promise(resolve => setTimeout(resolve, delay));
    const refreshed = await Purchases.getCustomerInfo();
    if (hasActivePro(refreshed.customerInfo)) return true;
  }
  return false;
}

export interface Offers {
  annual: NativeOffer | null;
  monthly: NativeOffer | null;
}

export async function getOffers(): Promise<Offers> {
  if (!isNative() || !isIOS()) return { annual: null, monthly: null };
  const current = await getCurrentOffering();
  return {
    annual: pkgToOffer(current?.annual ?? null),
    monthly: pkgToOffer(current?.monthly ?? null),
  };
}

/** Back-compat helper — returns only the yearly offer. */
export async function getYearlyOffer(): Promise<NativeOffer | null> {
  const { annual } = await getOffers();
  return annual ?? (await getOffers()).monthly; // last-resort fallback
}

/**
 * Launch native StoreKit purchase sheet for the requested plan.
 * Returns true if entitled (purchase OR existing active sub), false if user cancels.
 * Throws on real errors.
 */
export async function purchasePlan(plan: PlanId): Promise<boolean> {
  if (!isNative() || !isIOS()) {
    throw new Error('Native purchases only available on iOS');
  }
  await ensureInit();
  const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
  const { current } = await Purchases.getOfferings();
  const pkg = plan === 'annual'
    ? (current?.annual ?? current?.availablePackages?.[0])
    : (current?.monthly ?? current?.availablePackages?.find((p: any) => /month/i.test(p.identifier)));
  if (!pkg) throw new Error(`No ${plan} subscription available`);
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const active = await waitForActivePro(result.customerInfo);
    track('paywall_purchase', { plan, active });
    return active;
  } catch (e: any) {
    if (e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || /cancel/i.test(e?.message ?? '')) {
      return false;
    }
    throw e;
  }
}

export const purchaseYearly = () => purchasePlan('annual');
export const purchaseMonthly = () => purchasePlan('monthly');

export async function restorePurchases(): Promise<boolean> {
  if (!isNative() || !isIOS()) return false;
  await ensureInit();
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  const info = await Purchases.restorePurchases();
  const active = await waitForActivePro(info.customerInfo);
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
    return hasActivePro(customerInfo);
  } catch { return false; }
}

export interface SubscriptionStatus {
  /** True if RevenueCat reports an active "Brotein Pro" entitlement. */
  active: boolean;
  /** 'annual' | 'monthly' | null — inferred from productIdentifier. */
  plan: PlanId | null;
  /** Raw App Store product identifier, e.g. "brotein_yearly_3999". */
  productId: string | null;
  /** ISO timestamp of next renewal / expiration, or null if unknown. */
  expirationDate: string | null;
  /** True if the subscription is set to auto-renew. */
  willRenew: boolean;
  /** "NORMAL" | "INTRO" | "TRIAL" — whether the user is currently in a free trial. */
  periodType: string | null;
  /** Underlying store, e.g. "APP_STORE". */
  store: string | null;
  /** Deep link to App Store subscription management for this user, if available. */
  managementURL: string | null;
}

/** Full subscription snapshot for display in the Profile screen. */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const empty: SubscriptionStatus = {
    active: false, plan: null, productId: null, expirationDate: null,
    willRenew: false, periodType: null, store: null, managementURL: null,
  };
  if (!isNative() || !isIOS()) return empty;
  try {
    await ensureInit();
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();
    const ent: any = customerInfo.entitlements.active[ENTITLEMENT_ID]
      ?? Object.values(customerInfo.entitlements.active)[0]
      ?? null;
    const managementURL = (customerInfo as any).managementURL ?? null;
    if (!ent) return { ...empty, managementURL };
    const productId: string | null = ent.productIdentifier ?? null;
    const plan: PlanId | null = productId
      ? /year|annual|yearly/i.test(productId) ? 'annual'
        : /month/i.test(productId) ? 'monthly'
        : null
      : null;
    return {
      active: true,
      plan,
      productId,
      expirationDate: ent.expirationDate ?? null,
      willRenew: ent.willRenew ?? false,
      periodType: ent.periodType ?? null,
      store: ent.store ?? null,
      managementURL,
    };
  } catch (e) {
    console.warn('getSubscriptionStatus failed', e);
    return empty;
  }
}

export { OFFERING_ID, ENTITLEMENT_ID };
