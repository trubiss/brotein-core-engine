## Body Map v2 — Anatomical + Colored Tiers

Rebuild the Body Map to look like the reference: real anatomical muscle definition + colorful tier-based fills. This intentionally overrides the brutalist B&W rule for this one feature because it's the app's hero selling point and needs to feel rewarding.

### What changes

**1. Replace the crude polygon body with a proper anatomical SVG**

Hand-draw a detailed anatomical figure (front + back) using bezier curves. Each muscle group becomes a properly-shaped path:

- Pecs: two curved upper-chest shapes with cleavage gap
- Deltoids: rounded shoulder caps
- Biceps: peaked upper-arm bulges
- Triceps (back): horseshoe shape
- Forearms: tapered curves
- Abs: 6-pack with proper rectus segmentation + linea alba split
- Obliques: angled side-flank shapes
- Quads: four-headed thigh shapes with split
- Hamstrings: curved back-thigh
- Glutes: rounded buttock shapes
- Calves: diamond-shaped lower-leg bulges
- Lats: V-shaped wing
- Traps: upper-back diamond
- Neck: sternocleidomastoid lines

Body silhouette stays as a thin outline (no more skinny rectangle limbs). Head becomes a proper rounded oval with subtle neck taper.

**2. Tier-based color system (instead of unlock B&W fills)**

Each muscle group displays the color of the **highest tier the user has reached at the time it unlocked**. The whole figure changes color as the user progresses, exactly like the reference:

```
DORMANT   → outline only, no fill
NOVICE    (Day 1)   → RED      #ef4444
BUILDER   (Day 7)   → ORANGE   #f97316
FORGED    (Day 21)  → GREEN    #22c55e
ARCHITECT (Day 60)  → BLUE     #3b82f6
MONOLITH  (Day 90)  → PURPLE   #a855f7
LEGEND    (Day 180) → PINK     #ec4899   (new top tier)
```

Locked muscles render as thin outline only. Unlocked muscles fill with the color of the tier active when they unlocked, so an Architect-tier user sees:
- abs/chest (unlocked at NOVICE) = red
- arms/legs (unlocked at BUILDER) = orange
- back/glutes (unlocked at FORGED) = green
- forearms/obliques (unlocked at ARCHITECT) = blue

This gives the layered rainbow look from the reference and visually shows progression history.

**3. Dashboard card layout**

Make the card match the reference's split layout — Start (gray outline) on the left, Now (your current colored body) on the right, with a `›` between. This is the "selling moment": users see their actual transformation.

```
┌──────────────────────────────────────┐
│ // YOUR ARCHITECTURE                 │
│                                      │
│   [outline]    >    [your body]      │
│    START                NOW          │
│                                      │
│ ━━━━━━━━━━━━━━━━━━░░░░░░░░  47%     │
│ TIER: FORGED          14 / 90 DAYS › │
└──────────────────────────────────────┘
```

**4. Detail screen layout**

Match the reference closer:
- Front view on top, back view below (no toggle — show both stacked, like the reference)
- Tier pills bar in the middle showing current tier highlighted
- Milestone list underneath

### Files

**Modified:**
- `src/components/BodyMap.tsx` — full rewrite with proper anatomical paths + color prop per muscle
- `src/components/BodyMapCard.tsx` — split Start/Now layout
- `src/components/BodyMapScreen.tsx` — stacked front+back, tier pills bar
- `src/lib/bodyMap.ts` — add tier color map, add LEGEND tier at day 180, add helper `tierForGroup(group, hitDays)` returning the tier active when that group unlocked

### Aesthetic note

This breaks the project's brutalist B&W rule on purpose, scoped to this feature only. Everything else (Dashboard chrome, Fuel Status, typography) stays B&W. The Body Map becomes the one colorful artifact in the app — exactly what makes it a selling point.

### Not in scope

- Hand-drawn pixel-perfect anatomy (we're doing stylized vector, not medical-textbook detail)
- Front/back toggle (replaced with stacked view per the reference)
- Animated transition between unlock states beyond a simple fade
