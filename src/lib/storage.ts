import { createDefaultColumns, normalizeTaskOrder } from "@/lib/kanban";
import type {
  BoardColumn,
  KanbanBoard,
  KanbanTask,
  TaskPriority,
  WorkspaceExport,
} from "@/types/kanban";

const DB_NAME = "kanban-board";
const DB_VERSION = 2;
const TASK_STORE_NAME = "tasks";
const BOARD_STORE_NAME = "boards";
const LEGACY_TASKS_KEY = "tasks";
const LEGACY_DEFAULT_BOARD_ID = "welcome-board";

let dbPromise: Promise<IDBDatabase> | null = null;

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function getDatabase(): Promise<IDBDatabase> {
  if (!isBrowserEnvironment()) {
    return Promise.reject(new Error("IndexedDB is not available."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error("Failed to open IndexedDB."));
      };

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(TASK_STORE_NAME)) {
          db.createObjectStore(TASK_STORE_NAME);
        }

        if (!db.objectStoreNames.contains(BOARD_STORE_NAME)) {
          db.createObjectStore(BOARD_STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  return dbPromise;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function normalizeColumn(value: unknown): BoardColumn | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.title)) return null;
  return {
    id: record.id,
    title: record.title,
    countsAsDone: record.countsAsDone === true,
  };
}

/**
 * Boards written by older versions of the app have no `columns`; give them
 * the legacy fixed set so their tasks (columnId Todo/InProgress/Done) still
 * resolve.
 */
export function normalizeBoard(value: unknown): KanbanBoard | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.name)) return null;

  const columns = Array.isArray(record.columns)
    ? record.columns.map(normalizeColumn).filter((column): column is BoardColumn => !!column)
    : [];

  const timestamp = new Date().toISOString();

  return {
    id: record.id,
    name: record.name,
    columns: columns.length ? columns : createDefaultColumns(),
    createdAt: isNonEmptyString(record.createdAt) ? record.createdAt : timestamp,
    updatedAt: isNonEmptyString(record.updatedAt) ? record.updatedAt : timestamp,
  };
}

export function normalizeTask(value: unknown, columns: BoardColumn[]): KanbanTask | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.title)) return null;

  const fallbackColumnId = columns[0]?.id;
  const columnId =
    isNonEmptyString(record.columnId) && columns.some((column) => column.id === record.columnId)
      ? record.columnId
      : fallbackColumnId;
  if (!columnId) return null;

  const timestamp = new Date().toISOString();

  return {
    id: record.id,
    columnId,
    title: record.title,
    description: isNonEmptyString(record.description) ? record.description : undefined,
    labels: Array.isArray(record.labels) ? record.labels.filter(isNonEmptyString) : [],
    order: typeof record.order === "number" ? record.order : 0,
    priority: PRIORITIES.includes(record.priority as TaskPriority)
      ? (record.priority as TaskPriority)
      : "medium",
    dueDate: isNonEmptyString(record.dueDate) ? record.dueDate : undefined,
    createdAt: isNonEmptyString(record.createdAt) ? record.createdAt : timestamp,
    updatedAt: isNonEmptyString(record.updatedAt) ? record.updatedAt : timestamp,
  };
}

export async function readBoards(): Promise<KanbanBoard[]> {
  if (!isBrowserEnvironment()) {
    return [];
  }

  const db = await getDatabase();
  return await new Promise<KanbanBoard[]>((resolve, reject) => {
    const transaction = db.transaction(BOARD_STORE_NAME, "readonly");
    const store = transaction.objectStore(BOARD_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const raw = Array.isArray(request.result) ? request.result : [];
      const boards = raw
        .map(normalizeBoard)
        .filter((board): board is KanbanBoard => !!board);

      boards.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      resolve(boards);
    };
  });
}

