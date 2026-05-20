import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getSubscriptionStatus, restorePurchases, type SubscriptionStatus } from '@/lib/iap';
import { isIOS, isNative } from '@/lib/native';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

function planLabel(plan: SubscriptionStatus['plan']): string {
  if (plan === 'annual') return 'ANNUAL · $39.99/YR';
  if (plan === 'monthly') return 'MONTHLY · $4.99/MO';
  return 'UNKNOWN';
}

export default function SubscriptionPanel() {
  const native = isNative() && isIOS();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const s = await getSubscriptionStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await restorePurchases();
      if (ok) toast.success('Purchases restored');
      else toast.message('No active subscription found');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const manage = () => {
    if (!status?.managementURL) {
      toast.message('Open Settings → Apple ID → Subscriptions to manage');
      return;
    }
    window.open(status.managementURL, '_blank', 'noopener,noreferrer');
  };

  const isTrial = status?.periodType === 'TRIAL' || status?.periodType === 'INTRO';
  const renewLabel = status?.willRenew
    ? (isTrial ? 'TRIAL ENDS' : 'RENEWS')
    : 'EXPIRES';

  return (
    <motion.div variants={fadeUp} className="mt-10 pt-8 border-t-2 border-foreground space-y-4">
      <div className="flex items-center justify-between">
        <p className="label-spaced">SUBSCRIPTION</p>
        {status && (
          <span
            className={`font-mono text-[10px] font-black tracking-[0.25em] uppercase px-2 py-[3px] ${
              status.active
                ? 'bg-foreground text-background'
                : 'border border-foreground/40 text-foreground/70'
            }`}
          >
            {status.active ? (isTrial ? 'TRIAL' : 'ACTIVE') : 'INACTIVE'}
          </span>
        )}
      </div>

      {loading ? (
        <p className="font-mono text-xs opacity-50 tracking-widest uppercase">LOADING…</p>
      ) : !native ? (
        <p className="font-mono text-xs opacity-60 tracking-wider leading-relaxed">
          Subscription status is only available in the iOS app.
        </p>
      ) : status?.active ? (
        <div className="space-y-4">
          <div>
            <p className="label-spaced">PLAN</p>
            <p className="text-lg font-black font-display tracking-tight">
              {planLabel(status.plan)}
            </p>
          </div>
          <div>
            <p className="label-spaced">{renewLabel}</p>
            <p className="text-lg font-bold">{formatDate(status.expirationDate)}</p>
            {!status.willRenew && status.expirationDate && (
              <p className="font-mono text-[10px] font-bold tracking-widest uppercase opacity-50 mt-1">
                AUTO-RENEW OFF
              </p>
            )}
          </div>
          <button
            className="w-full p-4 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform"
            onClick={manage}
            disabled={busy}
          >
            MANAGE SUBSCRIPTION
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-xs opacity-60 tracking-wider leading-relaxed">
            No active subscription on this device.
          </p>
          <button
            className="w-full p-4 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform disabled:opacity-50"
            onClick={restore}
            disabled={busy}
          >
            {busy ? 'WORKING…' : 'RESTORE PURCHASES'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
