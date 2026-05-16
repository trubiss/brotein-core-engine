import { motion } from 'framer-motion';

const haptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(8); } catch { /* noop */ }
  }
};

interface Props {
  streak?: number;
  onStart: () => void;
}

export default function Paywall({ streak = 0, onStart }: Props) {
  const handle = () => {
    haptic();
    onStart();
  };

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

        {/* Price block */}
        <div className="mt-12 text-center">
          <p className="font-display font-black text-4xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            $39 <span className="opacity-50 font-normal text-2xl">/ YEAR</span>
          </p>
          <p className="mt-2 label-spaced opacity-60 tracking-[0.25em]">7-DAY FREE TRIAL</p>
          <p className="mt-1 text-[11px] opacity-40">Less than $4/month</p>
        </div>

        {/* CTA */}
        <motion.button
          onClick={handle}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.06 }}
          className="mt-8 w-full bg-foreground text-background font-black tracking-[0.15em] text-sm py-5 active:opacity-90"
        >
          START 7-DAY TRIAL
        </motion.button>

        {/* Footer micro-text */}
        <p className="mt-4 mb-2 text-center text-[10px] opacity-40 tracking-[0.15em] uppercase">
          Cancel anytime · Charged after trial ends
        </p>
      </div>
    </div>
  );
}
