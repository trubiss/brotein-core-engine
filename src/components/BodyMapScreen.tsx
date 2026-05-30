import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getRecentSummaries } from '@/lib/firestore';
import BodyMap from './BodyMap';
import {
  currentTier,
  MAX_DAYS,
  MILESTONES,
  nextMilestone,
  progressPct,
} from '@/lib/bodyMap';

interface Props {
  onBack: () => void;
}

export default function BodyMapScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [hitDays, setHitDays] = useState(0);
  const [view, setView] = useState<'front' | 'back'>('front');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getRecentSummaries(user.uid, 365)
      .then(all => {
        if (cancelled) return;
        setHitDays(all.filter(s => s.hitTarget).length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const tier = currentTier(hitDays);
  const pct = progressPct(hitDays);
  const next = nextMilestone(hitDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="screen-container pb-32"
    >
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 active:opacity-50 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase opacity-50">
          // BODY MAP
        </p>
        <div className="w-9" />
      </div>

      <div className="mb-2">
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/70 mb-1">
          TIER
        </p>
        <h1 className="font-display font-black text-5xl tracking-[-0.01em] leading-none uppercase">
          {tier}
        </h1>
      </div>

      <div className="mt-6 mb-2 flex items-baseline justify-between">
        <p className="font-display text-xs font-black tracking-[0.1em] uppercase">
          {hitDays} / {MAX_DAYS} DAYS
        </p>
        <p className="font-display text-xs font-black tracking-[0.04em]">{pct}%</p>
      </div>
      <div className="h-[10px] w-full bg-foreground/10 mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Front / Back toggle */}
      <div className="grid grid-cols-2 mb-6 border border-foreground/70">
        {(['front', 'back'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`py-2.5 font-display font-black text-xs tracking-[0.18em] uppercase transition-colors ${
              view === v ? 'bg-foreground text-background' : 'text-foreground/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-10">
        <div className="w-[60%] max-w-[260px]">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <BodyMap hitDays={hitDays} view={view} />
          </motion.div>
        </div>
      </div>

      {next && (
        <div className="border border-foreground/70 p-4 mb-8">
          <p className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
            NEXT UNLOCK
          </p>
          <p className="font-display font-black text-lg tracking-[0.06em] uppercase leading-tight">
            {next.label}
          </p>
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 mt-1">
            IN {next.day - hitDays} TARGET-HIT {next.day - hitDays === 1 ? 'DAY' : 'DAYS'}
          </p>
        </div>
      )}

      {/* Milestones */}
      <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/70 mb-3">
        MILESTONES
      </p>
      <div className="border-t border-foreground/20">
        {MILESTONES.map(m => {
          const done = hitDays >= m.day;
          return (
            <div
              key={m.day}
              className={`flex items-center justify-between py-3 border-b border-foreground/20 ${
                done ? '' : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-3 h-3 shrink-0 ${
                    done ? 'bg-foreground' : 'border border-foreground/40'
                  }`}
                  aria-hidden
                />
                <p className="font-display text-xs font-black tracking-[0.08em] uppercase truncate">
                  {m.label}
                </p>
              </div>
              <p className="font-display text-[10px] font-bold tracking-[0.2em] uppercase shrink-0 ml-3">
                DAY {m.day}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-8 leading-relaxed">
        Every day you hit your protein target builds your body. Miss a day, the build pauses. Hit
        90 to reach MONOLITH.
      </p>
    </motion.div>
  );
}
