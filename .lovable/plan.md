## Plan: App Store assets for Annual + Monthly subscriptions

Produce two paywall screenshots (one per plan selected) at iPhone 6.7" (1290×2796) plus suggested App Store Connect copy.

### Step 1 — Temporary preview routes
Add two dev-only routes in `src/App.tsx`:
- `/__paywall-annual` → `<Paywall onStart={() => {}} streak={0} />` (annual is default selected)
- `/__paywall-monthly` → same component but wrapped to auto-click the Monthly card on mount, so the screenshot captures monthly-selected state

(Implementation note: simplest path is one route `/__paywall?plan=monthly` that reads the query param and programmatically taps the monthly card via a `useEffect` + ref, but two routes is cleaner.)

### Step 2 — Capture screenshots
- Browser viewport: 390×844 (closest supported to iPhone 6.7" CSS dimensions; devicePixelRatio gives us native resolution)
- Capture full page for each route
- Upscale/resize the resulting PNGs to exactly 1290×2796 using ImageMagick to match Apple's required dimensions
- Save to:
  - `/mnt/documents/appstore-paywall-annual-1290x2796.png`
  - `/mnt/documents/appstore-paywall-monthly-1290x2796.png`

### Step 3 — Remove temporary routes
Revert `src/App.tsx` so the `__paywall-*` routes don't ship.

### Step 4 — Provide App Store Connect copy
Draft text for each subscription, sized to App Store Connect's limits:

**Annual subscription**
- Reference Name (internal): `Brotein Annual`
- Display Name (30 char max): `Brotein Annual`
- Description (45 char max for subscription localization): `Best value — save 33%. 7-day free trial.`

**Monthly subscription**
- Reference Name: `Brotein Monthly`
- Display Name (30 char max): `Brotein Monthly`
- Description (45 char max): `Flexible monthly access. Cancel anytime.`

Plus a short **Review Notes** snippet to paste into App Store Connect explaining what reviewers see:
> "Paywall appears after onboarding + first protein log. Both subscription options visible; tap to select, then 'Start' to subscribe. Annual offers a 7-day free trial; Monthly is full price from day one."

### Deliverables
- 2 PNG files in `/mnt/documents/` surfaced as `<presentation-artifact>` tags
- Markdown block with all the copy ready to paste into App Store Connect

### Out of scope
- No changes to `Paywall.tsx`, pricing, IAP product IDs, or `src/lib/iap.ts`
- No App Store Connect API calls — copy is for you to paste manually
