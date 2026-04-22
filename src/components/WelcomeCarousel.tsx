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

// Monolithic Discipline Column for Screen 4 — 7 concrete layers stack bottom-to-top
function MonolithColumn() {
  const LAYERS = 7;
  const COL_W = 140;
  const LAYER_H = 28;
  const TOTAL_H = LAYERS * LAYER_H; // 196
  const STAGGER = 0.18;
  const LAYER_DUR = 0.35;
  const buildEnd = (LAYERS - 1) * STAGGER + LAYER_DUR; // ~1.43s

  // Concrete texture: layered radial + repeating noise via SVG filter
  const concreteBg = `
    radial-gradient(ellipse at 30% 20%, hsl(var(--foreground) / 0.92) 0%, hsl(var(--foreground)) 60%),
    repeating-linear-gradient(115deg, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 3px, hsl(var(--foreground) / 0.85) 3px, hsl(var(--foreground)) 6px)
  `;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Column assembly */}
      <div
        className="relative"
        style={{ width: COL_W, height: TOTAL_H }}
      >
        {/* SVG noise filter for concrete grain */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <filter id="concrete-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
        </svg>

        {/* Stacked layers, bottom-up */}
        {Array.from({ length: LAYERS }).map((_, i) => {
          const fromBottom = i; // 0 = base
          return (
            <motion.div
              key={i}
              initial={{ y: -40, opacity: 0, scaleY: 0.6 }}
              animate={{ y: 0, opacity: 1, scaleY: 1 }}
              transition={{
                duration: LAYER_DUR,
                delay: fromBottom * STAGGER,
                ease: [0.7, 0, 0.2, 1],
              }}
              style={{
                position: 'absolute',
                left: 0,
                bottom: fromBottom * LAYER_H,
                width: COL_W,
                height: LAYER_H,
                background: concreteBg,
                borderTop: fromBottom === LAYERS - 1 ? 'none' : '1px solid hsl(var(--background) / 0.18)',
                boxShadow: 'inset 0 -2px 0 hsl(var(--background) / 0.15), inset 0 2px 0 hsl(var(--foreground))',
                transformOrigin: 'bottom',
              }}
            >
              {/* Grain overlay */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
                style={{
                  backgroundImage:
                    'repeating-radial-gradient(circle at 20% 30%, hsl(var(--background) / 0.08) 0px, transparent 1.5px), repeating-radial-gradient(circle at 70% 80%, hsl(var(--background) / 0.06) 0px, transparent 1px)',
                }}
              />
            </motion.div>
          );
        })}

        {/* Heavy ground baseline */}
        <div
          className="absolute left-[-20px] right-[-20px] bg-foreground"
          style={{ bottom: -8, height: 6 }}
        />

        {/* Recessed-carved text: "100% CONSISTENCY" — engraved into stone face */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: buildEnd + 0.1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="font-mono font-black uppercase text-background text-center leading-[0.95] tracking-tighter"
            style={{
              fontSize: 18,
              // Engraved/recessed effect: dark inset shadow above, light highlight below
              textShadow: `
                0 -1px 0 hsl(var(--foreground)),
                0 1px 0 hsl(var(--background) / 0.35),
                0 2px 1px hsl(var(--background) / 0.15)
              `,
              filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.6))',
            }}
          >
            100%
            <br />
            CONSISTENCY
          </div>
        </motion.div>
      </div>

      {/* STREAK ACTIVE stamp below column */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: buildEnd + 0.5 }}
        className="font-mono font-black uppercase tracking-widest text-foreground text-xs"
      >
        STREAK ACTIVE
      </motion.div>
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
      headline: <span className="font-sans font-bold text-4xl md:text-5xl tracking-tight normal-case text-foreground">One metric.</span>,
      sub: "Cut the noise. Stop tracking macros you don't care about. Focus exclusively on the only macronutrient that drives growth.",
      subClass: 'font-sans text-base normal-case tracking-normal text-muted-foreground leading-relaxed text-center max-w-[68%]',
      visual: (
        <div className="flex flex-col items-center gap-10">
          <span className="relative font-sans font-light text-2xl tracking-tight text-muted-foreground/60">
            Carbs
            <span className="absolute left-[-10%] right-[-10%] top-1/2 h-px bg-muted-foreground/50" />
          </span>
          <span className="relative font-sans font-light text-2xl tracking-tight text-muted-foreground/60">
            Fats
            <span className="absolute left-[-10%] right-[-10%] top-1/2 h-px bg-muted-foreground/50" />
          </span>
          <span className="font-sans font-bold text-7xl md:text-8xl tracking-tight leading-none text-foreground mt-2">
            Protein
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
      visual: <MonolithColumn />,
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
