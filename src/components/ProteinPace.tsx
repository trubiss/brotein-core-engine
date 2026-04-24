import { forwardRef, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { FoodLog } from '@/lib/types';
import { computePace, computeMealDistribution, distributionRecommendation } from '@/lib/pace';

interface Props {
  logs: FoodLog[];
  consumed: number;
  target: number;
}

const ProteinPace = forwardRef<HTMLDivElement, Props>(function ProteinPace({ logs, consumed, target }, ref) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pace = useMemo(() => computePace(consumed, target, now), [consumed, target, now]);
  const splits = useMemo(() => computeMealDistribution(logs, target), [logs, target]);
  const recommendation = useMemo(() => distributionRecommendation(splits, pace, now), [splits, pace, now]);

  const Icon = pace.status === 'ahead' ? TrendingUp : pace.status === 'behind' ? TrendingDown : Minus;
  const statusLabel = pace.status === 'on-pace' ? 'ON PACE' : pace.status === 'behind' ? 'BEHIND PACE' : 'AHEAD OF PACE';
  const diffLabel = pace.diff === 0 ? 'EXACTLY ON TARGET' : `${pace.diff > 0 ? '+' : ''}${pace.diff}G VS EXPECTED`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <p className="label-spaced">PROTEIN PACE</p>
      <div className="border-2 border-foreground p-4">
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={16} strokeWidth={2.5} className="shrink-0" />
            <p className="font-display text-sm font-bold tracking-[0.15em] truncate">{statusLabel}</p>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground shrink-0">
            {Math.round(pace.pctOfDay)}% OF DAY
          </span>
        </div>

        {/* Dual bar: expected marker over actual fill */}
        <div className="relative h-3 border-2 border-foreground mb-3">
          <div
            className="absolute top-0 left-0 bottom-0 bg-foreground"
            style={{ width: `${Math.min(100, (pace.actual / target) * 100)}%`, transition: 'width 0.5s ease-out' }}
          />
          <div
            className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-foreground"
            style={{ left: `${Math.min(100, (pace.expected / target) * 100)}%` }}
            aria-label="expected pace marker"
          />
        </div>

        <div className="flex justify-between text-[10px] tracking-[0.2em] uppercase mb-2 gap-2 min-w-0">
          <span className="font-display font-bold truncate">{diffLabel}</span>
          <span className="text-muted-foreground whitespace-nowrap">EXP {pace.expected}G</span>
        </div>
      </div>

      {/* Meal distribution */}
      <p className="label-spaced mt-6">MEAL DISTRIBUTION</p>
      <div className="border-t-2 border-foreground">
        {splits.map(s => {
          const pct = s.suggested > 0 ? Math.min(100, (s.actual / s.suggested) * 100) : 0;
          return (
            <div key={s.mealType} className="py-3 border-b border-border min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1.5 min-w-0">
                <p className="text-xs font-bold tracking-[0.15em] truncate">{s.label}</p>
                <span className="font-display text-[11px] font-bold whitespace-nowrap">
                  {s.actual}G / {s.suggested}G
                </span>
              </div>
              <div className="h-1.5 bg-muted">
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${pct}%`, transition: 'width 0.4s ease-out' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 border-2 border-foreground p-3 flex items-start gap-2"
        >
          <AlertTriangle size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" />
          <p className="text-[11px] tracking-[0.15em] uppercase font-bold leading-relaxed">{recommendation}</p>
        </motion.div>
      )}
    </motion.div>
  );
});

export default ProteinPace;
