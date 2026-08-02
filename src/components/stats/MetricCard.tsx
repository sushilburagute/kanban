export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {hint ? <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
