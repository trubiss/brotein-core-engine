# Protein Identity (replaces Protein Rank)

Rebuild the rank feature around a single visual idea: an evolving monochrome human silhouette that gets more defined as the user climbs. The letter grade is gone. The figure is the score.

## Identity model

`src/lib/identity.ts` (new — replaces `src/lib/rank.ts`):

- `Identity = 'UNRELIABLE' | 'CONSISTENT' | 'DISCIPLINED' | 'COMMITTED' | 'ELITE' | 'LOCKED_IN'`
- Tiers, in order, with min score and display label:
  - UNRELIABLE 0, CONSISTENT 40, DISCIPLINED 55, COMMITTED 70, ELITE 85, LOCKED_IN 95
- Same scoring formula as the current rank (it's a good fit, just rebadged):
  `score = round(hitRate*60 + avgCompletion*30 + streakBoost*10)` from last-30-days summaries + streak.
- Exports: `IDENTITY_TIERS`, `tierFor`, `identityForScore`, `computeIdentityScore`, `progressToNext`, `getOrSnapshotStartIdentity` (stable START snapshot in localStorage, key `brotein_start_identity:<uid>`, set once user has ≥7 days of data).

## Silhouette system — the centerpiece

`src/components/identity/SilhouetteFigure.tsx` (new):

A single parametric SVG figure. One pose (front-facing, athletic, neutral stance). Tier index (0–5) drives the level of definition. No color, no gradients — pure currentColor strokes and fills on black/white.

Definition progression (all derived from `tierIndex`):

| Tier | Outline stroke | Fill opacity | Muscle detail lines |
|------|----------------|--------------|---------------------|
| 0 UNRELIABLE | 1.25 dashed | 0.00 | none |
| 1 CONSISTENT | 1.5 solid | 0.10 | shoulder line |
| 2 DISCIPLINED | 1.75 solid | 0.22 | + chest line |
| 3 COMMITTED | 2.0 solid | 0.40 | + ab segmentation |
| 4 ELITE | 2.25 solid | 0.65 | + quads + arms |
| 5 LOCKED IN | 2.5 solid | 1.00 (full fill) | full anatomy etched in negative space |

Implementation notes:
- Single `<svg viewBox="0 0 200 360">` with named path groups (`#outline`, `#chest`, `#abs`, `#arms`, `#quads`).
- Tier index toggles `opacity` on detail groups and sets stroke width / fill on the outline.
- Uses `currentColor` so it inverts cleanly when placed inside the inverted "current" row.
- Sized via prop `size: 'sm' | 'md' | 'lg' | 'hero'` mapping to width classes.
- Optional `animate` prop fades detail groups in with framer-motion (0.4s stagger).

This component is reused on the home card, the screen hero, the Start→Now block, the ladder, and the share card — one source of truth for what each identity looks like.

## Home card — `IdentityCard.tsx`

Replaces `RankCard`. Same insertion slot in `Dashboard.tsx` (above PROGRESS).

```text
+--------------------------------------+
| PROTEIN IDENTITY              >      |
|                                      |
|   [silhouette]   DISCIPLINED         |
|       md          82% → COMMITTED    |
|                  ████████░░          |
+--------------------------------------+
```

- Silhouette on the left, identity name + progress bar on the right.
- No streak/consistency numerics on the card — those live on the dedicated screen.
- Empty state (no usable days): faint dashed outline silhouette + `LOG 7 DAYS TO UNLOCK`.

## Dedicated screen — `IdentityScreen.tsx`

Replaces `RankScreen`. Sections in order:

1. **Hero** — back chevron + `PROTEIN IDENTITY` label, then a large silhouette (`hero` size, ~280px tall, centered), then identity name in tracked display type (`DISCIPLINED`). One-time fade-up on entrance.
2. **Start → Now transformation** — two silhouettes at their respective tiers with a large `ArrowRight` between, captions `START` / `NOW`, tier names under each. Hidden until START snapshot exists. This is the screenshot moment.
3. **Progress to next identity** — `PROGRESS TO COMMITTED` heading, thick bar, `82%`, `18% UNTIL COMMITTED`. If already LOCKED IN: `LOCKED IN — MAX IDENTITY`.
4. **Three stat rows** (hairline dividers, no boxed card): CURRENT STREAK / LAST 30 DAYS / TARGET HIT. Deliberately small and secondary — the figure is the headline.
5. **Identity ladder** — vertical list of all 6 tiers. Each row: small silhouette thumbnail (sm) + tier name. Current row is inverted (`bg-foreground text-background`); tiers above current sit at `opacity-40`. Locks reading order to: "this is where I am, this is where I'm going."
6. **Share card** (see below).

## Share card

`src/components/identity/IdentityShareCard.tsx`:

A self-contained square-ish block designed to look intentional in a screenshot. Lives at the bottom of the identity screen.

Composition:
- 2px foreground border, 0 radius, generous padding.
- Top row: tiny `BROTEIN` wordmark left, `PROTEIN IDENTITY` label right.
- Center: large silhouette (hero size) on the left, identity name in oversized display type on the right, stacked above `18% UNTIL COMMITTED`.
- Footer row: `STREAK · 12 DAYS` left, date stamp right.
- Designed at a 4:5 aspect ratio so it crops well for Instagram/TikTok Story screenshots.

Below the card, a single button row:
- **SHARE** — uses `navigator.share({ title, text, url })` when available (mobile), otherwise copies a text snippet to clipboard and toasts `COPIED`. Text format: `I'm ${identity} on Brotein. ${pointsToNext} pts until ${next}. ${url}`.
- A small caption: `SCREENSHOT TO SAVE` — the card itself is the visual asset; no image-export dependency is added.

No new npm packages.

## Wiring

- `src/components/Dashboard.tsx`: swap `RankCard` import → `IdentityCard`. `onNavigate` prop union changes `'rank'` → `'identity'`.
- `src/pages/Index.tsx`: rename `'rank'` page to `'identity'`, lazy-load `IdentityScreen` instead of `RankScreen`.
- Delete old files: `src/lib/rank.ts`, `src/components/RankCard.tsx`, `src/components/RankScreen.tsx`.
- Carry over the START-snapshot localStorage key from `brotein_start_rank:<uid>` to `brotein_start_identity:<uid>`: on first read of identity, also migrate any existing rank snapshot (`F→UNRELIABLE`, `D→CONSISTENT`, `C→DISCIPLINED`, `B→COMMITTED`, `A→ELITE`, `S→LOCKED_IN`) so users who already have a START don't lose their transformation.

## Files

- New: `src/lib/identity.ts`, `src/components/IdentityCard.tsx`, `src/components/IdentityScreen.tsx`, `src/components/identity/SilhouetteFigure.tsx`, `src/components/identity/IdentityShareCard.tsx`
- Edit: `src/components/Dashboard.tsx`, `src/pages/Index.tsx`
- Delete: `src/lib/rank.ts`, `src/components/RankCard.tsx`, `src/components/RankScreen.tsx`

## Design rules

- Pure black/white, 0px radius, `currentColor` everywhere on the silhouette so it inverts inside the active ladder row and the share card.
- Space Mono for identity names and labels, Space Grotesk for body. All labels uppercase + tracked.
- Figure-first hierarchy: on the screen hero, the silhouette is ~3× the visual weight of any text. On the home card, the silhouette and the identity name carry equal weight; numbers are reduced to a single sub-line.
- No bright colors, no badges, no confetti, no streak flames, no progress sparkles. Motion is limited to one-shot fades on mount.
