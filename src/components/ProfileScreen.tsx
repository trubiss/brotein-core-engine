import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { updateProfileFields } from '@/lib/firestore';
import { Goal, goalLabel } from '@/lib/types';
import {
  UnitSystem, getDefaultUnits,
  displayWeight, parseWeightInput,
  cmToFtIn,
} from '@/lib/units';
import { ArrowLeft, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import ReminderSettingsPanel from './ReminderSettingsPanel';
import SubscriptionPanel from './SubscriptionPanel';
import DeleteAccountModal from './DeleteAccountModal';
import { AmbientGrid } from './ui/AmbientGrid';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'hypertrophy', label: 'BUILD' },
  { value: 'equilibrium', label: 'MAINTAIN' },
  { value: 'recovery', label: 'RECOVER' },
];

export default function ProfileScreen({ onBack }: Props) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const initialUnits: UnitSystem = (profile?.units as UnitSystem) ?? getDefaultUnits();
  const [units, setUnits] = useState<UnitSystem>(initialUnits);
  const [weight, setWeight] = useState(profile?.weight ?? 0); // stored as kg
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'hypertrophy');
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Display strings for inputs
  const [weightStr, setWeightStr] = useState<string>(
    profile?.weight ? String(displayWeight(profile.weight, initialUnits)) : ''
  );

  if (!user || !profile) return null;

  const onWeightChange = (v: string) => {
    setWeightStr(v);
    const n = Number(v);
    setWeight(n ? parseWeightInput(n, units) : 0);
  };

  const onToggleUnits = (next: UnitSystem) => {
    setUnits(next);
    // Re-render the displayed weight from stored kg
    setWeightStr(weight ? String(displayWeight(weight, next)) : '');
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProfileFields(user.uid, { weight: Number(weight), goal, units });
      await refreshProfile();
      toast.success('Profile updated · target recalculated');
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const displayUnits: UnitSystem = (profile.units as UnitSystem) ?? getDefaultUnits();
  const heightDisplay = displayUnits === 'imperial'
    ? (() => { const { ft, in: i } = cmToFtIn(profile.height); return `${ft}'${i}"`; })()
    : `${profile.height} CM`;
  const weightDisplay = `${displayWeight(profile.weight, displayUnits)} ${displayUnits === 'imperial' ? 'LBS' : 'KG'}`;

  return (
    <motion.div className="screen-container relative isolate" variants={stagger} initial="initial" animate="animate">
      <AmbientGrid opacity={0.035} />
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-12 min-w-0">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em] truncate flex-1">PROFILE</h1>
        <button onClick={signOut} className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </motion.div>

      <div className="space-y-8">
        <motion.div variants={fadeUp} className="min-w-0">
          <p className="label-spaced">NAME</p>
          <p className="text-lg font-bold break-words">{profile.name}</p>
        </motion.div>
        <motion.div variants={fadeUp} className="min-w-0">
          <p className="label-spaced">EMAIL</p>
          <p className="text-sm break-all">{profile.email}</p>
        </motion.div>

        {editing ? (
          <>
            <motion.div variants={fadeUp} className="flex items-center justify-between">
              <span className="label-spaced">UNITS</span>
              <div className="inline-flex border-2 border-foreground">
                {(['metric', 'imperial'] as UnitSystem[]).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onToggleUnits(u)}
                    className={`px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                      units === u ? 'bg-foreground text-background' : 'bg-background text-foreground/60'
                    }`}
                  >
                    {u === 'metric' ? 'KG / CM' : 'LBS / FT'}
                  </button>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <label className="label-spaced">BODY MASS ({units === 'imperial' ? 'LBS' : 'KG'})</label>
              <input
                className="input-underline"
                type="number"
                inputMode="decimal"
                value={weightStr}
                onChange={e => onWeightChange(e.target.value)}
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <label className="label-spaced">GOAL</label>
              <div className="grid grid-cols-3 gap-3">
                {GOAL_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`h-14 flex items-center justify-center border-2 border-foreground font-display text-[13px] font-black tracking-[0.18em] uppercase transition-colors active:scale-[0.97] ${
                      goal === g.value ? 'bg-foreground text-background' : 'bg-background text-foreground'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex gap-3">
              <button
                className="btn-outline flex-1"
                onClick={() => {
                  setEditing(false);
                  setWeight(profile.weight);
                  setGoal(profile.goal);
                  setUnits(initialUnits);
                  setWeightStr(profile.weight ? String(displayWeight(profile.weight, initialUnits)) : '');
                }}
                disabled={busy}
              >
                CANCEL
              </button>
              <button className="btn-primary flex-1" onClick={save} disabled={busy}>{busy ? '…' : 'SAVE'}</button>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div variants={fadeUp}>
              <p className="label-spaced">BODY MASS</p>
              <p className="text-lg font-bold">{weightDisplay}</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <p className="label-spaced">HEIGHT</p>
              <p className="text-lg font-bold">{heightDisplay}</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <p className="label-spaced">GOAL</p>
              <p className="text-lg font-bold uppercase">{profile.goal}</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <p className="label-spaced">DAILY PROTEIN TARGET</p>
              <p className="text-3xl font-black font-display">{profile.dailyProtein}G</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <button className="btn-outline" onClick={() => setEditing(true)}>EDIT PROFILE</button>
            </motion.div>
          </>
        )}
      </div>

      <ReminderSettingsPanel />

      <SubscriptionPanel />

      <motion.div variants={fadeUp} className="mt-10 pt-8 border-t-2 border-foreground space-y-3">
        <p className="label-spaced">LEGAL</p>
        <button
          className="w-full p-4 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform text-left"
          onClick={() => navigate('/privacy')}
        >
          PRIVACY POLICY
        </button>
        <button
          className="w-full p-4 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform text-left"
          onClick={() => navigate('/terms')}
        >
          TERMS OF SERVICE
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-10 pt-8 border-t-2 border-foreground space-y-3">
        <p className="label-spaced">DANGER ZONE</p>
        <button
          className="w-full p-4 border-2 border-destructive text-destructive font-mono font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-transform"
          onClick={() => setDeleteOpen(true)}
        >
          DELETE ACCOUNT
        </button>
      </motion.div>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </motion.div>
  );
}
