import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Apple, Shield, Bell, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/firestore';
import { calculateMacros, ActivityLevel, Goal } from '@/lib/types';
import { startTrial } from '@/lib/paywall';
import { tapHaptic, mediumHaptic, heavyHaptic, successHaptic, selectionHaptic, isNative } from '@/lib/native';
import { LocalNotifications } from '@capacitor/local-notifications';
import { InAppReview } from '@capacitor-community/in-app-review';
import { toast } from 'sonner';

/* ============================================================
   Types & state
   ============================================================ */

type WeightUnit = 'kg' | 'lb';
type HeightUnit = 'cm' | 'ft';
type Plan = 'monthly' | 'yearly';
type Pace = 'slow' | 'recommended' | 'aggressive';

interface State {
  pain: string | null;
  commitment: string | null;
  goal: string | null;
  pace: Pace;
  trainingDays: string | null;
  experience: string | null;
  trainingStyle: string | null;
  motivation: string | null;
  diet: string | null;
  deepMotivation: string | null;
  weight: { value: number; unit: WeightUnit };
  height: { value: number; unit: HeightUnit };
  birth: { m: number; d: number; y: number };
  physique: string | null;
  plan: Plan;
}

const today = new Date();
const initialState: State = {
  pain: null,
  commitment: null,
  goal: null,
  pace: 'recommended',
  trainingDays: null,
  experience: null,
  trainingStyle: null,
  motivation: null,
  diet: null,
  deepMotivation: null,
  weight: { value: 75, unit: 'kg' },
  height: { value: 175, unit: 'cm' },
  birth: { m: 1, d: 1, y: today.getFullYear() - 25 },
  physique: null,
  plan: 'yearly',
};

/* ============================================================
   Flow constants
   ============================================================ */

// 27 total screens.
const TOTAL_SCREENS = 27;
const LOADING_STEP = 22;
const SIGNIN_STEP = 24;
const PAYWALL_STEP = 25;
const NOTIF_STEP = 26;
const RATING_STEP = 27;
const DARK_STEPS = new Set([8, LOADING_STEP]); // Dark proof + loading
const HIDE_PROGRESS = new Set([1, LOADING_STEP, SIGNIN_STEP, PAYWALL_STEP, NOTIF_STEP, RATING_STEP]);
const HIDE_BACK = new Set([1, LOADING_STEP, SIGNIN_STEP, PAYWALL_STEP, NOTIF_STEP, RATING_STEP]);

const MONO = '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/* ============================================================
   Primitives
   ============================================================ */

