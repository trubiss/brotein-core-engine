import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { success } from '@/lib/haptics';

interface Props {
  open: boolean;
  grams: number;
  streak: number;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#FF3B30', '#FFCC00', '#34C759', '#0A84FF', '#AF52DE', '#FF9500', '#FF2D55'];

export default function GoalHitCelebration({ open, grams, streak, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    void success();
    const t = setTimeout(() => { void success(); }, 320);
    return () => clearTimeout(t);
  }, [open]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.4 + Math.random() * 0.8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 80,
      })),
    [open]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map(c => (
              <motion.span
                key={c.id}
                initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
                animate={{ y: '110vh', x: c.drift, opacity: [0, 1, 1, 0.6], rotate: 360 }}
                transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
                className="absolute rounded-full"
                style={{
                  left: `${c.left}%`,
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="relative w-full max-w-sm bg-white text-black rounded-2xl px-7 py-8 shadow-2xl text-center"
          >
            <div className="text-6xl mb-4" aria-hidden>💪</div>
            <h2 className="font-display font-black tracking-[0.08em] text-3xl mb-3">GOAL HIT.</h2>
            <p className="text-sm text-black/70 leading-relaxed mb-5">
              You hit {Math.round(grams)}g protein today. That's a day of muscle growth.
            </p>
            <p className="font-display text-[11px] font-bold tracking-[0.22em] uppercase text-black/60 mb-6">
              STREAK · {streak} {streak === 1 ? 'DAY' : 'DAYS'}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-black text-white rounded-full py-3.5 font-display font-black text-sm tracking-[0.08em] active:opacity-90"
            >
              Keep the streak going →
            </button>
            <button
              onClick={onClose}
              className="mt-3 text-xs text-black/40 hover:text-black/70 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
