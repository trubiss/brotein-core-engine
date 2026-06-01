# Goal Hit Celebration Screen

When the user crosses their daily protein target, show a one-time-per-day fullscreen celebration with an animated fire 🔥, a bold motivational headline, and stats.

## UX

- Triggers the moment `consumed >= target` (only for today, not when scrubbing past days).
- Shows once per day per user (persisted in localStorage, same key style as the existing `target_hit` tracker).
- Fullscreen black overlay, brutalist B&W aesthetic to match the app.
- Giant fire emoji 🔥 (text glyph at huge size for crisp 4K-feel) with a continuous flicker/scale/rotate loop via framer-motion.
- Headline rotates from a pool of motivational lines (KEEP GRINDING / LOCKED IN / FUEL SECURED / ANOTHER DAY DOMINATED / NO DAYS OFF).
- Sub-line: `{consumed}G / {target}G · STREAK {n}`.
- "TAP TO DISMISS" hint at bottom; tap anywhere or auto-dismiss after 4s.
- Light haptic on appear; respects `prefers-reduced-motion` (no flicker, just fade-in).

## Implementation

New file `src/components/GoalHitCelebration.tsx`:
- Props: `consumed`, `target`, `streak`, `onClose`.
- `motion.div` fixed-inset overlay (z-50), `bg-background`, `animate-fade-in`.
- Fire emoji uses `motion.span` with looped `scale: [1, 1.08, 0.96, 1.05, 1]` and `rotate: [-2, 2, -1, 1, 0]`, ~1.6s ease-in-out infinite. Size `text-[40vh]` for impact.
- Headline picked randomly once per mount from the pool, `font-display`, `tracking-[0.15em]`, ALL CAPS.
- Auto-dismiss timer (4s) + click handler.

Wire into `src/components/Dashboard.tsx`:
- Reuse the existing `target_hit` localStorage gate. Add a sibling key `brotein_target_celebrated:{uid}:{date}` so analytics fires once AND celebration shows once independently.
- Add `const [celebrate, setCelebrate] = useState(false)`.
- In the existing `hitTarget` effect, when `isToday` and not yet celebrated, set the flag and `setCelebrate(true)`.
- Render `{celebrate && <GoalHitCelebration ... onClose={() => setCelebrate(false)} />}` at the root of the Dashboard return.
- Fire haptic on appear (reuse existing `haptic()` pattern).

No changes to data models, firestore, or business logic.

## Files

- create `src/components/GoalHitCelebration.tsx`
- edit `src/components/Dashboard.tsx` (state + effect + render)
