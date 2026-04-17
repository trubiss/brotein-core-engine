import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, where, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { FoodLog, UserProfile, DailySummary, MealType, todayKey, calculateMacros } from './types';

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

async function recomputeSummary(uid: string, date: string, target: number) {
  const q = query(logsCol(uid), where('date', '==', date));
  const snap = await getDocs(q);
  let consumed = 0;
  snap.forEach(d => { consumed += (d.data() as FoodLog).proteinGrams || 0; });
  const summary: DailySummary = {
    date,
    consumedProtein: consumed,
    targetProtein: target,
    remainingProtein: Math.max(0, target - consumed),
    hitTarget: consumed >= target,
    logCount: snap.size,
  };
  await setDoc(summaryDoc(uid, date), summary, { merge: true });
  return summary;
}

export async function addLog(
  uid: string,
  input: { foodName: string; proteinGrams: number; mealType?: MealType; date?: string; timestamp?: number }
) {
  const profile = await getProfile(uid);
  if (!profile) throw new Error('Profile required');
  const now = Date.now();
  const date = input.date ?? todayKey();
  const ref = doc(logsCol(uid));
  const log: FoodLog = {
    id: ref.id,
    date,
    timestamp: input.timestamp ?? now,
    foodName: input.foodName,
    proteinGrams: input.proteinGrams,
    mealType: input.mealType,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, log);
  await recomputeSummary(uid, date, profile.dailyProtein);
  return log;
}

export async function updateLog(uid: string, logId: string, patch: Partial<FoodLog>) {
  const profile = await getProfile(uid);
  if (!profile) throw new Error('Profile required');
  const ref = doc(logsCol(uid), logId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  const data = existing.data() as FoodLog;
  await updateDoc(ref, { ...patch, updatedAt: Date.now() });
  const date = (patch.date as string) ?? data.date;
  await recomputeSummary(uid, date, profile.dailyProtein);
  if (patch.date && patch.date !== data.date) {
    await recomputeSummary(uid, data.date, profile.dailyProtein);
  }
}

export async function deleteLog(uid: string, logId: string) {
  const profile = await getProfile(uid);
  if (!profile) throw new Error('Profile required');
  const ref = doc(logsCol(uid), logId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  const data = existing.data() as FoodLog;
  await deleteDoc(ref);
  await recomputeSummary(uid, data.date, profile.dailyProtein);
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
