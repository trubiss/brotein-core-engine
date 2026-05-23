# Reset scroll to top on page entry

## Problem
After finishing onboarding (and when navigating between pages), the dashboard sometimes opens with the window already scrolled down a bit. The browser preserves the previous scroll position from the prior screen (e.g. ResultsScreen / onboarding) instead of starting at the top.

## Fix
In `src/pages/Index.tsx`, add a single `useEffect` that calls `window.scrollTo(0, 0)` whenever the active `page` changes, and also when the profile first becomes available (i.e. right after onboarding completes and we switch to the dashboard).

```ts
useEffect(() => {
  window.scrollTo(0, 0);
}, [page, profile]);
```

That's it — no other files need changes. Pure presentation tweak, no business logic touched.
