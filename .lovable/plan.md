## Goal

Replace the current `StreakGridMotif` (used on the "IN 30 DAYS, HITTING YOUR PROTEIN BECOMES AUTOMATIC." slide) with a more legible calendar-style visual. The current 30 tiny squares don't read well.

## New visual: `StreakCalendarMotif`

A month-style calendar grid that fills in sequentially, evoking a habit calendar:

- Header label: `BUILD THE HABIT` (replaces the cramped `30 DAY STREAK` label)
- Row of 7 day-of-week initials: `M T W T F S S` in muted mono, brutalist style
- Grid: 5 rows × 6 columns (30 cells) — bigger, easier to read than the current 10×3
- Each cell is a square with a 2px foreground border
- Animation: cells fill foreground sequentially (stagger ~0.08s) with a small checkmark stroke drawing in via SVG path; loops every ~5s with a brief blank reset
- Respects `useReducedMotion`: all cells fill statically with checks visible

## Wiring

- Add `StreakCalendarMotif` export in `src/components/onboarding/SlideMotifs.tsx`
- Swap import + usage in `src/components/OnboardingStoryFlow.tsx` from `StreakGridMotif` → `StreakCalendarMotif` on the "IN 30 DAYS..." slide
- Keep `StreakGridMotif` exported (unused) — or remove it; remove since nothing else uses it
- No layout, copy, or flow changes elsewhere

## Files

- `src/components/onboarding/SlideMotifs.tsx` — add new motif, remove old
- `src/components/OnboardingStoryFlow.tsx` — update import + JSX reference
