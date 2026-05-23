## Goal
Identify the real Capacitor iOS project and remove the stray `App/` folder so Xcode only shows one.

## Steps (you run these locally — I can't touch your Mac)

1. **Confirm the real project** — in Terminal:
   ```bash
   cd ~/brotein-core-engine
   ls ios/App/App.xcworkspace
   cat capacitor.config.ts | grep -i ios
   ```
   The real Capacitor project must live at `ios/App/App.xcworkspace`. This is what `npx cap sync ios` writes to.

2. **Inspect the stray folder** before deleting:
   ```bash
   ls ~/brotein-core-engine/App
   ```
   If it contains an `App.xcodeproj` but no `Podfile` or `public/` web assets being updated by `cap sync`, it's the stray copy.

3. **Remove the stray folder**:
   ```bash
   rm -rf ~/brotein-core-engine/App
   ```

4. **Clear Xcode's recent projects list** so the ghost entry disappears:
   - Open Xcode → Welcome window → right-click the stray `App` entry → **Remove from Recents**.

5. **Re-sync and open the correct one**:
   ```bash
   cd ~/brotein-core-engine
   git pull
   npm install
   npm run build
   npx cap sync ios
   open ios/App/App.xcworkspace
   ```
   Always open `.xcworkspace` (not `.xcodeproj`) — Capacitor uses CocoaPods.

## Notes
- No changes needed in the Lovable codebase — this is purely local filesystem cleanup on your Mac.
- If step 2 reveals the stray `App/` folder actually contains custom native code you added, stop and tell me before deleting.
