## Root cause

After tapping +20G/+30G/+40G, the protein number and progress bar feel laggy because the dashboard reads `consumed` from `summary` (a separate `daily_summary` doc):

```
const consumed = summary?.consumedProtein ?? 0;
```

The flow on quick-add is:
1. `addLog` writes the new log doc (instant in Firestore's local cache → `watchLogsForDate` fires immediately).
2. Then `recomputeSummary` runs: `getDocs` of today's logs → `setDoc` on the summary doc.
3. Only when step 2 round-trips does `watchSummary` fire and the UI finally reflects the new total.

So the log list is instant, but the headline number, "remaining", and progress bar wait for the summary write to complete — which is what feels slow (often 300–1500ms on cellular).

## Fix

Derive the displayed totals from `logs` (already streamed instantly from local cache) instead of from `summary`. Keep `summary` only for things that genuinely need server-confirmed state (streak / "target hit" celebration unlock).

Changes in `src/components/Dashboard.tsx`:

- Replace `const consumed = summary?.consumedProtein ?? 0;` with a memo computed from `logs`:
  `const consumed = useMemo(() => logs.reduce((s, l) => s + (l.proteinGrams || 0), 0), [logs]);`
- Make `summaryReady` true as soon as either `logs` has emitted or `summary` has loaded, so the skeleton disappears immediately on quick-add.
- Keep the existing `summary.hitTarget` effect for the celebratory toast (it only needs to fire once after the server confirms).

Result: tapping +20/+30/+40G updates the number, the progress bar, and "remaining" within ~16ms (next paint). The background summary write still happens, but the UI no longer blocks on it.

No backend, schema, or business-logic changes — purely a frontend data-source swap.
