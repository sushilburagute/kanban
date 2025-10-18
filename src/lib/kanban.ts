import type { KanbanTask, TaskStatus } from "@/types/Tasks";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (offset: number) => new Date(Date.now() + offset * DAY_IN_MS).toISOString();

const daysAgo = (offset: number) => new Date(Date.now() - offset * DAY_IN_MS).toISOString();

export function createSeedTasks(): KanbanTask[] {
  return [
    {
      id: "task-tour-overview",
      columnId: "Todo",
      status: "Todo",
      title: "Review the quick tour",
      description:
        "Open this card to see the modal, explore the fields, and learn where to update or delete tasks.",
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
      status: "Todo",
      title: "Create your first task",
      description:
        "Click Add task in the header, fill in the fields, and save. Your new task will appear in To Do.",
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
      status: "InProgress",
      title: "Drag this card",
      description:
        "Press and hold the grip icon on the right, then drag to a different column to reorder or change status.",
      labels: ["Guide"],
      order: 0,
      priority: "low",
      dueDate: daysFromNow(2),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(0),
    },
    {
      id: "task-edit-demo",
      columnId: "InProgress",
      status: "InProgress",
      title: "Edit this card",
      description:
        "Click the card body to open the modal, adjust fields such as priority or labels, and save your changes.",
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
      status: "Done",
      title: "Confirm data persistence",
      description:
        "Refresh the page. Tasks you created or moved should reload exactly where you left them thanks to IndexedDB.",
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
      status: "Done",
      title: "Tailor the board",
      description:
        "Delete this tutorial card once you are comfortable. Feel free to replace it with your own work items.",
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
  const byColumn = new Map<TaskStatus, KanbanTask[]>();

  tasks.forEach((task) => {
    const columnId = task.columnId as TaskStatus;
    const bucket = byColumn.get(columnId) ?? [];
    bucket.push(task);
    byColumn.set(columnId, bucket);
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
        updated.set(task.id, {
          ...task,
          columnId,
          status: columnId,
          order: index,
        });
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

export function generateTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task-${Math.random().toString(16).slice(2)}`;
}

export function generateBoardId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `board-${Math.random().toString(16).slice(2)}`;
}
