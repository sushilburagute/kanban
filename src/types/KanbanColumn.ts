import { TaskStatus } from "./Tasks";

export type KanbanColumnType = {
  id: TaskStatus;
  title: string;
  description?: string;
};
