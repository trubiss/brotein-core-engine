// Body Map — protein consistency turned into a visual avatar.
// Drives the colored body silhouette on the Dashboard.

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

export type Tier =
  | 'DORMANT'
  | 'NOVICE'
  | 'BUILDER'
  | 'FORGED'
  | 'ARCHITECT'
  | 'MONOLITH'
  | 'LEGEND';

export interface Milestone {
  day: number;
  groups: MuscleGroup[];
  tier: Tier;
  label: string;
}

// Each milestone records the tier that becomes active when reached.
export const MILESTONES: Milestone[] = [
  { day: 1, groups: ['abs'], tier: 'NOVICE', label: 'CORE ENGAGED' },
  { day: 3, groups: ['chest'], tier: 'NOVICE', label: 'CHEST ONLINE' },
  { day: 7, groups: ['shoulders', 'biceps', 'triceps'], tier: 'BUILDER', label: 'ARMS FORGED' },
  { day: 14, groups: ['quads', 'hamstrings'], tier: 'BUILDER', label: 'LEGS BUILT' },
  { day: 21, groups: ['lats', 'traps'], tier: 'FORGED', label: 'BACK FRAMED' },
  { day: 30, groups: ['glutes', 'calves'], tier: 'FORGED', label: 'POSTERIOR LOCKED' },
  { day: 60, groups: ['forearms', 'obliques'], tier: 'ARCHITECT', label: 'DETAIL LAYER' },
  { day: 90, groups: ['neck'], tier: 'MONOLITH', label: 'FULL ARCHITECTURE' },
  { day: 180, groups: [], tier: 'LEGEND', label: 'LEGEND STATUS' },
];

export const MAX_DAYS = 90;

export const TIER_COLORS: Record<Tier, string> = {
  DORMANT: 'hsl(0 0% 40%)',
  NOVICE: '#ef4444',     // red
  BUILDER: '#f97316',    // orange
  FORGED: '#22c55e',     // green
  ARCHITECT: '#3b82f6',  // blue
  MONOLITH: '#a855f7',   // purple
  LEGEND: '#ec4899',     // pink
};

export const TIER_ORDER: Tier[] = [
  'NOVICE',
  'BUILDER',
  'FORGED',
  'ARCHITECT',
  'MONOLITH',
  'LEGEND',
];

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

/** The tier that was active at the moment a given muscle group unlocked. */
export function tierForGroup(group: MuscleGroup): Tier | null {
  const m = MILESTONES.find(ms => ms.groups.includes(group));
  return m ? m.tier : null;
}

export function colorForGroup(group: MuscleGroup, hitDays: number): string | null {
  const unlocked = unlockedGroups(hitDays);
  if (!unlocked.has(group)) return null;
  const tier = tierForGroup(group);
  return tier ? TIER_COLORS[tier] : null;
}

export function nextMilestone(hitDays: number): Milestone | null {
  return MILESTONES.find(m => hitDays < m.day) ?? null;
}

export function progressPct(hitDays: number): number {
  return Math.min(100, Math.round((Math.min(hitDays, MAX_DAYS) / MAX_DAYS) * 100));
}
