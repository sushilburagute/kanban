import { DEFAULT_BOARD_ID } from "@/data/kanban";
import type { KanbanBoardMeta } from "@/types/Board";
import type { KanbanTask } from "@/types/Tasks";

const DB_NAME = "kanban-board";
const DB_VERSION = 2;
const TASK_STORE_NAME = "tasks";
const BOARD_STORE_NAME = "boards";
const LEGACY_TASKS_KEY = "tasks";

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

export type StoredTasksResult = {
  tasks: KanbanTask[] | null;
  migrateLegacy: boolean;
};

export async function readStoredTasks(boardId: string): Promise<StoredTasksResult> {
  if (!isBrowserEnvironment()) {
    return { tasks: null, migrateLegacy: false };
  }

  try {
    const db = await getDatabase();
    return await new Promise<StoredTasksResult>((resolve, reject) => {
      const transaction = db.transaction(TASK_STORE_NAME, "readonly");
      const store = transaction.objectStore(TASK_STORE_NAME);

      const request = store.get(boardId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const value = request.result;
        if (Array.isArray(value)) {
          resolve({ tasks: value as KanbanTask[], migrateLegacy: false });
          return;
        }

        if (boardId === DEFAULT_BOARD_ID) {
          const legacyRequest = store.get(LEGACY_TASKS_KEY);
          legacyRequest.onerror = () => resolve({ tasks: null, migrateLegacy: false });
          legacyRequest.onsuccess = () => {
            const legacyValue = legacyRequest.result;
            if (Array.isArray(legacyValue)) {
              resolve({
                tasks: legacyValue as KanbanTask[],
                migrateLegacy: true,
              });
            } else {
              resolve({ tasks: null, migrateLegacy: false });
            }
          };
        } else {
          resolve({ tasks: null, migrateLegacy: false });
        }
      };
    });
  } catch {
    return { tasks: null, migrateLegacy: false };
  }
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

export async function clearStoredTasks(boardId: string): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE_NAME, "readwrite");
    const store = transaction.objectStore(TASK_STORE_NAME);
    const request = store.delete(boardId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function readBoards(): Promise<KanbanBoardMeta[]> {
  if (!isBrowserEnvironment()) {
    return [];
  }

  const db = await getDatabase();
  return await new Promise<KanbanBoardMeta[]>((resolve, reject) => {
    const transaction = db.transaction(BOARD_STORE_NAME, "readonly");
    const store = transaction.objectStore(BOARD_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const boards = Array.isArray(request.result)
        ? (request.result as KanbanBoardMeta[])
        : [];

      boards.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      resolve(boards);
    };
  });
}

export async function writeBoard(board: KanbanBoardMeta): Promise<void> {
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

export async function deleteStoredBoard(boardId: string): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [BOARD_STORE_NAME, TASK_STORE_NAME],
      "readwrite"
    );
    const boardStore = transaction.objectStore(BOARD_STORE_NAME);
    const taskStore = transaction.objectStore(TASK_STORE_NAME);

    const deleteBoardRequest = boardStore.delete(boardId);
    const deleteTasksRequest = taskStore.delete(boardId);

    deleteBoardRequest.onerror = () => reject(deleteBoardRequest.error);
    deleteTasksRequest.onerror = () => reject(deleteTasksRequest.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Failed to delete board"));
  });
}

export async function clearAllStoredData(): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [BOARD_STORE_NAME, TASK_STORE_NAME],
      "readwrite"
    );
    const boardStore = transaction.objectStore(BOARD_STORE_NAME);
    const taskStore = transaction.objectStore(TASK_STORE_NAME);

    const clearBoardsRequest = boardStore.clear();
    const clearTasksRequest = taskStore.clear();

    clearBoardsRequest.onerror = () => reject(clearBoardsRequest.error);
    clearTasksRequest.onerror = () => reject(clearTasksRequest.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Failed to reset data"));
  });
}
