import type { KanbanTask, TaskStatus } from "@/types/Tasks";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (offset: number) =>
  new Date(Date.now() + offset * DAY_IN_MS).toISOString();

const daysAgo = (offset: number) =>
  new Date(Date.now() - offset * DAY_IN_MS).toISOString();

export function createSeedTasks(): KanbanTask[] {
  return [
    {
      id: "task-landing-refresh",
      columnId: "Todo",
      status: "Todo",
      title: "Refresh landing page hero illustrations",
      description:
        "Align new hero visuals with the updated brand language and craft micro-animations.",
      labels: ["Design", "Brand"],
      order: 0,
      priority: "high",
      dueDate: daysFromNow(4),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
    },
    {
      id: "task-research-sync",
      columnId: "Todo",
      status: "Todo",
      title: "Schedule customer discovery interviews",
      description:
        "Coordinate three customer calls focused on onboarding friction and form hypotheses.",
      labels: ["Research"],
      order: 1,
      priority: "medium",
      dueDate: daysFromNow(9),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      id: "task-ai-handbook",
      columnId: "InProgress",
      status: "InProgress",
      title: "Draft AI handover guidelines",
      description:
        "Codify expectations for prompt templates and QA steps before handing off to engineering.",
      labels: ["Product", "Documentation"],
      order: 0,
      priority: "medium",
      dueDate: daysFromNow(2),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(0),
    },
    {
      id: "task-automation",
      columnId: "InProgress",
      status: "InProgress",
      title: "Automate weekly analytics snapshot",
      description:
        "Build lightweight automation that sends the core KPI snapshot to Slack every Monday.",
      labels: ["Automation", "Growth"],
      order: 1,
      priority: "high",
      dueDate: daysFromNow(1),
      createdAt: daysAgo(7),
      updatedAt: daysAgo(0),
    },
    {
      id: "task-accessibility-audit",
      columnId: "Done",
      status: "Done",
      title: "Complete accessibility audit for dashboard",
      description:
        "Validate color contrast, keyboard flows, and announce upcoming fixes to the team.",
      labels: ["Accessibility"],
      order: 0,
      priority: "low",
      dueDate: daysAgo(1),
      createdAt: daysAgo(11),
      updatedAt: daysAgo(1),
    },
    {
      id: "task-launch-post",
      columnId: "Done",
      status: "Done",
      title: "Publish launch retrospective blog post",
      description:
        "Summarize the launch metrics, lessons learned, and thank the beta cohort.",
      labels: ["Marketing", "Content"],
      order: 1,
      priority: "medium",
      dueDate: daysAgo(2),
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
