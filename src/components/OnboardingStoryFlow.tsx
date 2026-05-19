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

// ───────────────────────────────────────────────────────────
// Design tokens
// 8pt grid: 8, 16, 24, 32, 48, 64
// ───────────────────────────────────────────────────────────
const HEADLINE_CLS =
  // 40-44px, weight 900, tight line-height (~92%), -1.5% tracking, uppercase
  'font-mono font-black text-[40px] leading-[0.92] tracking-[-0.015em] uppercase text-foreground';
const SUB_CLS =
  // 14px, weight 500, tracking +2%, ~60% black, line-height ~145%
  'font-sans text-[14px] font-medium leading-[1.45] tracking-[0.02em] text-foreground/60';
const LABEL_CLS =
  // 12px, +12% tracking, weight 600
  'font-mono text-[12px] font-semibold tracking-[0.12em] uppercase text-foreground/60';
const BUTTON_TEXT_CLS =
  // 14px, weight 700, +9% tracking, uppercase
  'font-mono text-[14px] font-bold uppercase tracking-[0.09em]';

function MetricStack() {
  return (
    <div className="flex flex-col items-center">
      {/* CARBS — tight to PROTEIN, 20% opacity */}
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.2, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative font-mono font-light text-[22px] uppercase tracking-tight text-foreground"
      >
        CARBS
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          style={{ transformOrigin: 'left' }}
          className="absolute left-[-12%] right-[-12%] top-1/2 h-[2px] bg-foreground"
        />
      </motion.span>

      {/* PROTEIN — dominant, ~20% larger than headline (~52px), tight */}
      <motion.span
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        className="font-mono font-black text-[52px] md:text-[64px] uppercase tracking-[-0.02em] leading-[0.9] text-foreground my-3"
      >
        PROTEIN
      </motion.span>

      {/* FATS — 12px gap from PROTEIN, 20% opacity */}
      <motion.span
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 0.2, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative font-mono font-light text-[22px] uppercase tracking-tight text-foreground"
      >
        FATS
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, delay: 0.45 }}
          style={{ transformOrigin: 'left' }}
          className="absolute left-[-12%] right-[-12%] top-1/2 h-[2px] bg-foreground"
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
      className="w-full max-w-xs border-2 border-foreground p-4 bg-background"
    >
      {/* TODAY label */}
      <p className={LABEL_CLS}>TODAY</p>

      {/* 8px gap */}
      <div className="h-2" />

      {/* Main value */}
      <div className="flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono font-black text-[56px] tracking-[-0.02em] leading-none text-foreground"
        >
          {value}
        </motion.span>
        <span className="font-mono font-bold text-[18px] text-foreground/60">/ {target}G</span>
      </div>

      {/* 16px gap */}
      <div className="h-4" />

      {/* Progress bar — 4px, subtle rounded */}
      <div className="w-full h-[4px] bg-muted rounded-[2px] relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full bg-foreground rounded-[2px]"
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

      {/* 8px gap */}
      <div className="h-2" />

      <p className={LABEL_CLS}>{pct}% OF TARGET</p>
    </motion.div>
  );
}

