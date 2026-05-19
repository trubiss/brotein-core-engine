# Add ambient animations to main screens

The text content stays exactly as-is. The goal is to make the lower/empty areas of each screen feel alive without distracting from the brutalist B&W aesthetic. All animations use existing `framer-motion` (already in the project) and CSS — no new dependencies.

## Per-screen treatments

### Dashboard (`src/components/Dashboard.tsx`)
- **Ambient grid backdrop**: subtle 1px monospace grid layer (opacity ~0.04) slowly drifting diagonally behind the content. Pure CSS, fixed/absolute behind the card.
- **Progress bar shimmer**: when consumed < target, a thin highlight sweeps left→right across the filled portion every ~3.5s.
- **Streak line tick**: the "STREAK · N DAYS" line gets a tiny blinking cursor (`|`) at the end — terminal/mono feel, matches Space Mono.
- **Quick-add buttons**: stagger-in already exists; add a faint border-pulse on the active day's `+20/+30/+40g` row every ~6s (very low opacity).

### History (`src/components/HistoryScreen.tsx`)
- **Day cells fade-up stagger** on mount (50ms stagger).
- **Today's cell**: gentle pulsing outline (2s loop, opacity 0.6↔1) so the eye lands there.
- **Empty state** (if any): typewriter reveal of the placeholder text.

### Insights (`src/components/InsightsScreen.tsx`)
- **Numbers count-up** on mount using the same `AnimatedGrams` pattern already in Dashboard (reuse the technique for kg, %, day counts).
- **Bars/lines draw-in**: any chart bars animate height from 0 → value with 60ms stagger.
- **Section dividers**: hairline draws left→right on first reveal.

### Profile (`src/components/ProfileScreen.tsx`)
- **Section stagger fade-up** on mount.
- **Avatar/initial block**: very subtle scanline shimmer (single diagonal line slowly traversing) to fill the white space at the top.
- **List rows**: gentle border-color pulse on hover/active.

## Shared utilities (added once, reused)
- A small `<AmbientGrid />` component (absolutely positioned, `pointer-events-none`, CSS-only animated background-position) — used as a backdrop on each screen where space feels empty.
- A `<BlinkingCursor />` mono `|` component for terminal accents.
- A `shimmer` keyframe added to `tailwind.config.ts` for the progress bar.

## Out of scope
- No text/copy changes.
- No layout, spacing, or color changes.
- No new dependencies, no Lottie, no video.
- Charts in Insights keep their existing structure; only the reveal animation is added.

## Files touched
- `src/components/Dashboard.tsx`
- `src/components/HistoryScreen.tsx`
- `src/components/InsightsScreen.tsx`
- `src/components/ProfileScreen.tsx`
- `src/components/ui/AmbientGrid.tsx` (new, tiny)
- `tailwind.config.ts` (add `shimmer` keyframe)
- `src/index.css` (add `.blink-cursor` utility)

All motion respects `prefers-reduced-motion` — animations are disabled for users who request it.
