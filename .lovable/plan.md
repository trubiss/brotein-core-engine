## Changes

**1. `src/lib/native.ts`** — replace `takeFoodPhoto()`'s `CameraSource.Prompt` (which is what triggers the "Photo / From Photos / Take Picture" iOS sheet) with `CameraSource.Camera`. Add a sibling `pickFoodPhoto()` using `CameraSource.Photos` for the UPLOAD button.

**2. `src/components/FoodScanModal.tsx`**
- `onUpload`: on native, call new `pickFoodPhoto()` instead of triggering the `<input type="file">`.
- Delete the decorative drag-handle bar (`<div className="w-12 h-0.5 bg-foreground/30 mx-auto mb-6" />`) — the modal isn't draggable, and it reads as a stray white/grey line at the top of the sheet after the photo loads.

**Out of scope:** scan API, Capacitor config, other modals.
