"use client";

import * as React from "react";

import { normalizeTaskOrder } from "@/lib/kanban";
import { readStoredTasks, writeStoredTasks } from "@/lib/task-storage";
import type { KanbanTask } from "@/types/Tasks";

type TasksUpdater = (previous: KanbanTask[]) => KanbanTask[];

export function usePersistentKanbanTasks(
  seedTasksFactory: () => KanbanTask[],
  boardId: string
) {
  const [tasks, setTasks] = React.useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const skipNextPersistRef = React.useRef(true);

  const seedTasksRef = React.useRef<KanbanTask[] | null>(null);

  const getSeedTasks = React.useCallback(() => {
    if (!seedTasksRef.current) {
      seedTasksRef.current = normalizeTaskOrder(seedTasksFactory());
    }
    return seedTasksRef.current;
  }, [seedTasksFactory]);

  React.useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      if (typeof window === "undefined") {
        return;
      }

      setIsLoading(true);
      setTasks([]);

      try {
        const stored = await readStoredTasks(boardId);

        if (isCancelled) return;

        if (stored.tasks) {
          const normalized = normalizeTaskOrder(stored.tasks);
          setTasks(normalized);
          if (stored.migrateLegacy) {
            await writeStoredTasks(boardId, normalized);
          }
        } else {
          const seedTasks = getSeedTasks();
          setTasks(seedTasks);
          await writeStoredTasks(boardId, seedTasks);
        }
      } catch {
        if (isCancelled) return;
        const seedTasks = getSeedTasks();
        setTasks(seedTasks);
      } finally {
        if (!isCancelled) {
          skipNextPersistRef.current = true;
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [boardId, getSeedTasks]);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    void writeStoredTasks(boardId, tasks).catch(() => {
      // Ignore transient persistence failures; UI remains usable.
    });
  }, [tasks, boardId, isLoading]);

  const replaceTasks = React.useCallback((nextTasks: KanbanTask[]) => {
    setTasks(normalizeTaskOrder(nextTasks));
  }, []);

  const updateTasks = React.useCallback((updater: TasksUpdater) => {
    setTasks((previous) => normalizeTaskOrder(updater(previous)));
  }, []);

  return {
    tasks,
    isLoading,
    replaceTasks,
    updateTasks,
  };
}
