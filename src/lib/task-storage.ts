import type { KanbanTask } from "@/types/Tasks";

const DB_NAME = "kanban-board";
const DB_VERSION = 1;
const STORE_NAME = "tasks";
const TASKS_KEY = "tasks";

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  return dbPromise;
}

export async function readStoredTasks(): Promise<KanbanTask[] | null> {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const db = await getDatabase();
    return await new Promise<KanbanTask[] | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(TASKS_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(Array.isArray(request.result) ? (request.result as KanbanTask[]) : null);
      };
    });
  } catch {
    return null;
  }
}

export async function writeStoredTasks(tasks: KanbanTask[]): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(tasks, TASKS_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearStoredTasks(): Promise<void> {
  if (!isBrowserEnvironment()) {
    return;
  }

  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(TASKS_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
