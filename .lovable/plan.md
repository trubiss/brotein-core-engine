# Fix iOS Launch Crash (Apple Review Rejection)

## What the crash logs say

All five `.ips` files show the **same crash** on different devices (iPhone 17 / iPad Pro M-series), all on iOS 26.5, build 5 of `com.brotein.app`:

- **Exception:** `EXC_BREAKPOINT (SIGTRAP)` — a Swift `_assertionFailure` (not a memory bug, a deliberate trap)
- **When:** ~200–400 ms after launch (`procLaunch` → `procExit` is sub-second)
- **Where:** Capacitor's **`bridge`** dispatch queue, inside:
  ```
  URL.appendingPathComponent(_:)
    → _SwiftURL.appending(path:directoryHint:encodingSlashes:compatibility:)
      → URLComponents._uncheckedString
        → _StringGuts.append → assertion failure
  ```

This is the well-known iOS 18+ Foundation behavior: `URL.appendingPathComponent("")` (empty string) or appending to a URL built from an empty/invalid string now traps instead of silently returning. Capacitor's iOS bridge calls this while resolving the start URL / served bundle path right after launch.

## Most likely root causes (in order)

1. **Stale `serverBasePath` in `UserDefaults`** — Capacitor persists the last live-update / hot-reload path. If a previous build wrote an empty string (or the dev `server.url` was toggled), the next cold launch appends `""` to the bundle URL and traps. This matches the timing exactly (bridge queue, first 200 ms).
2. **`CAP_DEV=1` accidentally compiled into the App Store build** — would leave `server.url` set, and on iOS 26 an empty path component along that URL traps.
3. **A plugin (Firebase Auth / Camera / Local Notifications) reading an empty config value** and appending it to a file URL on the bridge queue.

## Fix plan

### 1. Harden `capacitor.config.ts` against the empty-path trap
- Confirm production builds are produced with `CAP_DEV` **unset** (document this in `README.md` and add an `npm run build:ios` script that explicitly `unset CAP_DEV` before `vite build && cap sync ios`).
- Add an `ios.scheme: 'app'` and `ios.path` is left as default — never empty strings.
- Remove the `server` block entirely in production (already conditional, but add an `assert(!isDev)` log for safety).

### 2. Clear stale `serverBasePath` on launch
Add a tiny native-side reset in `src/lib/native.ts` `initNativeShell()`:
- On native iOS, call `Capacitor` Preferences to remove the keys `serverBasePath` and `lastBinaryVersionCode` / `lastBinaryVersionName` so a corrupted persisted path can't crash subsequent launches.
- This is a JS-side mitigation; safe and reversible.

### 3. Bump Capacitor iOS runtime
We're already on the latest 8.x (`@capacitor/ios@8.3.4`, `@capacitor/core@8.2.0`). Bump `@capacitor/core` to `^8.3.4` to match `ios` and re-run `npx cap sync ios` — version skew between core and ios is a known source of bridge bugs.

### 4. Rebuild & re-submit
After applying the above:
```
unset CAP_DEV
rm -rf node_modules dist
npm install
npm run build
npx cap sync ios
# In Xcode: Product → Clean Build Folder, archive, upload build 6.
```

### 5. If the crash still reproduces on build 6
Add a one-shot diagnostic: wrap `initNativeShell()` in a try/catch that writes the error to `Preferences` so the next launch can surface it. Also temporarily remove `@capacitor/camera` and `@capacitor-firebase/authentication` one at a time to bisect which plugin's path resolution is the culprit (the crash is on the shared bridge queue, but the offending call originates from a plugin).

## Files to change

- `capacitor.config.ts` — explicit `ios.scheme`, comment hardening, prod assert
- `src/lib/native.ts` — reset stale `serverBasePath` on iOS launch
- `package.json` — bump `@capacitor/core` to `^8.3.4`, add `build:ios` script
- `README.md` — document `unset CAP_DEV` requirement for App Store builds

## Risks

- Clearing `serverBasePath` will disable any live-update behavior on next launch (we don't use live updates, so this is safe).
- No user-facing changes.
