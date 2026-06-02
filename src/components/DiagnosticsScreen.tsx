import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { AmbientGrid } from './ui/AmbientGrid';
import pkg from '../../package.json';

interface Props {
  onBack: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function DiagnosticsScreen({ onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const bundleVersion = pkg.version ?? 'unknown';
  const buildTimestamp = __BUILD_TIMESTAMP__;
  const capDevEnabled = __CAP_DEV__;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'N/A';
  const screenSize = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A';
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 'N/A';
  const language = typeof navigator !== 'undefined' ? navigator.language : 'N/A';
  const online = typeof navigator !== 'undefined' ? navigator.onLine : 'N/A';

  const allInfo = [
    `Bundle Version: ${bundleVersion}`,
    `Build Timestamp: ${buildTimestamp}`,
    `CAP_DEV Enabled: ${capDevEnabled ? 'YES' : 'NO'}`,
    `User Agent: ${userAgent}`,
    `Platform: ${platform}`,
    `Screen: ${screenSize}`,
    `Pixel Ratio: ${devicePixelRatio}`,
    `Language: ${language}`,
    `Online: ${online}`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  return (
    <motion.div className="screen-container relative isolate" variants={stagger} initial="initial" animate="animate">
      <AmbientGrid opacity={0.035} />
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-12 min-w-0">
        <button onClick={onBack} className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em] truncate flex-1">DIAGNOSTICS</h1>
      </motion.div>

      <div className="space-y-6">
        <motion.div variants={fadeUp}>
          <p className="label-spaced">BUNDLE VERSION</p>
          <p className="text-lg font-bold font-mono">{bundleVersion}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">BUILD TIMESTAMP</p>
          <p className="text-lg font-bold font-mono">{buildTimestamp}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">CAP_DEV ENABLED</p>
          <p className={`text-lg font-bold font-mono ${capDevEnabled ? 'text-destructive' : ''}`}>
            {capDevEnabled ? 'YES — REMOTE SERVER' : 'NO — BUNDLED'}
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">PLATFORM</p>
          <p className="text-lg font-bold font-mono">{platform}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">SCREEN SIZE</p>
          <p className="text-lg font-bold font-mono">{screenSize}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">DEVICE PIXEL RATIO</p>
          <p className="text-lg font-bold font-mono">{devicePixelRatio}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">LANGUAGE</p>
          <p className="text-lg font-bold font-mono">{language}</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="label-spaced">ONLINE STATUS</p>
          <p className="text-lg font-bold font-mono">{online ? 'ONLINE' : 'OFFLINE'}</p>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="mt-10 pt-8 border-t-2 border-foreground">
        <button
          className="w-full p-4 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          onClick={handleCopy}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'COPIED TO CLIPBOARD' : 'COPY ALL INFO'}
        </button>
      </motion.div>
    </motion.div>
  );
}
