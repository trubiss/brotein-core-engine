# Fix Quick Log modal bugs

All changes in `src/components/QuickLogModal.tsx` (frontend only).

## 1. Drag-to-close is broken (the headline bug)
Currently two separate `motion.div`s have independent `y` values:
- The outer sheet uses a `useMotionValue` `y` (drives overlay fade) but is **not** draggable.
- The inner handle area is the one that's `drag="y"`, with `dragConstraints={{ top: 0, bottom: 0 }}`. Result: when the user pulls the handle down, only the handle bends slightly (elastic), the sheet itself never moves, and on release the threshold (`offset.y > 120`) sometimes fires and sometimes doesn't — feels random and "stuck".

Fix:
- Make the **outer sheet** the draggable element, tied to the same `y` motion value that drives `overlayOpacity`.
- Use `useDragControls` + `dragListener={false}` so a drag is only initiated by pointer-down on the handle bar / header strip (not by interactions with form fields or list rows inside the sheet).
- `dragConstraints={{ top: 0, bottom: 0 }}` + `dragElastic={{ top: 0, bottom: 0.4 }}` on the outer sheet so it physically follows the finger downward but can't be pulled up past its rest position.
- Keep the `onDragEnd` threshold (`offset.y > 120 || velocity.y > 500` → `onClose()`, else snap back with `animate(y, 0)`).
- Drop the inner draggable wrapper; keep the visual handle bar + title row, but attach `onPointerDown={(e) => dragControls.start(e)}` to that strip.

## 2. Wrong button fires on tap
- Several `<button>`s have no `type` attribute. Inside the manual tab, the food-name and protein `<input>`s combined with un-typed buttons can let an enter-key / accidental tap trigger `handleSubmit`/`toggleFavoriteCurrent` instead of the one the user pressed. Add `type="button"` to **every** `<button>` in this file.
- In the RECENT tab each row contains two adjacent buttons (pickRecent + quick-add Plus). The Plus button uses `whileTap={{ scale: 1.08 }}` (grows on tap → spills into the sibling row area, hits become inconsistent). Change to `whileTap={{ scale: 0.92 }}` to shrink (standard), keep `e.stopPropagation()`, and add `touch-manipulation` so iOS doesn't double-fire.

## 3. Tab presses sometimes look like they hit a neighbor
`TabBtn` uses `border-2 border-foreground` on all 4 buttons with `gap-1`. When the selected one flips to `bg-foreground`, adjacent borders visually merge and the active state isn't obviously bound to the tapped button. Tighten by:
- Adding `type="button"` and `touch-manipulation`.
- Keeping border colors identical but adding `relative z-10` to the active tab so its filled state sits on top of the seam.

## 4. Manual preset buttons (+20G/+30G/+40G/+50G)
These look like the dashboard quick-add buttons but they only set the protein field. That's intentional, but tapping doesn't reflect any state. Add a subtle active state: when `Number(protein) === g`, apply `bg-foreground text-background` so the user sees what was picked. Also add `type="button"`.

## 5. Body scroll lock cleanup edge case
`useEffect` saves `document.body.style.overflow` and restores it on unmount — fine. No change.

## Out of scope
No backend, no tab reorganization, no copy changes.
