import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, where, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { FoodLog, UserProfile, DailySummary, MealType, todayKey, calculateMacros, kcalFromMacros } from './types';

export interface FavoriteFood {
  id: string;
  foodName: string;
  proteinGrams: number;
  carbsGrams?: number;
  fatsGrams?: number;
  caloriesKcal?: number;
  mealType?: MealType;
  createdAt: number;
}

const favoritesCol = (uid: string) => collection(db, 'users', uid, 'favorites');

export function watchFavorites(uid: string, cb: (items: FavoriteFood[]) => void) {
  return onSnapshot(favoritesCol(uid), s => {
    const arr: FavoriteFood[] = [];
    s.forEach(d => arr.push(d.data() as FavoriteFood));
    arr.sort((a, b) => b.createdAt - a.createdAt);
    cb(arr);
  });
}

export async function addFavorite(uid: string, input: { foodName: string; proteinGrams: number; carbsGrams?: number; fatsGrams?: number; caloriesKcal?: number; mealType?: MealType }) {
  const ref = doc(favoritesCol(uid));
  const fav: FavoriteFood = {
    id: ref.id,
    foodName: input.foodName,
    proteinGrams: input.proteinGrams,
    carbsGrams: input.carbsGrams,
    fatsGrams: input.fatsGrams,
    caloriesKcal: input.caloriesKcal,
    mealType: input.mealType,
    createdAt: Date.now(),
  };
  // Strip undefined for Firestore
  const clean = Object.fromEntries(Object.entries(fav).filter(([, v]) => v !== undefined)) as FavoriteFood;
  await setDoc(ref, clean);
  return fav;
}

export async function removeFavorite(uid: string, id: string) {
  await deleteDoc(doc(favoritesCol(uid), id));
}

export function watchRecentLogs(uid: string, cb: (logs: FoodLog[]) => void, max = 30) {
  const q = query(logsCol(uid), orderBy('timestamp', 'desc'), limit(max));
  return onSnapshot(q, s => {
    const arr: FoodLog[] = [];
    s.forEach(d => arr.push(d.data() as FoodLog));
    cb(arr);
  });
}

const userDoc = (uid: string) => doc(db, 'users', uid);
const logsCol = (uid: string) => collection(db, 'users', uid, 'logs');
const summariesCol = (uid: string) => collection(db, 'users', uid, 'dailySummaries');
const summaryDoc = (uid: string, date: string) => doc(db, 'users', uid, 'dailySummaries', date);

