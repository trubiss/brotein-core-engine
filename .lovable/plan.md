## Swipe gestures for onboarding

Add finger-swipe navigation to the onboarding so the user can drag horizontally instead of (or in addition to) tapping the CTA.

### Story flow — `src/components/OnboardingStoryFlow.tsx`
The animated slide already uses framer-motion. Add drag handling to that same `motion.div`:

- `drag="x"`, `dragConstraints={{ left: 0, right: 0 }}`, `dragElastic={0.2}`.
- `onDragEnd` commits navigation when `offset.x` passes ~80px or `velocity.x` passes ~500:
  - Right swipe → `prev()` (no-op on step 0).
  - Left swipe → `next()` **only on non-question slides**. Question slides still require tapping a choice (a swipe with no answer shouldn't auto-advance).
- Remove `touch-none` from the outer container so horizontal pan is captured; keep `overscroll-none` to suppress browser pull-to-refresh. Vertical scrolling isn't needed in these slides.
- Keep the CTA button — swipe is additive.

### Bio/goals flow — `src/components/OnboardingFlow.tsx`
Same drag wrapper on the animated `motion.div`:
- Right swipe → call the step's `onBack`.
- Left swipe → not wired (forward depends on input validation per screen; honoring it via swipe would silently skip required fields).

This gives a consistent "swipe back" everywhere and "swipe forward" through the story slides.