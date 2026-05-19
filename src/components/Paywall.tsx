import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { isIOS, isNative, tapHaptic } from '@/lib/native';
import { getOffers, purchasePlan, restorePurchases, type Offers, type PlanId } from '@/lib/iap';
import { track } from '@/lib/track';

interface Props {
  streak?: number;
  /** Called when entitlement is granted (either via StoreKit on iOS, or web fallback trial). */
  onStart: () => void;
}

export default function Paywall({ streak = 0, onStart }: Props) {
  const native = isNative() && isIOS();
  const [offers, setOffers] = useState<Offers>({ annual: null, monthly: null });
  const [plan, setPlan] = useState<PlanId>('annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    void getOffers()
      .then(o => { if (!cancelled) setOffers(o); })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [native]);

  const annualPrice  = offers.annual?.priceString  ?? '$39.99';
  const monthlyPrice = offers.monthly?.priceString ?? '$4.99';
  const trialAvailable = !!offers.annual?.introPriceString || !native;

  const purchase = async (which: PlanId) => {
    void tapHaptic();
    if (busy) return;
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
    : trialAvailable
      ? 'START 7-DAY FREE TRIAL'
      : `SUBSCRIBE ${annualPrice}/YR`;

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

        {/* Selected plan panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-12 border-2 border-foreground p-5 relative"
        >
          <span className="absolute -top-3 left-4 bg-background px-2 font-mono text-[10px] font-bold tracking-[0.25em] uppercase">
            MOST POPULAR
          </span>
          {trialAvailable ? (
            <>
              <p className="font-display font-black text-3xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                7-DAY FREE TRIAL
              </p>
              <p className="mt-2 font-mono text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">
                THEN {annualPrice} / YEAR · BILLED YEARLY
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </motion.div>

        {/* Primary CTA */}
        <motion.button
          onClick={() => purchase('annual')}
          disabled={busy}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.06 }}
          className="mt-5 w-full bg-foreground text-background font-black tracking-[0.15em] text-sm py-5 active:opacity-90"
          style={{ opacity: busy && plan === 'annual' ? 0.5 : 1 }}
        >
          {plan === 'annual' && busy ? 'WORKING…' : primaryCta}
        </motion.button>

        <p className="mt-3 text-center text-[11px] opacity-50 leading-relaxed">
          {trialAvailable
            ? <>Free for 7 days, then {annualPrice}/year. Cancel anytime in Settings.</>
            : <>{annualPrice} per year. Cancel anytime in Settings.</>}
        </p>

        {/* Monthly secondary link */}
        <button
          onClick={() => purchase('monthly')}
          disabled={busy}
          className="mt-5 w-full font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground active:opacity-60 py-2"
        >
          {plan === 'monthly' && busy
            ? 'WORKING…'
            : <>OR SUBSCRIBE MONTHLY — {monthlyPrice} / MO →</>}
        </button>

        {native && (
          <button
            onClick={restore}
            disabled={busy}
            className="mt-2 w-full text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground active:opacity-60"
          >
            RESTORE PURCHASES
          </button>
        )}

        {/* Footer micro-text */}
        <p className="mt-4 mb-2 text-center text-[10px] opacity-40 tracking-[0.15em] uppercase">
          {native ? 'Cancel in Settings · Auto-renews' : 'Cancel anytime · Charged after trial ends'}
        </p>
      </div>
    </div>
  );
}
