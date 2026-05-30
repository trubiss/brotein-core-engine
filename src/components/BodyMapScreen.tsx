import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getRecentSummaries } from '@/lib/firestore';
import BodyMap from './BodyMap';
import {
  currentTier,
  MAX_DAYS,
  MILESTONES,
  nextMilestone,
  progressPct,
  TIER_COLORS,
  TIER_ORDER,
} from '@/lib/bodyMap';

interface Props {
  onBack: () => void;
}

export default function BodyMapScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [hitDays, setHitDays] = useState(0);

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
  const tierColor = TIER_COLORS[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="screen-container pb-32"
    >
      <div className="flex items-center justify-between mb-8">
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

      <div className="mb-6">
        <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/70 mb-1">
          YOUR STRENGTH PROGRESS
        </p>
        <h1
          className="font-display font-black text-5xl tracking-[-0.01em] leading-none uppercase"
          style={{ color: tierColor }}
        >
          {tier}
        </h1>
      </div>

      {/* Start → Now front */}
      <div className="border border-foreground/70 p-4 mb-3">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-foreground/50 text-center">START</p>
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-center" style={{ color: tierColor }}>NOW</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex justify-center">
            <BodyMap hitDays={0} view="front" dormant className="w-full max-w-[140px] text-foreground/40" />
          </div>
          <ChevronRight size={22} className="text-foreground/50 shrink-0" strokeWidth={2.5} />
          <div className="flex-1 flex justify-center">
            <BodyMap hitDays={hitDays} view="front" className="w-full max-w-[140px]" />
          </div>
        </div>
      </div>

      {/* Tier pills */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {TIER_ORDER.map(t => {
          const active = t === tier;
          const color = TIER_COLORS[t];
          return (
            <div
              key={t}
              className={`px-2.5 py-1.5 font-display text-[9px] font-black tracking-[0.15em] uppercase whitespace-nowrap shrink-0 border ${
                active ? 'text-background' : 'text-foreground/60 border-foreground/20'
              }`}
              style={active ? { background: color, borderColor: color } : undefined}
            >
              {t}
            </div>
          );
        })}
      </div>

      {/* Back view */}
      <div className="border border-foreground/70 p-4 mb-6">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-foreground/50 text-center">START</p>
          <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-center" style={{ color: tierColor }}>NOW</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex justify-center">
            <BodyMap hitDays={0} view="back" dormant className="w-full max-w-[140px] text-foreground/40" />
          </div>
          <ChevronRight size={22} className="text-foreground/50 shrink-0" strokeWidth={2.5} />
          <div className="flex-1 flex justify-center">
            <BodyMap hitDays={hitDays} view="back" className="w-full max-w-[140px]" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-display text-xs font-black tracking-[0.1em] uppercase">
          {hitDays} / {MAX_DAYS} DAYS
        </p>
        <p className="font-display text-xs font-black tracking-[0.04em]">{pct}%</p>
      </div>
      <div className="h-[10px] w-full bg-foreground/10 mb-8 overflow-hidden">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ background: tierColor }}
        />
      </div>

      {next && (
        <div className="border border-foreground/70 p-4 mb-8">
          <p className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
            NEXT UNLOCK
          </p>
          <p
            className="font-display font-black text-lg tracking-[0.06em] uppercase leading-tight"
            style={{ color: TIER_COLORS[next.tier] }}
          >
            {next.label}
          </p>
          <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 mt-1">
            IN {next.day - hitDays} TARGET-HIT {next.day - hitDays === 1 ? 'DAY' : 'DAYS'}
          </p>
        </div>
      )}

      <p className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/70 mb-3">
        MILESTONES
      </p>
      <div className="border-t border-foreground/20">
        {MILESTONES.filter(m => m.groups.length > 0 || m.tier === 'LEGEND').map(m => {
          const done = hitDays >= m.day;
          const color = TIER_COLORS[m.tier];
          return (
            <div
              key={m.day}
              className="flex items-center justify-between py-3 border-b border-foreground/20"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3 h-3 shrink-0"
                  style={done ? { background: color } : { border: '1px solid hsl(var(--foreground) / 0.4)' }}
                  aria-hidden
                />
                <p
                  className={`font-display text-xs font-black tracking-[0.08em] uppercase truncate ${done ? '' : 'text-foreground/40'}`}
                  style={done ? { color } : undefined}
                >
                  {m.label}
                </p>
              </div>
              <p className={`font-display text-[10px] font-bold tracking-[0.2em] uppercase shrink-0 ml-3 ${done ? '' : 'text-foreground/40'}`}>
                DAY {m.day}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-8 leading-relaxed">
        Every day you hit your protein target builds your body. Miss a day, the build pauses. Hit 90 to reach MONOLITH, 180 for LEGEND.
      </p>
    </motion.div>
  );
}
