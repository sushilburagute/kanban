export type TaskPriority = "low" | "medium" | "high";

export interface BoardColumn {
  id: string;
  title: string;
  /** Tasks in this column count toward completion in stats. */
  countsAsDone: boolean;
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: BoardColumn[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface KanbanTask {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  labels: string[];
  order: number;
  priority: TaskPriority;
  dueDate?: string; // ISO-8601
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface WorkspaceExport {
  app: "kanban";
  version: 1;
  exportedAt: string;
  boards: Array<KanbanBoard & { tasks: KanbanTask[] }>;
}

export type BoardSnapshot = {
  id: string;
  name: string;
  total: number;
  done: number;
  perColumn: Array<{ column: BoardColumn; count: number }>;
  lastUpdatedAt?: string;
  upcomingDueDate?: string;
};