export default function OnboardingStoryFlow({ onComplete }: OnboardingStoryFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [protein, setProtein] = useState(0);
  const [tapped, setTapped] = useState(0);

  const estimateGap = useMemo(() => {
    switch (answers.estimate) {
      case 'low':
        return '60–90G';
      case 'mid':
        return '30–60G';
      case 'high':
        return '10–30G';
      default:
        return '30–60G';
    }
  }, [answers.estimate]);

  const screens: Screen[] = useMemo(
    () => [
      { kind: 'statement', headline: <>YOU'RE NOT<br />HITTING YOUR<br />PROTEIN.</>, cta: 'CONTINUE' },
      {
        kind: 'statement',
        headline: <>NO PROTEIN.<br />NO RESULTS.</>,
        sub: 'MUSCLE, RECOVERY, FAT LOSS — ALL DEPEND ON IT.',
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>ONLY ONE<br />NUMBER<br />MATTERS.</>,
        visual: <MetricStack />,
        cta: 'CONTINUE',
      },
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
        kind: 'question',
        key: 'estimate',
        headline: <>HOW MUCH<br />PROTEIN DO<br />YOU EAT<br />PER DAY?</>,
        choices: [
          { value: 'low', label: 'LESS THAN 80G' },
          { value: 'mid', label: '80 — 120G' },
          { value: 'high', label: '120G+' },
        ],
      },
      {
        kind: 'statement',
        headline: (
          <>
            YOU'RE LIKELY<br />UNDER-EATING<br />PROTEIN BY<br />{estimateGap} DAILY.
          </>
        ),
        sub: 'BASED ON WHAT YOU JUST TOLD US.',
        cta: 'CONTINUE',
      },
      { kind: 'statement', headline: <>THAT GAP<br />IS HOLDING<br />YOU BACK.</>, cta: 'SHOW ME THE FIX' },
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
            ? 'KEEP THIS RHYTHM. THE STREAK BUILDS ITSELF.'
            : 'BROTEIN SHOWS YOU EXACTLY HOW MUCH MORE YOU NEED — IN REAL TIME.',
        cta: 'CONTINUE',
      },
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
      {
        kind: 'statement',
        headline: <>IN 30 DAYS,<br />HITTING YOUR<br />PROTEIN BECOMES<br />AUTOMATIC.</>,
        cta: 'CONTINUE',
      },
      { kind: 'statement', headline: <>LESS THAN<br />10 SECONDS<br />PER MEAL.</>, cta: 'CONTINUE' },
      {
        kind: 'statement',
        headline: <>YOU ALREADY<br />KNOW WHAT<br />TO DO.</>,
        sub: 'NOW YOU JUST NEED TO STAY CONSISTENT.',
        cta: 'CONTINUE',
      },
      {
        kind: 'statement',
        headline: <>TRY BROTEIN<br />FREE FOR<br />7 DAYS.</>,
        sub: 'LESS THAN A COFFEE PER WEEK.',
        cta: 'START FREE TRIAL',
      },
    ],
    [protein, estimateGap]
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

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* ── HEADER ── 16px top, 24px horizontal */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-4">
        <button
          onClick={prev}
          aria-label="Back"
          disabled={step === 0}
          className="text-foreground hover:opacity-60 transition-opacity disabled:opacity-0 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Progress: 2px, ~65% of screen, centered */}
        <div className="flex-1 flex justify-center">
          <div className="w-[65%] h-[2px] bg-foreground/15 overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="h-full bg-foreground"
            />
          </div>
        </div>

        <button
          onClick={onComplete}
          className={`${BUTTON_TEXT_CLS} text-foreground hover:opacity-60 transition-opacity shrink-0`}
        >
          SKIP
        </button>
      </div>

      {/* ── BODY ── */}
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
            className="absolute inset-0 flex flex-col px-6 pt-6 pb-6"
          >
            {/* Headline block — max-width ~280px, intentional line breaks */}
            <div className="flex flex-col">
              <h1 className={`${HEADLINE_CLS} max-w-[280px]`}>{current.headline}</h1>
              {'sub' in current && current.sub && (
                <>
                  {/* 12px gap */}
                  <div className="h-3" />
                  <p className={`${SUB_CLS} max-w-[260px]`}>{current.sub}</p>
                </>
              )}
            </div>

            {/* Center content — 32-48px from headline via flex spacing */}
            <div className="flex-1 flex items-center justify-center py-8">
              {current.kind === 'statement' && current.visual}

              {current.kind === 'question' && (
                /* Container 48px below headline (mt-12 from py-8 + items-center) */
                <div className="w-full flex flex-col gap-4 mt-12">
                  {current.choices.map((c) => {
                    const selected = answers[current.key] === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => handleAnswer(current.key, c.value)}
                        className={`w-full h-14 border-2 border-foreground px-4 text-left ${BUTTON_TEXT_CLS} transition-colors active:scale-[0.99] ${
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
                  <MiniDashboard value={protein} target={TARGET} flash={tapped} />
                  <motion.button
                    onClick={handleAdd}
                    whileTap={{ scale: 1.02 }}
                    animate={tapped > 0 ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.18 }}
                    key={`btn-${tapped}`}
                    className={`w-full max-w-xs h-14 border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-colors ${BUTTON_TEXT_CLS}`}
                  >
                    + 20G PROTEIN
                  </motion.button>
                  <p className={LABEL_CLS}>
                    {tapped === 0 ? 'TAP TO LOG' : `${tapped} LOG${tapped > 1 ? 'S' : ''} TODAY`}
                  </p>
                </div>
              )}

              {current.kind === 'pace' && (
                <div className="w-full flex flex-col items-center gap-6">
                  <MiniDashboard value={protein} target={TARGET} />
                  <div
                    className={`px-6 h-10 flex items-center ${BUTTON_TEXT_CLS} ${
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

            {/* ── CTA ── 56px tall, full width, 24px bottom margin (pb-6 on parent) */}
            {current.kind !== 'question' && (
              <button
                onClick={next}
                className={`w-full h-14 bg-foreground text-background hover:opacity-90 transition-opacity active:scale-[0.99] ${BUTTON_TEXT_CLS}`}
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
