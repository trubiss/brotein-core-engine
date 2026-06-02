import { forwardRef, useRef, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  onTap: () => void;
  onDelete: () => void;
  children: ReactNode;
}

// Distance (px) past which releasing triggers a delete.
const DELETE_THRESHOLD = 90;
// Velocity (px/s) that triggers delete regardless of distance.
const VELOCITY_THRESHOLD = 650;
// Max visible reveal before rubber-banding starts.
const MAX_REVEAL = 118;
const RUBBER_BAND = 0.22;
const TAP_SLOP = 8;
const SNAP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function rubberBand(dx: number) {
  if (dx >= 0) return 0;
  const distance = Math.abs(dx);
  if (distance <= MAX_REVEAL) return -distance;
  return -(MAX_REVEAL + (distance - MAX_REVEAL) * RUBBER_BAND);
}

const SwipeableLogRow = forwardRef<HTMLDivElement, Props>(function SwipeableLogRow(
  { onTap, onDelete, children },
  ref,
) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocityX = useRef(0);
  const offsetX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const didMove = useRef(false);
  const isDeleting = useRef(false);

  const setRefs = (node: HTMLDivElement | null) => {
    rowRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const paint = (x: number, transition = 'none') => {
    const progress = Math.min(Math.abs(x) / DELETE_THRESHOLD, 1);
    if (contentRef.current) {
      contentRef.current.style.transition = transition;
      contentRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
    }
    if (bgRef.current) bgRef.current.style.opacity = String(progress);
    if (iconRef.current) iconRef.current.style.transform = `scale(${0.84 + progress * 0.16})`;
  };

  const reset = () => {
    offsetX.current = 0;
    paint(0, `transform 220ms ${SNAP_EASING}`);
    window.setTimeout(() => {
      if (contentRef.current) contentRef.current.style.transition = 'none';
    }, 240);
  };

  const finishDelete = () => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    const exitX = -Math.max(window.innerWidth, rowRef.current?.offsetWidth ?? 0) - 24;
    paint(exitX, 'transform 170ms cubic-bezier(0.32, 0.72, 0, 1)');
    window.setTimeout(onDelete, 175);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDeleting.current) return;
    pointerId.current = event.pointerId;
    startX.current = event.clientX;
    startY.current = event.clientY;
    lastX.current = event.clientX;
    lastTime.current = performance.now();
    velocityX.current = 0;
    didMove.current = false;
    isSwiping.current = false;
    contentRef.current?.setPointerCapture(event.pointerId);
    if (contentRef.current) contentRef.current.style.transition = 'none';
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId || isDeleting.current) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (!isSwiping.current) {
      if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      isSwiping.current = true;
      didMove.current = true;
    }

    event.preventDefault();
    const now = performance.now();
    const dt = Math.max(now - lastTime.current, 1);
    velocityX.current = ((event.clientX - lastX.current) / dt) * 1000;
    lastX.current = event.clientX;
    lastTime.current = now;
    offsetX.current = rubberBand(dx);
    paint(offsetX.current);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId || isDeleting.current) return;
    pointerId.current = null;
    try { contentRef.current?.releasePointerCapture(event.pointerId); } catch { /* noop */ }

    if (!isSwiping.current) return;
    const shouldDelete = offsetX.current <= -DELETE_THRESHOLD || velocityX.current <= -VELOCITY_THRESHOLD;
    isSwiping.current = false;
    if (shouldDelete) finishDelete();
    else reset();
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (didMove.current) {
      event.preventDefault();
      didMove.current = false;
      return;
    }
    onTap();
  };

  return (
    <div ref={setRefs} className="relative overflow-hidden border-b border-border">
      {/* Background reveal — purely visual feedback while dragging */}
      <div
        ref={bgRef}
        style={{ opacity: 0, willChange: 'opacity' }}
        className="absolute inset-0 bg-foreground flex items-center justify-end pr-6 pointer-events-none"
        aria-hidden
      >
        <div ref={iconRef} style={{ transform: 'scale(0.84)' }} className="text-background">
          <Trash2 size={18} strokeWidth={2.5} />
        </div>
      </div>

      <div
        ref={contentRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{ touchAction: 'pan-y', willChange: 'transform', transform: 'translate3d(0, 0, 0)' }}
        onClick={handleClick}
        className="bg-background cursor-pointer select-none"
      >
        {children}
      </div>
    </div>
  );
});

export default SwipeableLogRow;
