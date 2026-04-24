import { useState, useRef, useEffect, useMemo } from 'react';
import { MealType, FoodLog } from '@/lib/types';
import { FOOD_DATABASE, searchFoods, FoodItem } from '@/lib/foods';
import { useAuth } from '@/lib/auth';
import { watchFavorites, watchRecentLogs, addFavorite, removeFavorite, FavoriteFood } from '@/lib/firestore';
import { Search, Star, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initial?: {
    foodName: string;
    proteinGrams: number;
    mealType?: MealType;
  };
  title?: string;
  submitLabel?: string;
  onSubmit: (data: { foodName: string; proteinGrams: number; mealType?: MealType }) => void | Promise<void>;
  onClose: () => void;
  onScan?: () => void;
}

const PRESETS = [20, 30, 40, 50];
const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'BFAST' },
  { value: 'lunch', label: 'LUNCH' },
  { value: 'dinner', label: 'DINNER' },
  { value: 'snack', label: 'SNACK' },
];

type Tab = 'search' | 'favorites' | 'recent' | 'manual';

export default function QuickLogModal({ initial, title = 'QUICK LOG', submitLabel = 'LOG', onSubmit, onClose, onScan }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(initial ? 'manual' : 'recent');
  const [name, setName] = useState(initial?.foodName ?? '');
  const [protein, setProtein] = useState(initial ? String(initial.proteinGrams) : '');
  const [mealType, setMealType] = useState<MealType | undefined>(initial?.mealType);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [recents, setRecents] = useState<FoodLog[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === 'manual') nameRef.current?.focus();
  }, [tab]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const u1 = watchFavorites(user.uid, setFavorites);
    const u2 = watchRecentLogs(user.uid, setRecents, 30);
    return () => { u1(); u2(); };
  }, [user]);

  const results = useMemo(() => searchFoods(search), [search]);

  // Dedupe recents by foodName (most recent first), cap 10
  const dedupedRecents = useMemo(() => {
    const seen = new Set<string>();
    const out: FoodLog[] = [];
    for (const r of recents) {
      const k = r.foodName.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
      if (out.length >= 10) break;
    }
    return out;
  }, [recents]);

  const canLog = name.trim().length > 0 && Number(protein) > 0;

  const pickFood = (f: FoodItem) => {
    setName(f.name);
    setProtein(String(f.proteinGrams));
    if (f.suggestedMeal && !mealType) setMealType(f.suggestedMeal);
    setTab('manual');
  };

  const pickFavorite = (f: FavoriteFood) => {
    setName(f.foodName);
    setProtein(String(f.proteinGrams));
    if (f.mealType) setMealType(f.mealType);
    setTab('manual');
  };

  const pickRecent = (r: FoodLog) => {
    setName(r.foodName);
    setProtein(String(r.proteinGrams));
    if (r.mealType) setMealType(r.mealType);
    setTab('manual');
  };

  const isFavorited = (foodName: string, proteinGrams: number) =>
    favorites.some(f => f.foodName.toLowerCase() === foodName.toLowerCase() && f.proteinGrams === proteinGrams);

  const toggleFavoriteCurrent = async () => {
    if (!user || !canLog) return;
    const existing = favorites.find(
      f => f.foodName.toLowerCase() === name.trim().toLowerCase() && f.proteinGrams === Number(protein)
    );
    try {
      if (existing) {
        await removeFavorite(user.uid, existing.id);
        toast.success('REMOVED FROM FAVORITES');
      } else {
        await addFavorite(user.uid, { foodName: name.trim(), proteinGrams: Number(protein), mealType });
        toast.success('SAVED TO FAVORITES');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Favorite failed');
    }
  };

  const handleSubmit = async () => {
    if (!canLog || busy) return;
    setBusy(true);
    try {
      await onSubmit({ foodName: name.trim(), proteinGrams: Number(protein), mealType });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 py-2 text-[10px] font-bold tracking-widest border-2 ${
        tab === id ? 'border-foreground bg-foreground text-background' : 'border-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-background w-full max-w-md p-6 border-t-2 border-foreground animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-12 h-0.5 bg-foreground/30 mx-auto mb-6" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black tracking-[0.1em]">{title}</h2>
          <button onClick={onClose} className="p-1.5 border-2 border-foreground active:scale-95"><X size={14} /></button>
        </div>

        {!initial && onScan && (
          <button
            onClick={onScan}
            className="w-full mb-4 border-2 border-foreground p-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-foreground text-background"
          >
            <Camera size={14} strokeWidth={2.5} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">SCAN FOOD WITH AI</span>
          </button>
        )}

        {!initial && (
          <div className="grid grid-cols-4 gap-1 mb-5">
            <TabBtn id="search" label="FOODS" />
            <TabBtn id="favorites" label="FAV" />
            <TabBtn id="recent" label="RECENT" />
            <TabBtn id="manual" label="MANUAL" />
          </div>
        )}

        {tab === 'search' && (
          <div className="mb-5">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                autoFocus
                className="input-underline pl-7"
                placeholder="Search foods..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="border-t-2 border-foreground max-h-72 overflow-y-auto">
              {results.length === 0 ? (
                <p className="py-6 text-center text-[10px] tracking-[0.2em] uppercase text-muted-foreground">NO MATCHES</p>
              ) : results.map(f => (
                <button
                  key={f.id}
                  onClick={() => pickFood(f)}
                  className="w-full flex items-center justify-between gap-3 py-3 border-b border-border min-w-0 active:bg-foreground/5"
                >
                  <div className="min-w-0 text-left">
                    <p className="text-sm uppercase tracking-[0.12em] truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                      {f.category}{f.suggestedMeal ? ` · ${f.suggestedMeal}` : ''}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold whitespace-nowrap shrink-0">{f.proteinGrams}G</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'favorites' && (
          <div className="mb-5 border-t-2 border-foreground max-h-80 overflow-y-auto">
            {favorites.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm uppercase tracking-[0.15em] mb-2">NO FAVORITES YET</p>
                <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">SAVE FOODS FROM THE MANUAL TAB</p>
              </div>
            ) : favorites.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-2 py-3 border-b border-border min-w-0">
                <button onClick={() => pickFavorite(f)} className="flex-1 text-left min-w-0 active:opacity-60">
                  <p className="text-sm uppercase tracking-[0.12em] truncate">{f.foodName}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                    {f.proteinGrams}G{f.mealType ? ` · ${f.mealType}` : ''}
                  </p>
                </button>
                <button
                  onClick={() => removeFavorite(user!.uid, f.id)}
                  className="p-2 border-2 border-foreground active:scale-95 shrink-0"
                  aria-label="Remove favorite"
                >
                  <Star size={12} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'recent' && (
          <div className="mb-5 border-t-2 border-foreground max-h-80 overflow-y-auto">
            {dedupedRecents.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm uppercase tracking-[0.15em] mb-2">NO RECENT LOGS</p>
                <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">YOUR LATEST FOODS WILL APPEAR HERE</p>
              </div>
            ) : dedupedRecents.map(r => (
              <button
                key={r.id}
                onClick={() => pickRecent(r)}
                className="w-full flex items-center justify-between gap-3 py-3 border-b border-border min-w-0 active:bg-foreground/5"
              >
                <div className="min-w-0 text-left">
                  <p className="text-sm uppercase tracking-[0.12em] truncate">{r.foodName}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                    {r.mealType ? `${r.mealType} · ` : ''}{new Date(r.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-display text-sm font-bold whitespace-nowrap shrink-0">{r.proteinGrams}G</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'manual' && (
          <>
            <div className="space-y-5 mb-5">
              <div>
                <label className="label-spaced">FOOD NAME</label>
                <input
                  ref={nameRef}
                  className="input-underline"
                  placeholder="e.g. Chicken Breast"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label-spaced">PROTEIN (G)</label>
                <input
                  className="input-underline"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
              {PRESETS.map(g => (
                <button
                  key={g}
                  className="btn-outline flex-1 min-w-[60px] px-3 py-2 text-xs font-bold tracking-widest"
                  onClick={() => setProtein(String(g))}
                >
                  +{g}G
                </button>
              ))}
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

            {!initial && (
              <button
                onClick={toggleFavoriteCurrent}
                disabled={!canLog}
                className="w-full mb-5 py-2 border-2 border-foreground text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30"
              >
                <Star size={12} fill={isFavorited(name.trim(), Number(protein)) ? 'currentColor' : 'none'} />
                {isFavorited(name.trim(), Number(protein)) ? 'SAVED TO FAVORITES' : 'SAVE TO FAVORITES'}
              </button>
            )}

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose} disabled={busy}>CANCEL</button>
              <button
                className="btn-primary flex-1"
                disabled={!canLog || busy}
                onClick={handleSubmit}
                style={{ opacity: canLog && !busy ? 1 : 0.3 }}
              >
                {busy ? '…' : submitLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
