# Add Apple re-auth to Delete Account flow

Make account deletion work for both email/password and Apple Sign-In users. Apple reviewers will likely test this with their Apple ID, so the current password-only flow is a rejection risk.

## What changes

**`src/lib/auth.tsx`**
- Export a new `reauthenticateWithApple()` helper that mirrors `signInWithApple()`:
  - Native (iOS): use `@capacitor-firebase/authentication`'s `signInWithApple` to get a fresh `idToken` + `rawNonce`, build an `OAuthProvider('apple.com')` credential, then call Firebase `reauthenticateWithCredential(auth.currentUser, credential)`.
  - Web: build an `OAuthProvider('apple.com')` and call `reauthenticateWithPopup(auth.currentUser, provider)`.
- Add it to the `AuthContext` value/interface alongside `signInWithApple`.

**`src/components/DeleteAccountModal.tsx`**
- Detect the user's sign-in method from `auth.currentUser.providerData[0].providerId`:
  - `password` → keep the existing "re-enter password" field.
  - `apple.com` → instead of a password input, show a **"CONFIRM WITH APPLE"** button that calls the new `reauthenticateWithApple()` and then retries deletion automatically.
- When `auth/requires-recent-login` fires, branch on provider:
  - password user → show password field (current behavior).
  - Apple user → show the Apple re-auth button (no password field).
- Keep the "DELETE" confirmation text gate for both paths.
- After successful re-auth, immediately re-run `deleteUserData` + `deleteUser` without making the user tap "DELETE FOREVER" again.

## Edge cases handled

- Apple user cancels the re-auth sheet → toast "Re-authentication cancelled", stay on modal.
- Mixed providers (rare: user linked both) → prefer the provider matching the most recent sign-in method; fall back to whichever is available.
- Native vs web detection reuses the existing `isNative()` helper already used by `signInWithApple`.

## Out of scope

- No UI redesign of the modal — only adds one conditional button in place of the password field for Apple users.
- No changes to the sign-in screen or auth provider configuration.
- No changes to Firestore data deletion logic.
