import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LABEL =
  'font-mono text-[10px] font-semibold tracking-[0.14em] uppercase text-foreground/60';

// ─────────────────────────────────────────────
// 1. Stalled progress bar — "you're not hitting your protein"
// ─────────────────────────────────────────────
export function StalledBarMotif() {
  const reduce = useReducedMotion();
  return (
    <div className="w-full max-w-[260px] flex flex-col gap-3">
      <div className="flex justify-between">
        <span className={LABEL}>INTAKE</span>
        <span className={LABEL}>TARGET</span>
      </div>
      <div className="relative w-full h-[6px] bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 bg-foreground"
          initial={{ width: '0%' }}
          animate={reduce ? { width: '45%' } : { width: ['0%', '45%', '45%', '0%'] }}
          transition={{ duration: 4, times: [0, 0.4, 0.85, 1], repeat: Infinity, ease: 'easeOut' }}
        />
        {/* target tick */}
        <div className="absolute right-0 top-[-4px] bottom-[-4px] w-[2px] bg-foreground" />
      </div>
      <div className="flex justify-between items-center">
        <span className="font-mono text-[12px] font-bold text-foreground">~45%</span>
        <motion.span
          className="font-mono text-[10px] font-bold tracking-[0.14em] text-foreground"
          animate={reduce ? {} : { opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          MISSED
        </motion.span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. Collapsing bars — "no protein. no results."
// ─────────────────────────────────────────────
export function CollapsingBarsMotif() {
  const reduce = useReducedMotion();
  const rows = ['MUSCLE', 'RECOVERY', 'FAT LOSS'];
  return (
    <div className="w-full max-w-[260px] flex flex-col gap-4">
      {rows.map((label, i) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className={LABEL}>{label}</span>
          <div className="relative w-full h-[6px] bg-muted">
            <motion.div
              className="absolute inset-y-0 left-0 bg-foreground"
              initial={{ width: '0%' }}
              animate={reduce ? { width: '0%' } : { width: ['0%', '70%', '70%', '0%'] }}
              transition={{
                duration: 3.6,
                times: [0, 0.35, 0.6, 0.85],
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. Deficit counter — "you're likely under-eating"
// ─────────────────────────────────────────────
export function DeficitCounterMotif({ from, to }: { from: number; to: number }) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(from);

  useEffect(() => {
    if (reduce) { setVal(to); return; }
    let raf = 0;
    let start = 0;
    const loop = (t: number) => {
      if (!start) start = t;
      const elapsed = (t - start) % 3200;
      const p = Math.min(1, elapsed / 1800);
      setVal(Math.round(from + (to - from) * p));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [from, to, reduce]);

  return (
    <div className="w-full max-w-[260px] flex flex-col items-center gap-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[14px] font-semibold text-foreground/40 line-through">
          {from}G
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-foreground/40">→</span>
        <span className="font-mono font-black text-[56px] leading-none tracking-[-0.02em] text-foreground tabular-nums">
          {val}
        </span>
        <span className="font-mono text-[16px] font-bold text-foreground/60">G</span>
      </div>
      {/* deficit bracket */}
      <div className="relative w-full h-3">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-foreground" />
        <div className="absolute left-0 top-0 h-3 w-[2px] bg-foreground" />
        <div className="absolute right-0 top-0 h-3 w-[2px] bg-foreground" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1 bg-background px-2">
          <span className={LABEL}>DEFICIT</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 5. Gap bars — "that gap is holding you back"
// ─────────────────────────────────────────────
export function GapBarsMotif() {
  const reduce = useReducedMotion();
  return (
    <div className="w-full max-w-[260px] flex items-end justify-between gap-4 h-[160px]">
      <div className="flex flex-col items-center gap-2 flex-1">
        <motion.div
          className="w-full bg-foreground/30"
          initial={{ height: 0 }}
          animate={{ height: 60 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <span className={LABEL}>CURRENT</span>
      </div>
      {/* gap bracket */}
      <div className="flex flex-col items-center justify-end h-full pb-7">
        <motion.span
          className="font-mono text-[11px] font-bold tracking-[0.14em] text-foreground mb-1"
          animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          GAP
        </motion.span>
        <motion.div
          className="w-12 h-[2px] bg-foreground"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        />
      </div>
      <div className="flex flex-col items-center gap-2 flex-1">
        <motion.div
          className="w-full bg-foreground"
          initial={{ height: 0 }}
          animate={{ height: 130 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <span className={LABEL}>TARGET</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 7. Streak grid — "in 30 days... automatic"
// ─────────────────────────────────────────────
export function StreakCalendarMotif() {
  const reduce = useReducedMotion();
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // 30 cells in a 5x6 grid (rows of 6) — bigger & easier to read than 10x3
  const cells = Array.from({ length: 30 });
  const CYCLE = 5; // seconds
  const FILL = 0.7; // proportion of cycle spent filling

  return (
    <div className="w-full max-w-[280px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={LABEL}>BUILD THE HABIT</span>
        <span className={LABEL}>30 DAYS</span>
      </div>

      {/* day-of-week header */}
      <div className="grid grid-cols-7 gap-1.5">
        {dayLabels.map((d, i) => (
          <span
            key={i}
            className="font-mono text-[10px] font-bold tracking-[0.1em] text-foreground/40 text-center"
          >
            {d}
          </span>
        ))}
      </div>

      {/* calendar grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {cells.map((_, i) => {
          const t = (i / cells.length) * FILL;
          return (
            <motion.div
              key={i}
              className="relative aspect-square border-2 border-foreground flex items-center justify-center"
              initial={{ backgroundColor: 'hsl(var(--background))' }}
              animate={
                reduce
                  ? { backgroundColor: 'hsl(var(--foreground))' }
                  : {
                      backgroundColor: [
                        'hsl(var(--background))',
                        'hsl(var(--background))',
                        'hsl(var(--foreground))',
                        'hsl(var(--foreground))',
                        'hsl(var(--background))',
                      ],
                    }
              }
              transition={{
                duration: CYCLE,
                times: reduce ? undefined : [0, t, t + 0.02, 0.92, 1],
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.svg
                viewBox="0 0 16 16"
                className="w-[55%] h-[55%]"
                initial={{ opacity: 0 }}
                animate={
                  reduce
                    ? { opacity: 1 }
                    : { opacity: [0, 0, 1, 1, 0] }
                }
                transition={{
                  duration: CYCLE,
                  times: [0, t + 0.005, t + 0.04, 0.92, 1],
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <path
                  d="M3 8.5 L7 12 L13 4"
                  fill="none"
                  stroke="hsl(var(--background))"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </motion.svg>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 8. Stopwatch — "less than 10 seconds per meal"
// ─────────────────────────────────────────────
export function StopwatchMotif() {
  const reduce = useReducedMotion();
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (reduce) { setSec(10); return; }
    let raf = 0;
    let start = 0;
    const loop = (t: number) => {
      if (!start) start = t;
      const elapsed = ((t - start) % 2800) / 2800;
      setSec(Math.min(10, +(elapsed * 10).toFixed(1)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const C = 2 * Math.PI * 56; // circumference
  const offset = C * (1 - sec / 10);

  return (
    <div className="relative w-[160px] h-[160px] flex items-center justify-center">
      <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90">
        <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="4"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-mono font-black text-[40px] leading-none tracking-[-0.02em] text-foreground tabular-nums">
          {sec.toFixed(1)}
        </span>
        <span className={LABEL}>SECONDS</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 9. Checklist — "you already know what to do"
// ─────────────────────────────────────────────
export function ChecklistMotif() {
  const reduce = useReducedMotion();
  const items = ['EAT PROTEIN', 'LOG IT', 'REPEAT'];
  // Triangle node positions (top, bottom-right, bottom-left) in a 240x220 box
  const W = 240;
  const H = 220;
  const nodes = [
    { x: W / 2, y: 32 },
    { x: W - 32, y: H - 32 },
    { x: 32, y: H - 32 },
  ];

  const STEP_MS = 1100; // dwell + travel per leg
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % nodes.length), STEP_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Build closed-loop path for the traveling dot
  const pathD = `M ${nodes[0].x} ${nodes[0].y} L ${nodes[1].x} ${nodes[1].y} L ${nodes[2].x} ${nodes[2].y} Z`;

  // Chip dimensions
  const CHIP_W = 108;
  const CHIP_H = 28;

  return (
    <div className="w-full max-w-[260px] flex items-center justify-center">
      <div className="relative" style={{ width: W, height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible">
          {/* loop path */}
          <path
            d={pathD}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeOpacity="0.25"
          />

          {/* arrowheads at each leg midpoint */}
          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % nodes.length];
            const mx = (n.x + next.x) / 2;
            const my = (n.y + next.y) / 2;
            const angle = (Math.atan2(next.y - n.y, next.x - n.x) * 180) / Math.PI;
            return (
              <g key={`arr-${i}`} transform={`translate(${mx} ${my}) rotate(${angle})`}>
                <path
                  d="M -5 -5 L 3 0 L -5 5 Z"
                  fill="hsl(var(--foreground))"
                  opacity="0.5"
                />
              </g>
            );
          })}

          {/* traveling dot */}
          {!reduce && (
            <motion.circle
              r="6"
              fill="hsl(var(--foreground))"
              initial={false}
              animate={{ cx: nodes[active].x, cy: nodes[active].y }}
              transition={{ duration: STEP_MS / 1000, ease: [0.6, 0.05, 0.4, 0.95] }}
            />
          )}
        </svg>

        {/* label chips */}
        {items.map((label, i) => {
          const n = nodes[i];
          const isActive = reduce ? true : active === i;
          return (
            <motion.div
              key={label}
              className="absolute flex items-center justify-center border-2 border-foreground"
              style={{
                width: CHIP_W,
                height: CHIP_H,
                left: n.x - CHIP_W / 2,
                top: n.y - CHIP_H / 2,
              }}
              animate={{
                scale: isActive ? 1.06 : 1,
                backgroundColor: isActive
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--background))',
                color: isActive ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <span className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase">
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 10. Week strip — "try brotein free for 7 days"
// ─────────────────────────────────────────────
export function WeekStripMotif() {
  const reduce = useReducedMotion();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="w-full max-w-[260px] flex flex-col gap-3">
      <span className={LABEL}>7 DAYS FREE</span>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const isLast = i === days.length - 1;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.div
                className="w-full aspect-square border-2 border-foreground"
                initial={{ backgroundColor: 'hsl(var(--background))' }}
                animate={
                  reduce
                    ? { backgroundColor: 'hsl(var(--foreground))' }
                    : isLast
                    ? {
                        backgroundColor: [
                          'hsl(var(--background))',
                          'hsl(var(--background))',
                          'hsl(var(--foreground))',
                          'hsl(var(--foreground))',
                          'hsl(var(--background))',
                        ],
                        scale: [1, 1, 1.08, 1, 1],
                      }
                    : {
                        backgroundColor: [
                          'hsl(var(--background))',
                          'hsl(var(--background))',
                          'hsl(var(--foreground))',
                          'hsl(var(--foreground))',
                          'hsl(var(--background))',
                        ],
                      }
                }
                transition={{
                  duration: 4.2,
                  times: [0, 0.1 + i * 0.08, 0.18 + i * 0.08, 0.9, 1],
                  repeat: Infinity,
                }}
              />
              <span className="font-mono text-[10px] font-bold text-foreground/60">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
