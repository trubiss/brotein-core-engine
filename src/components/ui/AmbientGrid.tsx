/**
 * Subtle animated mono-grid backdrop. Pure CSS, pointer-events disabled.
 * Use behind sparse screen content to break up large empty white areas.
 */
export function AmbientGrid({
  className = '',
  opacity = 0.05,
}: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 motion-reduce:hidden ${className}`}
      style={{
        opacity,
        backgroundImage:
          'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        animation: 'ambient-grid-drift 18s linear infinite',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
      }}
    />
  );
}

export function BlinkingCursor({ className = '' }: { className?: string }) {
  return <span className={`inline-block animate-[cursor-blink_1.1s_steps(1)_infinite] ${className}`}>|</span>;
}
