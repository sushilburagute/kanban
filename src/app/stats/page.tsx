"use client";

import * as React from "react";

import { BoardCard } from "@/components/stats/BoardCard";
import { MetricCard } from "@/components/stats/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceHydration } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/store/workspace";
import { formatTimeDistance } from "@/lib/utils";
import type { BoardSnapshot } from "@/types/kanban";

export default function StatsPage() {
  const hydrated = useWorkspaceHydration();
  const boards = useWorkspaceStore((state) => state.boards);
  const tasksByBoard = useWorkspaceStore((state) => state.tasksByBoard);

  const [tasksReady, setTasksReady] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    let active = true;
    void useWorkspaceStore
      .getState()
      .loadAllTasks()
      .finally(() => {
        if (active) setTasksReady(true);
      });
    return () => {
      active = false;
    };
  }, [hydrated, boards]);

  const snapshots = React.useMemo<BoardSnapshot[]>(() => {
    return boards.map((board) => {
      const tasks = tasksByBoard[board.id] ?? [];
      const doneColumns = new Set(
        board.columns.filter((column) => column.countsAsDone).map((column) => column.id)
      );

      let lastUpdatedAt: string | undefined;
      let upcomingDueDate: string | undefined;
      let done = 0;
      const counts = new Map<string, number>();

      for (const task of tasks) {
        counts.set(task.columnId, (counts.get(task.columnId) ?? 0) + 1);
        if (doneColumns.has(task.columnId)) done += 1;

        if (!lastUpdatedAt || (task.updatedAt && task.updatedAt > lastUpdatedAt)) {
          lastUpdatedAt = task.updatedAt;
        }
        if (
          task.dueDate &&
          (!upcomingDueDate || new Date(task.dueDate).getTime() < new Date(upcomingDueDate).getTime())
        ) {
          upcomingDueDate = task.dueDate;
        }
      }

      return {
        id: board.id,
        name: board.name,
        total: tasks.length,
        done,
        perColumn: board.columns.map((column) => ({
          column,
          count: counts.get(column.id) ?? 0,
        })),
        lastUpdatedAt,
        upcomingDueDate,
      };
    });
  }, [boards, tasksByBoard]);

  const aggregate = React.useMemo(() => {
    let totalTasks = 0;
    let done = 0;
    let lastUpdatedAt: string | undefined;

    for (const snapshot of snapshots) {
      totalTasks += snapshot.total;
      done += snapshot.done;
      if (snapshot.lastUpdatedAt && (!lastUpdatedAt || snapshot.lastUpdatedAt > lastUpdatedAt)) {
        lastUpdatedAt = snapshot.lastUpdatedAt;
      }
    }

    return {
      totalBoards: snapshots.length,
      totalTasks,
      done,
      inMotion: totalTasks - done,
      completionRate: totalTasks ? Math.round((done / totalTasks) * 100) : 0,
      lastUpdatedAt,
    };
  }, [snapshots]);

  const isReady = hydrated && tasksReady;
  const lastUpdatedLabel = aggregate.lastUpdatedAt
    ? formatTimeDistance(new Date(aggregate.lastUpdatedAt))
    : "—";

  return (
    <main className="min-h-screen w-full bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-1.5">
          <p className="eyebrow text-muted-foreground">Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            How work is flowing across your boards, straight from the data on this device.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Boards" value={isReady ? aggregate.totalBoards.toString() : "…"} />
          <MetricCard
            label="Cards done"
            value={isReady ? aggregate.done.toString() : "…"}
            hint={
              isReady && aggregate.completionRate
                ? `${aggregate.completionRate}% of everything`
                : undefined
            }
          />
          <MetricCard label="In motion" value={isReady ? aggregate.inMotion.toString() : "…"} />
          <MetricCard label="Last activity" value={isReady ? lastUpdatedLabel : "…"} />
        </section>

        <section className="space-y-3">
          <h2 className="eyebrow text-muted-foreground">Boards at a glance</h2>

          <div className="grid gap-3 lg:grid-cols-2">
            {!isReady
              ? Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="rounded-lg border bg-card p-5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-5 h-2 w-full" />
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  </div>
                ))
              : snapshots.map((snapshot) => <BoardCard key={snapshot.id} snapshot={snapshot} />)}

            {isReady && snapshots.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground lg:col-span-2">
                Nothing to measure yet. Create a board from the sidebar to start tracking flow.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
