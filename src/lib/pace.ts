import { FoodLog, MealType } from './types';

export type PaceStatus = 'on-pace' | 'behind' | 'ahead';

export interface PaceInfo {
  status: PaceStatus;
  expected: number; // grams expected by now
  actual: number;
  diff: number; // actual - expected
  pctOfDay: number; // 0-100, how far through the active eating window
}

// Active eating window: 7:00 -> 22:00 (15h)
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;

export function computePace(consumed: number, target: number, now: Date = new Date()): PaceInfo {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMin = DAY_START_HOUR * 60;
  const endMin = DAY_END_HOUR * 60;
  let pct = 0;
  if (minutes <= startMin) pct = 0;
  else if (minutes >= endMin) pct = 100;
  else pct = ((minutes - startMin) / (endMin - startMin)) * 100;

  const expected = Math.round((pct / 100) * target);
  const diff = consumed - expected;
  const tolerance = Math.max(10, Math.round(target * 0.08)); // 8% or 10g
  let status: PaceStatus = 'on-pace';
  if (diff < -tolerance) status = 'behind';
  else if (diff > tolerance) status = 'ahead';

  return { status, expected, actual: consumed, diff, pctOfDay: pct };
}

export interface MealSplit {
  mealType: MealType;
  label: string;
  suggested: number;
  actual: number;
}

const SPLITS: { mealType: MealType; label: string; pct: number }[] = [
  { mealType: 'breakfast', label: 'BREAKFAST', pct: 0.25 },
  { mealType: 'lunch', label: 'LUNCH', pct: 0.30 },
  { mealType: 'dinner', label: 'DINNER', pct: 0.30 },
  { mealType: 'snack', label: 'SNACK', pct: 0.15 },
];

export function computeMealDistribution(logs: FoodLog[], target: number): MealSplit[] {
  const totals: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  for (const l of logs) {
    if (l.mealType) totals[l.mealType] += l.proteinGrams;
  }
  return SPLITS.map(s => ({
    mealType: s.mealType,
    label: s.label,
    suggested: Math.round(target * s.pct),
    actual: totals[s.mealType],
  }));
}

export function distributionRecommendation(splits: MealSplit[], pace: PaceInfo, now: Date = new Date()): string | null {
  const hour = now.getHours();
  // If a meal window has fully passed and protein <50% of suggested, recommend.
  // Windows: breakfast<11, lunch<15, dinner<21
  const checks: { meal: MealType; deadline: number }[] = [
    { meal: 'breakfast', deadline: 11 },
    { meal: 'lunch', deadline: 15 },
    { meal: 'dinner', deadline: 21 },
  ];
  for (const c of checks) {
    if (hour >= c.deadline) {
      const split = splits.find(s => s.mealType === c.meal);
      if (split && split.actual < split.suggested * 0.5) {
        const missing = split.suggested - split.actual;
        return `LOW ${c.meal.toUpperCase()} INTAKE — MAKE UP ${missing}G AT NEXT MEAL`;
      }
    }
  }
  if (pace.status === 'behind') {
    const need = Math.abs(pace.diff);
    return `BEHIND PACE — ADD ${need}G SOON TO CATCH UP`;
  }
  // Detect heavy concentration in a single meal (>60% of target so far)
  const heavy = splits.find(s => s.actual > Math.max(40, splits.reduce((a, b) => a + b.actual, 0) * 0.6) && s.actual > s.suggested * 1.4);
  if (heavy) {
    return `INTAKE CONCENTRATED IN ${heavy.label} — SPREAD ACROSS MEALS`;
  }
  return null;
}
