Remove the following buttons from the UI:

1. **"SEND TEST NOTIFICATION"** — located in `src/components/ReminderSettingsPanel.tsx` inside the `permState === 'granted'` conditional block (lines ~160-167). Remove the entire conditional block (keep the `permState === 'prompt'` and `permState === 'denied'` branches).

2. **"REPLAY ONBOARDING STORY"** — located in `src/components/ProfileScreen.tsx` inside the ONBOARDING section (lines ~140-151). Remove the entire `<motion.div>` wrapper and its contents.

No other changes needed.