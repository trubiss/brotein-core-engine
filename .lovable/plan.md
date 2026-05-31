# Move STREAK out of the header

The header row (BROTEIN + Insights/Profile buttons) is too tight on 391px once the streak chip is added, causing the logotype to squeeze.

## Change (frontend only, `src/components/Dashboard.tsx`)

- Remove the `STREAK · {streak}D` line from the header row next to the Insights/Profile buttons.
- Restore the header to: `BROTEIN` (left) + Insights/Profile buttons (right), nothing else.
- Re-add the streak as a small, low-weight line **just above the PROGRESS card** (between the status headline/sub block and the boxed progress card). Same micro-label styling as before:
  `text-[9px] tracking-[0.22em] uppercase text-muted-foreground/55`, content `STREAK · {streak} {DAY|DAYS}` with the `BlinkingCursor`. Right-aligned so it sits visually attached to the progress card's top edge without competing with the FUEL STATUS / remaining grams hierarchy.

No other changes.
