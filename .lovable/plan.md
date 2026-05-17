
# Brotein — Deep App Audit

I went through every screen and library end-to-end (auth → onboarding story → bio onboarding → dashboard → quick log → AI scan → history → insights → profile → paywall → IAP → reminders → Firestore). Below are the real flaws, grouped by severity. Nothing here is hypothetical — every item references concrete code.

---

## 🔴 Critical (must fix before App Store)

**1. Rules-of-Hooks violation in `Dashboard.tsx`**
Line 183 has `if (!profile || !user) return null;` — but `useMemo(computePace…)` (188), the `target_hit` `useEffect` (117–127), and the `showPaywall` `useEffect` (222) all conditionally render. The first render before profile loads runs a different number of hooks than later renders → React will throw "Rendered fewer hooks than expected" intermittently in production. Move all hooks above the early return.

**2. RevenueCat key is still the test key**
`src/lib/iap.ts:20` — `REVENUECAT_IOS_API_KEY = 'test_LIpJqqukaFfMTNtAlMEpeYIfIsw'`. Will block real purchases at submission. Swap to live `appl_…` key.

**3. Existing iOS subscribers see paywall on reinstall**
`shouldShowPaywall` only checks local `brotein_trial_started`. It never calls `hasProEntitlement()` from RevenueCat. A returning paying user has to find and tap **Restore Purchases** to unblock the app — Apple often rejects for this. Fix: check entitlement on boot and treat active entitlement as `trialActive`.

**4. Web trial is "free forever"**
`isTrialActive()` returns true if `brotein_trial_started` key exists — no expiry check. Web users get the app permanently free after first tap. Either compute `Date.now() - startedAt < 7 days` or hide the web entry point entirely.

**5. Trial state lives in localStorage per-device**
Clearing site data, reinstalling on iOS, or switching users resets the trial and lets people loop free trials infinitely. Trial start time should be persisted on the user's Firestore profile.

**6. Per-user state collisions in localStorage**
`brotein_story_seen`, `brotein_first_open_at`, `brotein_target_hit_<date>`, `brotein:reminderState`, and the trial keys are all device-global. User A logs out, User B signs in → story is skipped, trial bleeds, reminders inherit. Namespace by `uid` or move to Firestore.

---

## 🟠 High — UX & correctness

**7. Reminders are toast-only, never push**
`evaluateReminders` only fires while the app is open. For a "hit your protein daily" habit app, the reminder you need is when the app is **closed**. Wire `@capacitor/local-notifications` to schedule the morning/midday/evening/behind-target reminders natively. Without this, reminders settings are decorative.

**8. Pace deadline is hardcoded to 22:00**
`Dashboard.tsx:201` shows "NEED XG BEFORE 22:00" but the user's evening reminder might be 19:00 or 23:00. Pull from `reminders.evening.time`.

**9. Streak edge case for "today not yet hit"**
`computeStreak` keeps the streak alive for today even if `s` is undefined. Behavior is fine, but a missing day in the middle of history will silently break the streak without telling the user. Add a small "longest streak" stat (already in analytics) prominently on dashboard.

**10. Food database has 10 items**
`src/lib/foods.ts` — for a paid product this is the single weakest spot in the app. Expand to ≥200 items with per-100g protein density, or import an open dataset (USDA FoodData Central or OpenFoodFacts subset).

**11. Manual quick-add posts the food name `+30g protein`** when using dashboard shortcuts. That pollutes "Recent" and "Most logged" stats. Tag these as `source: 'quick'` and exclude from name-based aggregation.

**12. No way to edit profile fields after signup besides weight/goal**
Name, email, height, age, activity level are all locked. At least let the user change name and activity level — both directly affect target.

**13. Forgot-password redirect URL = `window.location.origin`**
On iOS Capacitor that's `capacitor://localhost` — Firebase won't accept it without explicit allow-listing. Use the deployed web URL as the password-reset continue URL.

