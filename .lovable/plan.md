# Fix oversized word gaps in onboarding headlines

## Problem
The onboarding slide headlines (e.g. "NO PROTEIN. NO RESULTS.", "ONLY ONE NUMBER MATTERS.", "HOW MUCH PROTEIN DO YOU EAT PER DAY?") use **Space Mono** — a monospace font where every space is a fixed, full character width. That makes the gap between words look unnaturally wide and amateurish, especially at the large 40px display size.

It only stands out on slides with multiple short words per line; single long words like "STRUGGLE" look fine, which matches your observation.

## Fix
Keep the brutalist Space Mono look — just compress the **word spacing** (the gap between words) without touching letter-spacing or the font itself.

**File:** `src/components/OnboardingStoryFlow.tsx`

Update the `HEADLINE_CLS` constant (line 31) to add a negative `word-spacing`:

```
'font-mono font-black text-[40px] leading-[0.92] tracking-[-0.015em] [word-spacing:-0.25em] uppercase text-foreground'
```

This shrinks inter-word gaps by roughly 25% of the font size — enough to feel natural and intentional, while still leaving a clear visual break between words. Letter-spacing inside each word is untouched, so the monospace rhythm is preserved.

## Also check
`ManualTargetScreen.tsx` line 55 uses the same `font-mono font-black text-[40px]` headline ("SET YOUR TARGET") — apply the same `[word-spacing:-0.25em]` there for consistency.

## Out of scope
- No font swap, no layout changes, no copy edits.
- Body/sub text and labels are left as-is (they use smaller sizes where the gap reads fine).
