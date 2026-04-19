
Add a "Replay welcome tour" button in the Profile screen that clears the `brotein_welcome_seen` localStorage flag and reloads the page.

### File
- **Edit `src/components/ProfileScreen.tsx`**: Add a new bordered section near the bottom (above sign-out, if present) with a full-width brutalist button labeled `REPLAY WELCOME TOUR`. On click: `localStorage.removeItem('brotein_welcome_seen'); location.reload();`.

### Style
- Match existing brutalist buttons in ProfileScreen: square corners, uppercase Space Mono, solid border, full width — consistent with the rest of the app's B&W aesthetic.
