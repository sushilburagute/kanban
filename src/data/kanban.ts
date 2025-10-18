import type { TaskStatus } from "@/types/Tasks";

export const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  description: string;
}> = [
  {
    id: "Todo",
    title: "To Do",
    description: "Ideas and requests ready for kickoff.",
  },
  {
    id: "InProgress",
    title: "In Progress",
    description: "Work currently being executed by the team.",
  },
  {
    id: "Done",
    title: "Done",
    description: "Completed deliverables that passed review.",
  },
];

export const DEFAULT_COLUMN_ID = (KANBAN_COLUMNS[0]?.id ?? "Todo") as TaskStatus;

export const DEFAULT_BOARD_ID = "welcome-board";
export const DEFAULT_BOARD_NAME = "Welcome Board";
