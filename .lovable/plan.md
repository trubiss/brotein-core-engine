# Anatomical Identity Figure (rebuild)

The current silhouette reads as a cartoon. Rebuild it as a real anatomical front-view male figure inspired by the reference — clearly defined muscle groups (pecs, delts, biceps, forearms, abs, obliques, quads, calves), but in pure brutalist black and white. Progression is shown by which muscle groups have been "earned": at low tiers only the outline exists, and as the user climbs, muscle groups light up one anatomical region at a time.

## New component — `AnatomyFigure`

Replace `src/components/identity/SilhouetteFigure.tsx` with a new `AnatomyFigure.tsx`. Same prop API (`identity`, `size`, `className`) so the home card, screen hero, ladder, and share card don't need to change.

### SVG construction

- `<svg viewBox="0 0 240 520">` — taller, anatomical proportions instead of the current squat figure.
- Built from named muscle-group `<g>` layers, drawn back-to-front:
  1. `#outline` — outer body silhouette (head, neck, shoulders, arms slightly out, narrow waist, hips, legs apart, feet). Hand-crafted Bezier paths, not the boxy current shape.
  2. `#delts` — two rounded deltoid caps over the shoulder joints.
  3. `#pecs` — left/right pec, rounded triangle meeting at sternum with a center cleft.
  4. `#biceps` — upper-arm muscle bellies.
  5. `#forearms` — tapered forearm bellies.
  6. `#abs` — rectus abdominis as 3 stacked pairs (6-pack) with a vertical linea alba.
  7. `#obliques` — angled flank panels framing the abs into a V.
  8. `#quads` — rectus femoris + vastus lateralis/medialis per leg (3 paths per leg).
  9. `#calves` — peanut-shape calf bellies on lower leg backs (visible on front via inner contour).
- All paths use `currentColor` for stroke and fill so the figure inverts cleanly inside the active ladder row.

### Progression — what lights up at each tier

| Tier | Outline | Visible muscle groups | Stroke | Muscle fill opacity |
|------|---------|----------------------|--------|---------------------|
| 0 UNRELIABLE | dashed, thin | none | 1.25 | 0 |
| 1 CONSISTENT | solid | delts | 1.5 | 0.18 |
| 2 DISCIPLINED | solid | + pecs | 1.5 | 0.22 |
| 3 COMMITTED | solid | + biceps + abs | 1.75 | 0.32 |
| 4 ELITE | solid | + forearms + obliques + quads | 2.0 | 0.55 |
| 5 LOCKED IN | solid | + calves, every group filled solid | 2.25 | 1.0 |

Implementation: each muscle group is mounted unconditionally but its `opacity` is driven by tier index, so the same SVG renders six visual states. Locked groups stay at `opacity: 0` (not greyed-out — they don't exist yet). At LOCKED IN, all groups go to `fillOpacity: 1` with thin background-color separator lines drawn between them so the anatomy stays legible in solid silhouette.

Optional one-shot mount animation: groups fade in with `framer-motion` staggerChildren so the first render feels like the body assembles.

## Why this looks right

- Identical anatomical pose at every tier — only definition changes. That's exactly how the reference reads: "same body, more development."
- Muscle groups are real anatomical units, not decorative dashes. Even at low tiers the outline reads as a real figure, not a stick man.
- Pure black/white, currentColor throughout — preserves the brutalist aesthetic, no color highlights, no labels.
- The transformation ("START → NOW") becomes legible because the differences are large and structural — entire muscle groups appearing, not stroke widths nudging up by a quarter pixel.

## Files

- Rewrite: `src/components/identity/SilhouetteFigure.tsx` → rename to `AnatomyFigure.tsx`, update three imports (`IdentityCard.tsx`, `IdentityScreen.tsx`, `IdentityShareCard.tsx`).
- No data, model, or page-flow changes. Identity scoring, START snapshot, screen layout, and share card structure all stay as-is.

## Sizing & layout adjustments

- Bump the screen hero figure to `w-64` (~256 px wide, ~520 px tall) so the anatomy reads at distance.
- Home card silhouette stays at `md` (~80 px); raise card minimum height slightly so the taller figure fits without cropping.
- Ladder thumbnails stay at `sm` (~40 px) — at that size only the outline + dominant filled regions matter, which still differentiates tiers.
