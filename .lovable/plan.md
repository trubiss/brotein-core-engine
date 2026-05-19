## Goal
Take the composite strip you uploaded and produce **6 separate, App Store–ready PNGs at exactly 1290×2796**, keeping the current dark + phone-glow aesthetic but with perfected headline typography.

## Steps

### 1. Slice the composite
Copy `user-uploads://image-51.png` to `/tmp/`, detect the 6 panel boundaries (the strip already has clear vertical gaps between panels), and split into 6 base images:
1. MOST GUYS MISS PROTEIN
2. ONE NUMBER MATTERS
3. ZERO FRICTION
4. TAP. DONE.
5. YOU'RE BEHIND
6. STAY ON TRACK

### 2. Strip and re-typeset headlines
For each panel:
- Mask out the existing top headline + subtitle area with pure black (preserving the phone + glow below)
- Re-render the headline cleanly in **Space Grotesk Bold/Black** (matches Brotein's brutalist system) with:
  - Consistent left margin (~80 px at 1290 wide)
  - Consistent baseline / top position across all 6
  - Tightened tracking (-0.02em) and proper line-height
  - Auto-balanced line breaks so no orphans
  - Uniform headline size (e.g. ~140 px) — currently they vary
- Re-render subtitles in **Space Grotesk Regular** at a consistent smaller size, same left margin
- Same color hierarchy: headline pure white, subtitle ~70% white

### 3. Compose at exact App Store size
- Scale/pad each panel canvas to exactly **1290×2796** (iPhone 6.7" required size)
- Pure black background, phone hero preserved as-is from your composite
- Save as:
  - `/mnt/documents/appstore-01-most-guys.png`
  - `/mnt/documents/appstore-02-one-number.png`
  - `/mnt/documents/appstore-03-zero-friction.png`
  - `/mnt/documents/appstore-04-tap-done.png`
  - `/mnt/documents/appstore-05-youre-behind.png`
  - `/mnt/documents/appstore-06-stay-on-track.png`

### 4. QA pass
Re-open each PNG, verify:
- Exact 1290×2796 dimensions
- Headline baseline consistent across all 6
- No text clipping, no orphan words
- Phone artwork intact, no double-exposure on the mask edge

Surface all 6 as `<presentation-artifact>` tags.

## Out of scope
- No changes to the phone mockups themselves (angles, glow, screen contents)
- No copy rewrites — keeping your exact headlines
- No project source file changes