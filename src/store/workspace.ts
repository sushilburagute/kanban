import { create } from "zustand";
import { toast } from "sonner";

import { trackEvent } from "@/lib/analytics";
import {
  createDefaultColumns,
  createSeedTasks,
  generateBoardId,
  generateColumnId,
  generateTaskId,
  normalizeTaskOrder,
} from "@/lib/kanban";
import {
  clearAllStoredData,
  deleteStoredBoard,
  importWorkspace,
  readBoards,
  readStoredTasks,
  writeBoard,
  writeStoredTasks,
  type ParsedImport,
} from "@/lib/storage";
import type { BoardColumn, KanbanBoard, KanbanTask, TaskPriority } from "@/types/kanban";

export type TaskInput = {
  title: string;
  description?: string;
  columnId: string;
  priority: TaskPriority;
  dueDate?: string;
  labels: string[];
};

type WorkspaceState = {
  boards: KanbanBoard[];
  tasksByBoard: Record<string, KanbanTask[]>;
  tasksLoaded: Record<string, boolean>;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  loadBoardTasks: (boardId: string) => Promise<void>;
  loadAllTasks: () => Promise<void>;

  addBoard: (name: string, options?: { withSeedData?: boolean }) => Promise<KanbanBoard>;
  renameBoard: (boardId: string, name: string) => void;
  deleteBoard: (boardId: string) => Promise<void>;

  addColumn: (boardId: string, title: string) => void;
  updateColumn: (boardId: string, columnId: string, patch: Partial<Omit<BoardColumn, "id">>) => void;
  deleteColumn: (boardId: string, columnId: string, mode: "move" | "delete") => void;
  reorderColumns: (boardId: string, fromIndex: number, toIndex: number) => void;

  createTask: (boardId: string, input: TaskInput) => void;
  updateTask: (boardId: string, taskId: string, input: TaskInput) => void;
  deleteTask: (boardId: string, taskId: string) => void;
  setBoardTasks: (boardId: string, tasks: KanbanTask[]) => void;

  resetWorkspace: () => Promise<void>;
  applyImport: (data: ParsedImport) => Promise<void>;
};

function saveFailed(what: string) {
  return () => {
    toast.error(`Couldn't save ${what}`, {
      description: "Your browser blocked local storage. Recent changes may be lost on reload.",
    });
  };
}

