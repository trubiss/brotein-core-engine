import { useRef, useState, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface Props {
  onTap: () => void;
  onDelete: () => void;
  children: ReactNode;
}

const REVEAL = 88; // px width of delete action
const THRESHOLD = -56;

export default function SwipeableLogRow({ onTap, onDelete, children }: Props) {
  const x = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const dragged = useRef(false);
  const bgOpacity = useTransform(x, [-REVEAL, 0], [1, 0.4]);

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
    <div className="relative overflow-hidden border-b border-border">
      {/* Delete action behind */}
      <motion.button
        onClick={onDelete}
        style={{ opacity: bgOpacity }}
        className="absolute inset-y-0 right-0 w-[88px] bg-foreground text-background flex items-center justify-center active:opacity-80"
        aria-label="Delete"
      >
        <Trash2 size={16} strokeWidth={2.5} />
      </motion.button>

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
