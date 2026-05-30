import { forwardRef, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { computePace } from '@/lib/pace';
import { formatLocalTime, endOfDay } from '@/lib/time';

interface Props {
  consumed: number;
  target: number;
}

/**
 * MVP pace: a single status line — AHEAD / ON TRACK / BEHIND.
 * No meal distribution, no recommendation cards. One idea per screen.
 */
const ProteinPace = forwardRef<HTMLDivElement, Props>(function ProteinPace({ consumed, target }, ref) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pace = useMemo(() => computePace(consumed, target, now), [consumed, target, now]);

  const Icon = pace.status === 'ahead' ? TrendingUp : pace.status === 'behind' ? TrendingDown : Minus;
  const headline =
    pace.status === 'ahead' ? 'AHEAD OF PACE'
    : pace.status === 'behind' ? 'BEHIND'
    : 'ON TRACK';

  const sub =
    pace.status === 'behind'
      ? `NEED ${Math.max(0, target - consumed)}G BY ${formatLocalTime(endOfDay(now)).toUpperCase()}`
      : pace.status === 'ahead'
        ? `+${pace.diff}G VS EXPECTED`
        : `${consumed}G OF ${pace.expected}G EXPECTED`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-4"
    >
      <p className="label-spaced">PROTEIN PACE</p>
      <div className="border-2 border-foreground p-4 flex items-center gap-3 min-w-0">
        <Icon size={18} strokeWidth={2.5} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-black tracking-[0.12em] truncate">{headline}</p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5 truncate">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
});

export default ProteinPace;
