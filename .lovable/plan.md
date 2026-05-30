## Body Map — Protein Progress Visualization

A signature feature on the Dashboard that turns daily protein consistency into a visible, growing anatomical figure. Front + back views, brutalist line-art style matching the app.

### Concept

Each muscle group on a stylized human body "fills in" as the user accumulates **days where they hit their daily protein target**. The body starts as an empty wireframe outline and progressively gets filled with solid black (the app's brutalist accent) as muscle groups unlock at milestone thresholds.

This becomes the emotional payoff for daily logging — every hit day visibly builds the body.

### Unlock progression (cumulative hit days)

```
Day  1  →  Core (abs) lights up
Day  3  →  Chest
Day  7  →  Shoulders + Arms (biceps, triceps)
Day 14  →  Quads + Hamstrings
Day 21  →  Back (lats, traps) — back view unlocks
Day 30  →  Glutes + Calves
Day 60  →  Forearms + Obliques
Day 90  →  Neck + full definition layer (cross-hatching detail)
```

A small label under the body shows current tier:
`NOVICE → BUILDER → FORGED → ARCHITECT → MONOLITH`
(replacing the colorful "Beginner/Novice/Intermediate" pills from the reference — same idea, but typographic and brutalist.)

### Placement on Dashboard

A new collapsed card sits between Fuel Status and the daily log list:

```
┌─────────────────────────────┐
│ // ARCHITECTURE             │
│ 14 / 90 DAYS                │
│                             │
│   [body silhouette,         │
│    partially filled]        │
│                             │
│ TIER: BUILDER          ›    │
└─────────────────────────────┘
```

Tap → opens full-screen `BodyMapScreen` with:
- Front / Back toggle (swipe or tab)
- Larger figure with all unlocked groups filled
- Milestone list showing next unlock ("CHEST UNLOCKED · BACK IN 7 DAYS")
- Total protein-hit days, current streak, longest streak

### Visual style

- Pure brutalist: black outline figure on cream background (light mode) / white outline on black (dark mode)
- Unlocked muscles = solid `--foreground` fill
- Locked muscles = thin outline only, low-opacity dashed stroke
- Zero gradients, zero color (matches existing aesthetic — no rainbow tiers)
- Subtle scale-in animation when a new group unlocks (one-time celebration on the day it triggers)
- All labels Space Mono, ALL CAPS, tracking-wide

### Data model

Uses existing `protein-hit-days` data already tracked for streaks. No new database tables needed — derive `unlockedGroups` from a single count of historical hit days (stored in local storage / Firestore profile). Reuses current persistence layer.

### Files

**New:**
- `src/components/BodyMap.tsx` — SVG component, front + back, takes `hitDays: number` prop, renders correct fills
- `src/components/BodyMapCard.tsx` — collapsed Dashboard card
- `src/components/BodyMapScreen.tsx` — full-screen detail view with front/back toggle, milestone list
- `src/lib/bodyMap.ts` — unlock thresholds, tier names, helper to compute unlocked groups from hit-day count
- `src/assets/body-front.svg` + `src/assets/body-back.svg` — base anatomical line art (or inline JSX paths in BodyMap.tsx)

**Modified:**
- `src/components/Dashboard.tsx` — insert `<BodyMapCard />` and route to detail screen
- `src/lib/store.ts` or wherever hit-day count lives — expose a `getProteinHitDays()` selector if not already there

### Why this sells the app

- Turns invisible consistency into a tangible avatar that grows with the user
- Creates a long-term goal (90 days to full unlock) beyond daily streaks
- Becomes the natural paywall hook: "Unlock your full body map — Premium"
- Screenshot-worthy for App Store listing and social sharing

### Out of scope (for now)

- No real body-fat or weight tracking
- No multi-color tiers (intentional — matches brutalist B&W aesthetic)
- No animation library beyond what's already in the project (framer-motion)
