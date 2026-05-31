import { forwardRef, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface Props {
  onTap: () => void;
  onDelete: () => void;
  children: ReactNode;
}

// Distance (px) past which releasing triggers a delete.
const DELETE_THRESHOLD = 110;
// Velocity (px/s) that triggers delete regardless of distance.
const VELOCITY_THRESHOLD = 500;

const SwipeableLogRow = forwardRef<HTMLDivElement, Props>(function SwipeableLogRow(
  { onTap, onDelete, children },
  ref,
) {
  const x = useMotionValue(0);
  const dragged = useRef(false);

  // Background reveal opacity scales with drag distance — smoother ramp.
  const bgOpacity = useTransform(x, [-DELETE_THRESHOLD, 0], [1, 0], { clamp: true });
  const iconScale = useTransform(x, [-DELETE_THRESHOLD, -30, 0], [1.1, 0.7, 0.5], { clamp: true });
  const iconOpacity = useTransform(x, [-DELETE_THRESHOLD, -20, 0], [1, 0.4, 0], { clamp: true });
  const iconX = useTransform(x, [-DELETE_THRESHOLD * 1.5, -DELETE_THRESHOLD, 0], [-20, 0, 30], {
    clamp: true,
  });

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
      // Carry the swipe momentum off-screen for a natural feel.
      const velocity = Math.min(info.velocity.x, -800);
      animate(x, -window.innerWidth, {
        type: 'tween',
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
        onComplete: () => onDelete(),
      });
    } else {
      // Soft, iOS-like settle.
      animate(x, 0, {
        type: 'spring',
        stiffness: 380,
        damping: 34,
        mass: 0.9,
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
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 bg-foreground flex items-center justify-end pr-6 pointer-events-none"
        aria-hidden
      >
        <motion.div
          style={{ scale: iconScale, opacity: iconOpacity, x: iconX }}
          className="text-background"
        >
          <Trash2 size={18} strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -window.innerWidth, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        dragMomentum={false}
        dragDirectionLock
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        onClick={handleClick}
        className="bg-background cursor-pointer select-none active:bg-foreground/5"
      >
        {children}
      </motion.div>
    </div>
  );
});

export default SwipeableLogRow;
