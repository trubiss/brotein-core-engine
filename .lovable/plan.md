# Legal Pages + Account Deletion

App Store hard requirements before submission. Three pieces of work, all client-side, no backend schema changes.

## 1. Legal pages

Two new routes inside the existing `BrowserRouter`:

- `/privacy` → `<PrivacyPolicy />`
- `/terms` → `<TermsOfService />`

Both are public (no auth gate), brutalist styled (matches existing screens), scrollable long-form content, with a back button that uses `history.back()` or routes to `/`.

**`src/components/legal/PrivacyPolicy.tsx`** — content tailored to Brotein:
- What we collect: email, name, weight, height, goal, food logs
- Why: to calculate protein targets and sync your data across devices
- Where stored: secure cloud database (Firebase) + Lovable Cloud
- Third parties: Firebase (Google), no analytics sold, no ads
- User rights: export, delete, contact
- Contact email placeholder: `support@brotein.app` (user fills in)
- Effective date

**`src/components/legal/TermsOfService.tsx`**:
- Acceptance, eligibility (13+)
- Account responsibilities
- Subscription / trial language (matches current paywall: $39/year, 7-day free trial, "visual only — beta")
- No medical/nutrition advice disclaimer (important — this is a health-adjacent app)
- Limitation of liability
- Termination
- Governing law placeholder
- Contact

Both files use existing `screen-container`, `label-spaced`, `font-mono` classes. No new design tokens.

## 2. Delete account flow

**`src/components/DeleteAccountModal.tsx`** — full-screen confirmation overlay:
- Big headline: `DELETE ACCOUNT?`
- Body: "This permanently removes your profile, food logs, streak, and history. This cannot be undone."
- Required typed confirmation: user must type `DELETE` to enable the destructive button
- Two buttons: `CANCEL` (outline) and `DELETE FOREVER` (filled, only enabled after typing)

**Deletion logic** — new function in `src/lib/firestore.ts`:
```ts
export async function deleteUserData(uid: string): Promise<void>
```
Deletes in order:
1. All `logs` subcollection docs
2. All `favorites` subcollection docs
3. `profile` doc
4. All `localStorage` keys with `brotein_` prefix

**Auth deletion** — in the modal handler:
1. Call `deleteUserData(user.uid)`
2. Call Firebase `deleteUser(auth.currentUser)`
3. On `auth/requires-recent-login` error → prompt re-auth with password, then retry
4. Toast success, redirect to `/`

## 3. Wire into Profile screen

In `ProfileScreen.tsx`, replace the existing onboarding-replay block at the bottom with a danger zone section:

```
ONBOARDING
[REPLAY ONBOARDING STORY]

LEGAL
[PRIVACY POLICY]   → navigates to /privacy
[TERMS OF SERVICE] → navigates to /terms

DANGER ZONE
[DELETE ACCOUNT]   → opens DeleteAccountModal
```

The Delete Account button styled with foreground border but red text token (add `--destructive` usage — already exists in tailwind config via shadcn).

## Out of scope (call out, do not build now)

- Real Privacy Policy review by a lawyer — placeholder content user must review
- Cookie banner — not needed for a native iOS app
- GDPR data export — recommend as separate task if you target EU
- App Store privacy nutrition labels — done in App Store Connect, not code

## Technical notes

- Routes added to `src/App.tsx` Routes block.
- `react-router-dom` already installed → use `useNavigate` in profile screen.
- No DB migration. No Supabase changes. Firebase `deleteUser` from `firebase/auth`.
- The legal content lives as React components (not markdown) so we can use the brutalist typography system directly. Easy for the user to edit copy later.

## Files

- new `src/components/legal/PrivacyPolicy.tsx`
- new `src/components/legal/TermsOfService.tsx`
- new `src/components/DeleteAccountModal.tsx`
- edit `src/lib/firestore.ts` (add `deleteUserData`)
- edit `src/components/ProfileScreen.tsx` (add legal + danger zone)
- edit `src/App.tsx` (add `/privacy` and `/terms` routes)

After this lands you'll be App-Store-submittable on the legal side. Next recommended step: analytics wiring or real payments.
