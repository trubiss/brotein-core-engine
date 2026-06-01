import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, RefreshCw, Check, Loader2, AlertTriangle } from 'lucide-react';
import { MealType } from '@/lib/types';
import { scanFoodImage, fileToCompressedDataUrl, ScanResult } from '@/lib/scan';
import { track } from '@/lib/track';
import { isNative, takeFoodPhoto, pickFoodPhoto, tapHaptic } from '@/lib/native';
import { toast } from 'sonner';

interface Props {
  onConfirm: (data: {
    foodName: string;
    proteinGrams: number;
    carbsGrams?: number;
    fatsGrams?: number;
    caloriesKcal?: number;
    mealType?: MealType;
    ai: ScanResult;
    imageDataUrl: string;
    edited: boolean;
  }) => void | Promise<void>;
  onClose: () => void;
}

type Stage = 'pick' | 'analyzing' | 'review' | 'error';

const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'BFAST' },
  { value: 'lunch', label: 'LUNCH' },
  { value: 'dinner', label: 'DINNER' },
  { value: 'snack', label: 'SNACK' },
];

export default function FoodScanModal({ onConfirm, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('pick');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [ai, setAi] = useState<ScanResult | null>(null);
  const [foodName, setFoodName] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [calories, setCalories] = useState('');
  const [portionGrams, setPortionGrams] = useState('');
  const [mealType, setMealType] = useState<MealType | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      await handleDataUrl(dataUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Scan failed';
      setErrorMsg(msg);
      setStage('error');
    }
  };

  const handleDataUrl = async (dataUrl: string) => {
    setImageDataUrl(dataUrl);
    setStage('analyzing');
    track('ai_scan_started');
    try {
      const result = await scanFoodImage(dataUrl);
      setAi(result);
      setFoodName(result.foodName);
      setProtein(String(result.proteinGrams));
      setCarbs(result.carbsGrams != null ? String(result.carbsGrams) : '');
      setFats(result.fatsGrams != null ? String(result.fatsGrams) : '');
      setCalories(result.caloriesKcal != null ? String(result.caloriesKcal) : '');
      setPortionGrams(result.portionGrams != null ? String(result.portionGrams) : '');
      if (result.mealType) setMealType(result.mealType);
      track('ai_scan_completed', { ai_grams: result.proteinGrams, confidence: result.confidence });
      setStage('review');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Scan failed';
      track('ai_scan_failed', { reason: msg.slice(0, 80) });
      setErrorMsg(msg);
      setStage('error');
    }
  };

  const onCamera = async (e: React.ChangeEvent<HTMLInputElement>) => {
    void tapHaptic();
    if (isNative()) {
      const dataUrl = await takeFoodPhoto();
      if (dataUrl) void handleDataUrl(dataUrl);
      return;
    }
    const f = e.target.files?.[0]; if (f) void handleFile(f);
  };
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNative()) {
      const dataUrl = await pickFoodPhoto();
      if (dataUrl) void handleDataUrl(dataUrl);
      return;
    }
    const f = e.target.files?.[0]; if (f) void handleFile(f);
  };

  const reset = () => {
    setImageDataUrl(null); setAi(null); setFoodName(''); setProtein(''); setCarbs(''); setFats(''); setCalories(''); setPortionGrams(''); setMealType(undefined); setErrorMsg(''); setStage('pick');
  };

  const canConfirm = foodName.trim().length > 0 && Number(protein) > 0;

  const confirm = async () => {
    if (!ai || !imageDataUrl || !canConfirm || busy) return;
    setBusy(true);
    try {
      const edited = foodName.trim() !== ai.foodName || Number(protein) !== ai.proteinGrams;
      await onConfirm({
        foodName: foodName.trim(),
        proteinGrams: Number(protein),
        carbsGrams: Number(carbs) || undefined,
        fatsGrams: Number(fats) || undefined,
        caloriesKcal: Number(calories) || undefined,
        mealType,
        ai,
        imageDataUrl,
        edited,
      });
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Log failed');
    } finally {
      setBusy(false);
    }
  };

  const confidencePct = ai ? Math.round(ai.confidence * 100) : 0;
  const lowConfidence = ai && ai.confidence < 0.4;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-200" onClick={busy ? undefined : onClose} />
      <div className="relative bg-background w-full max-w-md p-6 border-t-2 border-foreground animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black tracking-[0.1em]">SCAN FOOD</h2>
          <button onClick={onClose} className="p-1.5 border-2 border-foreground active:scale-95" disabled={busy}><X size={14} /></button>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'pick' && (
            <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-6 leading-relaxed">
                AI ESTIMATES PROTEIN FROM A FOOD PHOTO. YOU CAN EDIT BEFORE LOGGING.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={async () => {
                  void tapHaptic();
                  if (isNative()) {
                    const dataUrl = await takeFoodPhoto();
                    if (dataUrl) void handleDataUrl(dataUrl);
                  } else {
                    cameraRef.current?.click();
                  }
                }} className="border-2 border-foreground p-6 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform">
                  <Camera size={28} strokeWidth={2} />
                  <span className="text-xs font-bold tracking-widest">CAMERA</span>
                </button>
                <button onClick={async () => {
                  if (isNative()) {
                    const dataUrl = await pickFoodPhoto();
                    if (dataUrl) void handleDataUrl(dataUrl);
                  } else {
                    fileRef.current?.click();
                  }
                }} className="border-2 border-foreground p-6 flex flex-col items-center gap-3 active:scale-[0.98] transition-transform">
                  <Upload size={28} strokeWidth={2} />
                  <span className="text-xs font-bold tracking-widest">UPLOAD</span>
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onCamera} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-6">
                BEST RESULTS: ONE DISH IN FRAME, GOOD LIGHT.
              </p>
            </motion.div>
          )}

          {stage === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 flex flex-col items-center gap-6">
              {imageDataUrl && (
                <img src={imageDataUrl} alt="" className="w-full max-h-64 object-cover border-2 border-foreground" />
              )}
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">ANALYZING…</span>
              </div>
            </motion.div>
          )}

          {stage === 'review' && ai && imageDataUrl && (
            <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <img src={imageDataUrl} alt="" className="w-full max-h-56 object-cover border-2 border-foreground mb-5" />

              <div className="border-2 border-foreground p-3 mb-5">
                <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase truncate">AI DETECTED</span>
                  <span className={`text-[10px] font-bold tracking-[0.2em] uppercase shrink-0 ${lowConfidence ? '' : ''}`}>
                    {confidencePct}% CONF
                  </span>
                </div>
                <p className="font-display text-sm font-bold uppercase truncate">{ai.foodName}</p>
                {ai.portion && <p className="text-[10px] tracking-wider uppercase text-muted-foreground mt-1 truncate">{ai.portion}</p>}
                {lowConfidence && (
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border">
                    <AlertTriangle size={12} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                    <p className="text-[10px] tracking-[0.15em] uppercase font-bold leading-relaxed">
                      LOW CONFIDENCE — REVIEW CAREFULLY
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5 mb-5">
                <div>
                  <label className="label-spaced">FOOD NAME</label>
                  <input className="input-underline" value={foodName} onChange={e => setFoodName(e.target.value)} />
                </div>
                <div>
                  <label className="label-spaced">PROTEIN (G)</label>
                  <input className="input-underline" type="number" inputMode="numeric" value={protein} onChange={e => setProtein(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-spaced opacity-70">CARBS (G)</label>
                    <input className="input-underline" type="number" inputMode="numeric" value={carbs} onChange={e => setCarbs(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-spaced opacity-70">FAT (G)</label>
                    <input className="input-underline" type="number" inputMode="numeric" value={fats} onChange={e => setFats(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-spaced opacity-70">CALORIES (KCAL)</label>
                  <input className="input-underline" type="number" inputMode="numeric" value={calories} onChange={e => setCalories(e.target.value)} />
                </div>
              </div>

              <div className="mb-5">
                <p className="label-spaced">MEAL TYPE</p>
                <div className="grid grid-cols-4 gap-2">
                  {MEALS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMealType(mealType === m.value ? undefined : m.value)}
                      className={`p-2 border-2 text-[10px] font-bold tracking-widest ${
                        mealType === m.value ? 'border-foreground bg-foreground text-background' : 'border-foreground'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={reset} className="btn-outline flex-1 flex items-center justify-center gap-2" disabled={busy}>
                  <RefreshCw size={12} /> RESCAN
                </button>
                <button onClick={confirm} disabled={!canConfirm || busy} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{ opacity: canConfirm && !busy ? 1 : 0.3 }}>
                  <Check size={14} /> {busy ? '…' : 'LOG'}
                </button>
              </div>
              <button onClick={onClose} className="w-full text-[10px] font-bold tracking-[0.2em] uppercase py-2 active:opacity-60" disabled={busy}>
                CANCEL
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
    </div>
  );
}
