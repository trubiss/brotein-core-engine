## Goal
After completing onboarding, land the user on the home (Dashboard) screen instead of the Profile screen.

## Change
In `src/pages/Index.tsx`, force `page` back to `'dashboard'` the moment the user's profile first becomes available (i.e. transitions from null → set, which happens right after `refreshProfile()` at the end of onboarding).

Add a `useEffect` that tracks the previous profile state with a ref, and calls `setPage('dashboard')` when profile flips from absent to present. This guarantees that whatever value `page` held before (or any future code path) cannot leave the user on Profile right after onboarding completes.

```ts
const prevProfileRef = useRef(profile);
useEffect(() => {
  if (!prevProfileRef.current && profile) setPage('dashboard');
  prevProfileRef.current = profile;
}, [profile]);
```

No other files need changes. Dashboard, ProfileScreen, and OnboardingFlow all stay as-is.

## Out of scope
- No changes to onboarding steps or styling.
- No changes to navigation within Dashboard (profile button still works).