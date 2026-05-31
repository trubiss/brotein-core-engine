# Dashboard: Today's Entries + Streak relocation

## Changes (frontend only, `src/components/Dashboard.tsx`)

### 1. Replace the "LAST · …" line with a "TODAY'S ENTRIES" list
Where the `lastEntry` block currently renders (bottom of Dashboard), render a list of `logs` for the currently viewed date instead.

- Section header: small label "TODAY'S ENTRIES" (or "ENTRIES · {dateLabel}" when not viewing today) matching existing micro-label styling (`text-[9px] tracking-[0.22em] uppercase text-muted-foreground/55`).
- For each log in `logs` (already sorted, already subscribed via `watchLogsForDate`), render a `SwipeableLogRow` (reuse existing component used in HistoryScreen):
  - Row content: food name (uppercase, truncated) on the left, `+{proteinGrams}G` + relative time on the right, brutalist style consistent with the rest of the dashboard (mono/display font, thin border-b already in SwipeableLogRow).
  - `onTap`: no-op (or open QuickLogModal prefilled — keep as no-op for minimal scope).
  - `onDelete`: call `deleteLog(user.uid, log.id, profile.dailyProtein)`, show a toast `ENTRY DELETED`, bump `streakBump` so streak recomputes.
- Empty state: if `logs.length === 0`, show muted "NO ENTRIES YET" line in the same micro-label style.
- Remove the `lastEntry` state, the `watchRecentLogs` effect that powers it, and the `nowTick`/`relTime` usage if no longer needed (relTime is still useful for per-row timestamps — keep it).

### 2. Move the STREAK line
Relocate the `STREAK · N DAYS` block from just above the entries list to the **top-right header area**, next to the BROTEIN title:
- Render it as a compact pill/line to the left of the Insights/Profile buttons inside the existing header `flex` row.
- Style: same micro-label (`text-[9px] tracking-[0.22em] uppercase text-muted-foreground/55`), no border, just text. Keep the BlinkingCursor.
- On narrow viewports (391px), ensure the header doesn't overflow — title can stay `text-3xl` but allow streak to shrink/truncate; `BROTEIN` already has `truncate`.

### 3. Cleanup
- Remove now-unused imports (`watchRecentLogs` if unused elsewhere in the file).
- Keep `deleteLog` import added from `@/lib/firestore`.

## Out of scope
No backend, schema, or business-logic changes. Pure UI rearrangement reusing existing `SwipeableLogRow` + `deleteLog`.
