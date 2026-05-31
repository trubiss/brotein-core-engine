import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { ReminderSettings, getReminderSettings, saveReminderSettings, DEFAULT_REMINDERS } from '@/lib/reminders';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import {
  isNative,
  getNotificationPermissionState,
  ensureNotificationPermission,
  scheduleFromSettings,
  sendTestNotification,
  cancelAllReminders,
  type NotificationPermissionState,
} from '@/lib/native';

export default function ReminderSettingsPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [busy, setBusy] = useState(false);
  const [permState, setPermState] = useState<NotificationPermissionState>('unsupported');

  useEffect(() => {
    setSettings(getReminderSettings(profile));
  }, [profile]);

  useEffect(() => {
    if (!isNative()) return;
    getNotificationPermissionState().then(setPermState);
  }, []);

  if (!user) return null;

  const persist = async (next: ReminderSettings) => {
    setSettings(next);
    if (busy) return;
    setBusy(true);
    try {
      await saveReminderSettings(user.uid, next);
      await refreshProfile();
      // Immediately reschedule on-device so changes take effect now
      if (isNative() && permState === 'granted') {
        if (next.enabled) await scheduleFromSettings(next);
        else await cancelAllReminders();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleEnableDevice = async () => {
    const ok = await ensureNotificationPermission();
    const next = await getNotificationPermissionState();
    setPermState(next);
    if (ok) {
      await scheduleFromSettings(settings);
      toast.success('NOTIFICATIONS ENABLED');
    } else {
      toast.error('Permission denied — enable in iOS Settings → Brotein');
    }
  };

  const handleTest = async () => {
    const ok = await sendTestNotification();
    if (ok) toast('TEST SENT', { description: 'Notification will fire in ~5 seconds. Lock your screen to see it.' });
    else toast.error('Could not send test notification');
  };

  const Toggle = ({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) => (
    <button
      onClick={onChange}
      className={`w-12 h-7 border-2 border-foreground relative transition-colors duration-200 shrink-0 ${
        on ? 'bg-foreground' : 'bg-background'
      }`}
      aria-label={label}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 transition-all duration-200 ${
          on ? 'right-0.5 bg-background' : 'left-0.5 bg-foreground'
        }`}
      />
    </button>
  );

  const slots: { key: 'morning' | 'midday' | 'evening'; label: string }[] = [
    { key: 'morning', label: 'MORNING' },
    { key: 'midday', label: 'MIDDAY' },
    { key: 'evening', label: 'EVENING' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 border-t-2 border-foreground pt-8"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={14} strokeWidth={2.5} />
          <p className="label-spaced mb-0 truncate">REMINDERS</p>
        </div>
        <Toggle on={settings.enabled} onChange={() => persist({ ...settings, enabled: !settings.enabled })} label="Toggle reminders" />
      </div>

      <div className={`space-y-5 ${settings.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
        {slots.map(s => {
          const cfg = settings[s.key];
          return (
            <div key={s.key} className="flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-[0.2em] uppercase">{s.label}</p>
                <input
                  type="time"
                  value={cfg.time}
                  onChange={e => persist({ ...settings, [s.key]: { ...cfg, time: e.target.value } })}
                  className="bg-transparent border-b-2 border-foreground font-display text-base font-bold tracking-widest mt-1 focus:outline-none"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <Toggle
                on={cfg.enabled}
                onChange={() => persist({ ...settings, [s.key]: { ...cfg, enabled: !cfg.enabled } })}
                label={`Toggle ${s.label}`}
              />
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-3 min-w-0 pt-3 border-t border-border">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.2em] uppercase">BEHIND TARGET</p>
            <p className="text-[10px] text-muted-foreground tracking-wider mt-1 uppercase">
              ALERT IF UNDER {settings.behindTarget.thresholdPct}% BY EVENING
            </p>
          </div>
          <Toggle
            on={settings.behindTarget.enabled}
            onChange={() => persist({
              ...settings,
              behindTarget: { ...settings.behindTarget, enabled: !settings.behindTarget.enabled },
            })}
            label="Toggle behind target"
          />
        </div>
      </div>

      {/* Device-level permission UX (native only) */}
      {isNative() && (
        <div className="mt-6 pt-6 border-t-2 border-foreground space-y-3">
          {permState === 'prompt' && (
            <button
              onClick={handleEnableDevice}
              className="w-full text-xs font-bold tracking-[0.2em] uppercase py-3 border-2 border-foreground bg-foreground text-background hover:opacity-80 transition-opacity"
            >
              ENABLE ON THIS DEVICE
            </button>
          )}
          {permState === 'denied' && (
            <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase leading-relaxed">
              NOTIFICATIONS BLOCKED · ENABLE IN iOS SETTINGS → BROTEIN → NOTIFICATIONS
            </p>
          )}
        </div>
      )}

      {!isNative() && (
        <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-6">
          IN-APP NOTICES ON WEB · PUSH ACTIVE IN THE iOS APP
        </p>
      )}
    </motion.div>
  );
}
