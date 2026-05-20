## Goal
Local daily reminders already have most plumbing (`@capacitor/local-notifications` installed, `src/lib/native.ts` wrappers, Dashboard schedules on mount). The gap: there's no explicit user-facing **"enable on this device"** step, no way to test, and scheduling only re-runs when the Dashboard re-mounts — so toggling reminder times in the Profile panel doesn't immediately reschedule. iOS-side, no Xcode capability is required for local notifications, but the plugin needs `npx cap sync` and a couple of config polish items.

## Why "push notifications was not set"
Most likely cause: on iOS the OS permission prompt never appeared (or was denied), and the panel gives no visible affordance to retry. Secondary: changing times in `ReminderSettingsPanel` writes to Firestore but doesn't call `scheduleDailyReminders` until Dashboard re-renders.

## Changes

### 1. `src/lib/native.ts`
- Add `scheduleFromSettings(settings: ReminderSettings)` helper that maps the panel's settings → `ScheduledReminder[]` and calls `scheduleDailyReminders`. (Removes the duplicated mapping in Dashboard.)
- Add `sendTestNotification()` — schedules a one-off notification ~5 s out so the user can confirm OS-level delivery.
- Add `getNotificationPermissionState()` returning `'granted' | 'denied' | 'prompt' | 'unsupported'` so the panel can show the right CTA.

### 2. `src/components/ReminderSettingsPanel.tsx`
- On mount (native only): read current permission state.
- Show one of:
  - **"ENABLE ON THIS DEVICE"** button → calls `ensureNotificationPermission()`, then `scheduleFromSettings()`.
  - **"SEND TEST NOTIFICATION"** button when already granted.
  - A muted hint "Reminders blocked — enable in iOS Settings → Brotein → Notifications" when denied.
- After any toggle/time change (persist), immediately call `scheduleFromSettings(newSettings)` or `cancelAllReminders()` so changes apply without waiting for Dashboard re-mount.

### 3. `src/components/Dashboard.tsx`
- Replace inline mapping in the effect with `scheduleFromSettings(settings)` to keep one source of truth.

### 4. `capacitor.config.ts`
- Add a `LocalNotifications` plugin block:
  ```ts
  LocalNotifications: {
    smallIcon: 'ic_stat_icon_config_sample', // Android only; iOS uses app icon
    iconColor: '#000000',
    sound: 'default',
  }
  ```
  (Safe defaults; doesn't change iOS behavior but documents intent and helps future Android build.)

### 5. No Xcode capability change needed
Local notifications do **not** require the "Push Notifications" capability or APNs entitlement — that's only for *remote* push. Reviewers will not flag a missing capability for local reminders. (We'll note this in the response so you don't add it by mistake.)

## After pulling
```bash
git pull
npm install
npm run build
npx cap sync ios
npx cap open ios
```
Then in Xcode: Product → Archive. First launch on a real device will trigger the iOS permission prompt the first time the Dashboard mounts OR when the user taps **Enable on this device** in Profile → Reminders.

## Out of scope
Remote push (APNs key, FCM, device-token storage, server) — explicitly skipped per your choice.
