import { forwardRef, useRef, useState, ReactNode } from 'react';
import { motion, useMotionValue, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface Props {
  onTap: () => void;
  onDelete: () => void;
  children: ReactNode;
}

const REVEAL = 56; // px — slim, icon-only
const THRESHOLD = -36;

const SwipeableLogRow = forwardRef<HTMLDivElement, Props>(function SwipeableLogRow({ onTap, onDelete, children }, ref) {
  const x = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const dragged = useRef(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setTimeout(() => { dragged.current = false; }, 50);
    if (info.offset.x < THRESHOLD || info.velocity.x < -300) {
      x.set(-REVEAL);
      setOpen(true);
    } else {
      x.set(0);
      setOpen(false);
    }
  };

  const handleDragStart = () => {
    dragged.current = true;
  };

  const handleClick = () => {
    if (dragged.current) return;
    if (open) {
      x.set(0);
      setOpen(false);
      return;
    }
    onTap();
  };

  return (
    <div ref={ref} className="relative overflow-hidden border-b border-border">
      {/* Slim icon-only delete reveal */}
      <button
        onClick={onDelete}
        className="absolute inset-y-0 right-0 w-[56px] bg-foreground text-background flex items-center justify-center active:bg-foreground/90"
        aria-label="Delete"
      >
        <Trash2 size={15} strokeWidth={2.5} />
      </button>

      <motion.div
        drag="x"
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={0.05}
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
}