export async function createOrUpdateProfile(profile: UserProfile) {
  await setDoc(userDoc(profile.uid), {
    ...profile,
    updatedAt: Date.now(),
    createdAt: profile.createdAt ?? Date.now(),
  }, { merge: true });
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function watchProfile(uid: string, cb: (p: UserProfile | null) => void) {
  return onSnapshot(userDoc(uid), s => cb(s.exists() ? (s.data() as UserProfile) : null));
}

export async function updateProfileFields(uid: string, partial: Partial<UserProfile>) {
  // Recompute macros if weight/goal/activityLevel changed
  const current = await getProfile(uid);
  if (!current) throw new Error('Profile not found');
  const merged = { ...current, ...partial };
  if (
    partial.weight !== undefined ||
    partial.goal !== undefined ||
    partial.activityLevel !== undefined
  ) {
    const m = calculateMacros(merged.weight, merged.activityLevel, merged.goal);
    merged.dailyProtein = m.protein;
    merged.dailyCalories = m.calories;
    merged.dailyCarbs = m.carbs;
    merged.dailyFats = m.fats;
    merged.mealFrequency = m.mealFrequency;
  }
  merged.updatedAt = Date.now();
  await setDoc(userDoc(uid), merged, { merge: true });
  return merged;
}

type Targets = { protein: number; carbs?: number; fats?: number; calories?: number };

function normalizeTargets(t: number | Targets | undefined): Targets | undefined {
  if (t === undefined) return undefined;
  if (typeof t === 'number') return { protein: t };
  return t;
}

async function resolveTargets(uid: string, t: number | Targets | undefined): Promise<Targets> {
  const norm = normalizeTargets(t);
  if (norm) return norm;
  const profile = await getProfile(uid);
  if (!profile) throw new Error('Profile required');
  return { protein: profile.dailyProtein, carbs: profile.dailyCarbs, fats: profile.dailyFats, calories: profile.dailyCalories };
}

async function recomputeSummary(uid: string, date: string, targets: Targets) {
  const q = query(logsCol(uid), where('date', '==', date));
  const snap = await getDocs(q);
  let consumed = 0;
  let consumedCarbs = 0;
  let consumedFats = 0;
  let consumedCalories = 0;
  snap.forEach(d => {
    const data = d.data() as FoodLog;
    consumed += data.proteinGrams || 0;
    consumedCarbs += data.carbsGrams || 0;
    consumedFats += data.fatsGrams || 0;
    consumedCalories += data.caloriesKcal ?? kcalFromMacros(data.proteinGrams, data.carbsGrams, data.fatsGrams);
  });
  const summary: DailySummary = {
    date,
    consumedProtein: consumed,
    targetProtein: targets.protein,
    remainingProtein: Math.max(0, targets.protein - consumed),
    hitTarget: consumed >= targets.protein,
    logCount: snap.size,
    consumedCarbs,
    consumedFats,
    consumedCalories,
    targetCarbs: targets.carbs ?? 0,
    targetFats: targets.fats ?? 0,
    targetCalories: targets.calories ?? 0,
  };
  await setDoc(summaryDoc(uid, date), summary, { merge: true });
  return summary;
}

export async function addLog(
  uid: string,
  input: {
    foodName: string;
    proteinGrams: number;
    carbsGrams?: number;
    fatsGrams?: number;
    caloriesKcal?: number;
    mealType?: MealType;
    date?: string;
    timestamp?: number;
    source?: FoodLog['source'];
    aiDetectedName?: string;
    aiEstimatedGrams?: number;
    aiEstimatedCarbs?: number;
    aiEstimatedFats?: number;
    aiEstimatedCalories?: number;
    aiConfidence?: number;
    aiPortion?: string;
    aiEdited?: boolean;
    imageRef?: string;
  },
  targetsInput?: number | Targets,
) {
  const targets = await resolveTargets(uid, targetsInput);
  const now = Date.now();
  const date = input.date ?? todayKey();
  const ref = doc(logsCol(uid));
  const log: FoodLog = Object.fromEntries(
    Object.entries({
      id: ref.id,
      date,
      timestamp: input.timestamp ?? now,
      foodName: input.foodName,
      proteinGrams: input.proteinGrams,
      carbsGrams: input.carbsGrams,
      fatsGrams: input.fatsGrams,
      caloriesKcal: input.caloriesKcal,
      mealType: input.mealType,
      source: input.source,
      aiDetectedName: input.aiDetectedName,
      aiEstimatedGrams: input.aiEstimatedGrams,
      aiEstimatedCarbs: input.aiEstimatedCarbs,
      aiEstimatedFats: input.aiEstimatedFats,
      aiEstimatedCalories: input.aiEstimatedCalories,
      aiConfidence: input.aiConfidence,
      aiPortion: input.aiPortion,
      aiEdited: input.aiEdited,
      imageRef: input.imageRef,
      createdAt: now,
      updatedAt: now,
    }).filter(([, v]) => v !== undefined)
  ) as unknown as FoodLog;
  setDoc(ref, log).then(() => recomputeSummary(uid, date, targets)).catch(() => { /* surfaced elsewhere */ });
  return log;
}

export async function updateLog(uid: string, logId: string, patch: Partial<FoodLog>, targetsInput?: number | Targets) {
  const targets = await resolveTargets(uid, targetsInput);
  const ref = doc(logsCol(uid), logId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  const data = existing.data() as FoodLog;
  const date = (patch.date as string) ?? data.date;
  updateDoc(ref, { ...patch, updatedAt: Date.now() })
    .then(() => recomputeSummary(uid, date, targets))
    .then(() => {
      if (patch.date && patch.date !== data.date) {
        return recomputeSummary(uid, data.date, targets);
      }
    })
    .catch(() => { /* surfaced elsewhere */ });
}

export async function deleteLog(uid: string, logId: string, targetsInput?: number | Targets) {
  const targets = await resolveTargets(uid, targetsInput);
  const ref = doc(logsCol(uid), logId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  const data = existing.data() as FoodLog;
  deleteDoc(ref)
    .then(() => recomputeSummary(uid, data.date, targets))
    .catch(() => { /* surfaced elsewhere */ });
}


export async function getRecentSummaries(uid: string, days = 30): Promise<DailySummary[]> {
  const q = query(summariesCol(uid), orderBy('date', 'desc'), limit(days));
  const snap = await getDocs(q);
  const arr: DailySummary[] = [];
  snap.forEach(d => arr.push(d.data() as DailySummary));
  return arr;
}

export function watchLogsForDate(uid: string, date: string, cb: (logs: FoodLog[]) => void) {
  const q = query(logsCol(uid), where('date', '==', date));
  return onSnapshot(q, s => {
    const logs: FoodLog[] = [];
    s.forEach(d => logs.push(d.data() as FoodLog));
    logs.sort((a, b) => b.timestamp - a.timestamp);
    cb(logs);
  });
}

export function watchAllLogs(uid: string, cb: (logs: FoodLog[]) => void) {
  const q = query(logsCol(uid), orderBy('timestamp', 'desc'));
  return onSnapshot(q, s => {
    const logs: FoodLog[] = [];
    s.forEach(d => logs.push(d.data() as FoodLog));
    cb(logs);
  });
}

export function watchSummary(uid: string, date: string, cb: (s: DailySummary | null) => void) {
  return onSnapshot(summaryDoc(uid, date), s => cb(s.exists() ? (s.data() as DailySummary) : null));
}

export function watchAllSummaries(uid: string, cb: (s: DailySummary[]) => void) {
  return onSnapshot(summariesCol(uid), s => {
    const arr: DailySummary[] = [];
    s.forEach(d => arr.push(d.data() as DailySummary));
    arr.sort((a, b) => b.date.localeCompare(a.date));
    cb(arr);
  });
}

// Permanently delete every doc owned by this user.
export async function deleteUserData(uid: string): Promise<void> {
  const deleteCollection = async (col: ReturnType<typeof collection>) => {
    const snap = await getDocs(col);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };
  await deleteCollection(logsCol(uid));
  await deleteCollection(favoritesCol(uid));
  await deleteCollection(summariesCol(uid));
  await deleteDoc(userDoc(uid));
}

// Streak: consecutive days up to today where consumed >= target
export function computeStreak(summaries: DailySummary[]): number {
  const map = new Map(summaries.map(s => [s.date, s]));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = todayKey(d);
    const s = map.get(key);
    if (s && s.hitTarget) {
      streak++;
    } else if (i === 0) {
      // today not yet hit — don't break streak from previous days
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
