import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Check, Apple } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/firestore';
import { calculateMacros, ActivityLevel, Goal } from '@/lib/types';
import { startTrial } from '@/lib/paywall';
import { toast } from 'sonner';

/* ============================================================
   Types & state
   ============================================================ */

type WeightUnit = 'kg' | 'lb';
type HeightUnit = 'cm' | 'ft';
type Plan = 'monthly' | 'yearly';

interface State {
  pain: string | null;
  commitment: string | null;
  goal: string | null;
  trainingDays: string | null;
  experience: string | null;
  weight: { value: number; unit: WeightUnit };
  height: { value: number; unit: HeightUnit }; // cm always, ft toggle is display-only
  birth: { m: number; d: number; y: number };
  physique: string | null;
  photoDataUrl: string | null;
  plan: Plan;
}

const today = new Date();
const initialState: State = {
  pain: null,
  commitment: null,
  goal: null,
  trainingDays: null,
  experience: null,
  weight: { value: 75, unit: 'kg' },
  height: { value: 175, unit: 'cm' },
  birth: { m: 1, d: 1, y: today.getFullYear() - 25 },
  physique: null,
  photoDataUrl: null,
  plan: 'yearly',
};

const TOTAL_PROGRESS_STEPS = 14; // screens 2..15 contribute to bar

/* ============================================================
   Primitives
   ============================================================ */

function ProgressBar({ step }: { step: number }) {
  // step is 1..16; show progress for screens 2..15
  if (step <= 1 || step === 13 || step >= 16) return null;
  const filled = Math.min(Math.max(step - 1, 0), TOTAL_PROGRESS_STEPS);
  const pct = (filled / TOTAL_PROGRESS_STEPS) * 100;
  return (
    <div className="w-full h-[2px] bg-[#EFEFEF]">
      <div
        className="h-full bg-black transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BackArrow({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 -ml-2 text-black"
      aria-label="Back"
    >
      <ArrowLeft className="w-6 h-6" strokeWidth={2.2} />
    </button>
  );
}

function PillOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-full text-[15px] font-medium transition-colors ${
        selected ? 'bg-black text-white' : 'bg-[#F5F5F5] text-black'
      }`}
    >
      {label}
    </button>
  );
}

function PrimaryCTA({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full py-4 text-[16px] font-semibold transition-colors ${
        disabled
          ? 'bg-[#E5E5E5] text-[#9A9A9A]'
          : 'bg-black text-white active:scale-[0.99]'
      }`}
    >
      {label}
    </button>
  );
}

/* ============================================================
   Scroll picker
   ============================================================ */

const ITEM_H = 44;

function ScrollPicker({
  values,
  value,
  onChange,
  format,
  width = '100%',
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  width?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, values.indexOf(value));
    el.scrollTo({ top: idx * ITEM_H, behavior: initial.current ? 'auto' : 'smooth' });
    initial.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, values.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | undefined;
    const onScroll = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        const idx = Math.round(el.scrollTop / ITEM_H);
        const v = values[Math.max(0, Math.min(values.length - 1, idx))];
        if (v !== value) onChange(v);
      }, 80);
    };
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (t) window.clearTimeout(t);
    };
  }, [values, value, onChange]);

  return (
    <div
      className="relative"
      style={{ width, height: ITEM_H * 5 }}
    >
      <div
        ref={ref}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollPaddingTop: ITEM_H * 2 }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {values.map((v) => {
          const isActive = v === value;
          return (
            <div
              key={v}
              className={`snap-center flex items-center justify-center transition-all ${
                isActive ? 'text-black font-bold text-3xl' : 'text-[#C8C8C8] text-xl'
              }`}
              style={{ height: ITEM_H }}
            >
              {format ? format(v) : v}
            </div>
          );
        })}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
      {/* Selection guides */}
      <div
        className="pointer-events-none absolute left-0 right-0 border-y border-[#EFEFEF]"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
    </div>
  );
}

/* ============================================================
   Main component
   ============================================================ */

