// Body Map — protein consistency turned into a visual avatar.
// Drives the brutalist body silhouette on the Dashboard.

export type MuscleGroup =
  | 'abs'
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'lats'
  | 'traps'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'obliques'
  | 'neck';

export type Tier = 'DORMANT' | 'NOVICE' | 'BUILDER' | 'FORGED' | 'ARCHITECT' | 'MONOLITH';

export interface Milestone {
  day: number;
  groups: MuscleGroup[];
  tier: Tier;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { day: 1, groups: ['abs'], tier: 'NOVICE', label: 'CORE ENGAGED' },
  { day: 3, groups: ['chest'], tier: 'NOVICE', label: 'CHEST ONLINE' },
  { day: 7, groups: ['shoulders', 'biceps', 'triceps'], tier: 'BUILDER', label: 'ARMS FORGED' },
  { day: 14, groups: ['quads', 'hamstrings'], tier: 'BUILDER', label: 'LEGS BUILT' },
  { day: 21, groups: ['lats', 'traps'], tier: 'FORGED', label: 'BACK FRAMED' },
  { day: 30, groups: ['glutes', 'calves'], tier: 'FORGED', label: 'POSTERIOR LOCKED' },
  { day: 60, groups: ['forearms', 'obliques'], tier: 'ARCHITECT', label: 'DETAIL LAYER' },
  { day: 90, groups: ['neck'], tier: 'MONOLITH', label: 'FULL ARCHITECTURE' },
];

export const MAX_DAYS = MILESTONES[MILESTONES.length - 1].day;

export function unlockedGroups(hitDays: number): Set<MuscleGroup> {
  const out = new Set<MuscleGroup>();
  for (const m of MILESTONES) {
    if (hitDays >= m.day) m.groups.forEach(g => out.add(g));
  }
  return out;
}

export function currentTier(hitDays: number): Tier {
  let tier: Tier = 'DORMANT';
  for (const m of MILESTONES) {
    if (hitDays >= m.day) tier = m.tier;
  }
  return tier;
}

export function nextMilestone(hitDays: number): Milestone | null {
  return MILESTONES.find(m => hitDays < m.day) ?? null;
}

export function progressPct(hitDays: number): number {
  return Math.min(100, Math.round((Math.min(hitDays, MAX_DAYS) / MAX_DAYS) * 100));
}
