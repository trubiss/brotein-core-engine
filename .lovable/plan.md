## Wire up Firebase Analytics with Measurement ID `G-016Z9P0KKE`

The Measurement ID is a public identifier (safe to commit), so we'll add it directly to the Firebase config instead of relying on env vars.

### Changes

1. **`src/lib/firebase.ts`** — Add `measurementId: "G-016Z9P0KKE"` to the `firebaseConfig` object.

2. **`src/lib/track.ts`** — Replace the `import.meta.env.VITE_FIREBASE_MEASUREMENT_ID` lookup with the hardcoded ID (or import from a shared constant). Remove the env-var guard so analytics initializes on every load.

### Result

- All previously instrumented events (`sign_up`, `food_logged`, `ai_scan_*`, `target_hit`, `paywall_viewed`, etc.) will start flowing to Firebase Analytics on the next page load.
- No Connectors or Secrets UI involvement needed.
- Data shows up in Firebase Console → Analytics → DebugView (real-time) within ~1 min, and in standard reports within ~24 hours.