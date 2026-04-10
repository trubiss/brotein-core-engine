import { useState } from 'react';
import { motion } from 'framer-motion';
import { getProfile, saveProfile } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function ProfileScreen({ onBack }: Props) {
  const profile = getProfile()!;
  const [notifications, setNotifications] = useState(profile.notifications);

  const toggleNotifications = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    saveProfile({ ...profile, notifications: newVal });
  };

  return (
    <motion.div className="screen-container" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-14">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em]">PROFILE</h1>
      </motion.div>

      <div className="space-y-10">
        <motion.div variants={fadeUp}>
          <p className="label-spaced">NAME</p>
          <p className="text-lg font-bold">{profile.name}</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <p className="label-spaced">BODY MASS</p>
          <p className="text-lg font-bold">{profile.weight} KG</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <p className="label-spaced">HEIGHT</p>
          <p className="text-lg font-bold">{profile.height} CM</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <p className="label-spaced">DAILY PROTEIN TARGET</p>
          <p className="text-3xl font-black font-display">{profile.dailyProtein}G</p>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="mt-14 border-t-2 border-foreground pt-10">
        <div className="flex items-center justify-between">
          <p className="label-spaced mb-0">NOTIFICATIONS</p>
          <button
            onClick={toggleNotifications}
            className={`w-14 h-8 border-2 border-foreground relative transition-colors duration-200 ${
              notifications ? 'bg-foreground' : 'bg-background'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 transition-all duration-200 ${
                notifications
                  ? 'right-0.5 bg-background'
                  : 'left-0.5 bg-foreground'
              }`}
            />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
