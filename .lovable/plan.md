## Goal

Fill the empty white space below the headlines on onboarding statement slides with subtle, on-theme animations. Question, interactive-add, and pace screens already have visuals — leave those untouched. Keep the brutalist B&W aesthetic (no color, no rounded shapes, mono lines only).

## Approach

Add an optional `motif` field to each statement screen. When a screen has no `visual`, render the motif in the center area. Each motif is a small, self-contained framer-motion SVG/div component that loops gently (3–6s) and respects `prefers-reduced-motion`.

## Per-slide motifs (statement screens only)

1. **"YOU'RE NOT HITTING YOUR PROTEIN"** — a horizontal progress bar that fills to ~45% then stalls, with a blinking "MISSED" tick mark at 100%.
2. **"NO PROTEIN. NO RESULTS."** — three stacked mono bars (MUSCLE / RECOVERY / FAT LOSS) that try to fill then collapse back to 0 in sequence.
3. **"ONLY ONE NUMBER MATTERS."** — already has `MetricStack`. Skip.
4. **"YOU'RE LIKELY UNDER-EATING…"** — a number ticker that counts from the user's est. intake up to the gap (e.g. 90 → 150 G), with a deficit bracket drawn underneath.
5. **"THAT GAP IS HOLDING YOU BACK"** — two vertical bars (CURRENT vs TARGET) with a labeled "GAP" bracket between them, drawn-in on mount.
6. **"THIS IS YOUR DAILY TARGET"** — already has `MiniDashboard`. Skip.
7. **"IN 30 DAYS… AUTOMATIC"** — a 30-cell mono streak grid that fills left-to-right in a 2.5s loop.
8. **"LESS THAN 10 SECONDS PER MEAL"** — a stopwatch-style mono ring that sweeps 0→10s and resets.
9. **"YOU ALREADY KNOW WHAT TO DO"** — a checkbox row (3 boxes) that ticks itself one by one.
10. **"TRY BROTEIN FREE FOR 7 DAYS"** — a 7-cell week strip with each day filling sequentially, last cell pulsing.

All motifs sit in the existing centered `flex-1` area, max-width ~260px, foreground-on-background only, 2px borders, mono typography for any labels.

## Technical details

- New file: `src/components/onboarding/SlideMotifs.tsx` exporting each motif as a named component (`StalledBarMotif`, `CollapsingBarsMotif`, `DeficitCounterMotif`, `GapBarsMotif`, `StreakGridMotif`, `StopwatchMotif`, `ChecklistMotif`, `WeekStripMotif`).
- `OnboardingStoryFlow.tsx`: extend the `statement` screen type with optional `motif?: React.ReactNode`; in the center block render `current.visual ?? current.motif`. Wire each statement above to its motif.
- Animations use framer-motion `animate` loops (`repeat: Infinity`) with `motion-reduce:hidden` wrappers or `useReducedMotion()` to disable loops.
- No tailwind config changes needed; reuse existing tokens (`foreground`, `muted`, mono font).

## Out of scope

- No copy, layout, color, spacing, or typography changes.
- Question / interactive-add / pace screens stay as-is.
- Dashboard/History/Insights/Profile ambient animations from last turn remain unchanged.
