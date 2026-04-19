import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

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

  const goTo = (target: number) => {
    if (target === step) return;
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

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

  const headline =
    'font-mono font-black text-5xl md:text-6xl uppercase tracking-tighter leading-[0.9] text-foreground';
  const subtext =
    'font-sans text-xs uppercase tracking-widest text-muted-foreground leading-relaxed';

  const screens = [
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-20">
          <h1 className={headline}>TRACKING<br />SUCKS.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            DIET APPS ARE BLOATED. YOU DON'T NEED A SPREADSHEET TO BUILD MUSCLE. YOU JUST NEED TO HIT YOUR TARGET.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-56 h-56">
              {/* Faint blurred pie chart */}
              <div
                className="absolute inset-0 rounded-full opacity-20 blur-md"
                style={{
                  background:
                    'conic-gradient(hsl(var(--foreground)) 0deg 110deg, hsl(var(--muted-foreground)) 110deg 200deg, hsl(var(--foreground)) 200deg 270deg, hsl(var(--muted-foreground)) 270deg 360deg)',
                }}
              />
              {/* Massive sharp X */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full text-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="square"
              >
                <line x1="10" y1="10" x2="90" y2="90" />
                <line x1="90" y1="10" x2="10" y2="90" />
              </svg>
            </div>
          </div>
        </div>
      ),
      cta: 'NEXT',
    },
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-20">
          <h1 className={headline}>ONE<br />METRIC.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            CUT THE NOISE. STOP TRACKING MACROS YOU DON'T CARE ABOUT. FOCUS EXCLUSIVELY ON THE ONLY MACRONUTRIENT THAT DRIVES GROWTH.
          </p>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="relative font-mono font-bold text-3xl uppercase tracking-tighter text-muted-foreground">
                CARBS
                <span className="absolute left-[-8%] right-[-8%] top-1/2 h-[3px] bg-foreground" />
              </span>
              <span className="relative font-mono font-bold text-3xl uppercase tracking-tighter text-muted-foreground">
                FATS
                <span className="absolute left-[-8%] right-[-8%] top-1/2 h-[3px] bg-foreground" />
              </span>
            </div>
            <span className="font-mono font-black text-7xl md:text-8xl uppercase tracking-tighter leading-none text-foreground">
              PROTEIN
            </span>
          </div>
        </div>
      ),
      cta: 'NEXT',
    },
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-20">
          <h1 className={headline}>ZERO<br />FRICTION.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            SNAP A PHOTO AND LET AI EXTRACT THE PROTEIN. OR USE 1-TAP QUICK-ADD FOR YOUR DAILY STAPLES. LOG IN SECONDS, NOT MINUTES.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col gap-3 w-48">
              {['+30G', '+40G', '+50G'].map((label) => (
                <div
                  key={label}
                  className="border-2 border-foreground bg-background py-4 text-center font-mono font-bold text-2xl tracking-tighter text-foreground"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      cta: 'NEXT',
    },
    {
      content: (
        <div className="flex-1 flex flex-col px-8 pt-20">
          <h1 className={headline}>FORGE<br />DISCIPLINE.</h1>
          <p className={`${subtext} mt-6 max-w-xs`}>
            CONSISTENCY IS THE ONLY HACK. HIT YOUR TARGET DAILY, BUILD YOUR STREAK, AND UNLOCK YOUR PHYSICAL TRAJECTORY.
          </p>
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-9 h-9 border-2 border-foreground bg-background" />
              ))}
            </div>
            <span className="font-mono font-bold text-sm uppercase tracking-widest text-foreground">
              STREAK ACTIVE
            </span>
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

      {/* Pagination — sharp tappable squares */}
      <div className="flex justify-center gap-2 pb-6">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to screen ${i + 1}`}
            className={`w-3 h-3 border-2 border-foreground transition-colors ${
              i === step ? 'bg-foreground' : 'bg-background hover:bg-muted'
            }`}
          />
        ))}
      </div>

      {/* CTA — solid black block, no brackets */}
      <button
        onClick={next}
        className="w-full bg-foreground text-background py-5 font-mono font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
      >
        {current.cta}
      </button>
    </div>
  );
}
