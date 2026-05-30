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
  hero: 'w-56',
};

/**
 * Front-view anatomical figure. One pose. Six levels of definition.
 * Pure currentColor — inverts cleanly inside dark/light containers.
 *
 * Progression: each tier unlocks a new muscle group (delts → pecs → biceps + abs
 * → forearms + obliques + quads → calves). At LOCKED IN every group fills solid
 * and is separated by hairline negative-space gaps.
 */
export default function AnatomyFigure({ identity, size = 'md', className = '' }: Props) {
  const idx = tierIndex(identity);

  const strokeW   = [1.25, 1.5, 1.5, 1.75, 2.0, 2.25][idx];
  const bodyFill  = [0,    0.06, 0.10, 0.16, 0.26, 1.0][idx];
  const muscleFill= [0,    0.18, 0.22, 0.32, 0.55, 1.0][idx];
  const dashed    = idx === 0;
  const full      = idx === 5;

  const showDelts    = idx >= 1;
  const showPecs     = idx >= 2;
  const showBiceps   = idx >= 3;
  const showAbs      = idx >= 3;
  const showForearms = idx >= 4;
  const showObliques = idx >= 4;
  const showQuads    = idx >= 4;
  const showCalves   = idx >= 5;

  // Separator lines drawn between muscles when fully filled (negative space)
  const sepStroke = full ? 'hsl(var(--background))' : 'currentColor';
  const sepOpacity = full ? 0.95 : 0.4;

  return (
    <svg
      viewBox="0 0 240 520"
      className={`${SIZE_CLASS[size]} h-auto ${className}`}
      aria-hidden
      fill="none"
    >
      {/* ─── BODY SILHOUETTE (outline) ─── */}
      <g
        stroke="currentColor"
        strokeWidth={strokeW}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={dashed ? '3 4' : undefined}
        fill="currentColor"
        fillOpacity={bodyFill}
      >
        {/* Head */}
        <ellipse cx="120" cy="38" rx="22" ry="26" />
        {/* Neck */}
        <path d="M106 60 L134 60 L138 84 L102 84 Z" />
        {/* Torso (shoulders → waist) */}
        <path d="
          M 96 84
          L 144 84
          C 170 88, 184 100, 188 122
          C 192 148, 184 178, 174 200
          C 168 214, 162 224, 158 240
          L 158 268
          L 82 268
          L 82 240
          C 78 224, 72 214, 66 200
          C 56 178, 48 148, 52 122
          C 56 100, 70 88, 96 84
          Z
        " />
        {/* Left arm */}
        <path d="
          M 64 96
          C 50 104, 42 122, 42 146
          C 42 174, 46 204, 52 232
          C 54 246, 54 258, 56 270
          L 70 272
          C 72 258, 74 244, 76 230
          C 80 202, 86 174, 90 148
          C 92 128, 90 110, 84 98
          Z
        " />
        {/* Right arm (mirror) */}
        <path d="
          M 176 96
          C 190 104, 198 122, 198 146
          C 198 174, 194 204, 188 232
          C 186 246, 186 258, 184 270
          L 170 272
          C 168 258, 166 244, 164 230
          C 160 202, 154 174, 150 148
          C 148 128, 150 110, 156 98
          Z
        " />
        {/* Left leg */}
        <path d="
          M 84 268
          L 118 268
          L 116 360
          C 114 400, 110 440, 108 480
          L 104 506
          L 86 506
          L 84 484
          C 82 440, 80 400, 80 360
          Z
        " />
        {/* Right leg */}
        <path d="
          M 122 268
          L 156 268
          L 160 360
          C 160 400, 158 440, 156 484
          L 154 506
          L 136 506
          L 132 480
          C 130 440, 126 400, 124 360
          Z
        " />
      </g>

      {/* ─── MUSCLE GROUPS ─── */}
      {/* DELTS — shoulder caps */}
      {showDelts && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M 96 86 C 78 92, 66 104, 64 124 C 64 134, 70 138, 80 136 C 92 132, 100 120, 102 104 Z" />
          <path d="M 144 86 C 162 92, 174 104, 176 124 C 176 134, 170 138, 160 136 C 148 132, 140 120, 138 104 Z" />
        </g>
      )}

      {/* PECS */}
      {showPecs && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M 118 96 C 108 96, 96 102, 90 114 C 86 124, 88 138, 96 148 C 106 158, 118 158, 118 152 Z" />
          <path d="M 122 96 C 132 96, 144 102, 150 114 C 154 124, 152 138, 144 148 C 134 158, 122 158, 122 152 Z" />
        </g>
      )}

      {/* BICEPS — upper arm bellies */}
      {showBiceps && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M 56 130 C 50 136, 48 158, 52 180 C 54 188, 62 188, 66 180 C 72 162, 74 142, 70 128 Z" />
          <path d="M 184 130 C 190 136, 192 158, 188 180 C 186 188, 178 188, 174 180 C 168 162, 166 142, 170 128 Z" />
        </g>
      )}

      {/* ABS — 6-pack */}
      {showAbs && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          {/* upper row */}
          <path d="M 108 158 L 118 158 L 118 178 L 108 178 Z" />
          <path d="M 122 158 L 132 158 L 132 178 L 122 178 Z" />
          {/* middle row */}
          <path d="M 106 182 L 118 182 L 118 204 L 106 204 Z" />
          <path d="M 122 182 L 134 182 L 134 204 L 122 204 Z" />
          {/* lower row */}
          <path d="M 104 208 L 118 208 L 118 232 L 104 232 Z" />
          <path d="M 122 208 L 136 208 L 136 232 L 122 232 Z" />
        </g>
      )}

      {/* FOREARMS */}
      {showForearms && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M 52 184 C 48 200, 52 226, 58 250 L 68 250 C 72 226, 76 200, 74 184 Z" />
          <path d="M 188 184 C 192 200, 188 226, 182 250 L 172 250 C 168 226, 164 200, 166 184 Z" />
        </g>
      )}

      {/* OBLIQUES — V-shape framing abs */}
      {showObliques && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M 92 200 C 96 220, 102 240, 104 258 L 118 244 L 118 210 C 110 210, 100 206, 92 200 Z" />
          <path d="M 148 200 C 144 220, 138 240, 136 258 L 122 244 L 122 210 C 130 210, 140 206, 148 200 Z" />
        </g>
      )}

      {/* QUADS — rectus + vastus per leg */}
      {showQuads && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          {/* left leg */}
          <path d="M 88 280 C 84 310, 84 340, 86 366 L 96 366 C 96 340, 94 310, 96 280 Z" />
          <path d="M 100 280 C 100 310, 102 340, 102 366 L 110 366 C 112 340, 112 310, 110 280 Z" />
          <path d="M 114 280 L 118 280 L 118 366 L 114 366 Z" />
          {/* right leg */}
          <path d="M 152 280 C 156 310, 156 340, 154 366 L 144 366 C 144 340, 146 310, 144 280 Z" />
          <path d="M 140 280 C 140 310, 138 340, 138 366 L 130 366 C 128 340, 128 310, 130 280 Z" />
          <path d="M 126 280 L 122 280 L 122 366 L 126 366 Z" />
        </g>
      )}

      {/* CALVES */}
      {showCalves && (
        <g fill="currentColor" fillOpacity={muscleFill} stroke={sepStroke} strokeOpacity={sepOpacity} strokeWidth={0.8} strokeLinejoin="round">
          <path d="M 86 376 C 82 400, 82 430, 88 458 L 104 458 C 108 430, 108 400, 104 376 Z" />
          <path d="M 136 376 C 132 400, 132 430, 138 458 L 154 458 C 158 430, 158 400, 154 376 Z" />
        </g>
      )}
    </svg>
  );
}
