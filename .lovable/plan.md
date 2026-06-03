
## New Onboarding Flow

One self-contained React component that owns all 16 screens, replacing the current `OnboardingStoryFlow` → `OnboardingFlow` (biometrics/goals/results) → `Paywall` sequence in `src/pages/Index.tsx`. Persists the resulting profile + paywall acknowledgement so the user lands on the dashboard at the end.

Note: this onboarding intentionally uses a different aesthetic from the rest of the app (white background, Inter, rounded pills) per your spec. The main app stays brutalist B&W.

### Files

- `src/components/onboarding/NewOnboarding.tsx` — the full flow (all 16 screens, state, progress bar, back arrow, transitions).
- `src/components/onboarding/screens/` — one file per screen (Splash, Pain, Validation, Commitment, Goal, Training, Experience, Weight, Height, Age, Physique, Photo, Loading, PlanReveal, SocialProof, PaywallNew) for readability.
- `src/components/onboarding/parts/` — shared primitives: `ProgressBar`, `PillOption`, `PrimaryCTA`, `BackArrow`, `ScrollPicker`.
- `src/pages/Index.tsx` — swap the three gated screens for the new flow.

### State

Single `useState` object inside `NewOnboarding`:
```
{ pain, commitment, goal, trainingDays, experience,
  weight:{value,unit}, height:{value,unit}, birth:{m,d,y},
  physique, photoDataUrl, plan:'monthly'|'yearly' }
```
- Step index drives the progress bar (1/14 → 14/14, hidden on splash + loading).
- Back arrow on every screen except Splash (1) and Loading (13).
- Choice CTAs disabled (gray pill) until a selection exists; enabled CTA = black pill, white text.
- Transitions: framer-motion x-slide between screens (already a project dep).

### Screen-specific behavior

- **Screen 8/9 weight & height:** `ScrollPicker` with kg/lb and cm/ft toggles; selected row bold/large, neighbors fade. Snap-scroll list (CSS `scroll-snap`).
- **Screen 10 age:** three side-by-side `ScrollPicker`s (month name / day / year 1940–current).
- **Screen 12 photo:** `<input type="file" accept="image/*" capture="environment">` triggered by "Take Photo"; preview shown in the dashed box; "Skip for now" advances without a photo. Stored as a data URL in state only (not uploaded).
- **Screen 13 loading:** dark `#0A0A0A` bg, white text, CSS-animated bar over 3s, `setInterval` cycles 4 status strings every 750ms, `setTimeout(..., 3000)` auto-advances. No back arrow.
- **Screen 14 plan reveal:**
  - protein g = `Math.round((weightKg * 2.2) / 5) * 5` (convert lb→kg first if needed).
  - date = `today + 90 days`, formatted `"September 14"` via `toLocaleDateString('en-US',{month:'long',day:'numeric'})`.
- **Screen 16 paywall:** Monthly/Yearly segmented toggle (yearly default, "Save 67%" badge). Pricing card swaps with framer-motion fade. CTA calls `startTrial(user.uid)` (existing helper in `@/lib/paywall`), then completes. "Restore Purchase" is a no-op link for now. On mount, `console.log(state)` for testing as requested.

### Persistence / integration

On reaching Screen 16 CTA:
1. Build a profile compatible with the current `useAuth().refreshProfile()` contract — map: weight (kg), height (cm), age (from birth date), goal → existing `Goal` enum (`'hypertrophy' | 'cut' | 'recomp'`), activityLevel inferred from training days (`0-2→sedentary, 3-4→active, 5-6→very_active, 7→athlete` matching existing `ActivityLevel`), protein target from the formula above (use existing manual-target write path in `@/lib/profile` so dashboard reads the same shape).
2. Mark both `brotein_story_seen:<uid>` and `brotein_paywall_seen:<uid>` in localStorage (same keys `Index.tsx` already checks) so the dashboard renders next.
3. Call `startTrial(user.uid)`.

### Routing change in `Index.tsx`

Replace the three gates:
```
if (!storySeen) → <OnboardingStoryFlow .../>
if (!profile)   → <OnboardingFlow />
if (!paywallSeen) → <Paywall .../>
```
with a single:
```
if (!storySeen || !profile || !paywallSeen)
  return <NewOnboarding onDone={...} />
```
The old `OnboardingStoryFlow`, `OnboardingFlow`, `Paywall` files stay on disk (unused) so nothing else breaks; we can delete them in a follow-up if you want.

### Styling

- Inline Tailwind only — no theme token changes (keeps the brutalist tokens intact for the rest of the app).
- Container: `mx-auto w-full max-w-[390px] min-h-screen bg-white text-black font-sans` (Tailwind's `font-sans` already resolves to Inter/system).
- Pills: `rounded-full`, selected = `bg-black text-white`, unselected = `bg-[#F5F5F5] text-black`.
- CTA: `w-full rounded-full bg-black text-white py-4 font-semibold` (disabled = `bg-[#E5E5E5] text-[#9A9A9A]`).
- Secondary text: `text-[#6B6B6B]`.
- Progress bar: 2px line, `bg-black` fill on `bg-[#EFEFEF]` track.

### Out of scope

- No backend schema changes; AI physique projection on Screen 12 is mocked (photo is stored locally, not sent anywhere).
- "Restore Purchase" link is visual only.
