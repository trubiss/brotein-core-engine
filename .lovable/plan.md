## Problem

On notched iPhones (and any device with a status bar / dynamic island), the app content sits too close to the top edge — the "BROTEIN" header is partially behind the dynamic island. The viewport already opts into `viewport-fit=cover`, but the global `.screen-container` only applies a fixed `pt-10` with no `env(safe-area-inset-top)` allowance.

## Fix

Update the single shared layout class in `src/index.css`:

- `.screen-container` currently: `pt-10` (and `padding-bottom: max(2.5rem, env(safe-area-inset-bottom))`)
- Change top padding to mirror the bottom: `padding-top: max(2.5rem, env(safe-area-inset-top))`

This fixes every screen at once (Dashboard, Insights, Profile, History, Onboarding, etc.) since they all use `.screen-container`. Non-notched devices keep the existing 2.5rem; notched devices get whatever the OS reports (typically ~47–59px), pushing the header below the dynamic island/status bar.

No component changes needed. No behavior changes on desktop/web preview.