interface Props {
  onDone: () => void | Promise<void>;
}

export default function NewOnboarding({ onDone }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<State>(initialState);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };
  const next = () => go(step + 1);
  const back = () => go(Math.max(1, step - 1));
  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  // Screen 13 auto-advance
  useEffect(() => {
    if (step !== 13) return;
    const t = window.setTimeout(() => go(14), 3000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Derived values
  const weightKg = useMemo(
    () =>
      state.weight.unit === 'kg'
        ? state.weight.value
        : Math.round(state.weight.value * 0.4536),
    [state.weight]
  );
  const proteinGoal = useMemo(
    () => Math.round((weightKg * 2.2) / 5) * 5,
    [weightKg]
  );
  const projectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }, []);

  const ageFromBirth = useMemo(() => {
    const now = new Date();
    let a = now.getFullYear() - state.birth.y;
    const beforeBirthday =
      now.getMonth() + 1 < state.birth.m ||
      (now.getMonth() + 1 === state.birth.m && now.getDate() < state.birth.d);
    if (beforeBirthday) a -= 1;
    return Math.max(13, a);
  }, [state.birth]);

  // Finish — write profile and exit
  const finish = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const goal: Goal =
        state.goal === 'Get Lean'
          ? 'recovery'
          : state.goal === 'Body Recomposition'
          ? 'equilibrium'
          : 'hypertrophy';
      const activityLevel: ActivityLevel =
        state.trainingDays?.startsWith('5') || state.trainingDays?.startsWith('7')
          ? 'active'
          : state.trainingDays?.startsWith('3')
          ? 'moderate'
          : 'recovery';

      const heightCm =
        state.height.unit === 'cm'
          ? state.height.value
          : Math.round(state.height.value * 2.54);

      const macros = calculateMacros(weightKg, activityLevel, goal);

      await createOrUpdateProfile({
        uid: user.uid,
        name: user.displayName ?? 'Athlete',
        email: user.email ?? '',
        weight: weightKg,
        height: heightCm,
        age: ageFromBirth,
        activityLevel,
        goal,
        dailyProtein: proteinGoal, // user-spec formula
        dailyCalories: macros.calories,
        dailyCarbs: macros.carbs,
        dailyFats: macros.fats,
        mealFrequency: macros.mealFrequency,
        notifications: true,
        units: state.weight.unit === 'kg' ? 'metric' : 'imperial',
      });

      // Mark all gating flags so Index drops us at the dashboard.
      try {
        localStorage.setItem(`brotein_story_seen:${user.uid}`, '1');
        localStorage.setItem(`brotein_paywall_seen:${user.uid}`, '1');
      } catch { /* noop */ }

      startTrial(user.uid);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save profile');
      setBusy(false);
    }
  };

  // Console-log on paywall screen
  useEffect(() => {
    if (step === 16) {
      // eslint-disable-next-line no-console
      console.log('[onboarding] state:', state);
    }
  }, [step, state]);

  /* ============================================================
     Screen renderers
     ============================================================ */

  const showBack = step !== 1 && step !== 13;
  const isDarkScreen = step === 13;

  const slide = {
    enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div
      className={`min-h-screen w-full flex justify-center ${
        isDarkScreen ? 'bg-[#0A0A0A]' : 'bg-white'
      }`}
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}
    >
      <div className={`w-full max-w-[390px] min-h-screen flex flex-col ${isDarkScreen ? 'text-white' : 'text-black'}`}>
        <ProgressBar step={step} />

        <div className="px-5 pt-3 h-12 flex items-center">
          {showBack && <BackArrow onClick={back} />}
        </div>

        <div className="flex-1 flex flex-col px-5 pb-6">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex-1 flex flex-col"
            >
              {step === 1 && (
                <ScreenSplash onStart={next} />
              )}

              {step === 2 && (
                <ChoiceScreen
                  title="What's holding you back right now?"
                  subtitle="Be honest. This shapes your plan."
                  options={[
                    "I'm not eating enough protein",
                    'I eat okay but can\'t see results',
                    "I'm inconsistent",
                    "I don't know where to start",
                  ]}
                  value={state.pain}
                  onChange={(v) => set('pain', v)}
                  onNext={next}
                />
              )}

              {step === 3 && (
                <ScreenValidation onNext={next} />
              )}

              {step === 4 && (
                <ChoiceScreen
                  title="How serious are you about changing this?"
                  options={[
                    'Somewhat serious',
                    'Very serious',
                    'I need to change this now ⚡',
                  ]}
                  value={state.commitment}
                  onChange={(v) => set('commitment', v)}
                  onNext={next}
                />
              )}

              {step === 5 && (
                <ChoiceScreen
                  title="What is your goal?"
                  options={['Build Muscle', 'Get Lean', 'Body Recomposition']}
                  value={state.goal}
                  onChange={(v) => set('goal', v)}
                  onNext={next}
                />
              )}

              {step === 6 && (
                <ChoiceScreen
                  title="How many days do you train per week?"
                  options={[
                    '0–2 — Just getting started',
                    '3–4 — A few times a week',
                    '5–6 — Pretty dedicated',
                    '7 — Every day',
                  ]}
                  value={state.trainingDays}
                  onChange={(v) => set('trainingDays', v)}
                  onNext={next}
                />
              )}

              {step === 7 && (
                <ChoiceScreen
                  title="Have you tracked protein before?"
                  options={[
                    'Never tried it',
                    "Tried it, didn't stick",
                    'Yes, but not consistently',
                    'Yes, consistently',
                  ]}
                  value={state.experience}
                  onChange={(v) => set('experience', v)}
                  onNext={next}
                />
              )}

              {step === 8 && (
                <ScreenWeight
                  value={state.weight}
                  onChange={(w) => set('weight', w)}
                  onNext={next}
                />
              )}

              {step === 9 && (
                <ScreenHeight
                  value={state.height}
                  onChange={(h) => set('height', h)}
                  onNext={next}
                />
              )}

              {step === 10 && (
                <ScreenAge
                  value={state.birth}
                  onChange={(b) => set('birth', b)}
                  onNext={next}
                />
              )}

              {step === 11 && (
                <ChoiceScreen
                  title="What's your dream physique?"
                  subtitle="We'll tailor your targets to match."
                  options={['Athletic', 'Muscular', 'Lean & Cut', 'Powerlifter', 'Bodybuilder']}
                  value={state.physique}
                  onChange={(v) => set('physique', v)}
                  onNext={next}
                />
              )}

              {step === 12 && (
                <ScreenPhoto
                  photo={state.photoDataUrl}
                  onPick={() => fileInputRef.current?.click()}
                  onSkip={next}
                />
              )}

              {step === 13 && <ScreenLoading />}

              {step === 14 && (
                <ScreenPlanReveal
                  weight={state.weight}
                  physique={state.physique ?? 'Athletic'}
                  protein={proteinGoal}
                  date={projectedDate}
                  onNext={next}
                />
              )}

              {step === 15 && <ScreenSocialProof onNext={next} />}

              {step === 16 && (
                <ScreenPaywall
                  plan={state.plan}
                  onPlanChange={(p) => set('plan', p)}
                  protein={proteinGoal}
                  date={projectedDate}
                  busy={busy}
                  onStart={finish}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hidden file input for screen 12 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => set('photoDataUrl', String(reader.result));
            reader.readAsDataURL(f);
          }}
        />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ============================================================
   Individual screens
   ============================================================ */