function ProgressBar({ step }: { step: number }) {
  if (HIDE_PROGRESS.has(step)) return null;
  const pct = Math.min(100, (step / TOTAL_SCREENS) * 100);
  return (
    <div className="w-full h-[2px] bg-[#EFEFEF]">
      <div
        className="h-full bg-black transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BackArrow({ onClick, dark }: { onClick: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 -ml-2 ${dark ? 'text-white' : 'text-black'}`}
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
      onClick={() => { void tapHaptic(); onClick(); }}
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
  variant = 'light',
  haptic = 'medium',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'light' | 'dark';
  haptic?: 'medium' | 'success';
}) {
  const enabled = !disabled;
  const enabledCls =
    variant === 'dark'
      ? 'bg-white text-black active:scale-[0.99]'
      : 'bg-black text-white active:scale-[0.99]';
  const disabledCls =
    variant === 'dark'
      ? 'bg-white/20 text-white/50'
      : 'bg-[#E5E5E5] text-[#9A9A9A]';
  return (
    <button
      onClick={() => {
        if (disabled) return;
        if (haptic === 'success') void successHaptic();
        else void mediumHaptic();
        onClick();
      }}
      disabled={disabled}
      className={`w-full rounded-full py-4 text-[16px] font-semibold transition-colors ${
        enabled ? enabledCls : disabledCls
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
const PICKER_VISIBLE_ITEMS = 5;

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
  const lastIdxRef = useRef(Math.max(0, values.indexOf(value)));

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
    let frame: number | undefined;
    let settle: number | undefined;
    lastIdxRef.current = Math.max(0, values.indexOf(value));

    const updateSelection = (commit: boolean) => {
      const liveIdx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, liveIdx));
      if (clamped !== lastIdxRef.current) {
        lastIdxRef.current = clamped;
        void selectionHaptic();
      }
      if (commit) {
        const v = values[clamped];
        if (v !== value) onChange(v);
      }
    };

    const onScroll = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => updateSelection(false));
      if (settle) window.clearTimeout(settle);
      settle = window.setTimeout(() => updateSelection(true), 64);
    };

    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (settle) window.clearTimeout(settle);
    };
  }, [values, value, onChange]);

  return (
    <div className="relative" style={{ width, height: ITEM_H * PICKER_VISIBLE_ITEMS }}>
      <div
        ref={ref}
        className="h-full overflow-y-scroll no-scrollbar touch-pan-y overscroll-contain"
        style={{
          scrollPaddingTop: ITEM_H * 2,
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity',
        }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {values.map((v) => {
          const isActive = v === value;
          return (
            <div
              key={v}
              className={`flex items-center justify-center transition-all duration-100 ${
                isActive ? 'text-black font-bold text-3xl' : 'text-[#C8C8C8] text-xl'
              }`}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            >
              {format ? format(v) : v}
            </div>
          );
        })}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
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
  initialStep?: number;
}

const ONBOARDING_AUTH_RESUME_KEY = 'brotein_onboarding_auth_resume';

const PACE_LABEL: Record<Pace, string> = {
  slow: '0.25 kg/week — Slow & steady',
  recommended: '0.5 kg/week — Recommended',
  aggressive: '1 kg/week — Aggressive',
};

export default function NewOnboarding({ onDone, initialStep = 1 }: Props) {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<State>(initialState);
  const [busy, setBusy] = useState(false);
  const savedProfileRef = useRef(false);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  const next = () => go(step + 1);
  const back = () => go(Math.max(1, step - 1));
  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  // Loading auto-advance
  useEffect(() => {
    if (step !== LOADING_STEP) return;
    const t = window.setTimeout(() => go(LOADING_STEP + 1), 3000);
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
  const heightCm = useMemo(
    () =>
      state.height.unit === 'cm'
        ? state.height.value
        : Math.round(state.height.value * 2.54),
    [state.height]
  );
  const proteinGoal = useMemo(
    () => Math.round((weightKg * 2.2) / 5) * 5,
    [weightKg]
  );
  const caloriesGoal = useMemo(() => proteinGoal * 4 + 800, [proteinGoal]);
  const carbsGoal = useMemo(() => Math.round(weightKg * 3), [weightKg]);
  const fatsGoal = useMemo(() => Math.round(weightKg * 0.8), [weightKg]);

  const goalDateLong = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);
  const goalDateShort = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }, []);

  const ageFromBirth = useMemo(() => {
    const now = new Date();
    let a = now.getFullYear() - state.birth.y;
    const before =
      now.getMonth() + 1 < state.birth.m ||
      (now.getMonth() + 1 === state.birth.m && now.getDate() < state.birth.d);
    if (before) a -= 1;
    return Math.max(13, a);
  }, [state.birth]);

  const birthdateISO = useMemo(() => {
    const m = String(state.birth.m).padStart(2, '0');
    const d = String(state.birth.d).padStart(2, '0');
    return `${state.birth.y}-${m}-${d}`;
  }, [state.birth]);

  // Console-log full user object on paywall
  useEffect(() => {
    if (step !== PAYWALL_STEP) return;
    // eslint-disable-next-line no-console
    console.log('[onboarding] user object:', {
      painPoint: state.pain,
      commitmentLevel: state.commitment,
      goal: state.goal,
      pace: state.pace,
      trainingDays: state.trainingDays,
      proteinHistory: state.experience,
      trainingStyle: state.trainingStyle,
      motivation: state.motivation,
      diet: state.diet,
      deepMotivation: state.deepMotivation,
      weightKg,
      heightCm,
      birthdate: birthdateISO,
      dreamPhysique: state.physique,
      calculatedProtein: proteinGoal,
      calculatedCalories: caloriesGoal,
      calculatedCarbs: carbsGoal,
      calculatedFats: fatsGoal,
      goalDate: goalDateLong,
    });
  }, [step, state, weightKg, heightCm, birthdateISO, proteinGoal, caloriesGoal, carbsGoal, fatsGoal, goalDateLong]);

  // Persist the calculated profile to Firestore. Safe to call multiple times — guarded
  // by savedProfileRef so we only write once per onboarding session.
  const saveProfile = async (): Promise<boolean> => {
    if (!user) return false;
    if (savedProfileRef.current) return true;
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
        dailyProtein: proteinGoal,
        dailyCalories: caloriesGoal,
        dailyCarbs: carbsGoal,
        dailyFats: fatsGoal,
        mealFrequency: macros.mealFrequency,
        notifications: true,
        units: state.weight.unit === 'kg' ? 'metric' : 'imperial',
      });
      savedProfileRef.current = true;
      await refreshProfile();
      return true;
    } catch (e) {
      console.error('saveProfile failed', e);
      toast.error(e instanceof Error ? e.message : 'Could not save profile');
      return false;
    }
  };

  // When the paywall mounts: persist the profile (so macros land in Firestore even if
  // the user later skips), then check for an existing entitlement and bypass paywall.
  useEffect(() => {
    if (step !== PAYWALL_STEP) return;
    let cancelled = false;
    void (async () => {
      await saveProfile();
      try {
        const { hasProEntitlement } = await import('@/lib/iap');
        if (cancelled) return;
        if (await hasProEntitlement()) void complete();
      } catch { /* ignore — show paywall */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user]);

  // Tapped "Start 7-Day Free Trial" — attempt native purchase, then complete onboarding.
  const startTrialAndAdvance = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveProfile();
      try {
        const { purchasePlan } = await import('@/lib/iap');
        await purchasePlan(state.plan === 'yearly' ? 'annual' : 'monthly');
      } catch (e) {
        console.warn('Native purchase unavailable / failed', e);
      }
      if (user) startTrial(user.uid);
      void complete();
    } finally {
      setBusy(false);
    }
  };

  // Final completion after notifications + rating screens.
  const complete = async () => {
    await saveProfile();
    try {
      sessionStorage.removeItem(ONBOARDING_AUTH_RESUME_KEY);
      if (user) {
        localStorage.setItem(`brotein_story_seen:${user.uid}`, '1');
        localStorage.setItem(`brotein_paywall_seen:${user.uid}`, '1');
      }
    } catch { /* noop */ }
    await onDone();
  };

  /* ============================================================
     Render
     ============================================================ */

  const showBack = !HIDE_BACK.has(step);
  const isDark = DARK_STEPS.has(step);

  const slide = {
    enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div
      className={`w-full flex justify-center ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        minHeight: '100dvh',
      }}
    >
      <div
        className={`w-full max-w-[390px] flex flex-col ${isDark ? 'text-white' : 'text-black'}`}
        style={{
          minHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ProgressBar step={step} />

        <div className="px-5 pt-3 h-12 flex items-center shrink-0">
          {showBack && <BackArrow onClick={back} dark={isDark} />}
        </div>

        <div className="flex-1 flex flex-col px-5 pb-6 min-h-0">

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
              {step === 1 && <ScreenSplash onStart={next} />}

              {step === 2 && (
                <ChoiceScreen
                  title="What's holding you back right now?"
                  subtitle="Be honest. This shapes your plan."
                  options={[
                    "I'm not eating enough protein",
                    "I eat okay but can't see results",
                    "I'm inconsistent",
                    "I don't know where to start",
                  ]}
                  value={state.pain}
                  onChange={(v) => set('pain', v)}
                  onNext={next}
                />
              )}

              {step === 3 && <ScreenValidation onNext={next} />}

              {step === 4 && (
                <ChoiceScreen
                  title="How serious are you about changing this?"
                  options={['Somewhat serious', 'Very serious', 'I need to change this now ⚡']}
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

              {step === 6 && <ScreenRealisticTarget onNext={next} />}

              {step === 7 && (
                <ScreenPace
                  value={state.pace}
                  onChange={(p) => set('pace', p)}
                  onNext={next}
                />
              )}

              {step === 8 && <ScreenDarkProof onNext={() => go(10)} />}

              {step === 10 && (
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

              {step === 11 && (
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

              {step === 12 && (
                <ChoiceScreen
                  title="What's your training style?"
                  subtitle="This shapes your protein target."
                  options={[
                    'Mostly lifting — I want to get bigger',
                    'Lifting + cardio — I want to lean out',
                    'Cardio focused — I want to stay athletic',
                    "Just starting out — I'm new to training",
                  ]}
                  value={state.trainingStyle}
                  onChange={(v) => set('trainingStyle', v)}
                  onNext={next}
                />
              )}

              {step === 13 && (
                <ChoiceScreen
                  title="One more thing — why does this matter to you?"
                  subtitle="Be real. This shapes everything."
                  options={[
                    'I want to look better with my shirt off',
                    'I want to feel stronger and more confident',
                    'I want to stay consistent and build a habit',
                    'I want to prove something to myself',
                  ]}
                  value={state.motivation}
                  onChange={(v) => set('motivation', v)}
                  onNext={next}
                />
              )}

              {step === 14 && (
                <ChoiceScreen
                  title="Do you follow a specific diet?"
                  subtitle="We'll make sure your plan works with how you eat."
                  options={[
                    'No specific diet — I eat everything',
                    'High protein / carnivore',
                    'Vegetarian',
                    'Vegan',
                    'Intermittent fasting',
                  ]}
                  value={state.diet}
                  onChange={(v) => set('diet', v)}
                  onNext={next}
                />
              )}

              {step === 15 && (
                <ChoiceScreen
                  title="What would you like to accomplish?"
                  subtitle="Beyond just the physical."
                  options={[
                    'Look better and feel more attractive',
                    'Feel stronger and more capable',
                    'Build discipline and consistency',
                    'Prove something to myself',
                    'Feel better day to day — energy, mood, confidence',
                  ]}
                  value={state.deepMotivation}
                  onChange={(v) => set('deepMotivation', v)}
                  onNext={next}
                />
              )}

              {step === 16 && (
                <ScreenWeight
                  value={state.weight}
                  onChange={(w) => set('weight', w)}
                  onNext={next}
                />
              )}

              {step === 17 && (
                <ScreenHeight
                  value={state.height}
                  onChange={(h) => set('height', h)}
                  onNext={next}
                />
              )}

              {step === 18 && (
                <ScreenAge
                  value={state.birth}
                  onChange={(b) => set('birth', b)}
                  onNext={next}
                />
              )}

              {step === 19 && (
                <ChoiceScreen
                  title="What's your dream physique?"
                  subtitle="We'll tailor your targets to match."
                  options={['Athletic', 'Muscular', 'Lean & Cut', 'Powerlifter', 'Bodybuilder']}
                  value={state.physique}
                  onChange={(v) => set('physique', v)}
                  onNext={next}
                />
              )}

              {step === 20 && <ScreenTimeline onNext={next} />}

              {step === 21 && <ScreenThankYou onNext={next} />}

              {step === LOADING_STEP && <ScreenLoading />}

              {step === 23 && (
                <ScreenPlanReveal
                  name={user?.displayName ?? null}
                  protein={proteinGoal}
                  calories={caloriesGoal}
                  carbs={carbsGoal}
                  fats={fatsGoal}
                  goalDate={goalDateLong}
                  pace={PACE_LABEL[state.pace]}
                  onNext={next}
                />
              )}

              {step === SIGNIN_STEP && <ScreenSignIn onNext={() => go(NOTIF_STEP)} protein={proteinGoal} calories={caloriesGoal} goalDate={goalDateLong} pace={PACE_LABEL[state.pace]} />}

              {step === NOTIF_STEP && (
                <ScreenNotifications
                  onAllow={async () => {
                    try {
                      if (isNative()) {
                        await LocalNotifications.requestPermissions();
                      }
                    } catch (e) {
                      console.warn('requestPermissions failed', e);
                    }
                    go(RATING_STEP);
                  }}
                  onSkip={() => go(RATING_STEP)}
                />
              )}

              {step === RATING_STEP && (
                <ScreenRating
                  onRate={async () => {
                    try {
                      if (isNative()) {
                        await InAppReview.requestReview();
                      }
                    } catch (e) {
                      console.warn('requestReview failed', e);
                    }
                    go(PAYWALL_STEP);
                  }}
                  onSkip={() => go(PAYWALL_STEP)}
                />
              )}

              {step === PAYWALL_STEP && (
                <ScreenPaywall
                  plan={state.plan}
                  onPlanChange={(p) => set('plan', p)}
                  protein={proteinGoal}
                  calories={caloriesGoal}
                  goalDate={goalDateShort}
                  pace={PACE_LABEL[state.pace]}
                  busy={busy}
                  onStart={startTrialAndAdvance}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
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
  const pills = ['195g tracked today', '🔥 14 day streak', '+3.2kg gained'];
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <h1 className="text-[56px] font-black tracking-tight leading-none" style={{ fontFamily: MONO }}>BROTEIN</h1>
        <p className="mt-5 text-[15px] text-[#6B6B6B] max-w-[260px]">
          Built for serious muscle growth.
        </p>
        <div className="mt-6 w-[80%] h-px bg-[#EFEFEF]" />
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {pills.map((p) => (
            <div
              key={p}
              className="bg-[#F5F5F5] text-black text-[12px] font-medium"
              style={{ padding: '6px 12px', borderRadius: 20 }}
            >
              {p}
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] italic text-[#6B6B6B]">
          Built for guys serious about building.
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
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>{title}</h1>
      {subtitle && <p className="mt-3 text-[15px] text-[#6B6B6B]">{subtitle}</p>}
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
          Fixing your protein intake is the{' '}
          <span className="underline decoration-2 underline-offset-4">single highest-leverage change</span> for muscle growth.
        </p>
      </div>
      <PrimaryCTA label="That could be me →" onClick={onNext} />
    </div>
  );
}

/* ---------- Screen A ---------- */
function ScreenRealisticTarget({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        That's a realistic target.
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">It's not hard at all.</p>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-[24px] font-bold leading-[1.25] tracking-tight">
          Most lifters who fail to grow are simply under-eating protein. Consistency fixes it.
        </p>
      </div>
      <PrimaryCTA label="Let's keep going →" onClick={onNext} />
    </div>
  );
}

/* ---------- Screen B ---------- */
function ScreenPace({
  value,
  onChange,
  onNext,
}: {
  value: Pace;
  onChange: (p: Pace) => void;
  onNext: () => void;
}) {
  const stops: { id: Pace; label: string; info: string }[] = [
    { id: 'slow', label: '0.25 kg/wk\nSlow & steady', info: 'Easier to maintain. Lower risk of fat gain.' },
    { id: 'recommended', label: '0.5 kg/wk\nRecommended', info: 'Optimal balance of muscle gain and recovery.' },
    { id: 'aggressive', label: '1 kg/wk\nAggressive', info: 'Requires very high protein consistency.' },
  ];
  const idx = stops.findIndex((s) => s.id === value);
  const current = stops[idx];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        How fast do you want to get there?
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">You control the pace.</p>

      <div className="mt-12 relative">
        {/* Recommended badge above middle stop */}
        <div className="absolute -top-6 left-0 right-0 flex justify-center">
          <div
            className="text-[10px] font-bold tracking-wider text-white bg-black px-2 py-1 rounded-full"
            style={{ marginLeft: 0 }}
          >
            RECOMMENDED
          </div>
        </div>
        {/* Track */}
        <div className="relative h-[2px] bg-[#EFEFEF] mx-3">
          <div
            className="absolute top-0 left-0 h-full bg-black transition-all"
            style={{ width: `${(idx / 2) * 100}%` }}
          />
        </div>
        {/* Stops */}
        <div className="relative -mt-[7px] flex justify-between mx-0">
          {stops.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i <= idx ? 'bg-black border-black' : 'bg-white border-[#D5D5D5]'
              }`}
              aria-label={s.id}
            />
          ))}
        </div>
        {/* Labels */}
        <div className="mt-4 flex justify-between text-[11px] text-[#6B6B6B] text-center whitespace-pre-line">
          {stops.map((s) => (
            <div key={s.id} className="w-[30%]">{s.label}</div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-[#F5F5F5] p-5">
        <p className="text-[14px] text-black">{current.info}</p>
      </div>

      <div className="flex-1" />
      <PrimaryCTA label="Continue" onClick={onNext} />
    </div>
  );
}

/* ---------- Screen C (dark proof) ---------- */
function ScreenDarkProof({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col text-white">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        Tracking protein beats guessing.
      </h1>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-2 gap-3 items-stretch">
          <div className="rounded-2xl bg-[#1A1A1A] p-5 text-center flex flex-col justify-center min-h-[140px]">
            <div className="text-[10px] tracking-wider text-white/60 font-semibold">WITHOUT BROTEIN</div>
            <div className="mt-3 text-[22px] font-black leading-tight tracking-tight">GUESSING</div>
            <div className="text-[11px] text-white/60 mt-2">Hit-or-miss days</div>
          </div>
          <div className="rounded-2xl bg-white text-black p-5 text-center shadow-[0_0_30px_rgba(255,255,255,0.1)] flex flex-col justify-center min-h-[140px]">
            <div className="text-[10px] tracking-wider text-black/60 font-semibold">WITH BROTEIN</div>
            <div className="mt-3 text-[22px] font-black leading-tight tracking-tight">TRACKING</div>
            <div className="text-[11px] text-black/60 mt-2">Hit the number daily</div>
          </div>
        </div>
      </div>
      <PrimaryCTA label="Let's track it" onClick={onNext} variant="dark" />
    </div>
  );
}

/* ---------- Screen F (timeline) ---------- */
function ScreenTimeline({ onNext }: { onNext: () => void }) {
  const cards = [
    { title: 'WEEK 1–2', body: 'The scale might not move much. Your body is adapting. This is normal.' },
    { title: 'WEEK 3–4', body: "Protein synthesis increases. You'll start feeling fuller and stronger." },
    { title: 'MONTH 2–3', body: 'Visible muscle changes. This is where most guys see the biggest shift.' },
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        Here's what to expect.
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">Honesty matters more than hype.</p>
      <div className="mt-7 space-y-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl bg-[#F5F5F5] p-5">
            <div className="text-[12px] font-bold tracking-wider" style={{ fontFamily: MONO }}>{c.title}</div>
            <p className="mt-2 text-[14px] text-[#3A3A3A] leading-snug">{c.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[13px] font-bold">
        Stick with it past week 2. That's where most guys quit.
      </p>
      <div className="flex-1" />
      <PrimaryCTA label="I'm ready" onClick={onNext} />
    </div>
  );
}

/* ---------- Screen G (thank you / privacy) ---------- */
function ScreenThankYou({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        Thank you for trusting us.
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">Now let's personalize Brotein for you.</p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <Shield className="w-16 h-16" strokeWidth={1.5} />
        <div className="mt-8 w-full rounded-2xl bg-[#F5F5F5] p-5">
          <p className="text-[14px] text-[#3A3A3A] leading-snug text-center">
            Your privacy matters. We never sell your data. Everything you share is used only to build your plan.
          </p>
        </div>
      </div>
      <PrimaryCTA label="Build My Plan" onClick={onNext} />
    </div>
  );
}

/* ---------- Weight / Height / Age ---------- */

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
    ? Array.from({ length: 161 }, (_, i) => i + 40)
    : Array.from({ length: 351 }, (_, i) => i + 80);
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>How much do you weigh?</h1>
          <p className="mt-2 text-[15px] text-[#6B6B6B]">Used to calculate your protein target.</p>
        </div>
        <UnitToggle
          left="kg"
          right="lb"
          value={value.unit}
          onChange={(u) => {
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
    ? Array.from({ length: 121 }, (_, i) => i + 130)
    : Array.from({ length: 49 }, (_, i) => i + 48);
  const format = (v: number) =>
    value.unit === 'cm' ? `${v} cm` : `${Math.floor(v / 12)}'${v % 12}"`;
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>How tall are you?</h1>
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
  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>When were you born?</h1>
      <div className="flex-1 flex items-center justify-center gap-2">
        <ScrollPicker values={months} value={value.m} onChange={(m) => onChange({ ...value, m })} format={monthName} width={110} />
        <ScrollPicker values={days} value={value.d} onChange={(d) => onChange({ ...value, d })} width={70} />
        <ScrollPicker values={years} value={value.y} onChange={(y) => onChange({ ...value, y })} width={110} />
      </div>
      <PrimaryCTA label="Continue" onClick={onNext} />
    </div>
  );
}

/* ---------- Loading ---------- */
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
    const t25 = window.setTimeout(() => { void tapHaptic(); }, 750);
    const t50 = window.setTimeout(() => { void tapHaptic(); }, 1500);
    const t75 = window.setTimeout(() => { void mediumHaptic(); }, 2250);
    const done = window.setTimeout(() => {
      void heavyHaptic();
      window.setTimeout(() => { void successHaptic(); }, 80);
    }, 3000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(t25); window.clearTimeout(t50); window.clearTimeout(t75);
      window.clearTimeout(done);
    };
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <h1 className="text-[24px] font-bold tracking-tight uppercase" style={{ fontFamily: MONO }}>Building your muscle plan...</h1>
      <div className="mt-10 w-full h-[3px] bg-white/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full"
          style={{ width: '100%', transform: 'translateX(-100%)', animation: 'fill 3s linear forwards' }}
        />
      </div>
      <p className="mt-6 text-[14px] text-white/70">{messages[idx]}</p>
      <style>{`@keyframes fill { from { transform: translateX(-100%);} to { transform: translateX(0);} }`}</style>
    </div>
  );
}

/* ---------- Screen H: Plan reveal dashboard ---------- */
function ScreenPlanReveal({
  name,
  protein,
  calories,
  carbs,
  fats,
  goalDate,
  pace,
  onNext,
}: {
  name: string | null;
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  goalDate: string;
  pace: string;
  onNext: () => void;
}) {
  useEffect(() => { void heavyHaptic(); }, []);
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
        <h1 className="mt-4 text-[24px] font-bold tracking-tight uppercase text-center" style={{ fontFamily: MONO }}>
          Your muscle plan is ready.
        </h1>
      </div>

      <div className="mt-6 rounded-3xl bg-black text-white p-6">
        <div className="text-[12px] tracking-wider text-white/60 font-semibold" style={{ fontFamily: MONO }}>
          {name ? name.toUpperCase() : 'YOUR PLAN'}
        </div>

        <div className="mt-5 text-center">
          <div className="text-[64px] font-black leading-none tracking-tight">{protein}</div>
          <div className="mt-2 text-[11px] uppercase tracking-wider text-white/60" style={{ fontFamily: MONO }}>
            g protein / day
          </div>
        </div>

        <div className="h-px bg-white/15 my-5" />

        <div className="text-[10px] tracking-wider text-white/50 font-semibold mb-3" style={{ fontFamily: MONO }}>
          FUEL BASELINE — FOR CONTEXT ONLY
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[18px] font-bold">{calories}</div>
            <div className="mt-1 text-[9px] uppercase tracking-wider text-white/60" style={{ fontFamily: MONO }}>kcal / day</div>
          </div>
          <div>
            <div className="text-[18px] font-bold">{carbs}g</div>
            <div className="mt-1 text-[9px] uppercase tracking-wider text-white/60" style={{ fontFamily: MONO }}>carbs / day</div>
          </div>
          <div>
            <div className="text-[18px] font-bold">{fats}g</div>
            <div className="mt-1 text-[9px] uppercase tracking-wider text-white/60" style={{ fontFamily: MONO }}>fats / day</div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-white/60 text-center" style={{ fontFamily: MONO }}>
          We only hold you to one number.
        </div>

        <div className="h-px bg-white/15 my-5" />

        <div className="text-[13px] text-white/80 space-y-1">
          <div>Goal date: <span className="text-white font-semibold">{goalDate}</span></div>
          <div>Pace: <span className="text-white font-semibold">{pace}</span></div>
        </div>
      </div>

      <div className="flex-1" />
      <PrimaryCTA label="Let's get started →" onClick={onNext} />
    </div>
  );
}

/* ---------- Screen I: Sign in ---------- */
function ScreenSignIn({
  onNext,
  protein,
  calories,
  goalDate,
  pace,
}: {
  onNext: () => void;
  protein: number;
  calories: number;
  goalDate: string;
  pace: string;
}) {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState<null | 'apple' | 'google'>(null);

  const handle = async (provider: 'apple' | 'google') => {
    if (busy) return;
    console.log(`[signin] ${provider} tapped`);
    setBusy(provider);
    try {
      sessionStorage.setItem(ONBOARDING_AUTH_RESUME_KEY, 'paywall');
      if (provider === 'apple') await signInWithApple();
      else await signInWithGoogle();
      console.log(`[signin] ${provider} success`);
      onNext();
    } catch (e: unknown) {
      sessionStorage.removeItem(ONBOARDING_AUTH_RESUME_KEY);
      const msg = e instanceof Error ? e.message : `${provider} sign-in failed`;
      console.error(`[signin] ${provider} error:`, e);
      if (!/cancel|popup-closed/i.test(msg)) {
        toast.error(msg.replace('Firebase: ', '') || `${provider} sign-in failed`);
      }
    } finally {
      setBusy(null);
    }
  };

  // Short date for the card row (e.g. "Mar 4")
  const goalDateShort = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  })();

  // Short pace for the card row (e.g. "0.5 kg/wk")
  const paceShort = (() => {
    const short = pace.split(' — ')[0];
    return short.replace('week', 'wk');
  })();

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
          Save your progress.
        </h1>
        <p className="mt-2 text-[15px] text-[#6B6B6B]">Sign in so you never lose your plan.</p>
      </div>

      {/* Card */}
      <div className="mt-5 w-full rounded-2xl bg-black text-white p-5">
        <div className="text-[10px] tracking-[0.15em] font-bold text-white/60" style={{ fontFamily: MONO }}>
          YOUR PLAN
        </div>
        <div className="mt-3 flex items-baseline justify-center gap-1">
          <div className="text-[44px] font-black leading-none tracking-tight">{protein}</div>
          <div className="text-[16px] font-semibold text-white/80">g / day</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[14px] font-bold">{calories}</div>
            <div className="mt-1 text-[9px] tracking-[0.15em] font-bold text-white/55" style={{ fontFamily: MONO }}>KCAL</div>
          </div>
          <div className="border-l border-r border-white/15">
            <div className="text-[14px] font-bold">{goalDateShort}</div>
            <div className="mt-1 text-[9px] tracking-[0.15em] font-bold text-white/55" style={{ fontFamily: MONO }}>GOAL DATE</div>
          </div>
          <div>
            <div className="text-[14px] font-bold">{paceShort}</div>
            <div className="mt-1 text-[9px] tracking-[0.15em] font-bold text-white/55" style={{ fontFamily: MONO }}>PACE</div>
          </div>
        </div>
        <p className="mt-4 text-center text-[12px] text-white/70">
          Don&apos;t lose this. It was built for you.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-5 space-y-3">
        <button
          onClick={() => { void mediumHaptic(); handle('apple'); }}
          disabled={busy !== null}
          className="w-full rounded-full bg-black text-white py-4 text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
        >
          <Apple className="w-5 h-5" strokeWidth={2} />
          {busy === 'apple' ? 'Signing in…' : 'Sign in with Apple'}
        </button>
        <button
          onClick={() => { void mediumHaptic(); handle('google'); }}
          disabled={busy !== null}
          className="w-full rounded-full bg-white text-black border border-black py-4 text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
        >
          <GoogleG className="w-5 h-5" />
          {busy === 'google' ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>

      {/* Benefit rows */}
      <div className="mt-5 space-y-3">
        {[
          'Your protein plan saved forever',
          'Track progress across all your devices',
          'Never start over if you switch phones',
        ].map((text) => (
          <div key={text} className="flex items-center gap-3">
            <Check className="w-4 h-4 text-black shrink-0" strokeWidth={3} />
            <span className="text-[13px] text-[#6B6B6B]">{text}</span>
          </div>
        ))}
      </div>

      {/* Spacer pushes Skip to bottom */}
      <div className="flex-1" />

      <button
        onClick={onNext}
        className="w-full text-center text-[10px] text-[#C8C8C8] py-2"
      >
        Skip for now
      </button>
    </div>
  );
}


function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.3C41.1 35.9 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/* ---------- Credibility ---------- */
function ScreenCredibility({ onNext }: { onNext: () => void }) {
  const points = [
    { title: 'UNDER-EATING PROTEIN', sub: "It's the most common reason lifters stop progressing." },
    { title: 'GUESSING DOESN\'T WORK', sub: 'Without a number, every day is a coin flip.' },
    { title: 'CONSISTENCY COMPOUNDS', sub: 'Hit the number daily and your body has no choice but to adapt.' },
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        The protein gap is real.
      </h1>
      <div className="mt-7 space-y-3">
        {points.map((p) => (
          <div key={p.title} className="rounded-2xl bg-[#F5F5F5] p-5">
            <div className="text-[18px] font-black leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>{p.title}</div>
            <p className="mt-2 text-[14px] text-[#6B6B6B] leading-snug">{p.sub}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[13px] italic text-[#6B6B6B]">
        Brotein was built to close this gap.
      </p>
      <div className="flex-1" />
      <PrimaryCTA label="I'm ready to fix this" onClick={onNext} />
    </div>
  );
}

/* ---------- Paywall ---------- */
function ScreenPaywall({
  plan,
  onPlanChange,
  protein,
  calories,
  goalDate,
  pace,
  busy,
  onStart,
}: {
  plan: Plan;
  onPlanChange: (p: Plan) => void;
  protein: number;
  calories: number;
  goalDate: string;
  pace: string;
  busy: boolean;
  onStart: () => void;
}) {
  const features = [
    'AI Food Scanner',
    'Daily Protein Tracking',
    'Daily Accountability',
    '90-Day Muscle Plan',
    'Progress Analytics',
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[30px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        Start building.
      </h1>

      <p className="mt-3 text-[13px] text-[#6B6B6B]">
        Your plan: {protein}g protein/day · Goal: {goalDate}
      </p>

      <div className="mt-5 space-y-3">
        <button
          onClick={() => onPlanChange('yearly')}
          className={`w-full text-left rounded-2xl p-5 transition-colors relative ${
            plan === 'yearly' ? 'border-2 border-black bg-white' : 'border border-[#E5E5E5] bg-white'
          }`}
        >
          <span className="absolute -top-2 left-5 bg-black text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full">
            BEST VALUE
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[18px] font-bold">Yearly</div>
              <div className="text-[13px] text-[#6B6B6B] mt-0.5">$39.99/year — just $3.33/mo</div>
              <div className="text-[12px] text-[#6B6B6B] mt-1">7-day free trial, then $39.99/year</div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 ${plan === 'yearly' ? 'border-black bg-black' : 'border-[#D5D5D5]'}`} />
          </div>
        </button>
        <button
          onClick={() => onPlanChange('monthly')}
          className={`w-full text-left rounded-2xl p-5 transition-colors ${
            plan === 'monthly' ? 'border-2 border-black bg-white' : 'border border-[#E5E5E5] bg-white'
          }`}
        >
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[18px] font-bold">Monthly</div>
              <div className="text-[13px] text-[#6B6B6B] mt-0.5">$4.99/month</div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 ${plan === 'monthly' ? 'border-black bg-black' : 'border-[#D5D5D5]'}`} />
          </div>
        </button>
      </div>

      <ul className="mt-5 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-[14px]">
            <Check className="w-4 h-4 text-black shrink-0" strokeWidth={3} />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-4" />

      <PrimaryCTA label={busy ? 'Starting…' : 'Start 7-Day Free Trial'} onClick={onStart} disabled={busy} haptic="success" />
      <p className="mt-3 text-center text-[12px] text-[#6B6B6B]">
        No payment due today. After 7 days, $39.99/year. Cancel anytime.
      </p>
      <button className="mt-2 w-full text-center text-[12px] text-[#6B6B6B] underline py-1">
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

/* ---------- Notifications permission ---------- */
function ScreenNotifications({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  const benefits = [
    'Daily protein reminders',
    "Alert when you're behind pace",
    'Weekly progress updates',
  ];
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        Reach your goals.
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">
        Turn on notifications so Brotein can remind you when you&apos;re falling behind.
      </p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-black flex items-center justify-center">
          <Bell className="w-14 h-14 text-white" strokeWidth={2} />
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-3 text-[15px]">
            <Check className="w-5 h-5 text-black shrink-0" strokeWidth={3} />
            {b}
          </li>
        ))}
      </ul>

      <PrimaryCTA label="Turn On Notifications" onClick={onAllow} />
      <button onClick={() => { void tapHaptic(); onSkip(); }} className="w-full text-center text-[13px] text-[#6B6B6B] underline py-3 mt-1">
        Not now
      </button>
    </div>
  );
}

/* ---------- App Store rating ---------- */
function ScreenRating({ onRate, onSkip }: { onRate: () => void; onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight uppercase" style={{ fontFamily: MONO }}>
        Loving Brotein so far?
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">
        Rate us on the App Store — it takes 2 seconds and helps us grow.
      </p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-10 h-10" fill="#F5B400" stroke="#F5B400" />
          ))}
        </div>
        <p className="mt-4 text-[13px] text-[#6B6B6B] font-semibold">4.8 · 100+ ratings</p>
      </div>

      <PrimaryCTA label="Rate Brotein" onClick={onRate} />
      <button onClick={() => { void tapHaptic(); onSkip(); }} className="w-full text-center text-[13px] text-[#6B6B6B] underline py-3 mt-1">
        Maybe later
      </button>
    </div>
  );
}
