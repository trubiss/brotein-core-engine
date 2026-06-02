import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { isIOS, isNative, tapHaptic } from '@/lib/native';
import { getOffers, purchasePlan, restorePurchases, type Offers, type PlanId } from '@/lib/iap';
import { track } from '@/lib/track';
import PrivacyPolicy from './legal/PrivacyPolicy';
import TermsOfService from './legal/TermsOfService';

interface Props {
  streak?: number;
  /** Called when entitlement is granted (either via StoreKit on iOS, or web fallback trial). */
  onStart: () => void;
  /** Optional dismiss handler — when provided, shows a "MAYBE LATER" button. */
  onClose?: () => void;
}

export default function Paywall({ streak = 0, onStart, onClose }: Props) {
  const native = isNative() && isIOS();
  const [offers, setOffers] = useState<Offers>({ annual: null, monthly: null });
  const [offersStatus, setOffersStatus] = useState<'loading' | 'ready' | 'error'>(
    native ? 'loading' : 'ready'
  );
  const [plan, setPlan] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState<null | 'privacy' | 'terms'>(null);

  const loadOffers = () => {
    if (!native) return undefined;
    setOffersStatus('loading');
    let cancelled = false;
    void getOffers()
      .then(o => {
        if (cancelled) return;
        setOffers(o);
        setOffersStatus(o.annual || o.monthly ? 'ready' : 'error');
      })
      .catch(() => {
        if (!cancelled) setOffersStatus('error');
      });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    const cleanup = loadOffers();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  const annualPrice  = offers.annual?.priceString  ?? '$39.99';
  const monthlyPrice = offers.monthly?.priceString ?? '$4.99';
  const trialAvailable = !!offers.annual?.introPriceString || !native;

  // Compute savings % (annual vs monthly × 12) from numeric prices when possible.
  const parsePrice = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const annualNum = parsePrice(annualPrice);
  const monthlyNum = parsePrice(monthlyPrice);
  const savingsPct = annualNum && monthlyNum
    ? Math.max(0, Math.round((1 - annualNum / (monthlyNum * 12)) * 100))
    : 33;
  const perWeek = annualNum
    ? `$${(annualNum / 52).toFixed(2)}`
    : '$0.77';

  const offersBlocked = native && offersStatus !== 'ready';

  const selectPlan = (which: PlanId) => {
    if (offersBlocked) return;
    void tapHaptic();
    setPlan(which);
    track('paywall_plan_selected', { plan: which });
  };

  const purchase = async (which: PlanId) => {
    void tapHaptic();
    if (busy) return;
    if (offersBlocked) {
      toast.error('Subscriptions unavailable right now. Tap retry to try again.');
      return;
    }
    setPlan(which);
    track('paywall_plan_selected', { plan: which });
    if (!native) { onStart(); return; }
    setBusy(true);
    try {
      const ok = await purchasePlan(which);
      if (ok) onStart();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!native || busy) return;
    setBusy(true);
    try {
      const ok = await restorePurchases();
      if (ok) { toast.success('Purchases restored'); onStart(); }
      else toast.message('No active subscription found');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const primaryCta = busy
    ? 'WORKING…'
    : native && offersStatus === 'loading'
      ? 'LOADING…'
      : native && offersStatus === 'error'
        ? 'TAP RETRY ABOVE'
        : plan === 'monthly'
          ? `SUBSCRIBE ${monthlyPrice}/MO`
          : trialAvailable
            ? `SUBSCRIBE ${annualPrice}/YR · 7-DAY FREE TRIAL`
            : `SUBSCRIBE ${annualPrice}/YR`;

  const annualSelected = plan === 'annual';
  const monthlySelected = plan === 'monthly';

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-y-auto">
      <div className="min-h-full flex flex-col px-6 py-10 max-w-[440px] mx-auto">
        {/* Brand mark */}
        <p className="label-spaced mb-8 opacity-40 tracking-[0.3em] text-center">BROTEIN</p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-display font-black text-[clamp(2.25rem,7vw,2.6rem)] leading-[1.05] text-center"
          style={{ letterSpacing: '-0.03em' }}
        >
          STOP GUESSING.<br />START GROWING.
        </motion.h1>

        {/* Subtext */}
        <p className="mt-6 text-center text-[15px] leading-snug text-muted-foreground">
          The difference between guys who build muscle and those who don't isn't the gym. It's whether they hit protein every day.
        </p>

        {/* Streak context */}
        {streak > 0 && (
          <p className="mt-8 text-center label-spaced opacity-70 tracking-[0.25em]">
            YOU'RE ON A {streak}-DAY STREAK
          </p>
        )}

        {/* Identity bullets */}
        <ul className="mt-10 space-y-3">
          {[
            'Never miss your number',
            'Build a streak that proves it',
            'Become consistent',
          ].map((line) => (
            <li key={line} className="flex items-start gap-3 text-[15px]">
              <span className="font-black mt-[1px]">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* Offer-load error banner — native only */}
        {native && offersStatus === 'error' && (
          <div className="mt-10 border border-foreground/40 p-4">
            <p className="text-[13px] leading-snug">
              Couldn't reach the App Store. Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => { void tapHaptic(); loadOffers(); }}
              className="mt-3 w-full bg-foreground text-background font-black tracking-[0.2em] text-xs py-3 active:opacity-90"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div className={`mt-12 space-y-4 ${offersBlocked ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Annual card */}
          <motion.button
            type="button"
            onClick={() => selectPlan('annual')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`w-full text-left p-5 relative block transition-[border-color,opacity] ${
              annualSelected
                ? 'border-2 border-foreground'
                : 'border border-foreground/30 opacity-70'
            }`}
            aria-pressed={annualSelected}
          >
            <span className="absolute -top-3 left-4 bg-background px-2 font-mono text-[10px] font-bold tracking-[0.25em] uppercase">
              MOST POPULAR
            </span>
            {savingsPct > 0 && (
              <span className="absolute -top-3 right-4 bg-foreground text-background px-2 py-[2px] font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                SAVE {savingsPct}%
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <p className="font-display font-black text-3xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                {annualPrice}
              </p>
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">
                / YEAR
              </p>
            </div>
            <p className="mt-2 font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">
              BILLED YEARLY
            </p>
            {trialAvailable && (
              <p className="mt-1 font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">
                INCLUDES 7-DAY FREE TRIAL
              </p>
            )}
            <p className="mt-3 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
              JUST {perWeek} / WEEK
            </p>
          </motion.button>

          {/* Monthly card */}
          <motion.button
            type="button"
            onClick={() => selectPlan('monthly')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={`w-full text-left p-5 relative block transition-[border-color,opacity] ${
              monthlySelected
                ? 'border-2 border-foreground'
                : 'border border-foreground/30 opacity-70'
            }`}
            aria-pressed={monthlySelected}
          >
            <div className="flex items-baseline justify-between">
              <p className="font-display font-black text-3xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                {monthlyPrice}
              </p>
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">
                / MO
              </p>
            </div>
            <p className="mt-2 font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">
              BILLED MONTHLY · CANCEL ANYTIME
            </p>
            <p className="mt-3 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
              NO TRIAL · FLEXIBLE
            </p>
          </motion.button>
        </div>

        {/* Primary CTA */}
        <motion.button
          onClick={() => purchase(plan)}
          disabled={busy || offersBlocked}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.06 }}
          className="mt-5 w-full bg-foreground text-background font-black tracking-[0.15em] text-sm py-5 active:opacity-90"
          style={{ opacity: busy || offersBlocked ? 0.5 : 1 }}
        >
          {primaryCta}
        </motion.button>

        <p className="mt-3 text-center text-[11px] opacity-50 leading-relaxed">
          {monthlySelected
            ? <>{monthlyPrice} per month. Cancel anytime in Settings.</>
            : trialAvailable
              ? <>{annualPrice}/year after a 7-day free trial. Cancel anytime in Settings.</>
              : <>{annualPrice} per year. Cancel anytime in Settings.</>}
        </p>

        <button
          onClick={restore}
          disabled={busy}
          className="mt-4 w-full text-xs tracking-[0.3em] uppercase font-bold py-3 border border-foreground/30 active:opacity-60 hover:opacity-80 transition-opacity"
        >
          RESTORE PURCHASES
        </button>

        {/* Footer micro-text — Apple-required auto-renewing subscription disclosure */}
        <p className="mt-4 mb-2 text-center text-[10px] opacity-50 tracking-normal leading-relaxed normal-case">
          Payment is charged to your Apple ID at confirmation of purchase. Subscription
          automatically renews unless auto-renew is turned off at least 24 hours before the end of
          the current period. Your account is charged for renewal within 24 hours prior to the end
          of the current period. Manage or cancel anytime in iPhone Settings → Subscriptions.
        </p>

        {/* Legal links — required by App Store for subscription paywalls */}
        <div className="mt-2 flex justify-center gap-4 text-[10px] tracking-[0.25em] uppercase font-bold opacity-50">
          <button
            type="button"
            onClick={() => { void tapHaptic(); setLegal('terms'); }}
            className="active:opacity-60 hover:opacity-80 transition-opacity"
          >
            TERMS
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => { void tapHaptic(); setLegal('privacy'); }}
            className="active:opacity-60 hover:opacity-80 transition-opacity"
          >
            PRIVACY
          </button>
        </div>

        {onClose && (
          <button
            onClick={() => { void tapHaptic(); track('paywall_dismissed', { plan }); onClose(); }}
            disabled={busy}
            className="mt-5 mb-2 w-full text-sm tracking-[0.25em] uppercase font-bold py-4 underline underline-offset-4 decoration-foreground/40 active:opacity-60 hover:opacity-80 transition-opacity"
          >
            CONTINUE WITH FREE VERSION
          </button>
        )}
      </div>

      <AnimatePresence>
        {legal && (
          <motion.div
            key={legal}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background text-foreground overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => { void tapHaptic(); setLegal(null); }}
              className="fixed top-4 left-4 z-[61] p-2 border-2 border-foreground bg-background active:scale-95 transition-transform"
              aria-label="Back to paywall"
            >
              <ArrowLeft size={20} />
            </button>
            {legal === 'terms' ? <TermsOfService /> : <PrivacyPolicy />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