function ScreenSplash({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="flex-1 flex flex-col items-center justify-center">
        <Apple className="w-10 h-10 mb-6" strokeWidth={1.8} />
        <h1 className="text-[56px] font-black tracking-tight leading-none">BROTEIN</h1>
        <p className="mt-5 text-[15px] text-[#6B6B6B] max-w-[260px]">
          Built for guys who are serious about muscle.
        </p>
      </div>
      <PrimaryCTA label="Start Building" onClick={onStart} />
    </div>
  );
}

function ChoiceScreen({
  title,
  subtitle,
  options,
  value,
  onChange,
  onNext,
}: {
  title: string;
  subtitle?: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-[15px] text-[#6B6B6B]">{subtitle}</p>
      )}
      <div className="mt-8 space-y-3">
        {options.map((opt) => (
          <PillOption
            key={opt}
            label={opt}
            selected={value === opt}
            onClick={() => onChange(value === opt ? null : opt)}
          />
        ))}
      </div>
      <div className="flex-1" />
      <PrimaryCTA label="Continue" onClick={onNext} disabled={!value} />
    </div>
  );
}

function ScreenValidation({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-[26px] font-bold leading-[1.2] tracking-tight">
          Most guys in your position gain{' '}
          <span className="underline decoration-2 underline-offset-4">4–6kg of muscle</span> in 90 days once they fix their protein.
        </p>
        <p className="mt-5 text-[13px] text-[#6B6B6B]">Based on Brotein user data.</p>
      </div>
      <PrimaryCTA label="That could be me →" onClick={onNext} />
    </div>
  );
}

