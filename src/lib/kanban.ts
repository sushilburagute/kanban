import type { BoardColumn, KanbanTask, TaskPriority } from "@/types/kanban";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (offset: number) => new Date(Date.now() + offset * DAY_IN_MS).toISOString();

const daysAgo = (offset: number) => new Date(Date.now() - offset * DAY_IN_MS).toISOString();

export const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

/**
 * Ids match the legacy hardcoded TaskStatus values so tasks stored by older
 * versions of the app keep pointing at valid columns.
 */
export function createDefaultColumns(): BoardColumn[] {
  return [
    { id: "Todo", title: "To do", countsAsDone: false },
    { id: "InProgress", title: "In progress", countsAsDone: false },
    { id: "Done", title: "Done", countsAsDone: true },
  ];
}

export function createSeedTasks(): KanbanTask[] {
  return [
    {
      id: "task-tour-overview",
      columnId: "Todo",
      title: "Take the quick tour",
      description:
        "Open this card to see the editor, explore the fields, and learn where to update or delete tasks.",
      labels: ["Guide"],
      order: 0,
      priority: "high",
      dueDate: daysFromNow(3),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
    },
    {
      id: "task-create-first",
      columnId: "Todo",
      title: "Create your first task",
      description:
        "Click Add task in the header, fill in the fields, and save. Your new task lands in the first column.",
      labels: ["Guide"],
      order: 1,
      priority: "medium",
      dueDate: daysFromNow(5),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      id: "task-drag-demo",
      columnId: "InProgress",
      title: "Drag this card",
      description:
        "Grab the card and drag it to another column, or focus it and press Enter to open the editor. Columns can be reordered by their headers, too.",
      labels: ["Guide"],
      order: 0,
      priority: "low",
      dueDate: daysFromNow(2),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(0),
    },
    {
      id: "task-columns-demo",
      columnId: "InProgress",
      title: "Make the board yours",
      description:
        "Rename this board from its title, add a column with the + at the end of the lanes, and rename columns from their header menu.",
      labels: ["Guide"],
      order: 1,
      priority: "medium",
      dueDate: daysFromNow(4),
      createdAt: daysAgo(7),
      updatedAt: daysAgo(0),
    },
    {
      id: "task-persistence-check",
      columnId: "Done",
      title: "Confirm your data stays put",
      description:
        "Refresh the page. Everything reloads exactly where you left it — boards live in your browser, not on a server. Back them up anytime from Settings.",
      labels: ["Guide"],
      order: 0,
      priority: "high",
      dueDate: daysFromNow(1),
      createdAt: daysAgo(11),
      updatedAt: daysAgo(1),
    },
    {
      id: "task-cleanup",
      columnId: "Done",
      title: "Clear the tutorial",
      description:
        "Delete these guide cards once you're comfortable and replace them with your own work.",
      labels: ["Guide"],
      order: 1,
      priority: "low",
      dueDate: daysFromNow(6),
      createdAt: daysAgo(14),
      updatedAt: daysAgo(2),
    },
  ];
}

export function normalizeTaskOrder(tasks: KanbanTask[]): KanbanTask[] {
  const byColumn = new Map<string, KanbanTask[]>();

  tasks.forEach((task) => {
    const bucket = byColumn.get(task.columnId) ?? [];
    bucket.push(task);
    byColumn.set(task.columnId, bucket);
  });

  const updated = new Map<string, KanbanTask>();

  for (const [columnId, columnTasks] of byColumn.entries()) {
    columnTasks
      .sort((a, b) => {
        if (a.order === b.order) {
          return a.createdAt.localeCompare(b.createdAt);
        }
        return a.order - b.order;
      })
      .forEach((task, index) => {
        updated.set(task.id, { ...task, columnId, order: index });
      });
  }

  return tasks.map((task) => updated.get(task.id) ?? task);
}

export function toDateInputValue(isoDate?: string) {
  if (!isoDate) return "";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export function parseLabels(labelInput: string) {
  return labelInput
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

export function formatLabelsForInput(labels: string[]) {
  return labels.join(", ");
}

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

export function generateTaskId() {
  return randomId("task");
}

export function generateBoardId() {
  return randomId("board");
}

export function generateColumnId() {
  return randomId("column");
}
