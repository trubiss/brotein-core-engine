import { Identity, tierIndex } from '@/lib/identity';

interface Props {
  identity: Identity;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-10',
  md: 'w-20',
  lg: 'w-32',
  hero: 'w-44',
};

/**
 * Monochrome athletic silhouette. One pose, six levels of definition.
 * Uses currentColor everywhere so it inverts inside dark/light containers.
 *
 * Tier index → outline weight, body fill opacity, and visibility of
 * progressive anatomy detail (shoulder → chest → abs → arms → quads → full).
 */
export default function SilhouetteFigure({ identity, size = 'md', className = '' }: Props) {
  const idx = tierIndex(identity);

  const strokeW = [1.25, 1.5, 1.75, 2.0, 2.25, 2.5][idx];
  const fillOpacity = [0, 0.10, 0.22, 0.40, 0.65, 1.0][idx];
  const dashed = idx === 0;

  // Detail visibility thresholds
  const showShoulders = idx >= 1;
  const showChest = idx >= 2;
  const showAbs = idx >= 3;
  const showArms = idx >= 4;
  const showQuads = idx >= 4;
  const fullyFilled = idx === 5;

  // Negative-space lines (drawn in background when body is fully filled)
  const detailStroke = fullyFilled ? 'hsl(var(--background))' : 'currentColor';
  const detailOpacity = fullyFilled ? 0.85 : 0.55;

  return (
    <svg
      viewBox="0 0 200 360"
      className={`${SIZE_CLASS[size]} h-auto ${className}`}
      aria-hidden
      fill="none"
    >
      {/* Body silhouette: head + neck + torso + arms + legs as a single path */}
      <path
        d="
          M100 18
          C 116 18, 128 30, 128 48
          C 128 64, 118 74, 108 78
          L 108 86
          C 132 90, 148 100, 152 116
          L 158 158
          L 168 200
          C 170 210, 168 214, 160 214
          L 152 214
          L 148 196
          L 144 168
          L 144 226
          C 144 244, 138 256, 134 274
          L 130 332
          C 130 342, 124 348, 116 348
          C 110 348, 106 344, 106 336
          L 106 282
          L 100 246
          L 94 282
          L 94 336
          C 94 344, 90 348, 84 348
          C 76 348, 70 342, 70 332
          L 66 274
          C 62 256, 56 244, 56 226
          L 56 168
          L 52 196
          L 48 214
          L 40 214
          C 32 214, 30 210, 32 200
          L 42 158
          L 48 116
          C 52 100, 68 90, 92 86
          L 92 78
          C 82 74, 72 64, 72 48
          C 72 30, 84 18, 100 18
          Z
        "
        stroke="currentColor"
        strokeWidth={strokeW}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={dashed ? '3 4' : undefined}
        fill="currentColor"
        fillOpacity={fillOpacity}
      />

      {/* Shoulder line */}
      {showShoulders && (
        <path
          d="M 70 100 Q 100 92 130 100"
          stroke={detailStroke}
          strokeOpacity={detailOpacity}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      )}

      {/* Chest line */}
      {showChest && (
        <g stroke={detailStroke} strokeOpacity={detailOpacity} strokeLinecap="round">
          <path d="M 100 110 L 100 152" strokeWidth={1.2} />
          <path d="M 78 122 Q 88 134 100 134" strokeWidth={1.1} fill="none" />
          <path d="M 122 122 Q 112 134 100 134" strokeWidth={1.1} fill="none" />
        </g>
      )}

      {/* Ab segmentation */}
      {showAbs && (
        <g stroke={detailStroke} strokeOpacity={detailOpacity} strokeWidth={1.1} strokeLinecap="round">
          <path d="M 100 152 L 100 210" />
          <path d="M 86 168 L 114 168" />
          <path d="M 84 184 L 116 184" />
          <path d="M 84 200 L 116 200" />
        </g>
      )}

      {/* Arm definition (biceps/forearm seams) */}
      {showArms && (
        <g stroke={detailStroke} strokeOpacity={detailOpacity} strokeWidth={1.1} strokeLinecap="round" fill="none">
          <path d="M 156 130 Q 162 150 160 172" />
          <path d="M 44 130 Q 38 150 40 172" />
        </g>
      )}

      {/* Quad definition */}
      {showQuads && (
        <g stroke={detailStroke} strokeOpacity={detailOpacity} strokeWidth={1.1} strokeLinecap="round" fill="none">
          <path d="M 88 250 Q 90 280 90 310" />
          <path d="M 112 250 Q 110 280 110 310" />
        </g>
      )}
    </svg>
  );
}
