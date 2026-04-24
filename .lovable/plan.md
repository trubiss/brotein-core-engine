## Problem

Two issues are bundled in your report:

1. **"Protein flashes the old value, then snaps to 0"** on first open.
   Root cause: the Dashboard subscribes to `watchSummary(today)` and `watchLogsForDate(today)` via Firestore. Firestore instantly serves a **cached** snapshot from the previous session before the network response arrives. The cached doc is from yesterday's date key (or a stale `dailySummary`), so the big number momentarily shows the old `consumed` / `remaining`, then the real snapshot for today arrives and resets to the correct value. Visually this reads as "started at the old number, jumped to 0".

2. **General sluggishness on first paint.**
   - Three live Firestore listeners spin up before the first frame (`watchLogsForDate`, `watchSummary`, `watchAllSummaries`) and one of them (`watchAllSummaries`) downloads the **entire** dailySummaries collection forever just to compute a streak.
   - The Dashboard renders a heavy stack (progress bar animation, ProteinPace, Streak, Timeline with per-row motion, floating button) all wrapped in `motion.div` with stagger — the initial animation runs even on cold load.
   - Two ref warnings in console: `ProteinPace` and `SwipeableLogRow` aren't `forwardRef`, so framer-motion stagger drops refs and re-validates every render — minor but noisy.
   - `addLog` does a `getProfile` round-trip on every quick-add even though the profile is already in memory via `useAuth`.

## Fix plan

### 1. Kill the stale-value flash (the headline bug)

In `src/components/Dashboard.tsx`:

- **Reset local state immediately when `viewDate` (or `user`) changes**, before the Firestore listener fires:
  ```ts
  useEffect(() => {
    if (!user) return;
    setLogs([]);          // clear stale logs from previous day/session
    setSummary(null);     // forces remaining = target until real data lands
    const u1 = watchLogsForDate(user.uid, viewDate, setLogs);
    const u2 = watchSummary(user.uid, viewDate, setSummary);
    const u3 = watchAllSummaries(user.uid, all => setStreak(computeStreak(all)));
    return () => { u1(); u2(); u3(); };
  }, [user, viewDate]);
  ```
- **Hide the big number until the first real snapshot arrives** with a `summaryReady` flag set inside the `watchSummary` callback. Until then, render a thin skeleton (single underscore or the target itself) — no jumping number.
- Same treatment for the progress bar `animate={{ width }}` so it doesn't animate from a stale fill.

This single change eliminates the "old value → 0" flash in all cases (cold load, day rollover, account switch).

### 2. Make the cold load actually fast

In `src/components/Dashboard.tsx` and `src/lib/firestore.ts`:

- **Stop downloading the full summaries collection just for the streak.** Replace `watchAllSummaries` with a one-shot `getDocs` limited to the last 30 days, ordered by date desc, run once on mount and re-run only when a log is added/edited/deleted. Streak rarely needs >30 days of context.
- **Defer non-critical listeners.** Mount `watchLogsForDate` + `watchSummary` immediately; defer the streak fetch behind `requestIdleCallback` (fallback `setTimeout(…, 0)`).
- **Skip the entry stagger animation on first mount when there's no data yet** — show content instantly, animate only on subsequent transitions. This removes the "fade-in feels slow" perception.
- **Memoize derived values** (`progress`, `suggestions`, sorted timeline) with `useMemo` so re-renders from the streak listener don't re-sort logs.
- **Avoid the per-add `getProfile` round-trip** in `addLog`/`updateLog`/`deleteLog`: accept `dailyProtein` as a parameter from the caller (we already have `profile.dailyProtein` in Dashboard via `useAuth`). Saves one network hop per quick-add.

### 3. Fix the React ref warnings (minor but real)

- Wrap `ProteinPace` and `SwipeableLogRow` in `React.forwardRef` (or remove the `motion.div` wrapper around `SwipeableLogRow` — the rows already animate themselves). This silences the warning loop and lets framer-motion skip its dev-mode validator.

### 4. Lighter initial render

- Lazy-load `FoodScanModal` and `QuickLogModal` with `React.lazy` — they're only needed after a tap, but they currently pull `firebase/firestore` query helpers and a 200+ item food database into the initial bundle.
- Lazy-load `InsightsScreen`, `HistoryScreen`, `ProfileScreen` in `src/pages/Index.tsx` — none are needed for the first paint of the Dashboard.

### 5. Auth bootstrap

In `src/lib/auth.tsx` (read first to confirm): if it currently waits for both `onAuthStateChanged` **and** a `getProfile` round-trip before showing anything, switch the loading screen to release as soon as auth resolves, and let the Dashboard handle the brief "loading profile" state inline. This usually shaves 200–600ms off perceived startup.

## Files touched

- `src/components/Dashboard.tsx` — clear-on-viewDate-change, summaryReady flag, memoization, defer streak, drop initial stagger when empty, pass `dailyProtein` to mutations
- `src/lib/firestore.ts` — `getRecentSummaries(uid, days)` one-shot helper; `addLog`/`updateLog`/`deleteLog` accept `dailyProtein` instead of re-fetching profile
- `src/components/ProteinPace.tsx` — `forwardRef`
- `src/components/SwipeableLogRow.tsx` — `forwardRef` (or unwrap parent motion)
- `src/pages/Index.tsx` — `React.lazy` for non-initial screens
- `src/lib/auth.tsx` — only if profile fetch is gating the loading screen unnecessarily

## What you'll feel

- Big protein number renders **once**, with the correct value — no flash, no jump back to 0.
- Dashboard paints faster on cold open (fewer listeners, smaller bundle, no full-summaries download).
- Quick-add latency drops by one Firestore round-trip.
- Console warnings gone.

No schema or backend changes required.
