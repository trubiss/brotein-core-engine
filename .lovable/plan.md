## Goal
Make every visible time locale-aware: use the device's region defaults (24h vs 12h) instead of hardcoding a format, and update the "behind pace" copy to read `NEED 162G BY [localized time]`.

## Approach
Add one shared formatter and route all UI time renders through it. `Intl.DateTimeFormat`/`toLocaleTimeString` with `locale = undefined` and **no `hour12` override** automatically follows the user's OS/browser region (e.g. `22:00` in DE, `10:00 PM` in US).

## New helper — `src/lib/time.ts`
```ts
export function formatLocalTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
// Today's end-of-day deadline (used by pace copy)
export function endOfDay(d = new Date()): Date {
  const e = new Date(d); e.setHours(23, 59, 0, 0); return e;
}
```
No `hour12` field, no locale arg → respects device.

## Edits

1. **`src/components/HistoryScreen.tsx:185`** — replace
   `new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })`
   with `formatLocalTime(new Date(log.timestamp))`.

2. **`src/components/ProteinPace.tsx`** — in the `behind` branch, change
   ``NEED ${Math.max(0, target - consumed)}G TODAY``
   to
   ``NEED ${Math.max(0, target - consumed)}G BY ${formatLocalTime(endOfDay(now)).toUpperCase()}``
   so the existing all-caps label style is preserved (e.g. `NEED 162G BY 11:59 PM` / `NEED 162G BY 23:59`).

3. **Audit pass** — `rg "toLocaleTimeString|hour12|new Intl\.DateTimeFormat"` shows only HistoryScreen formats raw times today. `ReminderSettingsPanel` uses a native `<input type="time">` which the browser already localizes — no change needed. No other hardcoded `AM/PM` or `HH:` strings exist in user-facing code.

## Notes
- Deadline is end-of-day (midnight) because the app resets daily totals at midnight (per core memory); that's the natural "by when" for today's protein target.
- Helper kept tiny and isolated so future time displays have one obvious place to import from.

## Summary
Add `src/lib/time.ts` with a device-locale time formatter, use it in HistoryScreen, and rewrite the behind-pace sub-line to `NEED {g}G BY {localized time}`.