## Onboarding Polish Plan

Scope: post-story onboarding only (`BiometricsScreen` → `GoalsScreen` → `ResultsScreen`, plus `ManualTargetScreen`). Keep current 3-screen structure and keyboard inputs. No new dependencies. Brutalist B&W identity preserved — same Space Mono / Grotesk tokens, 0px corners.

### What's wrong today

- After the dramatic story flow, the form screens feel flat: no sense of progress, no rhythm, no payoff.
- Inputs are thin and identical; no visual weight matches the headlines.
- The Results "reveal" is a static number — the climax of onboarding doesn't feel like one.
- Buttons (BACK / NEXT) look identical in weight, hurting clarity.
- Manual-override link buried as small underline text.

### Changes

**1. Shared progress header (new)**
A top bar shared across bio / goals / results showing step position. Brutalist execution: numeric counter + a row of segmented bars.

```text
  01 / 03                          ────  ────  ────
  STRUCTURAL DATA                   ████  ────  ────
  ─────                              (filled segments = progress)
```

Counter is mono caps, segments are 2px-tall blocks that fill black as you advance, with a 250ms ease-out width animation between steps.

**2. BiometricsScreen — input redesign**
- Replace three identical underline inputs with **large-number inputs**: each field shows the entered value at ~56px Space Mono on the right, label on the left, thick 2px underline that thickens to 4px on focus.
- Unit chip (`KG`, `CM`, `YR`) sits inline next to the value to remove ambiguity.
- Fields stagger in on mount (40ms each) for rhythm matching the story flow.
- Manual-override link promoted to a bordered ghost row at the bottom (`ALREADY KNOW YOUR TARGET? →`) with an arrow glyph.

Sketch:
```text
  BODY MASS                              82  KG
  ──────────────────────────────────────────
  HEIGHT                                178  CM
  ──────────────────────────────────────────
  AGE                                    29  YR
  ──────────────────────────────────────────
```

**3. GoalsScreen — hierarchy + selection feedback**
- Each option row gains a **leading numeric badge** (`01 02 03`) in mono and a **right-side meta value** (e.g. `1.8 G/KG`) pulled out of the description for scannability.
- Selection animation: instead of an instant invert, the black fill sweeps in from the left over 200ms; a small inverted arrow (`→`) appears on the right.
- Sections get a thin numeric label (`A · ACTIVITY` / `B · TRAJECTORY`) to break the monotony of two identical stacks.
- Tap target height bumped from current ~56px to 64px for thumb-comfort.

**4. ResultsScreen — make it the climax**
- Headline becomes `CALCULATION COMPLETE` with a typewriter-like reveal (8 chars at a time, ~30ms each).
- The protein number **counts up** from 0 to the target over 900ms (ease-out-cubic), in 96px Space Mono Black, kerning -2%.
- Below the number: a thin animated rule that draws left-to-right in 400ms after the count finishes.
- 3-column macros grid: each cell fades + slides up 8px in sequence (80ms stagger) after the rule lands.
- `START TRACKING` button: full-width, 64px tall, with a tiny `→` glyph that nudges 4px right on hover/press.

**5. Buttons & rhythm (shared)**
- `BACK` becomes a top-left chevron (`← BACK`) inside the progress header, not a bottom-row button — frees the bottom for one strong primary CTA per screen.
- Primary CTA spans full width, label centered, 56–64px tall. Disabled state: 12% opacity (current 30% reads as "broken").
- Page padding standardized to `px-6 pt-6 pb-8`; vertical rhythm on an 8pt grid.

**6. Transitions**
- Keep the existing horizontal slide between steps but shorten to 160ms with `cubic-bezier(0.2, 0.8, 0.2, 1)` to match story flow easing.
- Add a 1-frame `prefers-reduced-motion` fallback that disables count-up + stagger.

### Files touched

- `src/components/OnboardingFlow.tsx` — add `currentStepIndex` / `totalSteps` and pass to each screen; wire shared header.
- `src/components/BiometricsScreen.tsx` — new input layout, staggered mount, promoted manual link.
- `src/components/GoalsScreen.tsx` — badges, meta values, sweep-in selection.
- `src/components/ResultsScreen.tsx` — count-up hook, rule-draw, staggered macros.
- `src/components/ManualTargetScreen.tsx` — light pass to match new header + button rhythm.
- `src/index.css` — possibly one new utility (`.btn-cta` for the 64px full-width CTA) if it can't be expressed cleanly with Tailwind.

### Out of scope

- No copy rewrites (screen titles stay: `STRUCTURAL DATA`, `KINETIC OBJECTIVES`, `CALCULATION COMPLETE`).
- No new fields, no new flow steps, no dependency installs.
- SignIn, Dashboard, Paywall, story flow untouched.
