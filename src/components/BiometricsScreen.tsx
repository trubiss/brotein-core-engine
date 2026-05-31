import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import OnboardingHeader from './onboarding/OnboardingHeader';
import {
  UnitSystem, getDefaultUnits,
  displayWeight, parseWeightInput,
  cmToFtIn, ftInToCm,
} from '@/lib/units';

interface Props {
  data: { weight: number; height: number; age: number };
  onUpdate: (d: Partial<Props['data']> & { units?: UnitSystem }) => void;
  onNext: () => void;
  onBack: () => void;
  onManualOverride?: () => void;
  step?: number;
  total?: number;
  initialUnits?: UnitSystem;
}

export default function BiometricsScreen({
  data, onUpdate, onNext, onBack, onManualOverride, step = 1, total = 3, initialUnits,
}: Props) {
  const [units, setUnits] = useState<UnitSystem>(initialUnits ?? getDefaultUnits());
  const canProceed = data.weight > 0 && data.height > 0 && data.age > 0;

  // Local display state for weight (so user can type lbs naturally)
  const [weightStr, setWeightStr] = useState<string>(
    data.weight ? String(displayWeight(data.weight, units)) : ''
  );
  // Local display state for height (cm or ft+in)
  const initialFtIn = cmToFtIn(data.height);
  const [cmStr, setCmStr] = useState<string>(data.height ? String(data.height) : '');
  const [ftStr, setFtStr] = useState<string>(data.height ? String(initialFtIn.ft) : '');
  const [inStr, setInStr] = useState<string>(data.height ? String(initialFtIn.in) : '');

  // Re-sync inputs when units toggle (keep stored values intact)
  useEffect(() => {
    onUpdate({ units });
    setWeightStr(data.weight ? String(displayWeight(data.weight, units)) : '');
    if (units === 'metric') {
      setCmStr(data.height ? String(data.height) : '');
    } else {
      const { ft, in: i } = cmToFtIn(data.height);
      setFtStr(data.height ? String(ft) : '');
      setInStr(data.height ? String(i) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  const handleWeight = (v: string) => {
    setWeightStr(v);
    const n = Number(v);
    onUpdate({ weight: n ? parseWeightInput(n, units) : 0 });
  };

  const handleCm = (v: string) => {
    setCmStr(v);
    onUpdate({ height: Number(v) || 0 });
  };

  const handleFt = (v: string) => {
    setFtStr(v);
    onUpdate({ height: ftInToCm(Number(v), Number(inStr)) });
  };
  const handleIn = (v: string) => {
    setInStr(v);
    onUpdate({ height: ftInToCm(Number(ftStr), Number(v)) });
  };

  const UnitToggle = ({ value, options, onChange }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
  }) => (
    <div className="inline-flex border-2 border-foreground">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
            value === opt.value ? 'bg-foreground text-background' : 'bg-background text-foreground/60'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <OnboardingHeader step={step} total={total} onBack={onBack} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="px-1 pt-6"
      >
        <p className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase text-foreground/40 mb-3">
          // INPUT 01
        </p>
        <h1 className="font-mono font-black text-[40px] leading-[0.92] tracking-[-0.015em] uppercase">
          STRUCTURAL<br />DATA
        </h1>
        <p className="font-sans text-[13px] font-medium leading-[1.45] tracking-[0.01em] text-foreground/55 mt-3 max-w-[260px]">
          Three numbers. Used once to compute your target.
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center gap-7">
        {/* Global unit system toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-center justify-between"
        >
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/50">
            UNITS
          </span>
          <UnitToggle
            value={units}
            options={[{ value: 'metric', label: 'KG / CM' }, { value: 'imperial', label: 'LBS / FT' }]}
            onChange={v => setUnits(v as UnitSystem)}
          />
        </motion.div>

        {/* WEIGHT */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="bio-weight" className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/50">
              WEIGHT
            </label>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/30">
              {units === 'imperial' ? 'LBS' : 'KG'}
            </span>
          </div>
          <div className="relative">
            <input
              id="bio-weight"
              className="input-bio"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={weightStr}
              onChange={e => handleWeight(e.target.value)}
            />
            <motion.span
              initial={false}
              animate={{ opacity: data.weight > 0 ? 1 : 0, scale: data.weight > 0 ? 1 : 0.7 }}
              transition={{ duration: 0.2 }}
              className="absolute right-1 bottom-3 w-2 h-2 bg-foreground"
              aria-hidden
            />
          </div>
        </motion.div>

        {/* HEIGHT */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.17, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <label className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/50">
              HEIGHT
            </label>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/30">
              {units === 'imperial' ? 'FT / IN' : 'CM'}
            </span>
          </div>
          {units === 'metric' ? (
            <div className="relative">
              <input
                className="input-bio"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={cmStr}
                onChange={e => handleCm(e.target.value)}
              />
              <motion.span
                initial={false}
                animate={{ opacity: data.height > 0 ? 1 : 0, scale: data.height > 0 ? 1 : 0.7 }}
                transition={{ duration: 0.2 }}
                className="absolute right-1 bottom-3 w-2 h-2 bg-foreground"
                aria-hidden
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  className="input-bio"
                  type="number"
                  inputMode="numeric"
                  placeholder="FT"
                  value={ftStr}
                  onChange={e => handleFt(e.target.value)}
                />
                <span className="absolute right-1 bottom-3 font-mono text-[10px] font-bold tracking-[0.2em] text-foreground/40">FT</span>
              </div>
              <div className="relative">
                <input
                  className="input-bio"
                  type="number"
                  inputMode="numeric"
                  placeholder="IN"
                  value={inStr}
                  onChange={e => handleIn(e.target.value)}
                />
                <span className="absolute right-1 bottom-3 font-mono text-[10px] font-bold tracking-[0.2em] text-foreground/40">IN</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* AGE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="bio-age" className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/50">
              AGE
            </label>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/30">
              YRS
            </span>
          </div>
          <div className="relative">
            <input
              id="bio-age"
              className="input-bio"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={data.age || ''}
              onChange={e => onUpdate({ age: Number(e.target.value) })}
            />
            <motion.span
              initial={false}
              animate={{ opacity: data.age > 0 ? 1 : 0, scale: data.age > 0 ? 1 : 0.7 }}
              transition={{ duration: 0.2 }}
              className="absolute right-1 bottom-3 w-2 h-2 bg-foreground"
              aria-hidden
            />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="flex flex-col items-center gap-4 pt-8"
      >
        <button className="btn-cta" disabled={!canProceed} onClick={onNext}>
          CONTINUE
        </button>
        {onManualOverride && (
          <button
            onClick={onManualOverride}
            className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground active:opacity-60 py-2"
          >
            ALREADY KNOW YOUR TARGET →
          </button>
        )}
      </motion.div>
    </div>
  );
}
