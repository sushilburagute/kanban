"use client";

import * as React from "react";

import { useWorkspaceStore } from "@/store/workspace";

/** Triggers one-time workspace hydration; returns true once boards are read. */
export function useWorkspaceHydration() {
  const hydrated = useWorkspaceStore((state) => state.hydrated);

  React.useEffect(() => {
    void useWorkspaceStore.getState().hydrate();
  }, []);

  return hydrated;
}

/** Loads a board's tasks on demand; ready is false until they're in memory. */
export function useBoardTasks(boardId: string | undefined) {
  const hydrated = useWorkspaceStore((state) => state.hydrated);
  const tasks = useWorkspaceStore((state) =>
    boardId ? state.tasksByBoard[boardId] : undefined
  );

  React.useEffect(() => {
    if (!hydrated || !boardId) return;
    void useWorkspaceStore.getState().loadBoardTasks(boardId);
  }, [hydrated, boardId]);

  return { tasks: tasks ?? [], ready: tasks !== undefined };
}
