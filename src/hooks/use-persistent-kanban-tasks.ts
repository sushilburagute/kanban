"use client";

import * as React from "react";

import { normalizeTaskOrder } from "@/lib/kanban";
import { readStoredTasks, writeStoredTasks } from "@/lib/task-storage";
import type { KanbanTask } from "@/types/Tasks";

type TasksUpdater = (previous: KanbanTask[]) => KanbanTask[];

export function usePersistentKanbanTasks(seedTasksFactory: () => KanbanTask[]) {
  const [tasks, setTasks] = React.useState<KanbanTask[] | null>(null);
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

      try {
        const stored = await readStoredTasks();

        if (isCancelled) return;

        if (stored && stored.length) {
          setTasks(normalizeTaskOrder(stored));
        } else {
          const seedTasks = getSeedTasks();
          setTasks(seedTasks);
          await writeStoredTasks(seedTasks);
        }
      } catch {
        const seedTasks = getSeedTasks();
        setTasks(seedTasks);
      } finally {
        if (!isCancelled) {
          skipNextPersistRef.current = true;
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [getSeedTasks]);

  React.useEffect(() => {
    if (tasks === null || isLoading) {
      return;
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    void writeStoredTasks(tasks).catch(() => {
      // Ignore transient persistence failures; UI remains usable.
    });
  }, [tasks, isLoading]);

  const replaceTasks = React.useCallback((nextTasks: KanbanTask[]) => {
    setTasks(normalizeTaskOrder(nextTasks));
  }, []);

  const updateTasks = React.useCallback((updater: TasksUpdater) => {
    setTasks((previous) => {
      if (!previous) {
        return previous;
      }
      const next = updater(previous);
      return normalizeTaskOrder(next);
    });
  }, []);

  return {
    tasks,
    isLoading,
    replaceTasks,
    updateTasks,
  };
}
