import { forwardRef, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface Props {
  onTap: () => void;
  onDelete: () => void;
  children: ReactNode;
}

// Distance (px) past which releasing triggers a delete.
const DELETE_THRESHOLD = 90;
// Velocity (px/s) that triggers delete regardless of distance.
const VELOCITY_THRESHOLD = 500;
// Max drag distance — finger meets resistance past this.
const MAX_DRAG = 140;

const SwipeableLogRow = forwardRef<HTMLDivElement, Props>(function SwipeableLogRow(
  { onTap, onDelete, children },
  ref,
) {
  const x = useMotionValue(0);
  const dragged = useRef(false);

  // Single, cheap transform for the reveal background.
  const bgOpacity = useTransform(x, [-DELETE_THRESHOLD, 0], [1, 0], { clamp: true });
  const iconScale = useTransform(x, [-DELETE_THRESHOLD, -20], [1, 0.85], { clamp: true });

  const handleDragStart = () => {
    dragged.current = true;
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setTimeout(() => {
      dragged.current = false;
    }, 50);

    const shouldDelete =
      info.offset.x < -DELETE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD;

    if (shouldDelete) {
      animate(x, -window.innerWidth, {
        type: 'tween',
        duration: 0.18,
        ease: [0.32, 0.72, 0, 1],
        onComplete: () => onDelete(),
      });
    } else {
      animate(x, 0, {
        type: 'spring',
        stiffness: 500,
        damping: 40,
        mass: 0.6,
        velocity: info.velocity.x,
      });
    }
  };

  const handleClick = () => {
    if (dragged.current) return;
    onTap();
  };

  return (
    <div ref={ref} className="relative overflow-hidden border-b border-border">
      {/* Background reveal — purely visual feedback while dragging */}
      <motion.div
        style={{ opacity: bgOpacity, willChange: 'opacity' }}
        className="absolute inset-0 bg-foreground flex items-center justify-end pr-6 pointer-events-none"
        aria-hidden
      >
        <motion.div style={{ scale: iconScale }} className="text-background">
          <Trash2 size={18} strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_DRAG, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        dragDirectionLock
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'pan-y', willChange: 'transform' }}
        onClick={handleClick}
        className="bg-background cursor-pointer select-none"
      >
        {children}
      </motion.div>
    </div>
  );
});

export default SwipeableLogRow;