function ScreenWeight({
  value,
  onChange,
  onNext,
}: {
  value: State['weight'];
  onChange: (v: State['weight']) => void;
  onNext: () => void;
}) {
  const range = value.unit === 'kg'
    ? Array.from({ length: 161 }, (_, i) => i + 40) // 40-200
    : Array.from({ length: 351 }, (_, i) => i + 80); // 80-430 lb

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">How much do you weigh?</h1>
          <p className="mt-2 text-[15px] text-[#6B6B6B]">Used to calculate your protein target.</p>
        </div>
        <UnitToggle
          left="kg"
          right="lb"
          value={value.unit}
          onChange={(u) => {
            // Convert when switching units
            const v =
              u === 'kg' && value.unit === 'lb'
                ? Math.round(value.value * 0.4536)
                : u === 'lb' && value.unit === 'kg'
                ? Math.round(value.value * 2.2046)
                : value.value;
            onChange({ value: v, unit: u as WeightUnit });
          }}
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ScrollPicker
          values={range}
          value={value.value}
          onChange={(v) => onChange({ ...value, value: v })}
          format={(v) => `${v} ${value.unit}`}
        />
      </div>
      <PrimaryCTA label="Continue" onClick={onNext} />
    </div>
  );
}

function ScreenHeight({
  value,
  onChange,
  onNext,
}: {
  value: State['height'];
  onChange: (v: State['height']) => void;
  onNext: () => void;
}) {
  const range = value.unit === 'cm'
    ? Array.from({ length: 121 }, (_, i) => i + 130) // 130-250
    : Array.from({ length: 49 }, (_, i) => i + 48); // 48-96 inches

  const format = (v: number) =>
    value.unit === 'cm'
      ? `${v} cm`
      : `${Math.floor(v / 12)}'${v % 12}"`;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">How tall are you?</h1>
        <UnitToggle
          left="cm"
          right="ft"
          value={value.unit}
          onChange={(u) => {
            const v =
              u === 'cm' && value.unit === 'ft'
                ? Math.round(value.value * 2.54)
                : u === 'ft' && value.unit === 'cm'
                ? Math.round(value.value / 2.54)
                : value.value;
            onChange({ value: v, unit: u as HeightUnit });
          }}
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ScrollPicker
          values={range}
          value={value.value}
          onChange={(v) => onChange({ ...value, value: v })}
          format={format}
        />
      </div>
      <PrimaryCTA label="Continue" onClick={onNext} />
    </div>
  );
}

