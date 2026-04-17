import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { updateProfileFields } from '@/lib/firestore';
import { Goal } from '@/lib/types';
import { ArrowLeft, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface Props { onBack: () => void; }

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'hypertrophy', label: 'HYPER' },
  { value: 'equilibrium', label: 'MAINT' },
  { value: 'recovery', label: 'RECOV' },
];

export default function ProfileScreen({ onBack }: Props) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(profile?.weight ?? 0);
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'hypertrophy');
  const [busy, setBusy] = useState(false);

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

  const toggleNotifications = async () => {
    await updateProfileFields(user.uid, { notifications: !profile.notifications });
    await refreshProfile();
  };

  return (
    <motion.div className="screen-container" variants={stagger} initial="initial" animate="animate">
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
              <div className="grid grid-cols-3 gap-2">
                {GOAL_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-3 border-2 text-xs font-bold tracking-widest ${
                      goal === g.value ? 'border-foreground bg-foreground text-background' : 'border-foreground'
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

      <motion.div variants={fadeUp} className="mt-12 border-t-2 border-foreground pt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="label-spaced mb-0 truncate">NOTIFICATIONS</p>
          <button
            onClick={toggleNotifications}
            className={`w-14 h-8 border-2 border-foreground relative transition-colors duration-200 shrink-0 ${
              profile.notifications ? 'bg-foreground' : 'bg-background'
            }`}
            aria-label="Toggle notifications"
          >
            <div className={`absolute top-0.5 w-6 h-6 transition-all duration-200 ${
              profile.notifications ? 'right-0.5 bg-background' : 'left-0.5 bg-foreground'
            }`} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
