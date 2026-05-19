## Plan: Two-card paywall (Annual + Monthly)

Replace the single bordered card + tiny "subscribe monthly" link at the bottom with **two stacked cards**, both visible at once. Tapping a card selects it; the primary CTA reflects the selected plan.

### Layout (top to bottom, unchanged above)
- Brand mark, headline, subtext, streak, identity bullets — all unchanged.

### New section: plan cards
Two stacked cards, full width, 16px gap:

**Card 1 — ANNUAL (default selected)**
- Top-left chip: `MOST POPULAR` (existing style)
- Top-right chip: `SAVE 33%` (computed from monthly × 12 vs annual)
- Title: `7-DAY FREE TRIAL` if trial available, else `$39.99`
- Sub: `THEN $39.99 / YEAR · BILLED YEARLY` (or just `BILLED YEARLY` when no trial)
- Per-week breakdown footnote: `JUST $0.77 / WEEK`

**Card 2 — MONTHLY**
- No "popular" chip
- Title: `$4.99`
- Sub: `BILLED MONTHLY · CANCEL ANYTIME`
- Footnote: `NO TRIAL · FLEXIBLE`

### Selection behavior
- Tap a card → it becomes selected (2px solid `foreground` border, others go to 1px `foreground/30`).
- Selected plan drives the primary CTA label:
  - Annual + trial: `START 7-DAY FREE TRIAL`
  - Annual no trial: `SUBSCRIBE $39.99/YR`
  - Monthly: `SUBSCRIBE $4.99/MO`
- CTA `onClick` calls `purchase(selectedPlan)`.

### Footer micro-text
Reflects selection:
- Annual+trial: `Free for 7 days, then $39.99/year. Cancel anytime in Settings.`
- Annual: `$39.99 per year. Cancel anytime in Settings.`
- Monthly: `$4.99 per month. Cancel anytime in Settings.`

Remove the old "OR SUBSCRIBE MONTHLY" link entirely. Keep `RESTORE PURCHASES` (native only) and bottom auto-renew line.

### Technical notes
- Single file change: `src/components/Paywall.tsx`.
- Reuse existing `plan` state (already typed `PlanId`) as the selection source of truth; just wire card taps to `setPlan(...)` without triggering purchase.
- Brutalist tokens preserved: 0px radius, 2px foreground border on selected, Space Mono labels, ALL CAPS.
- No new images, no business-logic changes, no IAP changes.
