## Last Entry Display on Home Screen

Add a minimal "last entry" line at the bottom of the Dashboard, below the streak indicator, showing the most recently logged food across all days.

### Data
- Subscribe to `watchRecentLogs(uid, cb, 1)` to get the single most recent `FoodLog`.
- Derive a relative-time string ("JUST NOW", "5 M AGO", "2 H AGO", "1 D AGO") from the log's `timestamp`.

### UI
- Insert below the streak block, styled to match the brutalist B&W aesthetic:
  - Label: `LAST:` in small muted uppercase tracking.
  - Content: `{FOOD_NAME} · {X}G · {TIME_AGO}`
  - Same font scale / opacity as the streak line (`text-[9px]`, `tracking-[0.22em]`, `text-muted-foreground/55`).
- Animate in with the existing `fadeUp` variant.
- Hide when there are no logs yet.

### Files to modify
- `src/components/Dashboard.tsx` — add state, subscription, helper, and JSX.