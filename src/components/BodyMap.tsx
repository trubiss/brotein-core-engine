import { motion } from 'framer-motion';
import { MuscleGroup, colorForGroup, unlockedGroups } from '@/lib/bodyMap';

interface Props {
  hitDays: number;
  view?: 'front' | 'back';
  className?: string;
  /** Animate fills on mount. */
  animate?: boolean;
  /** Render body in dormant outline-only mode regardless of hitDays. */
  dormant?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Anatomical SVG paths.  ViewBox: 0 0 200 480.  Centerline x=100.
// Each muscle group is a path that draws BOTH left+right sides where applicable
// so a single fill change colors the whole group.
// ──────────────────────────────────────────────────────────────────────────────

// Outer silhouette + head — always rendered as the body outline.
const SILHOUETTE_FRONT = `
  M 100 14
  C 86 14 80 24 80 36
  C 80 48 86 58 100 58
  C 114 58 120 48 120 36
  C 120 24 114 14 100 14 Z

  M 89 58
  C 89 66 92 72 100 72
  C 108 72 111 66 111 58

  M 88 70
  C 76 74 64 80 56 90
  C 48 100 44 114 42 130
  C 40 152 38 178 36 200
  C 34 218 32 240 30 258
  C 28 270 26 280 28 286
  C 30 290 36 292 42 290
  C 46 286 50 278 52 268
  C 56 246 60 220 64 196
  C 67 178 70 162 72 150
  L 72 200
  C 71 220 70 242 70 264
  C 70 296 71 332 73 372
  C 74 402 75 432 76 456
  C 76 466 80 470 88 470
  C 96 470 100 466 100 456
  L 100 380
  L 100 456
  C 100 466 104 470 112 470
  C 120 470 124 466 124 456
  C 125 432 126 402 127 372
  C 129 332 130 296 130 264
  C 130 242 129 220 128 200
  L 128 150
  C 130 162 133 178 136 196
  C 140 220 144 246 148 268
  C 150 278 154 286 158 290
  C 164 292 170 290 172 286
  C 174 280 172 270 170 258
  C 168 240 166 218 164 200
  C 162 178 160 152 158 130
  C 156 114 152 100 144 90
  C 136 80 124 74 112 70
  Z
`;

const SILHOUETTE_BACK = SILHOUETTE_FRONT;

// ── FRONT muscle groups ─────────────────────────────────────────────────────
const FRONT: { id: MuscleGroup; d: string }[] = [
  // Neck (sternocleidomastoid — two diagonal strips)
  { id: 'neck', d: `
    M 92 60 C 90 64 88 68 90 72 L 96 72 L 98 60 Z
    M 108 60 C 110 64 112 68 110 72 L 104 72 L 102 60 Z
  ` },

  // Shoulders / deltoids (rounded caps)
  { id: 'shoulders', d: `
    M 88 72 C 76 74 66 80 60 90 C 56 98 54 108 56 116
    C 64 118 72 114 78 104 C 82 96 86 84 88 72 Z
    M 112 72 C 124 74 134 80 140 90 C 144 98 146 108 144 116
    C 136 118 128 114 122 104 C 118 96 114 84 112 72 Z
  ` },

  // Chest / pecs (two curved shields with centerline gap)
  { id: 'chest', d: `
    M 90 74 C 84 76 78 82 74 92 C 70 104 70 118 76 128
    C 84 134 92 132 96 124 C 98 116 98 96 98 78 C 96 75 92 74 90 74 Z
    M 110 74 C 116 76 122 82 126 92 C 130 104 130 118 124 128
    C 116 134 108 132 104 124 C 102 116 102 96 102 78 C 104 75 108 74 110 74 Z
  ` },

  // Biceps (upper-arm bulges)
  { id: 'biceps', d: `
    M 56 118 C 50 124 46 138 46 154 C 46 168 50 178 54 184
    C 60 184 64 176 66 162 C 68 146 66 130 62 120 Z
    M 144 118 C 150 124 154 138 154 154 C 154 168 150 178 146 184
    C 140 184 136 176 134 162 C 132 146 134 130 138 120 Z
  ` },

  // Forearms (tapered)
  { id: 'forearms', d: `
    M 52 186 C 46 196 42 218 40 240 C 38 256 38 270 42 280
    C 48 282 52 274 54 262 C 58 240 60 218 60 196 Z
    M 148 186 C 154 196 158 218 160 240 C 162 256 162 270 158 280
    C 152 282 148 274 146 262 C 142 240 140 218 140 196 Z
  ` },

  // Abs (6-pack — three pairs of rounded squares with linea alba gap)
  { id: 'abs', d: `
    M 92 110 C 88 110 86 114 86 118 L 86 130 C 86 134 88 136 92 136
    L 98 136 L 98 110 Z
    M 102 110 L 108 110 C 112 110 114 114 114 118 L 114 130
    C 114 134 112 136 108 136 L 102 136 Z
    M 92 140 C 88 140 86 144 86 148 L 86 160 C 86 164 88 166 92 166
    L 98 166 L 98 140 Z
    M 102 140 L 108 140 C 112 140 114 144 114 148 L 114 160
    C 114 164 112 166 108 166 L 102 166 Z
    M 92 170 C 88 170 86 174 86 178 L 86 192 C 86 196 88 198 92 198
    L 98 198 L 98 170 Z
    M 102 170 L 108 170 C 112 170 114 174 114 178 L 114 192
    C 114 196 112 198 108 198 L 102 198 Z
  ` },

  // Obliques (angled side flank wedges)
  { id: 'obliques', d: `
    M 78 130 C 76 148 76 170 80 188 C 82 196 84 200 86 200 L 86 132 Z
    M 122 130 C 124 148 124 170 120 188 C 118 196 116 200 114 200 L 114 132 Z
  ` },

  // Quads (outer + inner thigh muscles)
  { id: 'quads', d: `
    M 72 220 C 68 240 66 270 66 300 C 66 320 70 332 74 336
    C 80 332 82 318 84 300 C 86 280 86 250 86 220 Z
    M 88 220 C 88 250 90 280 92 300 C 92 314 94 326 96 332 L 96 220 Z
    M 128 220 C 132 240 134 270 134 300 C 134 320 130 332 126 336
    C 120 332 118 318 116 300 C 114 280 114 250 114 220 Z
    M 112 220 C 112 250 110 280 108 300 C 108 314 106 326 104 332 L 104 220 Z
  ` },
];

// ── BACK muscle groups ──────────────────────────────────────────────────────
const BACK: { id: MuscleGroup; d: string }[] = [
  // Neck back
  { id: 'neck', d: `
    M 92 60 L 108 60 L 110 72 L 90 72 Z
  ` },

  // Traps (upper back diamond)
  { id: 'traps', d: `
    M 92 72 L 108 72 C 116 78 122 88 124 100
    L 100 96 L 76 100 C 78 88 84 78 92 72 Z
  ` },

  // Shoulders (back delts)
  { id: 'shoulders', d: `
    M 76 102 C 66 104 58 110 54 120 C 60 124 70 124 78 118 C 82 114 80 108 76 102 Z
    M 124 102 C 134 104 142 110 146 120 C 140 124 130 124 122 118 C 118 114 120 108 124 102 Z
  ` },

  // Lats (V-shape wings on either side of spine)
  { id: 'lats', d: `
    M 78 106 C 70 130 64 158 64 188 C 72 192 82 188 90 180
    C 94 170 96 150 96 130 C 96 118 92 110 86 106 Z
    M 122 106 C 130 130 136 158 136 188 C 128 192 118 188 110 180
    C 106 170 104 150 104 130 C 104 118 108 110 114 106 Z
  ` },

  // Triceps (back of arms — horseshoe-ish)
  { id: 'triceps', d: `
    M 56 118 C 50 130 46 148 46 164 C 46 176 50 184 54 186
    C 60 184 62 174 64 160 C 66 144 64 128 60 120 Z
    M 144 118 C 150 130 154 148 154 164 C 154 176 150 184 146 186
    C 140 184 138 174 136 160 C 134 144 136 128 140 120 Z
  ` },

  // Forearms (back)
  { id: 'forearms', d: `
    M 52 188 C 46 200 42 222 40 244 C 38 260 40 274 44 282
    C 50 282 54 272 56 260 C 58 240 60 220 60 198 Z
    M 148 188 C 154 200 158 222 160 244 C 162 260 160 274 156 282
    C 150 282 146 272 144 260 C 142 240 140 220 140 198 Z
  ` },

  // Glutes (rounded buttock shapes)
  { id: 'glutes', d: `
    M 72 196 C 68 210 68 226 74 238 C 84 244 96 240 100 230
    L 100 196 Z
    M 128 196 C 132 210 132 226 126 238 C 116 244 104 240 100 230
    L 100 196 Z
  ` },

  // Hamstrings
  { id: 'hamstrings', d: `
    M 74 244 C 70 264 70 290 72 314 C 78 322 88 324 94 318
    C 96 296 98 270 98 244 Z
    M 126 244 C 130 264 130 290 128 314 C 122 322 112 324 106 318
    C 104 296 102 270 102 244 Z
  ` },

  // Calves (diamond bulges)
  { id: 'calves', d: `
    M 74 340 C 70 360 70 392 76 410 C 84 412 90 402 92 384
    C 94 366 92 350 90 340 Z
    M 126 340 C 130 360 130 392 124 410 C 116 412 110 402 108 384
    C 106 366 108 350 110 340 Z
  ` },
];

export default function BodyMap({
  hitDays,
  view = 'front',
  className,
  animate = true,
  dormant = false,
}: Props) {
  const effectiveDays = dormant ? 0 : hitDays;
  const unlocked = unlockedGroups(effectiveDays);
  const groups = view === 'front' ? FRONT : BACK;
  const silhouette = view === 'front' ? SILHOUETTE_FRONT : SILHOUETTE_BACK;

  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 480"
        className="w-full h-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-label={`Body map — ${view} view`}
      >
        {/* Outer silhouette */}
        <path d={silhouette} className="text-foreground/85" fillRule="evenodd" />

        {/* Muscle groups */}
        {groups.map((g, i) => {
          const isUnlocked = unlocked.has(g.id);
          const color = colorForGroup(g.id, effectiveDays);
          return (
            <motion.path
              key={`${view}-${g.id}`}
              d={g.d}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: animate ? i * 0.04 : 0, ease: 'easeOut' }}
              fill={isUnlocked && color ? color : 'none'}
              stroke={isUnlocked && color ? color : 'currentColor'}
              strokeOpacity={isUnlocked ? 0.9 : 0.3}
              strokeWidth={isUnlocked ? 0.6 : 0.8}
              fillRule="evenodd"
              className={isUnlocked ? '' : 'text-foreground'}
            />
          );
        })}

        {/* Spine guide on back view */}
        {view === 'back' && (
          <line
            x1="100" y1="72" x2="100" y2="240"
            stroke="currentColor"
            strokeWidth={0.4}
            className="text-foreground/30"
          />
        )}
      </svg>
    </div>
  );
}
