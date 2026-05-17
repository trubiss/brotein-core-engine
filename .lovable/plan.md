## Onboarding Cleanup — Strip to Essentials

Goal: align the 3 form screens (`BiometricsScreen`, `GoalsScreen`, `ResultsScreen`) + `ManualTargetScreen` with the visual discipline of `OnboardingStoryFlow`. No copy changes. Same brutalist tokens. Remove every element that isn't carrying its weight.

### Diagnosis — what's noisy today

After the last pass, each form screen carries three competing systems:
1. The shared header (segmented bar + chevron + `01/03` counter)
2. A kicker line (`A · MEASUREMENTS`, `B · TRAJECTORY`, `C · OUTPUT`)
3. Per-row decoration (numbered badges `01/02/03`, unit chips, meta values like `1.8 G/KG`, section headers `ACTIVITY COEFFICIENT`)

That's three places telling you where you are, plus per-row chrome competing with the actual content. The story flow uses **one** of those systems and reads instantly.

### Cleanup rules (apply to all screens)

- Headline = the only thing that matters at the top.
- Progress = one thin bar at the very top, story-flow style (matches what came before).
- Drop every kicker, section label, and number badge.
- One column. Same horizontal padding everywhere (`px-6`).
- Vertical rhythm on multiples of 8: `pt-4 pb-6`, gaps of 16/24/32 only.
- Borders only where they encode meaning (selected state, input baseline). No purely decorative borders.

### Per-screen changes

**Shared `OnboardingHeader` — simplified**
- Remove segmented bars, kicker prop, large dividing rule under the headline.
- Replace with the exact header from `OnboardingStoryFlow`: back chevron (left) · one thin 2px progress line (center, ~65% width) · `SKIP` slot empty. No `01/03` counter.
- Headline rendered by the screen, not the header — gives each screen full control over headline spacing.

```text
  ←       ───────────────────         
                                       
  STRUCTURAL                           
  DATA                                 
```

**BiometricsScreen — quiet form**
- Drop unit chips (`KG/CM/YR`) — units go into the label itself: `WEIGHT (KG)`, `HEIGHT (CM)`, `AGE`.
- Drop the staggered entry animation — let the screen-level slide do the work.
- Single column, three rows, each row = small label above, big underlined number input below (left-aligned, full width).
- Manual-override becomes a plain centered text link below the CTA: `ALREADY KNOW YOUR TARGET →` — no border box.

```text
  WEIGHT (KG)
  __82_______________________________

  HEIGHT (CM)
  __178______________________________

  AGE
  __29_______________________________
                                   
  [        CONTINUE              →  ]
       ALREADY KNOW YOUR TARGET →
```

**GoalsScreen — match story flow's button stack**
- Drop section headers (`ACTIVITY COEFFICIENT`, `PHYSICAL TRAJECTORY`), kickers, numbered badges, meta values, and the inverted arrow.
- Two question-style stacks separated by a single short headline change rendered inside the body (not a label):
  - First page asks `HOW ACTIVE ARE YOU?` (no copy change — just promote the existing prompt visually)
  - Second `WHAT'S YOUR GOAL?`
- Options become the exact `h-14` bordered button used in `OnboardingStoryFlow`: label only, full-width, invert-on-select. Description shown as a single-line muted subtext under each label (12px, +6% tracking).

Important detail: splitting the screen into two sub-pages preserves all current data flow (`onUpdate({activityLevel})` / `onUpdate({goal})`) — just adds one internal step. Headline copy stays as today (`KINETIC OBJECTIVES`) for the wrapper; per-section sub-prompts are kept tiny and secondary. **If you'd rather not split**, fallback is keeping both lists on one screen but with story-flow buttons and only the existing `KINETIC OBJECTIVES` headline — confirm preference in the build.

**ResultsScreen — single hero number**
- Drop the kicker (`C · OUTPUT`) and the animated rule draw.
- Headline `CALCULATION COMPLETE` stays.
- Center stack:
  - small label `DAILY PROTEIN TARGET`
  - giant count-up number (kept — it earns its place)
  - 32px of breathing room
  - 3-column macros, no individual cell animation, no big numbers competing with the hero — keep at ~18px
  - `MEAL FREQUENCY` becomes the 4th cell in the grid (eliminates the orphaned block below)
- Bottom CTA unchanged.

```text
  CALCULATION
  COMPLETE

           DAILY PROTEIN TARGET
                184G
            ────────────

      CALORIES   CARBS    FATS    MEALS
        2 410    240G     78G     5×/D

  [       START TRACKING        →  ]
```

**ManualTargetScreen — match Results rhythm**
- Same simplified header.
- Centered number input identical to Results' display, just editable.
- Drop the "RECOMMENDED RANGE" line into a single muted helper under the input (already there, just retypeset).

### Token / utility changes

- `.btn-cta` — keep, but reduce height to 56px to match story flow's `h-14`. Drop the gap-3 + arrow icon from the utility; screens pass the arrow as a child only when wanted.
- New `.input-bio` — single underline, left-aligned, 40px Space Mono Black, used by Biometrics rows.
- Remove `.bio-row` (no longer needed once units move into labels).

### Files

- `src/components/onboarding/OnboardingHeader.tsx` — strip to back + thin progress line.
- `src/components/BiometricsScreen.tsx` — simplified rows, link instead of bordered override.
- `src/components/GoalsScreen.tsx` — story-flow buttons; either single screen with one headline or split into two sub-steps (I'll pick the single-screen version unless you prefer the split).
- `src/components/ResultsScreen.tsx` — drop kicker + rule draw, fold meal frequency into the grid.
- `src/components/ManualTargetScreen.tsx` — header + button rhythm.
- `src/index.css` — adjust `.btn-cta`, add `.input-bio`, remove `.bio-row`.

### Out of scope

- All copy (headlines, button labels, descriptions) stays exactly as today.
- Story flow untouched.
- No changes to flow/state/persistence.
