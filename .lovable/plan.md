## Goal

Track carbs and fat alongside protein, while keeping protein as the dominant, hero metric. Nothing about the protein-first UX (big remaining number, FUEL STATUS, streak, pace, quick +20/+30/+40 buttons) changes.

## Data model

`src/lib/types.ts`
- `FoodLog`: add optional `carbsGrams?: number` and `fatsGrams?: number` (optional so existing logs stay valid; treated as 0 when missing).
- `DailySummary`: add `consumedCarbs`, `consumedFats`, `targetCarbs`, `targetFats` (optional for backward compat).
- `FoodItem` (`src/lib/foods.ts`): add optional `carbsGrams?` and `fatsGrams?` per item. Leave existing values; backfill common items with rough macro values. Anything unset falls back to 0.

`src/lib/firestore.ts`
- `addLog` / `updateLog` accept `carbsGrams` and `fatsGrams`.
- `recomputeSummary` also sums carbs and fats from the day's logs, and writes `targetCarbs` = `profile.dailyCarbs`, `targetFats` = `profile.dailyFats`. Requires passing those targets in (or fetching profile). Simplest: change the helper signature to accept `{ protein, carbs, fats }` targets, and update the three callers (`addLog`, `updateLog`, `deleteLog`) to pass them. Dashboard already has `profile.dailyCarbs` / `profile.dailyFats`.
- `computeStreak` stays protein-only.

## UI — Dashboard (protein stays the hero)

`src/components/Dashboard.tsx`
- Hero (remaining grams, FUEL STATUS, status headline, streak, big PROGRESS bar, QUICK ADD, SCAN, +20/+30/+40 row): unchanged.
- Add a compact **MACROS** strip directly under the protein progress card (above the +20/+30/+40 row), visually smaller and lower-contrast so protein still dominates:
  - Two thin rows: `CARBS  consumed / target G` with a 4px bar, `FAT  consumed / target G` with a 4px bar.
  - Muted foreground color, no shimmer, no animated counter.
- No new screen, no header changes.

## UI — Quick Log

`src/components/QuickLogModal.tsx` (manual tab)
- Below the existing PROTEIN (G) input, add two smaller inputs side-by-side: `CARBS (G)` and `FAT (G)`. Both optional, default empty → 0. Same `input-underline` style but visually subordinate (smaller label spacing, half width each).
- Picking from FOODS / FAVORITES / RECENT auto-fills carbs and fats when the source has them (FoodItem / FavoriteFood / FoodLog).
- `onSubmit` payload extended with `carbsGrams` and `fatsGrams`.
- `addFavorite` / `FavoriteFood` get the same optional fields so favorites round-trip macros.
- Quick presets (+20G etc.) remain protein-only.

## UI — Food scan

`supabase/functions/scan-food/index.ts`
- Extend system prompt and tool schema to also estimate `carbsGrams` and `fatsGrams` (integers, default 0 when unknown). Return them in the JSON response.
- `src/lib/scan.ts` `ScanResult` gains `carbsGrams` and `fatsGrams`.
- `FoodScanModal.tsx` shows the two extra numbers in the review step as small editable fields under the protein field, and passes them through `onConfirm`. Dashboard's `addLog` call from scan flow forwards them.

## Out of scope

- Onboarding flow, GoalsScreen, ManualTargetScreen, InsightsScreen, HistoryScreen — macro targets are already computed in `calculateMacros` and stored on the profile, so no changes needed for this step.
- Streak / pace / paywall logic — remain protein-only.
- Reminders.

## Technical notes

- All new fields are optional; legacy logs and summaries continue to work (missing → 0).
- No migration needed (Firestore is schemaless); summaries get the new fields the next time they're recomputed (i.e. next log add/edit/delete on that day).
- Display uses `??` / `|| 0` for missing values so existing data renders cleanly.
