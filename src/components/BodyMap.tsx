import { motion } from 'framer-motion';
import { MuscleGroup, unlockedGroups } from '@/lib/bodyMap';

interface Props {
  hitDays: number;
  view?: 'front' | 'back';
  className?: string;
  /** Show muscle group labels under the figure. */
  showLabels?: boolean;
  /** Animate fills on mount. */
  animate?: boolean;
}

// Stylized brutalist silhouette. viewBox 200x420.
// Each muscle group is a single <path> keyed by id so we can toggle fill.

const FRONT_GROUPS: { id: MuscleGroup; d: string }[] = [
  // Neck
  { id: 'neck', d: 'M88 50 L112 50 L112 64 L88 64 Z' },
  // Shoulders (deltoids) L/R
  { id: 'shoulders', d: 'M58 68 L88 64 L88 92 L60 100 Z M142 68 L112 64 L112 92 L140 100 Z' },
  // Chest (pecs) L/R
  { id: 'chest', d: 'M88 68 L100 68 L100 110 L70 110 L62 100 L88 92 Z M112 68 L100 68 L100 110 L130 110 L138 100 L112 92 Z' },
  // Biceps L/R
  { id: 'biceps', d: 'M52 96 L62 100 L66 138 L50 138 Z M148 96 L138 100 L134 138 L150 138 Z' },
  // Forearms L/R
  { id: 'forearms', d: 'M50 140 L66 140 L62 188 L46 188 Z M150 140 L134 140 L138 188 L154 188 Z' },
  // Abs (4-pack stack)
  { id: 'abs', d: 'M84 114 L100 114 L100 130 L84 130 Z M100 114 L116 114 L116 130 L100 130 Z M84 132 L100 132 L100 148 L84 148 Z M100 132 L116 132 L116 148 L100 148 Z M84 150 L100 150 L100 168 L84 168 Z M100 150 L116 150 L116 168 L100 168 Z' },
  // Obliques L/R
  { id: 'obliques', d: 'M68 114 L82 114 L82 168 L72 172 Z M132 114 L118 114 L118 168 L128 172 Z' },
  // Quads L/R
  { id: 'quads', d: 'M72 188 L98 188 L96 270 L74 270 Z M128 188 L102 188 L104 270 L126 270 Z' },
];

const BACK_GROUPS: { id: MuscleGroup; d: string }[] = [
  // Neck (back)
  { id: 'neck', d: 'M88 50 L112 50 L112 64 L88 64 Z' },
  // Traps
  { id: 'traps', d: 'M84 64 L116 64 L124 96 L100 92 L76 96 Z' },
  // Shoulders L/R
  { id: 'shoulders', d: 'M58 68 L84 64 L76 96 L60 100 Z M142 68 L116 64 L124 96 L140 100 Z' },
  // Lats L/R
  { id: 'lats', d: 'M64 98 L100 92 L100 158 L74 168 L62 130 Z M136 98 L100 92 L100 158 L126 168 L138 130 Z' },
  // Triceps L/R
  { id: 'triceps', d: 'M52 96 L62 100 L66 138 L50 138 Z M148 96 L138 100 L134 138 L150 138 Z' },
  // Forearms L/R
  { id: 'forearms', d: 'M50 140 L66 140 L62 188 L46 188 Z M150 140 L134 140 L138 188 L154 188 Z' },
  // Glutes L/R
  { id: 'glutes', d: 'M74 172 L100 168 L100 210 L78 212 Z M126 172 L100 168 L100 210 L122 212 Z' },
  // Hamstrings L/R
  { id: 'hamstrings', d: 'M76 214 L98 214 L96 280 L78 280 Z M124 214 L102 214 L104 280 L122 280 Z' },
  // Calves L/R
  { id: 'calves', d: 'M78 296 L96 296 L92 360 L80 360 Z M122 296 L104 296 L108 360 L120 360 Z' },
];

// Outer silhouette (always shown as outline).
const SILHOUETTE = `
  M100 28
  C 110 28, 116 36, 116 46
  C 116 56, 110 64, 100 64
  C 90 64, 84 56, 84 46
  C 84 36, 90 28, 100 28 Z
  M 88 50 L 112 50 L 112 66
  L 142 68 L 158 100 L 154 192
  L 138 196 L 130 168 L 126 270
  L 130 360 L 126 392 L 108 392
  L 104 360 L 100 280
  L 96 360 L 92 392 L 74 392
  L 70 360 L 74 270 L 70 168
  L 62 196 L 46 192 L 42 100 L 58 68 L 88 66 Z
`;

export default function BodyMap({
  hitDays,
  view = 'front',
  className,
  showLabels = false,
  animate = true,
}: Props) {
  const unlocked = unlockedGroups(hitDays);
  const groups = view === 'front' ? FRONT_GROUPS : BACK_GROUPS;

  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 420"
        className="w-full h-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="miter"
        aria-label={`Body map — ${view} view`}
      >
        {/* Outer silhouette */}
        <path d={SILHOUETTE} className="text-foreground/80" />

        {/* Muscle groups */}
        {groups.map(g => {
          const isUnlocked = unlocked.has(g.id);
          return (
            <motion.path
              key={`${view}-${g.id}`}
              d={g.d}
              initial={animate ? { opacity: 0, scale: 0.96 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              fill={isUnlocked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={isUnlocked ? 0 : 0.8}
              strokeDasharray={isUnlocked ? undefined : '2 2'}
              className={isUnlocked ? 'text-foreground' : 'text-foreground/25'}
            />
          );
        })}

        {/* Center spine line — pure geometric anchor */}
        <line x1="100" y1="66" x2="100" y2="270" stroke="currentColor" strokeWidth={0.5} className="text-foreground/20" />
      </svg>

      {showLabels && (
        <div className="mt-4 grid grid-cols-2 gap-1 font-display text-[9px] tracking-[0.18em] uppercase">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-2">
              <span
                className={`w-2 h-2 ${unlocked.has(g.id) ? 'bg-foreground' : 'border border-foreground/30'}`}
                aria-hidden
              />
              <span className={unlocked.has(g.id) ? 'text-foreground' : 'text-foreground/40'}>
                {g.id}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
