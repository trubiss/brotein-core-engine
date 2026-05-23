## Plan

Fix the scroll reset so it works reliably in the browser preview and in the iOS native WebView.

### Changes

1. **Strengthen the page-level scroll reset**
   - In `src/pages/Index.tsx`, replace the single `window.scrollTo(0, 0)` effect with a small helper that resets every common scroll container:
     - `window`
     - `document.documentElement`
     - `document.body`
     - `#root`

2. **Run the reset after layout/animation settles**
   - Trigger the reset immediately, then again on the next animation frame and shortly after mount.
   - This handles iOS WKWebView restoring scroll position after React renders or after Framer Motion finishes the page transition.

3. **Add a dashboard-specific safety reset**
   - In `src/components/Dashboard.tsx`, reset scroll on dashboard mount as a fallback, so the home screen always starts at the top even after finishing onboarding.

### Technical detail

The existing fix only calls `window.scrollTo(0, 0)`. On iOS native WebView, scroll can be held on `body`, `html`, or restored after the first render. Resetting all containers in a delayed frame makes the behavior deterministic without changing app logic or onboarding data.