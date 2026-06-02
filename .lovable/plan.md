## Fix: Smooth swipe-to-delete

The current `SwipeableLogRow` feels laggy because of a few specific issues — not because Framer Motion is slow. I'll rewrite the gesture layer with the following changes:

### Root causes
1. **`dragConstraints={{ left: -window.innerWidth }}`** — allows the row to be dragged the full screen width with elastic resistance recalculated every frame. This is the main source of "sluggish" feel; the row should resist past the threshold, not follow the finger across the screen.
2. **`dragMomentum={false}`** — kills natural inertia, so the release feels dead/abrupt instead of fluid.
3. **Multiple `useTransform` chains** driving opacity/scale/x on the icon recompute on every pointer move; the icon `x` transform especially causes extra layout thrash.
4. **`active:bg-foreground/5`** on the draggable layer triggers a background repaint mid-drag on touch devices.
5. **`border-b` on the outer wrapper** means the revealed red background bleeds 1px — minor but contributes to jank perception.
6. No GPU compositing hint (`will-change: transform`) on the moving layer.

### Changes to `src/components/SwipeableLogRow.tsx`
- Constrain drag to `{ left: -140, right: 0 }` with `dragElastic={0.08}` so the finger meets gentle resistance past the threshold — feels tight and responsive, like iOS Mail.
- Re-enable natural momentum: drop `dragMomentum={false}`.
- Simplify the background to a single `useTransform` for opacity. Remove the icon `x` transform and the multi-stop scale; keep one subtle scale (0.85 → 1) tied to drag progress.
- Add `style={{ x, willChange: 'transform' }}` and `transformTemplate` to force GPU compositing.
- Remove `active:bg-foreground/5` (it repaints during drag); keep the tap feedback via a quick `whileTap` scale instead, or just drop it — the toast already confirms taps.
- Lower `DELETE_THRESHOLD` to 90px and keep velocity escape hatch.
- On delete: animate to `-window.innerWidth` with a shorter tween (`duration: 0.18`, same easing) so the row exits crisply.
- On cancel: snap back with a snappier spring (`stiffness: 500, damping: 40, mass: 0.6`) — current spring is too soft and feels laggy on return.
- Replace `dragDirectionLock` behavior tuning so vertical scroll stays buttery (keep `touchAction: 'pan-y'`).

### Out of scope
No changes to Dashboard, data layer, or delete handlers — purely the gesture/animation layer in `SwipeableLogRow.tsx`.
