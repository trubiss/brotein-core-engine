## Fix Apple rejection ITMS-90683 (missing purpose strings)

Apple rejected build 8 because `Info.plist` is missing `NSPhotoLibraryUsageDescription`. Your app includes `@capacitor/camera`, which references both photo library and camera APIs — so iOS requires user-facing purpose strings for both, even if a given flow doesn't use them.

The `ios/` folder is not tracked in this Lovable repo (it's generated locally via `npx cap add ios`), so the fix has to be applied to your local Xcode project. I'll give you the exact keys and a one-command patch.

### Keys to add to `ios/App/App/Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>Brotein uses the camera to scan food labels and meals so it can estimate protein automatically.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Brotein needs access to your photo library so you can pick a meal photo to estimate its protein content.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Brotein may save scanned meal photos to your photo library if you choose to keep them.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Brotein does not record audio. This permission is declared because a bundled SDK references the microphone API.</string>
```

The first two are mandatory for `@capacitor/camera`. `NSPhotoLibraryAddUsageDescription` and `NSMicrophoneUsageDescription` are included defensively — Apple frequently rejects Capacitor apps for these once it has already flagged one purpose string, since the same SDK references them.

### Steps (run locally on your Mac)

1. `git pull` the latest Lovable changes.
2. Open `ios/App/App/Info.plist` in Xcode (or any text editor).
3. Paste the four `<key>`/`<string>` pairs above inside the top-level `<dict>`.
4. Bump the build number in Xcode (Target → General → Build → 9).
5. Archive and upload to App Store Connect.

### Why not edit it from here

Capacitor's `ios/` directory is generated on your machine and intentionally not committed (Lovable's sandbox can't run `xcodebuild`). Editing `Info.plist` is a one-time native change — once it's in your local iOS project, future Lovable changes won't touch it.

### Optional hardening

If you'd like, I can also add a check in `capacitor.config.ts` documenting the required Info.plist keys as a comment, so any teammate regenerating `ios/` from scratch sees the requirement. Let me know.