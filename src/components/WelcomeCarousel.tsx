import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft } from 'lucide-react';

interface WelcomeCarouselProps {
  onComplete: () => void;
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

const TOTAL = 4;

export default function WelcomeCarousel({ onComplete }: WelcomeCarouselProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = () => {
    if (step === TOTAL - 1) {
      onComplete();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const prev = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const SWIPE_THRESHOLD = 50;
  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) next();
    else if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) prev();
  };

  const headline = 'font-mono font-black text-5xl md:text-6xl uppercase tracking-tighter leading-[0.9] text-foreground';
  const subtext = 'font-sans text-xs uppercase tracking-widest text-muted-foreground leading-relaxed';

  const screens = [
    {
      content: (
        <div className="flex-1 flex flex-col justify-center px-8">
          <h1 className={headline}>TRACKING<br />SUCKS.</h1>
          <p className={`${subtext} mt-8 max-w-xs`}>
            DIET APPS ARE BLOATED. YOU DON'T NEED A SPREADSHEET TO BUILD MUSCLE. YOU JUST NEED TO HIT YOUR TARGET.
          </p>
        </div>
      ),
      cta: 'NEXT',
    },
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-16">
          <h1 className={headline}>ONE<br />METRIC.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            CUT THE NOISE. STOP TRACKING MACROS YOU DON'T CARE ABOUT. FOCUS EXCLUSIVELY ON THE ONLY MACRONUTRIENT THAT DRIVES GROWTH.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono font-black text-[8rem] md:text-[10rem] tracking-tighter leading-none text-foreground">
              126G
            </span>
          </div>
        </div>
      ),
      cta: 'NEXT',
    },
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-16">
          <h1 className={headline}>ZERO<br />FRICTION.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            SNAP A PHOTO AND LET AI EXTRACT THE PROTEIN. OR USE 1-TAP QUICK-ADD FOR YOUR DAILY STAPLES. LOG IN SECONDS, NOT MINUTES.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-foreground bg-foreground flex items-center justify-center">
              <Camera className="w-14 h-14 text-background" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      ),
      cta: 'NEXT',
    },
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-16">
          <h1 className={headline}>FORGE<br />DISCIPLINE.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            CONSISTENCY IS THE ONLY HACK. HIT YOUR TARGET DAILY, BUILD YOUR STREAK, AND UNLOCK YOUR PHYSICAL TRAJECTORY.
          </p>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-9 h-9 border-2 border-foreground" />
              ))}
            </div>
            <span className="text-3xl">🔥</span>
          </div>
        </div>
      ),
      cta: "LET'S GO",
    },
  ];

  const current = screens[step];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* BACK */}
      {step > 0 && (
        <button
          onClick={prev}
          aria-label="Back"
          className="absolute top-6 left-6 z-10 text-foreground hover:opacity-60 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}

      {/* SKIP */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 z-10 font-mono text-xs uppercase tracking-widest text-foreground hover:opacity-60 transition-opacity"
      >
        SKIP
      </button>

      {/* Slide content */}
      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col touch-pan-y cursor-grab active:cursor-grabbing"
          >
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 pb-6">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 border-2 border-foreground ${i === step ? 'bg-foreground' : 'bg-background'}`}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={next}
        className="w-full bg-foreground text-background py-5 font-mono font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
      >
        [ {current.cta} ]
      </button>
    </div>
  );
}
