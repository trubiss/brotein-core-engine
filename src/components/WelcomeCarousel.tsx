import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import quickAddVideo from '../../public/onboarding-quickadd.mp4.asset.json';

interface WelcomeCarouselProps {
  onComplete: () => void;
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

const TOTAL = 4;

// Brutalist animated step graph for Screen 4
function StepGraph() {
  // Staircase points scaled to 280x180 viewBox
  // Path: starts bottom-left, steps up to top-right, closes to baseline for fill
  const linePath = 'M 0 170 L 40 170 L 40 140 L 80 140 L 80 110 L 120 110 L 120 80 L 160 80 L 160 55 L 200 55 L 200 30 L 240 30 L 240 10 L 280 10';
  const fillPath = `${linePath} L 280 180 L 0 180 Z`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[280px] h-[180px]">
        <svg
          viewBox="0 0 280 180"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full overflow-visible"
        >
          {/* Animated clip reveals fill + line left-to-right */}
          <defs>
            <clipPath id="reveal-clip">
              <motion.rect
                x="0"
                y="0"
                height="180"
                initial={{ width: 0 }}
                animate={{ width: 280 }}
                transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
              />
            </clipPath>
          </defs>

          <g clipPath="url(#reveal-clip)">
            {/* Solid black fill under the staircase */}
            <path d={fillPath} fill="hsl(var(--foreground))" />
            {/* Heavy stepped line on top */}
            <path
              d={linePath}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="4"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </g>

          {/* Heavy baseline */}
          <line
            x1="0"
            y1="180"
            x2="280"
            y2="180"
            stroke="hsl(var(--foreground))"
            strokeWidth="6"
          />
        </svg>

        {/* Stamp: positioned in the largest filled region (right side, near peak) */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.5 }}
          className="absolute right-2 bottom-3 font-sans font-black uppercase tracking-tight text-background text-[15px] leading-[0.95] text-right pointer-events-none"
        >
          100%
          <br />
          CONSISTENCY
        </motion.span>
      </div>
    </div>
  );
}

// Bloated spreadsheet visual for Screen 1
function BloatedSpreadsheet() {
  const cols = ['KCAL', 'CARB', 'FAT', 'PRO', 'FIB', 'ZN', 'B12', 'MG'];
  const rows = 7;
  return (
    <div className="relative w-[280px] h-[260px]">
      {/* Title bar */}
      <div className="absolute -top-5 left-0 right-0 text-center font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
        MYFITNESSPAL / SPREADSHEET (BLOATED)
      </div>
      {/* Grid */}
      <div className="w-full h-full border border-muted-foreground/40 grid grid-rows-[16px_repeat(7,1fr)] opacity-60">
        {/* Header row */}
        <div className="grid grid-cols-8 border-b border-muted-foreground/40">
          {cols.map((c) => (
            <div
              key={c}
              className="border-r border-muted-foreground/40 last:border-r-0 flex items-center justify-center font-mono text-[7px] uppercase text-muted-foreground"
            >
              {c}
            </div>
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid grid-cols-8 border-b border-muted-foreground/30 last:border-b-0">
            {cols.map((c, ci) => (
              <div
                key={ci}
                className="border-r border-muted-foreground/30 last:border-r-0 flex items-center justify-center font-mono text-[7px] text-muted-foreground/70"
              >
                {((r * 13 + ci * 7) % 99) + 1}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Subtle massive X overlay */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full text-foreground opacity-90 pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      >
        <line x1="4" y1="4" x2="96" y2="96" />
        <line x1="96" y1="4" x2="4" y2="96" />
      </svg>
    </div>
  );
}

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
    'font-mono font-black text-5xl md:text-6xl uppercase tracking-tighter leading-[0.9] text-foreground text-center';
  const subtext =
    'font-sans text-xs uppercase tracking-widest text-muted-foreground leading-relaxed text-center max-w-xs';

  type Screen = { headline: React.ReactNode; sub: string; visual: React.ReactNode; cta: string };

  const screens: Screen[] = [
    {
      headline: <>TRACKING<br />SUCKS.</>,
      sub: "DIET APPS ARE BLOATED. YOU DON'T NEED A SPREADSHEET TO BUILD MUSCLE. YOU JUST NEED TO HIT YOUR TARGET.",
      visual: <BloatedSpreadsheet />,
      cta: 'NEXT',
    },
    {
      headline: <>ONE<br />METRIC.</>,
      sub: "CUT THE NOISE. STOP TRACKING MACROS YOU DON'T CARE ABOUT. FOCUS EXCLUSIVELY ON THE ONLY MACRONUTRIENT THAT DRIVES GROWTH.",
      visual: (
        <div className="flex flex-col items-center gap-4">
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
      ),
      cta: 'NEXT',
    },
    {
      headline: <>ZERO<br />FRICTION.</>,
      sub: 'SNAP A PHOTO AND LET AI EXTRACT THE PROTEIN. OR USE 1-TAP QUICK-ADD FOR YOUR DAILY STAPLES. LOG IN SECONDS, NOT MINUTES.',
      visual: (
        <div className="border-2 border-foreground bg-background w-[240px] aspect-[3/4] overflow-hidden">
          <video
            src={quickAddVideo.url}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />
        </div>
      ),
      cta: 'NEXT',
    },
    {
      headline: <>FORGE<br />DISCIPLINE.</>,
      sub: 'CONSISTENCY IS THE ONLY HACK. HIT YOUR TARGET DAILY, BUILD YOUR STREAK, AND UNLOCK YOUR PHYSICAL TRAJECTORY.',
      visual: <TargetBars />,
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
            className="absolute inset-0 flex flex-col items-center justify-between px-8 py-20 touch-pan-y cursor-grab active:cursor-grabbing"
          >
            {/* Top: Headline + subtext, centered */}
            <div className="flex flex-col items-center gap-6 w-full">
              <h1 className={headline}>{current.headline}</h1>
              <p className={subtext}>{current.sub}</p>
            </div>

            {/* Middle: Central visual, perfectly centered */}
            <div className="flex-1 w-full flex items-center justify-center">
              {current.visual}
            </div>

            {/* Spacer to balance — bottom controls live outside motion div */}
            <div className="h-2" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination — sharp tappable squares, centered */}
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

      {/* CTA — solid black block, full width, centered text */}
      <button
        onClick={next}
        className="w-full bg-foreground text-background py-5 font-mono font-bold uppercase tracking-widest text-sm text-center hover:opacity-90 transition-opacity"
      >
        {current.cta}
      </button>
    </div>
  );
}
