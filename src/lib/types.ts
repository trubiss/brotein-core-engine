export type ActivityLevel = 'active' | 'moderate' | 'recovery';
export type Goal = 'hypertrophy' | 'equilibrium' | 'recovery';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyProtein: number;
  dailyCalories: number;
  dailyCarbs: number;
  dailyFats: number;
  mealFrequency: number;
  notifications: boolean;
  reminders?: {
    enabled: boolean;
    morning: { enabled: boolean; time: string };
    midday: { enabled: boolean; time: string };
    evening: { enabled: boolean; time: string };
    behindTarget: { enabled: boolean; thresholdPct: number };
  };
  createdAt?: number;
  updatedAt?: number;
}

export type LogSource = 'manual' | 'database' | 'favorite' | 'recent' | 'ai-scan';

export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD (local)
  timestamp: number;
  foodName: string;
  proteinGrams: number;
  mealType?: MealType;
  source?: LogSource;
  // AI scan metadata (only present when source === 'ai-scan')
  aiDetectedName?: string;
  aiEstimatedGrams?: number;
  aiConfidence?: number;
  aiPortion?: string;
  aiEdited?: boolean;
  imageRef?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DailySummary {
  date: string;
  consumedProtein: number;
  targetProtein: number;
  remainingProtein: number;
  hitTarget: boolean;
  logCount: number;
}

export function calculateMacros(weight: number, activityLevel: ActivityLevel, goal: Goal) {
  // Protein g/kg by goal (per spec): Hypertrophy 1.8 / Maintenance 1.4 / Recovery 1.2
  let proteinMultiplier = 1.4;
  if (goal === 'hypertrophy') proteinMultiplier = 1.8;
  else if (goal === 'recovery') proteinMultiplier = 1.2;

  let activityMod = 1.55;
  if (activityLevel === 'active') activityMod = 1.75;
  if (activityLevel === 'recovery') activityMod = 1.3;

  const protein = Math.round(weight * proteinMultiplier);
  const bmr = weight * 22;
  const calories = Math.round(bmr * activityMod);
  const proteinCals = protein * 4;
  const fatCals = calories * 0.25;
  const fats = Math.round(fatCals / 9);
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);
  const mealFrequency = protein > 150 ? 5 : protein > 100 ? 4 : 3;
  return { protein, calories, carbs, fats, mealFrequency };
}

export function todayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