let hydrationStarted = false;

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => {
  const persistBoard = (board: KanbanBoard) => {
    void writeBoard(board).catch(saveFailed(`board “${board.name}”`));
  };

  const persistTasks = (boardId: string, tasks: KanbanTask[]) => {
    void writeStoredTasks(boardId, tasks).catch(saveFailed("your tasks"));
  };

  const updateBoard = (boardId: string, mutate: (board: KanbanBoard) => KanbanBoard) => {
    const board = get().boards.find((item) => item.id === boardId);
    if (!board) return;

    const next = { ...mutate(board), updatedAt: new Date().toISOString() };
    set((state) => ({
      boards: state.boards.map((item) => (item.id === boardId ? next : item)),
    }));
    persistBoard(next);
  };

  const updateTasks = (boardId: string, mutate: (tasks: KanbanTask[]) => KanbanTask[]) => {
    const previous = get().tasksByBoard[boardId] ?? [];
    const next = normalizeTaskOrder(mutate(previous));
    set((state) => ({
      tasksByBoard: { ...state.tasksByBoard, [boardId]: next },
    }));
    persistTasks(boardId, next);
  };

  return {
    boards: [],
    tasksByBoard: {},
    tasksLoaded: {},
    hydrated: false,

    hydrate: async () => {
      if (hydrationStarted) return;
      hydrationStarted = true;

      try {
        const boards = await readBoards();
        set({ boards, hydrated: true });
      } catch {
        set({ hydrated: true });
        toast.error("Couldn't open local storage", {
          description: "Boards can't be loaded or saved in this browser session.",
        });
      }
    },

    loadBoardTasks: async (boardId) => {
      const state = get();
      if (state.tasksLoaded[boardId]) return;

      const board = state.boards.find((item) => item.id === boardId);
      if (!board) return;

      // Mark as loading synchronously so concurrent callers don't double-read.
      set((current) => ({ tasksLoaded: { ...current.tasksLoaded, [boardId]: true } }));

      try {
        const tasks = await readStoredTasks(board);
        set((current) => ({
          tasksByBoard: { ...current.tasksByBoard, [boardId]: tasks ?? [] },
        }));
      } catch {
        set((current) => ({
          tasksByBoard: { ...current.tasksByBoard, [boardId]: [] },
        }));
        toast.error("Couldn't load this board's tasks");
      }
    },

    loadAllTasks: async () => {
      const { boards, loadBoardTasks } = get();
      await Promise.all(boards.map((board) => loadBoardTasks(board.id)));
    },

    addBoard: async (name, options) => {
      const { withSeedData = false } = options ?? {};
      const trimmedName = name.trim();
      const timestamp = new Date().toISOString();
      const board: KanbanBoard = {
        id: generateBoardId(),
        name: trimmedName.length ? trimmedName : "Untitled board",
        columns: createDefaultColumns(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const tasks = withSeedData ? normalizeTaskOrder(createSeedTasks()) : [];

      try {
        await writeBoard(board);
        await writeStoredTasks(board.id, tasks);
      } catch {
        toast.error("Couldn't save the new board", {
          description: "It will disappear when you close this tab.",
        });
      }

      set((state) => ({
        boards: [...state.boards, board],
        tasksByBoard: { ...state.tasksByBoard, [board.id]: tasks },
        tasksLoaded: { ...state.tasksLoaded, [board.id]: true },
      }));

      trackEvent("board_create", {
        board_id: board.id,
        name_length: board.name.length,
        with_seed_data: withSeedData,
      });

      return board;
    },

    renameBoard: (boardId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateBoard(boardId, (board) => ({ ...board, name: trimmed }));
      trackEvent("board_rename", { board_id: boardId });
    },

    deleteBoard: async (boardId) => {
      set((state) => {
        const tasksByBoard = { ...state.tasksByBoard };
        const tasksLoaded = { ...state.tasksLoaded };
        delete tasksByBoard[boardId];
        delete tasksLoaded[boardId];
        return {
          boards: state.boards.filter((board) => board.id !== boardId),
          tasksByBoard,
          tasksLoaded,
        };
      });

      try {
        await deleteStoredBoard(boardId);
      } catch {
        toast.error("Couldn't delete the board from local storage");
      }

      trackEvent("board_delete", { board_id: boardId });
    },

    addColumn: (boardId, title) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      updateBoard(boardId, (board) => ({
        ...board,
        columns: [
          ...board.columns,
          { id: generateColumnId(), title: trimmed, countsAsDone: false },
        ],
      }));
      trackEvent("column_create", { board_id: boardId });
    },

    updateColumn: (boardId, columnId, patch) => {
      updateBoard(boardId, (board) => ({
        ...board,
        columns: board.columns.map((column) =>
          column.id === columnId ? { ...column, ...patch, id: column.id } : column
        ),
      }));
      trackEvent("column_update", { board_id: boardId });
    },

    deleteColumn: (boardId, columnId, mode) => {
      const board = get().boards.find((item) => item.id === boardId);
      if (!board || board.columns.length <= 1) return;

      const remaining = board.columns.filter((column) => column.id !== columnId);
      const fallbackColumnId = remaining[0].id;

      updateBoard(boardId, (current) => ({ ...current, columns: remaining }));

      updateTasks(boardId, (tasks) => {
        if (mode === "delete") {
          return tasks.filter((task) => task.columnId !== columnId);
        }
        const highestOrder = tasks.filter((task) => task.columnId === fallbackColumnId).length;
        let offset = 0;
        return tasks.map((task) =>
          task.columnId === columnId
            ? { ...task, columnId: fallbackColumnId, order: highestOrder + offset++ }
            : task
        );
      });

      trackEvent("column_delete", { board_id: boardId, mode });
    },

    reorderColumns: (boardId, fromIndex, toIndex) => {
      updateBoard(boardId, (board) => {
        const columns = [...board.columns];
        const [moved] = columns.splice(fromIndex, 1);
        if (!moved) return board;
        columns.splice(toIndex, 0, moved);
        return { ...board, columns };
      });
      trackEvent("column_reorder", { board_id: boardId });
    },

    createTask: (boardId, input) => {
      const timestamp = new Date().toISOString();
      const taskId = generateTaskId();

      updateTasks(boardId, (tasks) => [
        ...tasks,
        {
          id: taskId,
          columnId: input.columnId,
          title: input.title,
          description: input.description,
          labels: input.labels,
          order: tasks.filter((task) => task.columnId === input.columnId).length,
          priority: input.priority,
          dueDate: input.dueDate,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ]);

      trackEvent("task_create", {
        board_id: boardId,
        task_id: taskId,
        column_id: input.columnId,
        has_due_date: Boolean(input.dueDate),
        label_count: input.labels.length,
        priority: input.priority,
      });
    },

    updateTask: (boardId, taskId, input) => {
      updateTasks(boardId, (tasks) =>
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                title: input.title,
                description: input.description,
                labels: input.labels,
                priority: input.priority,
                dueDate: input.dueDate,
                columnId: input.columnId,
                updatedAt: new Date().toISOString(),
              }
            : task
        )
      );

      trackEvent("task_update", {
        board_id: boardId,
        task_id: taskId,
        column_id: input.columnId,
        has_due_date: Boolean(input.dueDate),
        label_count: input.labels.length,
        priority: input.priority,
      });
    },

    deleteTask: (boardId, taskId) => {
      const task = (get().tasksByBoard[boardId] ?? []).find((item) => item.id === taskId);
      updateTasks(boardId, (tasks) => tasks.filter((item) => item.id !== taskId));
      trackEvent("task_delete", {
        board_id: boardId,
        task_id: taskId,
        column_id: task?.columnId,
        had_due_date: Boolean(task?.dueDate),
      });
    },

    setBoardTasks: (boardId, tasks) => {
      updateTasks(boardId, () => tasks);
    },

    resetWorkspace: async () => {
      try {
        await clearAllStoredData();
        set({ boards: [], tasksByBoard: {}, tasksLoaded: {} });
        trackEvent("workspace_reset");
      } catch {
        toast.error("Couldn't reset the workspace");
        throw new Error("reset-failed");
      }
    },

    applyImport: async (data) => {
      await importWorkspace(data);
      const tasksLoaded: Record<string, boolean> = {};
      for (const board of data.boards) {
        tasksLoaded[board.id] = true;
      }
      set({ boards: data.boards, tasksByBoard: data.tasksByBoard, tasksLoaded });
      trackEvent("workspace_import", { board_count: data.boards.length });
    },
  };
});

/** Kicks off one-time hydration; returns whether boards are ready. */
export function selectHydrated(state: WorkspaceState) {
  return state.hydrated;
}
