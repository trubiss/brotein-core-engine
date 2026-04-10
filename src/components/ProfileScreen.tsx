import { useState } from 'react';
import { getProfile, saveProfile } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: Props) {
  const profile = getProfile()!;
  const [notifications, setNotifications] = useState(profile.notifications);

  const toggleNotifications = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    saveProfile({ ...profile, notifications: newVal });
  };

  return (
    <div className="screen-container">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={onBack} className="p-2 border-2 border-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-[0.1em]">PROFILE</h1>
      </div>

      <div className="space-y-8">
        <div>
          <p className="label-spaced">Name</p>
          <p className="text-lg font-bold">{profile.name}</p>
        </div>
        <div>
          <p className="label-spaced">Body Mass</p>
          <p className="text-lg font-bold">{profile.weight} kg</p>
        </div>
        <div>
          <p className="label-spaced">Height</p>
          <p className="text-lg font-bold">{profile.height} cm</p>
        </div>
        <div>
          <p className="label-spaced">Daily Protein Target</p>
          <p className="text-3xl font-bold font-display">{profile.dailyProtein}g</p>
        </div>
      </div>

      <div className="mt-12 border-t-2 border-foreground pt-8">
        <div className="flex items-center justify-between">
          <p className="label-spaced mb-0">Notifications</p>
          <button
            onClick={toggleNotifications}
            className={`w-14 h-8 border-2 border-foreground relative transition-all ${
              notifications ? 'bg-foreground' : 'bg-background'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 transition-all ${
                notifications
                  ? 'right-0.5 bg-background'
                  : 'left-0.5 bg-foreground'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