export async function writeBoard(board: KanbanBoard): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(BOARD_STORE_NAME, "readwrite");
    const store = transaction.objectStore(BOARD_STORE_NAME);
    const request = store.put(board);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function readStoredTasks(board: KanbanBoard): Promise<KanbanTask[] | null> {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const db = await getDatabase();
  const raw = await new Promise<unknown>((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE_NAME, "readonly");
    const store = transaction.objectStore(TASK_STORE_NAME);

    const request = store.get(board.id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (Array.isArray(request.result)) {
        resolve(request.result);
        return;
      }

      if (board.id === LEGACY_DEFAULT_BOARD_ID) {
        // Very old installs stored the single board's tasks under a fixed key.
        const legacyRequest = store.get(LEGACY_TASKS_KEY);
        legacyRequest.onerror = () => resolve(null);
        legacyRequest.onsuccess = () =>
          resolve(Array.isArray(legacyRequest.result) ? legacyRequest.result : null);
      } else {
        resolve(null);
      }
    };
  });

  if (!Array.isArray(raw)) return null;

  const tasks = raw
    .map((task) => normalizeTask(task, board.columns))
    .filter((task): task is KanbanTask => !!task);

  return normalizeTaskOrder(tasks);
}

export async function writeStoredTasks(boardId: string, tasks: KanbanTask[]): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE_NAME, "readwrite");
    const store = transaction.objectStore(TASK_STORE_NAME);
    const request = store.put(tasks, boardId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteStoredBoard(boardId: string): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([BOARD_STORE_NAME, TASK_STORE_NAME], "readwrite");
    const boardStore = transaction.objectStore(BOARD_STORE_NAME);
    const taskStore = transaction.objectStore(TASK_STORE_NAME);

    boardStore.delete(boardId);
    taskStore.delete(boardId);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to delete board"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Failed to delete board"));
  });
}

export async function clearAllStoredData(): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([BOARD_STORE_NAME, TASK_STORE_NAME], "readwrite");
    transaction.objectStore(BOARD_STORE_NAME).clear();
    transaction.objectStore(TASK_STORE_NAME).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to reset data"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Failed to reset data"));
  });
}

export async function exportWorkspace(): Promise<WorkspaceExport> {
  const boards = await readBoards();
  const withTasks: WorkspaceExport["boards"] = [];

  for (const board of boards) {
    const tasks = await readStoredTasks(board);
    withTasks.push({ ...board, tasks: tasks ?? [] });
  }

  return {
    app: "kanban",
    version: 1,
    exportedAt: new Date().toISOString(),
    boards: withTasks,
  };
}

export type ParsedImport = {
  boards: KanbanBoard[];
  tasksByBoard: Record<string, KanbanTask[]>;
};

/** Parses an exported backup, tolerating unknown fields. Throws on bad shape. */
export function parseWorkspaceExport(raw: unknown): ParsedImport {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Not a kanban backup file.");
  }

  const record = raw as Record<string, unknown>;
  if (record.app !== "kanban" || !Array.isArray(record.boards)) {
    throw new Error("Not a kanban backup file.");
  }

  const boards: KanbanBoard[] = [];
  const tasksByBoard: Record<string, KanbanTask[]> = {};

  for (const entry of record.boards) {
    const board = normalizeBoard(entry);
    if (!board) continue;

    const rawTasks =
      typeof entry === "object" && entry !== null && Array.isArray((entry as Record<string, unknown>).tasks)
        ? ((entry as Record<string, unknown>).tasks as unknown[])
        : [];

    boards.push(board);
    tasksByBoard[board.id] = normalizeTaskOrder(
      rawTasks
        .map((task) => normalizeTask(task, board.columns))
        .filter((task): task is KanbanTask => !!task)
    );
  }

  if (!boards.length) {
    throw new Error("The backup file contains no boards.");
  }

  return { boards, tasksByBoard };
}

/** Replaces the entire workspace with the parsed backup contents. */
export async function importWorkspace(data: ParsedImport): Promise<void> {
  await clearAllStoredData();
  for (const board of data.boards) {
    await writeBoard(board);
    await writeStoredTasks(board.id, data.tasksByBoard[board.id] ?? []);
  }
}
