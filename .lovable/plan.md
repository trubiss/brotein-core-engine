# Protein Rank

A consistency-based status system. The user's identity in the app becomes their rank letter (F → S), driven by their last 30 days of protein-target performance. The visual centerpiece is the giant rank letter and a Start → Now transformation that makes progression feel real.

## Rank model

`src/lib/rank.ts` (new):

- `Rank = 'F' | 'D' | 'C' | 'B' | 'A' | 'S'`
- Each rank has: letter, label, min score (0–100), next rank.
  - F Beginner 0, D Consistent 40, C Disciplined 55, B Advanced 70, A Elite 85, S Locked In 95.
- `computeRankScore(summaries: DailySummary[], streak: number)`:
  - `hitRate` = days hit / days with data (cap at 30)
  - `avgCompletion` = mean of `min(consumed/target, 1)` across days with target>0
  - `streakBoost` = `min(streak, 14) / 14 * 0.10` (up to +10 pts)
  - `score = round(hitRate * 60 + avgCompletion * 30 + streakBoost * 100)` → 0–100
- `rankForScore(score)` returns the matching rank tier.
- `progressToNext(score, rank)` returns `{ pctOfTier: 0–100, pointsToNext, nextRank | null }`.

### Start vs Now (transformation)

- `NOW` = rank from last 30 days of summaries.
- `START` = rank from the **oldest 7 consecutive days** in the user's summary history (only when ≥7 days of history exist; otherwise show NOW only and hide the Start→Now block).
- A small localStorage cache `brotein_start_rank:<uid>` snapshots the start rank once it has enough data, so it stays stable as the window moves forward.

No new types in `types.ts` are required — `DailySummary` already carries `hitTarget`, `consumedProtein`, `targetProtein`.

## Home card (Dashboard)

New component `src/components/RankCard.tsx`, inserted near the top of `Dashboard.tsx` (above the existing progress card, below the streak/title block). Tap → calls `onNavigate('rank')`.

Layout (brutalist, monochrome, 0 radius, 2px border):

```text
+--------------------------------------+
| PROTEIN RANK                         |
|                                      |
|                B                     |   ← clamp(6rem, 22vw, 9rem), Space Mono, font-black
|           ADVANCED                   |
|                                      |
|  CONSISTENCY 82%   STREAK 6D         |
|                                      |
|  78% → ELITE                         |
|  ████████░░                          |
+--------------------------------------+
```

Empty state (no history yet): same card, rank shows `—`, label `START LOGGING`, progress bar empty, subtitle `LOG 7 DAYS TO UNLOCK`.

## Rank screen

New component `src/components/RankScreen.tsx`. Registered as page `'rank'` in `src/pages/Index.tsx` and in the `Page` union + `Dashboard.onNavigate` type. Standard back chevron header (matches HistoryScreen/InsightsScreen).

Sections, in order:

1. **Hero** — `PROTEIN RANK` label, giant letter (clamp ~10rem), label (`ADVANCED`).
2. **Start → Now** — two-column block:
   ```text
   START                NOW
   D            →       B
   CONSISTENT           ADVANCED
   ```
   Subtle 1px divider, large center arrow (lucide `ArrowRight`, stroke 2.5). Hidden when no start rank yet.
3. **Progress to next rank** — `PROGRESS TO ELITE`, thick bar (reuse Dashboard's bar style, no shimmer), `82%` number, `18% UNTIL ELITE` caption. If already S: `LOCKED IN — MAX RANK`.
4. **Stats trio** — three stacked rows with hairline dividers:
   - CURRENT STREAK — `6 DAYS`
   - LAST 30 DAYS — `82% CONSISTENCY`
   - TARGET HIT — `24 / 30 DAYS`
5. **Rank ladder** — vertical list F→S. Each row: letter (left, mono), label (right, uppercase), thin divider. Current rank row: inverted (bg-foreground / text-background) so the eye locks onto it. Locked rows above current: muted-foreground.

All animations use existing `framer-motion` patterns already in the project (fade-up, easeOut 0.18s, staggerChildren 0.02). The giant rank letter gets a one-time `scale: [0.92, 1]` + opacity entrance, no looping effects.

## Wiring

- `Dashboard.tsx`:
  - Already loads recent summaries via `getRecentSummaries` and `computeStreak`. Pass `summaries` + `streak` into `<RankCard summaries={...} streak={...} onOpen={() => onNavigate('rank')} />`.
  - Extend `onNavigate` prop type: `'history' | 'profile' | 'insights' | 'rank'`.
- `Index.tsx`: add `'rank'` to `Page` union, lazy-load `RankScreen`, render it like the other sub-pages.
- No Firestore schema changes. No backend changes.

## Design tokens / aesthetic

- Reuse existing `--foreground`, `--background`, `--muted-foreground`, `border-foreground/10`, `border-foreground/15` tokens.
- Typography: Space Mono for rank letter and labels, Space Grotesk for stats. All labels uppercase + tracked.
- 0px border-radius everywhere. 2px solid borders for the home card to match the existing PROGRESS card.
- No color accents, no gradients, no badges, no icons inside the rank letter — just type and rules.

## Files

- New: `src/lib/rank.ts`, `src/components/RankCard.tsx`, `src/components/RankScreen.tsx`
- Edit: `src/components/Dashboard.tsx` (insert card, extend nav type), `src/pages/Index.tsx` (add `'rank'` page).
- Tests (optional, light): extend `src/test/example.test.ts` style with a `rank.test.ts` covering thresholds and `progressToNext` math.
