import { Identity, tierFor, progressToNext } from '@/lib/identity';
import AnatomyFigure from './AnatomyFigure';

interface Props {
  identity: Identity;
  score: number;
  streak: number;
}

export default function IdentityShareCard({ identity, score, streak }: Props) {
  const tier = tierFor(identity);
  const next = progressToNext(score, identity);
  const stamp = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <div className="border-2 border-foreground bg-background text-foreground p-6 aspect-[4/5] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <p className="font-display text-[10px] font-black tracking-[0.25em]">BROTEIN</p>
        <p className="font-display text-[10px] font-bold tracking-[0.25em] text-muted-foreground">PROTEIN IDENTITY</p>
      </div>

      <div className="flex items-center gap-5 min-w-0">
        <AnatomyFigure identity={identity} size="hero" />
        <div className="min-w-0 flex-1">
          <p
            className="font-display font-black leading-none tracking-[0.06em] break-words"
            style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}
          >
            {tier.label}
          </p>
          <p className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground/80 mt-4 leading-snug">
            {next.nextId
              ? `${next.pointsToNext} PTS UNTIL ${next.nextLabel}`
              : 'MAX IDENTITY REACHED'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-display text-[10px] font-bold tracking-[0.22em]">STREAK · {streak}D</p>
        <p className="font-display text-[10px] font-bold tracking-[0.22em] text-muted-foreground">{stamp}</p>
      </div>
    </div>
  );
}
