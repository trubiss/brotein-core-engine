## Goal

Make every slide of the onboarding story flow (`OnboardingStoryFlow.tsx`) fit exactly one screen on iPhone — no scrolling, no large empty bands between the headline and the visual.

## Problems to fix

1. **Page scrolls.** Root uses `min-h-screen` which on iOS Safari/Capacitor doesn't account for the dynamic browser chrome and safe areas, so total layout height exceeds the visible viewport and the page becomes scrollable.
2. **Huge gap between headline and motif.** The body uses `flex-1 items-center justify-center py-8`, so the visual is centered in *all* remaining space. With a tall headline at top and a CTA pinned to the bottom, the visual floats far from the headline (as in the screenshot — INTAKE/TARGET sits near the bottom).
3. **No safe-area padding.** The bottom CTA can sit under the iPhone home indicator on some slides.

## Changes (all in `src/components/OnboardingStoryFlow.tsx`)

### 1. Root container — true viewport lock
Replace `min-h-screen ... overflow-hidden` with:
- `h-[100dvh]` (dynamic viewport height — respects iOS browser chrome correctly)
- `overflow-hidden overscroll-none touch-pan-y` only for the slide area, and `touch-none` on the root so the page itself can't scroll/bounce
- Add `safe-area` padding via `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]`

### 2. Slide layout — balance, don't center-fill
Inside the absolutely-positioned slide:
- Keep headline at top
- Replace `flex-1 items-center justify-center py-8` on the body with a controlled layout: small top margin (24–32px) below the headline, motif sized to a fixed max-height (e.g. `max-h-[280px]`), and `flex-1` *above* it consuming residual space rather than centering. Net effect: motif sits near the headline, not pinned to the CTA.
- Reduce headline top padding from `pt-6` to `pt-4`
- Cap headline `max-w` and the motif container so they don't push the CTA off-screen on small devices (e.g. iPhone SE 375×667)

### 3. CTA — always reachable
- Bottom CTA wrapped in a container with `pb-[max(env(safe-area-inset-bottom),16px)]` so the home indicator never overlaps it
- Keep the 56px (`h-14`) tap target

### 4. Question screens — same constraint
The question slides currently use `mt-12` after the headline, which can overflow when the question is 4 lines (e.g. "HOW MUCH PROTEIN DO YOU EAT PER DAY?" with 3 options). Replace fixed `mt-12` with proportional spacing that adapts to remaining space, and cap the button height so all 3 choices always fit.

## Out of scope

- No changes to slide content, copy, motifs, or animations.
- No changes to onboarding logic, state, or analytics.
- This is a pure layout fix.

## Verification

After implementing, I'll open the preview at 390×844 (iPhone 17 Pro) and 375×667 (iPhone SE — the tightest realistic case) and confirm:
- No vertical scrollbar on any of the 16 slides
- Headline → motif → CTA all visible without gaps that look broken
- The previously cramped slides (slide 5 "HOW MUCH PROTEIN" with 4-line headline + 3 buttons, and slide 11 "READY TO HIT YOUR PROTEIN") still fit
