import { KanbanTask, TaskStatus } from "./Tasks";

export type BoardSnapshot = {
  id: string;
  name: string;
  tasksByStatus: Record<TaskStatus, KanbanTask[]>;
  total: number;
  done: number;
  todo: number;
  inProgress: number;
  lastUpdatedAt?: string;
  upcomingDueDate?: string;
};
