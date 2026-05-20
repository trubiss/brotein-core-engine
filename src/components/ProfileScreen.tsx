import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { updateProfileFields } from '@/lib/firestore';
import { Goal } from '@/lib/types';
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
  const [weight, setWeight] = useState(profile?.weight ?? 0);
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'hypertrophy');
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user || !profile) return null;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProfileFields(user.uid, { weight: Number(weight), goal });
      await refreshProfile();
      toast.success('Profile updated · target recalculated');
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div className="screen-container relative isolate" variants={stagger} initial="initial" animate="animate">
      <AmbientGrid opacity={0.035} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 overflow-hidden -z-10 motion-reduce:hidden">
        <div
          className="absolute inset-x-0 h-px bg-foreground/40 animate-scanline-drift"
          style={{ top: 0 }}
        />
      </div>
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
            <motion.div variants={fadeUp}>
              <label className="label-spaced">BODY MASS (KG)</label>
              <input className="input-underline" type="number" inputMode="numeric" value={weight || ''} onChange={e => setWeight(Number(e.target.value))} />
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
              <button className="btn-outline flex-1" onClick={() => { setEditing(false); setWeight(profile.weight); setGoal(profile.goal); }} disabled={busy}>CANCEL</button>
              <button className="btn-primary flex-1" onClick={save} disabled={busy}>{busy ? '…' : 'SAVE'}</button>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div variants={fadeUp}>
              <p className="label-spaced">BODY MASS</p>
              <p className="text-lg font-bold">{profile.weight} KG</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <p className="label-spaced">HEIGHT</p>
              <p className="text-lg font-bold">{profile.height} CM</p>
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


      <motion.div variants={fadeUp} className="mt-12 pt-8 border-t-2 border-foreground space-y-3">
        <p className="label-spaced">ONBOARDING</p>
        <button
          className="w-full p-4 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform"
          onClick={() => {
            if (user) localStorage.removeItem(`brotein_story_seen:${user.uid}`);
            location.reload();
          }}
        >
          REPLAY ONBOARDING STORY
        </button>
      </motion.div>

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
