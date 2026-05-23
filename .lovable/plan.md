## Goal

Replace the checkbox-list animation in `ChecklistMotif` ("EAT PROTEIN / LOG IT / REPEAT" slide). Keep the three labels — change the visual. The current checkbox-fill pattern is now reused by the new 30-day calendar motif and the 7-day strip, so this slide needs a different idea.

## New visual: circular loop ("REPEAT" cycle)

A brutalist B&W triangular loop that visualizes the cycle itself:

- Three labels arranged at the points of an equilateral triangle (top: `EAT PROTEIN`, bottom-right: `LOG IT`, bottom-left: `REPEAT`)
- Each label sits inside a small 2px-bordered chip
- A thin foreground stroke connects them in a closed loop (SVG path with three straight segments + arrowheads at each midpoint)
- Animation: a filled dot travels along the path continuously (`offsetPath` / `motionPath` via framer-motion `motion.circle` animating along the path), pausing briefly at each chip — which scales up ~6% and inverts to filled foreground when the dot arrives, then releases as the dot moves on
- Reduced-motion: static loop with all three chips filled, no traveling dot

## Implementation notes

- Keep export name `ChecklistMotif` so `OnboardingStoryFlow.tsx` needs no changes
- Use a square SVG container (~220×220) inside the existing `max-w-[260px]` wrapper
- Drive the animation via a single timeline (one `useEffect` + `useState` for active index, or framer `animate` keyframes on the dot's `cx/cy`) — no external libs
- Pure foreground/background tokens, 0 border-radius (chip = square), Space Mono for labels

## Files

- `src/components/onboarding/SlideMotifs.tsx` — rewrite `ChecklistMotif` body
