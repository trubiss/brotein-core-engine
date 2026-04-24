import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface OnboardingStoryFlowProps {
  onComplete: () => void;
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

type Choice = { value: string; label: string };

type Screen =
  | { kind: 'statement'; headline: React.ReactNode; sub?: string; visual?: React.ReactNode; cta: string }
  | { kind: 'question'; key: string; headline: React.ReactNode; sub?: string; choices: Choice[] }
  | { kind: 'interactive-add'; headline: React.ReactNode; sub: string; cta: string }
  | { kind: 'pace'; headline: React.ReactNode; sub: string; cta: string };

const TARGET = 150;

function MetricStack() {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.35, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative font-mono font-light text-2xl uppercase tracking-tight text-muted-foreground"
      >
        CARBS
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          style={{ transformOrigin: 'left' }}
          className="absolute left-[-12%] right-[-12%] top-1/2 h-[2px] bg-muted-foreground/70"
        />
      </motion.span>
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        className="font-mono font-black text-[5.5rem] md:text-[7rem] uppercase tracking-tighter leading-none text-foreground my-1"
      >
        PROTEIN
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 0.35, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative font-mono font-light text-2xl uppercase tracking-tight text-muted-foreground"
      >
        FATS
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, delay: 0.45 }}
          style={{ transformOrigin: 'left' }}
          className="absolute left-[-12%] right-[-12%] top-1/2 h-[2px] bg-muted-foreground/70"
        />
      </motion.span>
    </div>
  );
}

function MiniDashboard({ value, target, flash = 0 }: { value: number; target: number; flash?: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <motion.div
      animate={flash > 0 ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.25 }}
      key={`d-${flash}`}
      className="w-full max-w-xs border-2 border-foreground p-6 bg-background"
    >
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
        TODAY
      </p>
      <div className="flex items-baseline gap-2 mb-6">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono font-black text-6xl tracking-tighter leading-none text-foreground"
        >
          {value}
        </motion.span>
        <span className="font-mono font-bold text-xl text-muted-foreground">/ {target}G</span>
      </div>
      <div className="w-full h-2 bg-muted relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full bg-foreground"
        />
        {flash > 0 && (
          <motion.div
            key={`flash-${flash}`}
            initial={{ opacity: 0.6, x: '-100%' }}
            animate={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 bg-foreground/40"
          />
        )}
      </div>
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-3">
        {pct}% OF TARGET
      </p>
    </motion.div>
  );
}

