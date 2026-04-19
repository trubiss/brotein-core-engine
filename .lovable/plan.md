
## Plan: 4-Step Welcome Carousel

Add a pre-auth welcome carousel that shows on first launch, before the SignInScreen. Users can skip or complete it; completion is persisted to localStorage so it never shows again.

### Files

**New: `src/components/WelcomeCarousel.tsx`**
- 4 swipeable/tappable screens using `framer-motion` slide transitions (matches existing `OnboardingFlow` pattern).
- Shared layout: `SKIP` top-right, content center, square pagination (■ □ □ □) + full-width black action button at bottom.
- Screen 1: Massive "TRACKING SUCKS." headline, subtext, empty negative space.
- Screen 2: "ONE METRIC." headline, huge centered "126G" display in Space Mono.
- Screen 3: "ZERO FRICTION." headline, minimalist Camera icon (lucide) inside a bordered black square.
- Screen 4: "FORGE DISCIPLINE." headline, row of 7 square boxes with 🔥, button reads `LET'S GO`.
- Calls `onComplete` which sets `localStorage['brotein_welcome_seen'] = '1'`.

**Edit: `src/pages/Index.tsx`**
- Add state `welcomeSeen` read from localStorage on mount.
- Render order: loading → if `!welcomeSeen` show `<WelcomeCarousel onComplete={...} />` → if `!user` SignInScreen → if `!profile` OnboardingFlow → Dashboard.
- Carousel shows BEFORE sign-in (pure marketing/hook), independent of auth.

### Design Tokens (consistent with existing brutalist system)
- Headlines: `font-mono font-black text-5xl md:text-6xl uppercase tracking-tighter`
- Subtext: `font-sans text-xs uppercase tracking-widest text-muted-foreground leading-relaxed`
- Buttons: `w-full bg-foreground text-background py-5 font-mono font-bold uppercase tracking-widest` (zero radius)
- Pagination: 4 small squares, active = filled black, inactive = outlined
- SKIP: `absolute top-6 right-6 text-xs uppercase tracking-widest`

### Behavior
- NEXT advances slides with horizontal slide animation (reuse existing `slideVariants` style).
- SKIP and LET'S GO both call `onComplete`.
- No swipe-back logic needed (forward-only or arrow), keeps it simple. Pagination dots are visual only (not tappable) to enforce linear hook flow.
