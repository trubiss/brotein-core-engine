// Unit system: storage is always metric (kg, cm). Display can be metric or imperial.

export type UnitSystem = 'metric' | 'imperial';

const IMPERIAL_LOCALES = ['en-US', 'en-LR', 'en-MM'];

export function getDefaultUnits(): UnitSystem {
  try {
    const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    return IMPERIAL_LOCALES.some(l => locale.startsWith(l)) ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

// ---- Weight ----
export const kgToLbs = (kg: number) => kg * 2.2046226218;
export const lbsToKg = (lbs: number) => lbs / 2.2046226218;

export function displayWeight(kg: number, units: UnitSystem): number {
  if (!kg) return 0;
  return units === 'imperial' ? Math.round(kgToLbs(kg)) : Math.round(kg);
}

export function parseWeightInput(value: number, units: UnitSystem): number {
  // Returns kg for storage
  if (!value) return 0;
  return units === 'imperial' ? Math.round(lbsToKg(value) * 10) / 10 : value;
}

// ---- Height ----
export const cmToInches = (cm: number) => cm / 2.54;
export const inchesToCm = (inches: number) => inches * 2.54;

export function cmToFtIn(cm: number): { ft: number; in: number } {
  if (!cm) return { ft: 0, in: 0 };
  const totalInches = Math.round(cmToInches(cm));
  return { ft: Math.floor(totalInches / 12), in: totalInches % 12 };
}

export function ftInToCm(ft: number, inches: number): number {
  return Math.round(inchesToCm((ft || 0) * 12 + (inches || 0)));
}

export const WEIGHT_UNIT = (u: UnitSystem) => (u === 'imperial' ? 'LBS' : 'KG');
