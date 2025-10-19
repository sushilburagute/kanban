export function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}
