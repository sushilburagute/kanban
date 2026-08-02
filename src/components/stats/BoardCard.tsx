import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { formatTimeDistance } from "@/lib/utils";
import type { BoardSnapshot } from "@/types/kanban";

export function BoardCard({ snapshot }: { snapshot: BoardSnapshot }) {
  const { id, name, total, done, perColumn, lastUpdatedAt, upcomingDueDate } = snapshot;
  const completion = total ? Math.round((done / total) * 100) : 0;

  const lastUpdatedLabel = lastUpdatedAt ? formatTimeDistance(new Date(lastUpdatedAt)) : "—";
  const upcomingDueLabel = upcomingDueDate
    ? `Next due ${formatTimeDistance(new Date(upcomingDueDate))}`
    : "No upcoming due dates";

  return (
    <Link
      href={`/boards/${id}`}
      className="group flex flex-col gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          {total} {total === 1 ? "card" : "cards"}
          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>done</span>
          <span>
            {done}/{total} · {completion}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <p className="font-mono text-xs leading-relaxed text-muted-foreground">
        {perColumn.map(({ column, count }, index) => (
          <span key={column.id}>
            {index > 0 ? " · " : ""}
            {count} {column.title.toLowerCase()}
          </span>
        ))}
      </p>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Last activity {lastUpdatedLabel}</p>
        <p>{upcomingDueLabel}</p>
      </div>
    </Link>
  );
}
