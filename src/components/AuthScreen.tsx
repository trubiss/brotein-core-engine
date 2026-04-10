interface Props {
  data: { name: string; email: string; password: string };
  onUpdate: (d: Partial<Props['data']>) => void;
  onNext: () => void;
}

export default function AuthScreen({ data, onUpdate, onNext }: Props) {
  const canProceed = data.name && data.email && data.password;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="pt-16">
        <h1 className="text-4xl font-bold tracking-[0.15em] mb-4">BROTEIN</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Architectural nutrition for the disciplined athlete. Construct your physique with mathematical precision.
        </p>
      </div>

      <div className="space-y-8 py-12">
        <div>
          <label className="label-spaced">Name</label>
          <input
            className="input-underline"
            placeholder="Enter your name"
            value={data.name}
            onChange={e => onUpdate({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="label-spaced">Email</label>
          <input
            className="input-underline"
            type="email"
            placeholder="Enter your email"
            value={data.email}
            onChange={e => onUpdate({ email: e.target.value })}
          />
        </div>
        <div>
          <label className="label-spaced">Password</label>
          <input
            className="input-underline"
            type="password"
            placeholder="Enter your password"
            value={data.password}
            onChange={e => onUpdate({ password: e.target.value })}
          />
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={!canProceed}
        onClick={onNext}
        style={{ opacity: canProceed ? 1 : 0.3 }}
      >
        INITIALIZE SYSTEM
      </button>
    </div>
  );
}
