"use client";

import * as React from "react";

import { createSeedTasks, generateBoardId, normalizeTaskOrder } from "@/lib/kanban";
import {
  deleteStoredBoard,
  readBoards,
  writeBoard,
  writeStoredTasks,
  clearAllStoredData,
} from "@/lib/task-storage";
import type { KanbanBoardMeta } from "@/types/Board";

type AddBoardOptions = {
  withSeedData?: boolean;
};

type BoardsContextValue = {
  boards: KanbanBoardMeta[];
  isLoading: boolean;
  addBoard: (name: string, options?: AddBoardOptions) => Promise<KanbanBoardMeta>;
  deleteBoard: (boardId: string) => Promise<boolean>;
  refreshBoards: () => Promise<void>;
  resetBoards: () => Promise<void>;
};

const BoardsContext = React.createContext<BoardsContextValue | null>(null);

function sortBoards(boards: KanbanBoardMeta[]) {
  return [...boards].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function loadBoards() {
  const boards = await readBoards();
  return sortBoards(boards);
}

function useBoardsInternal(): BoardsContextValue {
  const [boards, setBoards] = React.useState<KanbanBoardMeta[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshBoards = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const existing = await loadBoards();
      setBoards(existing);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshBoards();
  }, [refreshBoards]);

  const addBoard = React.useCallback(async (name: string, options?: AddBoardOptions) => {
    const { withSeedData = false } = options ?? {};
    const trimmedName = name.trim();
    const timestamp = new Date().toISOString();
    const board: KanbanBoardMeta = {
      id: generateBoardId(),
      name: trimmedName.length ? trimmedName : "Untitled board",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await writeBoard(board);

    if (withSeedData) {
      const seedTasks = normalizeTaskOrder(createSeedTasks());
      await writeStoredTasks(board.id, seedTasks);
    }

    setBoards((prev) => sortBoards([...prev, board]));

    return board;
  }, []);

  const deleteBoard = React.useCallback(
    async (boardId: string) => {
      await deleteStoredBoard(boardId);
      setBoards((prev) => sortBoards(prev.filter((board) => board.id !== boardId)));
      return true;
    },
    []
  );

  const resetBoards = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await clearAllStoredData();
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return React.useMemo(
    () => ({
      boards,
      isLoading,
      addBoard,
      deleteBoard,
      refreshBoards,
      resetBoards,
    }),
    [boards, isLoading, addBoard, deleteBoard, refreshBoards, resetBoards]
  );
}

export function BoardsProvider({ children }: { children: React.ReactNode }) {
  const value = useBoardsInternal();
  return <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>;
}

export function useBoards() {
  const context = React.useContext(BoardsContext);
  if (!context) {
    throw new Error("useBoards must be used within a BoardsProvider.");
  }
  return context;
}
