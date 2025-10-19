import { formatTimeDistance } from "@/lib/utils";
import { BoardSnapshot } from "@/types/BoardSnapshot";
import { CircleCheck, TimerReset } from "lucide-react";

export function BoardCard({ snapshot }: { snapshot: BoardSnapshot }) {
  const { name, total, done, inProgress, todo, lastUpdatedAt, upcomingDueDate } = snapshot;
  const completion = total ? Math.round((done / total) * 100) : 0;
  const statusLine = [`${done} done`, `${inProgress} in progress`, `${todo} queued`].join(" · ");

  const lastUpdatedLabel = lastUpdatedAt ? formatTimeDistance(new Date(lastUpdatedAt)) : "—";

  const upcomingDueLabel = upcomingDueDate
    ? formatTimeDistance(new Date(upcomingDueDate))
    : "No upcoming due dates";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{total} cards</span>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Completion</span>
          <span>{completion}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>{statusLine}</p>
        <p className="flex items-center gap-2">
          <TimerReset className="h-4 w-4" />
          <span>Last activity {lastUpdatedLabel}</span>
        </p>
        <p className="flex items-center gap-2">
          <CircleCheck className="h-4 w-4" />
          <span>{upcomingDueLabel}</span>
        </p>
      </div>
    </div>
  );
}
