"use client";

import * as React from "react";

import { DEFAULT_BOARD_ID, DEFAULT_BOARD_NAME } from "@/data/kanban";
import {
  generateBoardId,
  createSeedTasks,
  normalizeTaskOrder,
} from "@/lib/kanban";
import {
  deleteStoredBoard,
  readBoards,
  readStoredTasks,
  writeBoard,
  writeStoredTasks,
  clearAllStoredData,
} from "@/lib/task-storage";
import type { KanbanBoardMeta } from "@/types/Board";

type BoardsContextValue = {
  boards: KanbanBoardMeta[];
  isLoading: boolean;
  addBoard: (name: string) => Promise<KanbanBoardMeta>;
  deleteBoard: (boardId: string) => Promise<boolean>;
  refreshBoards: () => Promise<void>;
  resetBoards: () => Promise<void>;
};

const BoardsContext = React.createContext<BoardsContextValue | null>(null);

function sortBoards(boards: KanbanBoardMeta[]) {
  return [...boards].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function ensureDefaultBoardExists() {
  const boards = await readBoards();

  if (boards.length > 0) {
    return sortBoards(boards);
  }

  const timestamp = new Date().toISOString();
  const defaultBoard: KanbanBoardMeta = {
    id: DEFAULT_BOARD_ID,
    name: DEFAULT_BOARD_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await writeBoard(defaultBoard);

  const existingTasks = await readStoredTasks(DEFAULT_BOARD_ID);
  if (!existingTasks.tasks || existingTasks.tasks.length === 0) {
    const seedTasks = normalizeTaskOrder(createSeedTasks());
    await writeStoredTasks(DEFAULT_BOARD_ID, seedTasks);
  }

  return [defaultBoard];
}

function useBoardsInternal(): BoardsContextValue {
  const [boards, setBoards] = React.useState<KanbanBoardMeta[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshBoards = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const existing = await ensureDefaultBoardExists();
      setBoards(existing);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshBoards();
  }, [refreshBoards]);

  const addBoard = React.useCallback(async (name: string) => {
    const trimmedName = name.trim();
    const timestamp = new Date().toISOString();
    const board: KanbanBoardMeta = {
      id: generateBoardId(),
      name: trimmedName.length ? trimmedName : "Untitled board",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await writeBoard(board);

    setBoards((prev) => sortBoards([...prev, board]));

    return board;
  }, []);

  const deleteBoard = React.useCallback(
    async (boardId: string) => {
      if (boards.length <= 1) {
        return false;
      }

      await deleteStoredBoard(boardId);
      setBoards((prev) => sortBoards(prev.filter((board) => board.id !== boardId)));
      return true;
    },
    [boards.length]
  );

  const resetBoards = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await clearAllStoredData();
      const existing = await ensureDefaultBoardExists();
      setBoards(existing);
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
