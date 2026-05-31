import { forwardRef, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface Props {
  onTap: () => void;
  onDelete: () => void;
  children: ReactNode;
}

// Distance (px) past which releasing triggers a delete.
const DELETE_THRESHOLD = 120;
// Velocity (px/s) that triggers delete regardless of distance.
const VELOCITY_THRESHOLD = 600;

const SwipeableLogRow = forwardRef<HTMLDivElement, Props>(function SwipeableLogRow(
  { onTap, onDelete, children },
  ref,
) {
  const x = useMotionValue(0);
  const dragged = useRef(false);

  // Background reveal opacity scales with drag distance.
  const bgOpacity = useTransform(x, [-DELETE_THRESHOLD, -20, 0], [1, 0.3, 0]);
  const iconScale = useTransform(x, [-DELETE_THRESHOLD, -40, 0], [1, 0.6, 0.4]);
  const iconOpacity = useTransform(x, [-DELETE_THRESHOLD, -30, 0], [1, 0.5, 0]);

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
      // Animate fully off-screen, then commit delete.
      animate(x, -window.innerWidth, {
        duration: 0.18,
        ease: 'easeOut',
        onComplete: () => onDelete(),
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
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
        <motion.div style={{ scale: iconScale, opacity: iconOpacity }} className="text-background">
          <Trash2 size={18} strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -window.innerWidth, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        dragDirectionLock
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleClick}
        className="bg-background cursor-pointer select-none active:bg-foreground/5"
      >
        {children}
      </motion.div>
    </div>
  );
});

export default SwipeableLogRow;
