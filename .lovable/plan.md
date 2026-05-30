## Revert Body Map feature

Remove everything I added for the muscle visualization, returning the app to its state before this thread.

### Delete
- `src/components/BodyMap.tsx`
- `src/components/BodyMapCard.tsx`
- `src/components/BodyMapScreen.tsx`
- `src/lib/bodyMap.ts`

### Revert
- `src/components/Dashboard.tsx` — remove `BodyMapCard` import + render, revert `onNavigate` type back to `'history' | 'profile' | 'insights'`, remove `hitDays` state, restore the streak effect to fetch 30 days only (no hit-day count).
- `src/pages/Index.tsx` — remove `BodyMapScreen` lazy import + route, revert `Page` type.

End state: codebase is back to where it was before the body-map work, no leftover dead code.