**14. AI scan has no daily cap / no rate-limit handling on client**
Edge function returns 429 generically, but client just shows the raw error. Add a "you've used X/day" UI and gate it behind paid entitlement (otherwise free users can burn Lovable AI credits).

**15. `Insights` watches the full log collection forever**
`watchAllLogs` + `watchAllSummaries` with no pagination. A 2-year power user with 6k logs will pay for that read every screen open. Limit to last 90 days.

**16. Delete-account fan-out is client-side**
`deleteUserData` deletes every doc one-by-one from the client. Past ~500 docs this hits limits and can leave partial state. Move to a callable Cloud Function with batch deletes, OR use Firebase Extension "Delete User Data".

---

## 🟡 Medium — Polish & correctness

**17. `OnboardingStoryFlow` is eagerly bundled** even though it shows once. Make it lazy like `HistoryScreen`/`InsightsScreen`.

**18. Paywall price flash**
While `getYearlyOffer` resolves, the screen shows `$39` then jumps to `$39.99`. Either show a skeleton or hide the price block until offer loads.

**19. Number inputs reject decimals**
Weight input doesn't accept `72.5` cleanly (`inputMode="numeric"` should be `"decimal"` and `step="0.1"`).

**20. Accessibility / contrast**
9–10px copy with `text-muted-foreground/55` opacity fails WCAG AA. Bump label sizes to 11px minimum and remove the extra opacity multipliers.

**21. No haptic on success / milestones**
`successHaptic()` exists in `native.ts` but is never imported anywhere. Wire to: target hit, streak milestone, paywall purchase success.

**22. Apple sign-in displayName fallback `'Athlete'`**
Used in `OnboardingFlow.tsx:55` — feels generic. Prompt for a name on the bio screen if `displayName` is empty.

**23. `updateLog` and manual edits accept negative/empty protein**
`QuickLogModal` validates on create (`Number(protein) > 0`) — but the edit path passes whatever's in the field. Guard in `firestore.updateLog`.

**24. `recomputeSummary` runs a full `getDocs` for the date on every log mutation**
Fine while users log <50/day. Could be an atomic counter using `increment(grams)` on the summary doc to halve reads.

**25. `index.html` SEO / meta**
Worth a quick check that title/description/og tags are set for the marketing share preview when sending the App Store link.

---

## 🟢 Growth & retention opportunities

**26. Onboarding story → paywall conversion**
You skip from the story straight to bio onboarding, then to dashboard, then *eventually* to paywall after 3 logs or 2 days. Industry best practice for habit apps: paywall at end of onboarding *after* the user invested effort. You'll convert 2-3× better.

**27. No social proof on paywall**
No ratings, testimonials, "10k+ athletes" — easy lift for trial-start rate.

**28. No widget / Live Activity**
iOS users live in widgets for tracking apps. A simple "remaining grams" home-screen widget is a 1-day build and a top reason people stick with MacroFactor/Streaks.

**29. No HealthKit integration**
Logging protein into Apple Health unlocks a different audience and improves App Store discoverability ("works with Health").

**30. No share / streak screenshot**
Letting users share "7-day streak · 1,050g hit" generates free top-of-funnel.

**31. Empty states are dry**
Insights with no data shows dashed boxes and "YOUR WEEK STARTS HERE". Add a single direct CTA: "LOG YOUR FIRST GRAM →" that opens QuickLog.

---

## Suggested priority order

If I were building this, I'd ship in this order:

1. Fix the hooks violation, live RevenueCat key, entitlement check on boot, web-trial expiry, per-user state namespacing (1–6) — these are pre-submission blockers.
2. Real push reminders + bigger food DB (7, 10) — biggest retention levers.
3. Profile editing + AI scan gating + paginated history (12, 14, 15).
4. Paywall move to end-of-onboarding + social proof (26, 27).
5. Widget + HealthKit (28, 29) — post-launch.

---

## Want me to start implementing?

If yes, tell me which bucket and I'll begin with that one. My recommendation is **start with bucket 1 (critical pre-submission fixes)** — it's mostly mechanical, low-risk, and required regardless of any product direction.
