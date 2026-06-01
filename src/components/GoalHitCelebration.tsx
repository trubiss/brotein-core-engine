import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  consumed: number;
  target: number;
  streak: number;
  onClose: () => void;
}

const MESSAGES = [
  'KEEP GRINDING',
  'LOCKED IN',
  'FUEL SECURED',
  'ANOTHER DAY DOMINATED',
  'NO DAYS OFF',
  'TARGET DESTROYED',
];

export default function GoalHitCelebration({ consumed, target, streak, onClose }: Props) {
  const headline = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([12, 40, 18]); } catch { /* noop */ }
    }
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-label="Daily protein goal hit"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 cursor-pointer select-none overflow-hidden"
    >
      {/* Hairline frame for brutalist feel */}
      <div aria-hidden className="absolute inset-3 border border-foreground/20 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <motion.span
          aria-hidden
          animate={{
            scale: [1, 1.1, 0.95, 1.06, 1],
            rotate: [-2, 2, -1, 1, 0],
            filter: [
              'drop-shadow(0 0 0px hsl(var(--foreground)/0))',
              'drop-shadow(0 0 24px hsl(var(--foreground)/0.25))',
              'drop-shadow(0 0 12px hsl(var(--foreground)/0.15))',
              'drop-shadow(0 0 28px hsl(var(--foreground)/0.30))',
              'drop-shadow(0 0 0px hsl(var(--foreground)/0))',
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="block leading-none motion-reduce:animate-none"
          style={{ fontSize: 'clamp(10rem, 38vh, 22rem)' }}
        >
          🔥
        </motion.span>

        <motion.h2
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.35, ease: 'easeOut' }}
          className="mt-8 font-display font-black text-center tracking-[0.15em] uppercase leading-tight"
          style={{ fontSize: 'clamp(1.75rem, 7vw, 3rem)' }}
        >
          {headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.32, duration: 0.3 }}
          className="mt-3 text-[11px] tracking-[0.22em] uppercase text-center"
        >
          {consumed}G / {target}G · STREAK {streak} {streak === 1 ? 'DAY' : 'DAYS'}
        </motion.p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="absolute bottom-10 text-[9px] tracking-[0.3em] uppercase"
      >
        TAP TO DISMISS
      </motion.p>
    </motion.div>
  );
}
