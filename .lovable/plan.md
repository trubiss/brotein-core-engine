## Goal

Replace the 6 letterboxed/upscaled App Store screenshots in `/mnt/documents/brotein-screenshots/` with crisp, native-resolution **1290×2796** PNGs generated directly by AI — no upscaling, no black bars.

## Approach

Use `imagegen--generate_image` at premium quality (text legibility matters) with the existing brutalist B&W design language as the spec. Each panel gets its own focused prompt describing exactly what's in the current screenshot, so the regenerated version matches the original composition as closely as a fresh generation allows.

Constraints baked into every prompt:
- Pure black background (#000), white text (#FFF)
- Space Mono for display text, Space Grotesk for body
- Zero border-radius, brutalist industrial UI
- iPhone-shaped portrait composition that fills the full 1290×2796 frame edge-to-edge
- ALL CAPS labels where present
- NO logos, NO watermarks, NO "Higgsfield" branding

## The 6 panels (text preserved exactly)

1. **MOST GUYS MISS PROTEIN.** — bold headline, full-bleed
2. **ONE NUMBER MATTERS.** — single large protein gram counter
3. **ZERO FRICTION.** — quick-log preset buttons mock
4. **TAP. DONE.** — single tap interaction shown
5. **YOU'RE BEHIND.** — pace warning UI mock
6. **DAY 12. LOCKED IN.** — streak counter, no Higgsfield text

## Output

Files written to `/mnt/documents/brotein-screenshots/v2/`:
- `1_most_guys_miss_protein.png`
- `2_one_number_matters.png`
- `3_zero_friction.png`
- `4_tap_done.png`
- `5_youre_behind.png`
- `6_dont_break_the_chain.png`

Each will be exactly **1290×2796** PNG, generated natively (no upscaling).

## QA

After generation, I'll inspect each file's dimensions and visually verify:
- Resolution = 1290×2796
- No Higgsfield text on panel 6
- Text is legible and matches the original copy
- Brutalist B&W aesthetic consistent across all 6

If any panel comes out wrong (text typo, off-brand styling, watermark), I'll regenerate just that one.

## Caveats

AI regeneration is not pixel-identical to the originals — phone mockup positions, icon shapes, and typographic details will differ slightly even with tight prompts. If you need the *exact* original composition pixel-for-pixel at App Store res, the only true fix is to re-render the source artwork in a vector tool (Figma) at 1290×2796 — generative AI can't guarantee that.
