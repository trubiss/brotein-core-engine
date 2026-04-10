// Local storage based state management for Brotein

export interface UserProfile {
  name: string;
  email: string;
  weight: number;
  height: number;
  age: number;
  activityLevel: 'active' | 'moderate' | 'recovery';
  goal: 'hypertrophy' | 'equilibrium';
  dailyProtein: number;
  dailyCalories: number;
  dailyCarbs: number;
  dailyFats: number;
  mealFrequency: number;
  notifications: boolean;
}

export interface FoodLog {
  id: string;
  name: string;
  protein: number;
  timestamp: number;
  date: string; // YYYY-MM-DD
}

const PROFILE_KEY = 'brotein_profile';
const LOGS_KEY = 'brotein_logs';
const ONBOARDED_KEY = 'brotein_onboarded';

export function getProfile(): UserProfile | null {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true';
}

export function setOnboarded() {
  localStorage.setItem(ONBOARDED_KEY, 'true');
}

export function getLogs(): FoodLog[] {
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addLog(log: Omit<FoodLog, 'id' | 'timestamp' | 'date'>): FoodLog {
  const logs = getLogs();
  const now = new Date();
  const newLog: FoodLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: now.getTime(),
    date: now.toISOString().split('T')[0],
  };
  logs.unshift(newLog);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return newLog;
}

export function getTodayLogs(): FoodLog[] {
  const today = new Date().toISOString().split('T')[0];
  return getLogs().filter(l => l.date === today);
}

export function getTodayProtein(): number {
  return getTodayLogs().reduce((sum, l) => sum + l.protein, 0);
}

export function calculateMacros(weight: number, activityLevel: string, goal: string) {
  // Protein multiplier based on goal
  let proteinMultiplier = 1.6; // equilibrium
  if (goal === 'hypertrophy') proteinMultiplier = 2.2;

  // Activity modifier for calories
  let activityMod = 1.55; // moderate
  if (activityLevel === 'active') activityMod = 1.75;
  if (activityLevel === 'recovery') activityMod = 1.3;

  const protein = Math.round(weight * proteinMultiplier);
  const bmr = weight * 22; // simplified
  const calories = Math.round(bmr * activityMod);
  const proteinCals = protein * 4;
  const fatCals = calories * 0.25;
  const fats = Math.round(fatCals / 9);
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);
  const mealFrequency = protein > 150 ? 5 : protein > 100 ? 4 : 3;

  return { protein, calories, carbs, fats, mealFrequency };
}

export function getStreak(): number {
  const logs = getLogs();
  const profile = getProfile();
  if (!profile || logs.length === 0) return 0;

  const target = profile.dailyProtein;
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayProtein = logs.filter(l => l.date === dateStr).reduce((s, l) => s + l.protein, 0);

    if (dayProtein >= target) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}