export default function OnboardingStoryFlow({ onComplete }: OnboardingStoryFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [protein, setProtein] = useState(0);
  const [tapped, setTapped] = useState(0);

  const screens: Screen[] = useMemo(
    () => [
      // SECTION 1 — Problem
      {
        kind: 'statement',
        headline: <>YOU'RE NOT<br />HITTING YOUR<br />PROTEIN.</>,
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>THAT'S WHY<br />YOU'RE NOT<br />SEEING<br />RESULTS.</>,
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>ONE<br />METRIC.</>,
        sub: 'CUT THE NOISE. ONE NUMBER DRIVES GROWTH.',
        visual: <MetricStack />,
        cta: 'CONTINUE',
      },
      // SECTION 2 — Reflection
      {
        kind: 'question',
        key: 'struggle',
        headline: <>DO YOU STRUGGLE<br />TO HIT YOUR<br />PROTEIN DAILY?</>,
        choices: [
          { value: 'always', label: 'ALWAYS' },
          { value: 'sometimes', label: 'SOMETIMES' },
          { value: 'rarely', label: 'RARELY' },
        ],
      },
      {
        kind: 'statement',
        headline: <>MOST PEOPLE<br />LIKE YOU MISS<br />THEIR TARGET<br />EVERY DAY.</>,
        cta: 'CONTINUE',
      },
      {
        kind: 'question',
        key: 'estimate',
        headline: <>HOW MUCH<br />PROTEIN DO<br />YOU EAT<br />PER DAY?</>,
        choices: [
          { value: 'low', label: 'LESS THAN 80G' },
          { value: 'mid', label: '80 — 120G' },
          { value: 'high', label: '120G+' },
        ],
      },
      // SECTION 3 — Aha
      {
        kind: 'statement',
        headline: <>TO BUILD<br />MUSCLE,<br />YOU NEED<br />120G+ DAILY.</>,
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>THAT GAP<br />IS WHY<br />PROGRESS<br />FEELS SLOW.</>,
        cta: 'SHOW ME THE FIX',
      },
      // SECTION 4 — Product
      {
        kind: 'statement',
        headline: <>THIS IS<br />YOUR DAILY<br />TARGET.</>,
        sub: 'ONE SCREEN. ONE NUMBER. ZERO CLUTTER.',
        visual: <MiniDashboard value={0} target={TARGET} />,
        cta: 'TRY IT',
      },
      {
        kind: 'interactive-add',
        headline: <>TAP TO<br />ADD PROTEIN.</>,
        sub: 'EACH TAP LOGS +20G. HIT YOUR TARGET IN SECONDS.',
        cta: 'CONTINUE',
      },
      {
        kind: 'pace',
        headline: protein >= TARGET ? <>YOU'RE<br />ON TRACK.</> : <>YOU'RE<br />BEHIND<br />TODAY.</>,
        sub:
          protein >= TARGET
            ? 'KEEP THIS RHYTHM AND THE STREAK BUILDS ITSELF.'
            : 'BROTEIN TELLS YOU EXACTLY HOW MUCH MORE YOU NEED, IN REAL TIME.',
        cta: 'CONTINUE',
      },
      // SECTION 5 — Commitment
      {
        kind: 'question',
        key: 'commit',
        headline: <>READY TO<br />HIT YOUR<br />PROTEIN<br />DAILY?</>,
        choices: [
          { value: 'serious', label: "YES, I'M SERIOUS" },
          { value: 'try', label: "I'LL TRY" },
          { value: 'no', label: 'NOT REALLY' },
        ],
      },
      // SECTION 6 — Future
      {
        kind: 'statement',
        headline: <>IN 30 DAYS,<br />YOU BUILD<br />A REAL<br />PROTEIN HABIT.</>,
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>LESS THAN<br />10 SECONDS<br />PER MEAL.</>,
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>MOST USERS<br />HIT THEIR<br />TARGET WITHIN<br />DAYS.</>,
        cta: 'CONTINUE',
      },
      // SECTION 7 — Paywall intro
      {
        kind: 'statement',
        headline: <>TRY BROTEIN<br />FREE FOR<br />7 DAYS.</>,
        sub: 'LESS THAN A COFFEE PER WEEK.',
        cta: 'START FREE TRIAL',
      },
    ],
    [protein]
  );

  const TOTAL = screens.length;
  const current = screens[step];

  const next = () => {
    if (step >= TOTAL - 1) {
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

  const handleAnswer = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(next, 220);
  };

  const handleAdd = () => {
    setProtein((p) => Math.min(TARGET + 20, p + 20));
    setTapped((t) => t + 1);
  };

  const headlineCls =
    'font-mono font-black text-5xl md:text-6xl uppercase tracking-tighter leading-[0.95] text-foreground';
  const subCls =
    'font-sans text-xs uppercase tracking-widest text-muted-foreground leading-relaxed max-w-xs';

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Top bar */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button
          onClick={prev}
          aria-label="Back"
          disabled={step === 0}
          className="text-foreground hover:opacity-60 transition-opacity disabled:opacity-0"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <div className="flex-1 mx-4 h-[2px] bg-muted overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full bg-foreground"
          />
        </div>
        <button
          onClick={onComplete}
          className="font-mono text-xs uppercase tracking-widest text-foreground hover:opacity-60 transition-opacity"
        >
          SKIP
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col px-8 pt-12 pb-8"
          >
            {/* Headline block */}
            <div className="flex flex-col gap-5">
              <h1 className={headlineCls}>{current.headline}</h1>
              {'sub' in current && current.sub && <p className={subCls}>{current.sub}</p>}
            </div>

            {/* Center visual / interactive zone */}
            <div className="flex-1 flex items-center justify-center py-8">
              {current.kind === 'statement' && current.visual}

              {current.kind === 'question' && (
                <div className="w-full flex flex-col gap-3">
                  {current.choices.map((c) => {
                    const selected = answers[current.key] === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => handleAnswer(current.key, c.value)}
                        className={`w-full border-2 border-foreground py-5 px-5 text-left font-mono font-bold uppercase tracking-widest text-sm transition-colors ${
                          selected
                            ? 'bg-foreground text-background'
                            : 'bg-background text-foreground hover:bg-foreground hover:text-background'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.kind === 'interactive-add' && (
                <div className="w-full flex flex-col items-center gap-8">
                  <MiniDashboard value={protein} target={TARGET} />
                  <button
                    onClick={handleAdd}
                    className="w-full max-w-xs border-2 border-foreground py-6 font-mono font-black uppercase tracking-widest text-base bg-background hover:bg-foreground hover:text-background transition-colors active:scale-[0.98]"
                  >
                    + 20G PROTEIN
                  </button>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                    {tapped === 0 ? 'TAP TO LOG' : `${tapped} LOG${tapped > 1 ? 'S' : ''} TODAY`}
                  </p>
                </div>
              )}

              {current.kind === 'pace' && (
                <div className="w-full flex flex-col items-center gap-6">
                  <MiniDashboard value={protein} target={TARGET} />
                  <div
                    className={`px-6 py-3 font-mono font-black uppercase tracking-widest text-sm ${
                      protein >= TARGET
                        ? 'bg-foreground text-background'
                        : 'border-2 border-foreground text-foreground'
                    }`}
                  >
                    {protein >= TARGET ? 'ON TRACK' : 'BEHIND PACE'}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            {current.kind !== 'question' && (
              <button
                onClick={next}
                className="w-full bg-foreground text-background py-5 font-mono font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity active:scale-[0.99]"
              >
                {current.cta}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
