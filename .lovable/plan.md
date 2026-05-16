## Generate App Store Assets

Produce the visual assets you'll upload to App Store Connect and drop into the Xcode project. All files land in `/mnt/documents/` for download, and the app icon also goes into the repo at `src/assets/` so we can reference it from the PWA manifest / Capacitor splash.

### What gets generated

**1. App Icon — `brotein-icon-1024.png`**
- 1024×1024 PNG, no transparency, no rounded corners (Apple rounds them automatically)
- Brutalist B&W: solid black background, bold white "B" mark in Space Mono / heavy geometric sans
- Generated via `imagegen` with `model: premium` (icon is brand-critical, must be crisp)
- Saved to `src/assets/brotein-icon-1024.png` + copied to `/mnt/documents/`

**2. Splash / Launch Screen — `brotein-splash-2732.png`**
- 2732×2732 (covers all iPhone + iPad sizes when Capacitor scales it)
- White background, centered black "BROTEIN" wordmark, tiny tagline "ARCHITECTURAL NUTRITION" beneath
- Saved to `/mnt/documents/` and `resources/splash.png` (Capacitor convention)

**3. App Store screenshots — 6.7" iPhone (1290×2796), 3 frames**
- Captured from the live preview using `browser--screenshot` at the right viewport, then composited onto a branded background with a one-line caption above each:
  - Frame 1: Dashboard with Fuel Status ring — caption "TRACK PROTEIN. NOTHING ELSE."
  - Frame 2: Quick Log modal open — caption "LOG IN UNDER 3 SECONDS."
  - Frame 3: History/streak view — caption "BUILD THE STREAK."
- Composited via a small Python/Pillow script (no need for the macOS product-shot frame — App Store rejects those; needs raw device-frame-free or device-framed shots)
- Saved as `/mnt/documents/screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`

**4. Marketing copy stub — `app-store-listing.md`**
- App name: Brotein
- Subtitle (≤30 chars): "Architectural Nutrition"
- Promo text (≤170 chars) + Description (~500 words) + 100 keywords
- Privacy nutrition label answers (what data is collected, linked to user, used for tracking)
- Saved to `/mnt/documents/app-store-listing.md`

### Out of scope (do later)
- 6.5" / 5.5" screenshot sizes — Apple only requires 6.7" if you target modern devices, so we ship just that. Add the others only if App Store Connect complains.
- iPad screenshots — only needed if you ship for iPad. Brotein is iPhone-only per the Capacitor config.
- Privacy policy + Terms URLs — already exist in `src/components/legal/` and will be linked from the App Store listing once you have a public URL.

### QA loop
After generation I'll view each PNG, check for: cropping, illegible text at thumbnail size (icon test = does the "B" read at 60×60?), color drift, App Store size compliance. Re-render anything that fails.

### Confirm before I start
- **Icon concept**: bold white "B" on solid black, brutalist. Sound good, or do you want a different mark (full "BROTEIN" wordmark, abstract symbol, etc.)?
- **Screenshot captions**: I drafted three above — happy with them, or want different copy?

If you just say "go", I'll run with the defaults above.
