import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, RefreshCw, AlertTriangle, Loader2, Lock, Download, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { fileToCompressedDataUrl } from '@/lib/scan';
import {
  simulatePhysique,
  hasUsedFreeSimulation,
  markFreeSimulationUsed,
} from '@/lib/physique';
import { isNative, takeFoodPhoto, pickFoodPhoto, tapHaptic, successHaptic } from '@/lib/native';
import { track } from '@/lib/track';
import { toast } from 'sonner';

interface Props {
  /** Called when the user wants to unlock premium (after free use). */
  onUpgrade: () => void;
  onClose: () => void;
  /** True if user already has a paid entitlement / active trial. */
  isPremium: boolean;
}

type Stage = 'intro' | 'pick' | 'analyzing' | 'reveal' | 'error';

export default function PhysiqueSimulator({ onClose, onUpgrade, isPremium }: Props) {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? '';
  const [stage, setStage] = useState<Stage>('intro');
  const [original, setOriginal] = useState<string | null>(null);
  const [simulated, setSimulated] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSimulated, setShowSimulated] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const freeUsed = hasUsedFreeSimulation(uid);
  const locked = !isPremium && freeUsed;

  // body scroll lock
  useEffect(() => {
    const scrollY = window.scrollY;
    const { style: bodyStyle } = document.body;
    const prev = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
    };
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';
    bodyStyle.overflow = 'hidden';
    return () => {
      bodyStyle.position = prev.position;
      bodyStyle.top = prev.top;
      bodyStyle.width = prev.width;
      bodyStyle.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleDataUrl = async (dataUrl: string) => {
    if (!profile) return;
    setOriginal(dataUrl);
    setStage('analyzing');
    track('physique_sim_started', { goal: profile.goal });
    try {
      const result = await simulatePhysique({
        imageDataUrl: dataUrl,
        goal: profile.goal,
        weeks: 12,
        proteinTarget: profile.dailyProtein,
      });
      setSimulated(result.imageDataUrl);
      if (!isPremium) markFreeSimulationUsed(uid);
      void successHaptic();
      track('physique_sim_completed', { goal: profile.goal });
      setStage('reveal');
      // animated reveal: start showing simulated after a short delay
      setTimeout(() => setShowSimulated(true), 600);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Simulation failed';
      track('physique_sim_failed', { reason: msg.slice(0, 80) });
      setErrorMsg(msg);
      setStage('error');
    }
  };

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1024, 0.85);
      await handleDataUrl(dataUrl);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Could not read photo');
      setStage('error');
    }
  };

  const onCameraClick = async () => {
    void tapHaptic();
    if (isNative()) {
      const dataUrl = await takeFoodPhoto();
      if (dataUrl) void handleDataUrl(dataUrl);
      return;
    }
    cameraRef.current?.click();
  };
  const onUploadClick = async () => {
    void tapHaptic();
    if (isNative()) {
      const dataUrl = await pickFoodPhoto();
      if (dataUrl) void handleDataUrl(dataUrl);
      return;
    }
    fileRef.current?.click();
  };

  const reset = () => {
    setOriginal(null);
    setSimulated(null);
    setShowSimulated(false);
    setErrorMsg('');
    setStage('pick');
  };

  const goNext = () => {
    if (locked) {
      track('physique_sim_paywall_viewed');
      onUpgrade();
      return;
    }
    setStage('pick');
  };

  const downloadResult = () => {
    if (!simulated) return;
    const a = document.createElement('a');
    a.href = simulated;
    a.download = `brotein-potential-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('SAVED');
  };

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end justify-center overflow-hidden bg-foreground/50">
      <div className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-200" onClick={stage === 'analyzing' ? undefined : onClose} />
      <div
        className="relative bg-background w-full max-w-md p-6 border-t-2 border-foreground animate-in slide-in-from-bottom duration-300 max-h-[94dvh] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black tracking-[0.1em]">POTENTIAL</h2>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-foreground active:scale-95"
            disabled={stage === 'analyzing'}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="border-2 border-foreground p-4 mb-5">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] tracking-[0.2em] uppercase font-black leading-relaxed">
                    SEE YOUR 12-WEEK POTENTIAL
                  </p>
                </div>
                <p className="text-[11px] tracking-[0.08em] leading-relaxed text-muted-foreground">
                  Snap a physique photo. AI renders a realistic visualization of the same you
                  after <span className="text-foreground font-bold">12 weeks of locked-in protein</span> at
                  your target of <span className="text-foreground font-bold">{profile?.dailyProtein ?? 0}g/day</span>.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <Line k="GOAL" v={(profile?.goal ?? '—').toUpperCase()} />
                <Line k="WINDOW" v="12 WEEKS" />
                <Line k="PRIVACY" v="PHOTO NOT STORED" />
              </div>

              <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/60 mb-5 leading-relaxed">
                ARTISTIC VISUALIZATION — NOT A MEDICAL PREDICTION.
              </p>

              {locked ? (
                <>
                  <button
                    onClick={() => { void tapHaptic(); onUpgrade(); }}
                    className="w-full bg-foreground text-background py-3.5 font-display font-black text-sm tracking-[0.12em] active:opacity-90 flex items-center justify-center gap-2"
                  >
                    <Lock size={14} strokeWidth={2.5} /> UNLOCK MORE — PRO
                  </button>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/55 text-center mt-3">
                    YOUR FREE SIMULATION HAS BEEN USED
                  </p>
                </>
              ) : (
                <button
                  onClick={goNext}
                  className="w-full bg-foreground text-background py-3.5 font-display font-black text-sm tracking-[0.12em] active:opacity-90"
                >
                  {isPremium ? 'SIMULATE →' : 'TRY FREE →'}
                </button>
              )}
              <button onClick={onClose} className="w-full text-[10px] font-bold tracking-[0.2em] uppercase py-3 active:opacity-60 mt-2">
                CANCEL
              </button>
            </motion.div>
          )}

          {stage === 'pick' && (
            <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-6 leading-relaxed">
                STAND IN GOOD LIGHT. KEEP THE PHOTO IN FRAME — HEAD TO WAIST WORKS BEST.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={onCameraClick}
                  className="border-2 border-foreground p-6 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <Camera size={28} strokeWidth={2} />
                  <span className="text-xs font-bold tracking-widest">CAMERA</span>
                </button>
                <button
                  onClick={onUploadClick}
                  className="border-2 border-foreground p-6 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <Upload size={28} strokeWidth={2} />
                  <span className="text-xs font-bold tracking-widest">UPLOAD</span>
                </button>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
              />
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-6 leading-relaxed">
                YOUR PHOTO IS SENT TO THE AI MODEL ONCE AND DISCARDED — NOT STORED ON OUR SERVERS.
              </p>
            </motion.div>
          )}

          {stage === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
              {original && (
                <div className="relative w-full mb-6 border-2 border-foreground overflow-hidden">
                  <img src={original} alt="" className="w-full max-h-72 object-cover" />
                  <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 size={24} className="animate-spin text-background" />
                    <span className="text-[10px] font-black tracking-[0.25em] uppercase text-background">
                      RENDERING POTENTIAL…
                    </span>
                  </div>
                </div>
              )}
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center leading-relaxed">
                THIS TAKES 10–30 SECONDS. HOLD TIGHT.
              </p>
            </motion.div>
          )}

          {stage === 'reveal' && original && simulated && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div>
                  <p className="label-spaced text-center mb-2">NOW</p>
                  <div className="border-2 border-foreground aspect-[3/4] overflow-hidden">
                    <img src={original} alt="Current physique" className="w-full h-full object-cover grayscale" />
                  </div>
                </div>
                <div>
                  <p className="label-spaced text-center mb-2">12 WEEKS</p>
                  <div className="border-2 border-foreground aspect-[3/4] overflow-hidden relative">
                    <motion.img
                      src={simulated}
                      alt="12-week potential"
                      className="w-full h-full object-cover grayscale"
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{
                        opacity: showSimulated ? 1 : 0,
                        scale: showSimulated ? 1 : 1.06,
                      }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                    {!showSimulated && (
                      <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
                        <Sparkles size={20} className="animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-2 border-foreground p-3 mb-5">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1">YOUR TARGET</p>
                <p className="font-display text-2xl font-black">
                  {profile?.dailyProtein ?? 0}G / DAY
                </p>
                <p className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground/70 mt-1">
                  HIT IT CONSISTENTLY · {(profile?.goal ?? '').toUpperCase()}
                </p>
              </div>

              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/55 mb-4 leading-relaxed">
                ARTISTIC VISUALIZATION. RESULTS DEPEND ON TRAINING, GENETICS, AND CONSISTENCY.
              </p>

              <div className="flex gap-2 mb-2">
                <button onClick={downloadResult} className="btn-outline flex-1 flex items-center justify-center gap-2">
                  <Download size={12} /> SAVE
                </button>
                <button
                  onClick={() => {
                    if (!isPremium) { onUpgrade(); return; }
                    reset();
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {!isPremium ? (<><Lock size={12} /> UNLOCK MORE</>) : (<><RefreshCw size={12} /> AGAIN</>)}
                </button>
              </div>
              <button onClick={onClose} className="w-full text-[10px] font-bold tracking-[0.2em] uppercase py-2 active:opacity-60">
                DONE
              </button>
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="border-2 border-foreground p-4 mb-5 flex items-start gap-3">
                <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                <p className="text-[11px] tracking-[0.15em] uppercase font-bold leading-relaxed">{errorMsg}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-outline flex-1">CLOSE</button>
                <button onClick={reset} className="btn-primary flex-1">TRY AGAIN</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-2">
      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">{k}</span>
      <span className="font-display text-xs font-black tracking-[0.08em] uppercase">{v}</span>
    </div>
  );
}
