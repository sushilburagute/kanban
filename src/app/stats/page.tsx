"use client";

import * as React from "react";
import { CircleCheck, Kanban, ListChecks, TimerReset } from "lucide-react";

import { useBoards } from "@/components/contexts/BoardsProvider";
import { createSeedTasks, normalizeTaskOrder } from "@/lib/kanban";
import { readStoredTasks, writeStoredTasks } from "@/lib/task-storage";
import type { KanbanTask, TaskStatus } from "@/types/Tasks";

type BoardSnapshot = {
  id: string;
  name: string;
  tasksByStatus: Record<TaskStatus, KanbanTask[]>;
  total: number;
  done: number;
  todo: number;
  inProgress: number;
  lastUpdatedAt?: string;
  upcomingDueDate?: string;
};

export default function StatsPage() {
  const { boards, isLoading } = useBoards();
  const seedTasksFactory = React.useCallback(() => createSeedTasks(), []);

  const [snapshots, setSnapshots] = React.useState<BoardSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = React.useState(true);

  React.useEffect(() => {
    if (isLoading) return;

    let active = true;
    setLoadingSnapshots(true);

    async function loadSnapshots() {
      const results: BoardSnapshot[] = [];

      for (const board of boards) {
        const stored = await readStoredTasks(board.id);

        let tasks = stored.tasks ?? seedTasksFactory();
        tasks = normalizeTaskOrder(tasks);

        if (stored.migrateLegacy) {
          await writeStoredTasks(board.id, tasks);
        }

        const tasksByStatus: Record<TaskStatus, KanbanTask[]> = {
          Todo: [],
          InProgress: [],
          Done: [],
        };

        let lastUpdatedAt: string | undefined;
        let upcomingDueDate: string | undefined;

        for (const task of tasks) {
          tasksByStatus[task.status].push(task);

          if (!lastUpdatedAt || (task.updatedAt && task.updatedAt > lastUpdatedAt)) {
            lastUpdatedAt = task.updatedAt;
          }

          if (task.dueDate) {
            if (
              !upcomingDueDate ||
              new Date(task.dueDate).getTime() < new Date(upcomingDueDate).getTime()
            ) {
              upcomingDueDate = task.dueDate;
            }
          }
        }

        results.push({
          id: board.id,
          name: board.name,
          tasksByStatus,
          total: tasks.length,
          done: tasksByStatus.Done.length,
          todo: tasksByStatus.Todo.length,
          inProgress: tasksByStatus.InProgress.length,
          lastUpdatedAt,
          upcomingDueDate,
        });
      }

      if (!active) return;
      setSnapshots(results);
      setLoadingSnapshots(false);
    }

    void loadSnapshots();

    return () => {
      active = false;
    };
  }, [boards, isLoading, seedTasksFactory]);

  const aggregate = React.useMemo(() => {
    if (!snapshots.length) {
      return {
        totalBoards: 0,
        totalTasks: 0,
        done: 0,
        inProgress: 0,
        todo: 0,
        completionRate: 0,
        lastUpdatedAt: undefined as string | undefined,
      };
    }

    let totalTasks = 0;
    let done = 0;
    let inProgress = 0;
    let todo = 0;
    let lastUpdatedAt: string | undefined;

    for (const snapshot of snapshots) {
      totalTasks += snapshot.total;
      done += snapshot.done;
      inProgress += snapshot.inProgress;
      todo += snapshot.todo;

      if (
        snapshot.lastUpdatedAt &&
        (!lastUpdatedAt || snapshot.lastUpdatedAt > lastUpdatedAt)
      ) {
        lastUpdatedAt = snapshot.lastUpdatedAt;
      }
    }

    const completionRate = totalTasks
      ? Math.round((done / totalTasks) * 100)
      : 0;

    return {
      totalBoards: snapshots.length,
      totalTasks,
      done,
      inProgress,
      todo,
      completionRate,
      lastUpdatedAt,
    };
  }, [snapshots]);

  const lastUpdatedLabel = aggregate.lastUpdatedAt
    ? formatTimeDistance(new Date(aggregate.lastUpdatedAt))
    : "—";
  const isReady = !isLoading && !loadingSnapshots;

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Flow pulse
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Review how the work-in-progress pipeline is evolving across your boards. Everything updates automatically from the same data powering your kanban.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Kanban className="h-5 w-5" />}
            label="Active boards"
            value={aggregate.totalBoards.toString()}
          />
          <MetricCard
            icon={<CircleCheck className="h-5 w-5" />}
            label="Cards shipped"
            value={aggregate.done.toString()}
            hint={
              aggregate.completionRate
                ? `${aggregate.completionRate}% overall completion`
                : undefined
            }
          />
          <MetricCard
            icon={<ListChecks className="h-5 w-5" />}
            label="In motion"
            value={aggregate.inProgress.toString()}
            hint={`${aggregate.todo} waiting in backlog`}
          />
          <MetricCard
            icon={<TimerReset className="h-5 w-5" />}
            label="Last activity"
            value={lastUpdatedLabel}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Boards at a glance
            </h2>
            <span className="text-xs text-muted-foreground">
              Updated {isReady ? lastUpdatedLabel : "…"}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {isReady && snapshots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-card/80 p-10 text-center text-sm text-muted-foreground">
                No boards yet. Create your first board from the sidebar to start tracking flow.
              </div>
            ) : null}

            {(!isReady ? Array.from({ length: 2 }) : snapshots).map((snapshot, index) =>
              !isReady ? (
                <div
                  key={`placeholder-${index}`}
                  className="rounded-2xl border border-border/60 bg-card/60 p-6"
                >
                  <div className="h-5 w-32 rounded bg-muted" />
                  <div className="mt-6 h-2 w-full rounded-full bg-muted" />
                  <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                  </div>
                </div>
              ) : (
                <BoardCard key={snapshot.id} snapshot={snapshot} />
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
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
      {hint ? (
        <div className="mt-2 text-xs text-muted-foreground/80">{hint}</div>
      ) : null}
    </div>
  );
}

function BoardCard({ snapshot }: { snapshot: BoardSnapshot }) {
  const { name, total, done, inProgress, todo, lastUpdatedAt, upcomingDueDate } = snapshot;
  const completion = total ? Math.round((done / total) * 100) : 0;
  const statusLine = [
    `${done} done`,
    `${inProgress} in progress`,
    `${todo} queued`,
  ].join(" · ");

  const lastUpdatedLabel = lastUpdatedAt
    ? formatTimeDistance(new Date(lastUpdatedAt))
    : "—";

  const upcomingDueLabel = upcomingDueDate
    ? formatTimeDistance(new Date(upcomingDueDate))
    : "No upcoming due dates";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {total} cards
        </span>
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

function formatTimeDistance(date: Date) {
  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return formatter.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return formatter.format(diffYears, "year");
}