function ScreenAge({
  value,
  onChange,
  onNext,
}: {
  value: State['birth'];
  onChange: (v: State['birth']) => void;
  onNext: () => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1940 + 1 }, (_, i) => 1940 + i);
  const monthName = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">When were you born?</h1>
      <div className="flex-1 flex items-center justify-center gap-2">
        <ScrollPicker
          values={months}
          value={value.m}
          onChange={(m) => onChange({ ...value, m })}
          format={monthName}
          width={110}
        />
        <ScrollPicker
          values={days}
          value={value.d}
          onChange={(d) => onChange({ ...value, d })}
          width={70}
        />
        <ScrollPicker
          values={years}
          value={value.y}
          onChange={(y) => onChange({ ...value, y })}
          width={110}
        />
      </div>
      <PrimaryCTA label="Continue" onClick={onNext} />
    </div>
  );
}

function ScreenPhoto({
  photo,
  onPick,
  onSkip,
}: {
  photo: string | null;
  onPick: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">
        See your transformation before it happens.
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">
        Take a starting photo. Our AI will show your projected physique after 90 days of hitting your protein goal.
      </p>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full aspect-[3/4] max-h-[420px] rounded-3xl border-2 border-dashed border-[#D6D6D6] flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt="Starting" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-12 h-12 text-[#B5B5B5]" strokeWidth={1.8} />
          )}
        </div>
      </div>
      <div className="space-y-3">
        <PrimaryCTA label={photo ? 'Continue' : 'Take Photo'} onClick={photo ? onSkip : onPick} />
        {!photo && (
          <button
            onClick={onSkip}
            className="w-full text-center text-[14px] text-[#6B6B6B] py-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

function ScreenLoading() {
  const messages = [
    'Analyzing your body type...',
    'Calculating protein targets...',
    'Estimating muscle potential...',
    'Mapping your 90-day trajectory...',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIdx((i) => (i + 1) % messages.length), 750);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <h1 className="text-[26px] font-bold tracking-tight">Building your muscle plan...</h1>
      <div className="mt-10 w-full h-[3px] bg-white/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full"
          style={{
            width: '100%',
            transform: 'translateX(-100%)',
            animation: 'fill 3s linear forwards',
          }}
        />
      </div>
      <p className="mt-6 text-[14px] text-white/70">{messages[idx]}</p>
      <style>{`@keyframes fill { from { transform: translateX(-100%);} to { transform: translateX(0);} }`}</style>
    </div>
  );
}

function ScreenPlanReveal({
  weight,
  physique,
  protein,
  date,
  onNext,
}: {
  weight: State['weight'];
  physique: string;
  protein: number;
  date: string;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">
        🔥 Your Muscle Plan is Ready
      </h1>
      <div className="mt-6 rounded-3xl bg-[#F5F5F5] p-6">
        <div className="flex justify-between text-[15px]">
          <span className="text-[#6B6B6B]">Current weight</span>
          <span className="font-semibold">{weight.value} {weight.unit}</span>
        </div>
        <div className="flex justify-between text-[15px] mt-3">
          <span className="text-[#6B6B6B]">Goal</span>
          <span className="font-semibold">{physique}</span>
        </div>
        <div className="h-px bg-[#E2E2E2] my-5" />
        <div className="text-center">
          <div className="text-[56px] font-black leading-none tracking-tight">{protein}g</div>
          <div className="mt-2 text-[13px] uppercase tracking-wider text-[#6B6B6B]">
            Daily Protein Goal
          </div>
        </div>
        <div className="h-px bg-[#E2E2E2] my-5" />
        <p className="text-center text-[15px] font-medium">
          Projected gain: <span className="font-bold">+5kg by {date}</span>
        </p>
      </div>
      <p className="mt-5 text-center text-[13px] italic text-[#6B6B6B]">
        89% of guys with your profile hit their goal within 90 days.
      </p>
      <div className="flex-1" />
      <PrimaryCTA label="See My Full Plan" onClick={onNext} />
    </div>
  );
}

function ScreenSocialProof({ onNext }: { onNext: () => void }) {
  const cards = [
    { initials: 'JK', name: 'Jake, 24', goal: 'Wanted to get muscular.', quote: 'Hit 190g protein for 60 days straight. Up 4kg.' },
    { initials: 'MR', name: 'Marcus, 28', goal: 'Stuck for 2 years.', quote: 'Finally figured out my protein.' },
    { initials: 'TM', name: 'Tom, 22', goal: 'Didn\'t think tracking would work.', quote: 'Now I can\'t stop.' },
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">
        Guys like you are already building.
      </h1>
      <div className="mt-6 space-y-3">
        {cards.map((c) => (
          <div key={c.initials} className="rounded-2xl bg-[#F5F5F5] p-4 flex gap-3">
            <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-bold text-[13px] shrink-0">
              {c.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[14px]">{c.name}</p>
                <p className="text-[12px]">⭐⭐⭐⭐⭐</p>
              </div>
              <p className="text-[13px] text-[#6B6B6B] mt-0.5">{c.goal}</p>
              <p className="text-[13px] mt-1">{c.quote}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[13px] text-[#6B6B6B]">
        2.3M bros tracking with Brotein
      </p>
      <div className="flex-1" />
      <PrimaryCTA label="Join Them" onClick={onNext} />
    </div>
  );
}

function ScreenPaywall({
  plan,
  onPlanChange,
  protein,
  date,
  busy,
  onStart,
}: {
  plan: Plan;
  onPlanChange: (p: Plan) => void;
  protein: number;
  date: string;
  busy: boolean;
  onStart: () => void;
}) {
  const features = [
    'AI Food Scanner',
    'Protein & Macro Tracking',
    'Physique Progress Photos',
    '90-Day Muscle Plan',
    'Bros Leaderboard',
    'Daily Accountability',
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">
        Start your 90-day transformation
      </h1>
      <p className="mt-3 text-[14px] text-[#6B6B6B]">
        Your protein target: <span className="text-black font-semibold">{protein}g/day</span> · Your goal:{' '}
        <span className="text-black font-semibold">+5kg by {date}</span>
      </p>

      {/* Plan toggle */}
      <div className="mt-6 bg-[#F5F5F5] rounded-full p-1 flex">
        {(['monthly', 'yearly'] as Plan[]).map((p) => (
          <button
            key={p}
            onClick={() => onPlanChange(p)}
            className={`flex-1 py-2.5 rounded-full text-[14px] font-semibold capitalize transition-colors ${
              plan === p ? 'bg-black text-white' : 'text-black'
            }`}
          >
            {p}
            {p === 'yearly' && (
              <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                plan === 'yearly' ? 'bg-white text-black' : 'bg-black text-white'
              }`}>
                Save 67%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pricing card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={plan}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="mt-4 rounded-2xl border border-[#EAEAEA] p-5 text-center"
        >
          {plan === 'yearly' ? (
            <>
              <div className="text-[22px] font-bold">$29.99/year</div>
              <div className="text-[13px] text-[#6B6B6B] mt-1">$2.49/mo · billed annually</div>
            </>
          ) : (
            <>
              <div className="text-[22px] font-bold">$7.99/month</div>
              <div className="text-[13px] text-[#6B6B6B] mt-1">Billed monthly</div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <ul className="mt-5 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-[14px]">
            <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <PrimaryCTA
        label={busy ? 'Starting…' : 'Start Free Trial — No payment today'}
        onClick={onStart}
        disabled={busy}
      />
      <p className="mt-3 text-center text-[12px] text-[#6B6B6B]">
        Cancel anytime. Billed after 7-day trial.
      </p>
      <button className="mt-2 w-full text-center text-[13px] text-[#6B6B6B] underline py-1">
        Restore Purchase
      </button>
    </div>
  );
}

/* ============================================================
   Misc
   ============================================================ */

function UnitToggle({
  left,
  right,
  value,
  onChange,
}: {
  left: string;
  right: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-[#F5F5F5] rounded-full p-1 flex text-[12px] font-semibold">
      {[left, right].map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className={`px-3 py-1.5 rounded-full transition-colors ${
            value === u ? 'bg-black text-white' : 'text-black'
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
