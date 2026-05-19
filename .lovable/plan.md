## Plan

1. Add a temporary dev-only route `/__paywall` in `src/App.tsx` that renders `<Paywall onStart={() => {}} streak={0} />` standalone (no auth, no Dashboard chrome).
2. Open the preview at `/__paywall` at iPhone size (391×844) and screenshot it.
3. Save the PNG to `/mnt/documents/paywall.png` and surface it as a downloadable artifact.
4. Remove the temporary route from `src/App.tsx` so it doesn't ship to production.

No other files touched.
