
Replace Screen 4's seven thin-lined squares with a heavy, animated bar-chart graphic that fills bottom-to-top, then stamps "100% TARGET" across in white.

### Component: `TargetBars` (new, inline in `WelcomeCarousel.tsx`)

Layout (perfectly centered):
- Container: `w-[280px] h-[180px]` flex column, items-center.
- Bars row: 7 thick black vertical bars, `w-8` each, `gap-1.5`, aligned to a shared baseline.
- Baseline: a heavy `h-[6px] w-full bg-foreground` strip directly under the bars (no gap).
- Overlaid "100% TARGET" text absolutely positioned across the middle of the bars.

### Animation (Framer Motion, runs once on mount via `key={step}` remount)

Bars:
- Each bar uses `transform-origin: bottom` and animates `scaleY` from `0` → `1`.
- Staggered start: bar `i` delay = `0.1 * i` (Day 1 → Day 7, sequential as requested).
- Each bar duration: `0.45s`, `ease: [0.65, 0, 0.35, 1]` (sharp brutalist easing).
- Total ~1.75s (within 1.5–2s window).

Text "100% TARGET":
- Hidden initially (`opacity: 0`).
- Fades in sharply at delay `~1.8s` with duration `0.2s`.
- Style inherits headline font: `font-mono font-black uppercase tracking-tighter text-background` (white on black bars), sized `text-2xl`, centered absolutely across the bar group.

### Code sketch

```tsx
function TargetBars() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="flex items-end gap-1.5 h-[180px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: [0.65, 0, 0.35, 1] }}
              style={{ transformOrigin: 'bottom' }}
              className="w-8 h-full bg-foreground"
            />
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 1.8 }}
            className="absolute inset-0 flex items-center justify-center font-mono font-black uppercase tracking-tighter text-background text-2xl pointer-events-none"
          >
            100% TARGET
          </motion.span>
        </div>
        <div className="h-[6px] w-full bg-foreground" />
      </div>
    </div>
  );
}
```

Replace the existing Screen 4 `visual` (lines 164–175) with `<TargetBars />`. Remove the "STREAK ACTIVE" sub-label (replaced by the in-bar "100% TARGET" stamp per spec).

### Notes
- Animation re-triggers each time user lands on Screen 4 because the slide is keyed by `step` and remounts.
- Pagination dots, CTA "LET'S GO", headline, and subtext remain unchanged.
