export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "Todo" | "InProgress" | "Done";

export interface KanbanTask {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  labels: Array<string>;
  order: number;
  priority: TaskPriority;
  dueDate?: string; // ISO-8601
  status: TaskStatus;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}
