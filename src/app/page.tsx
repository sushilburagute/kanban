"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import {
  KanbanBoardSkeleton,
  KanbanStatsSkeleton,
} from "@/components/kanban/KanbanSkeleton";
import { TaskDialog, type TaskDialogFormValues } from "@/components/kanban/TaskDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KANBAN_COLUMNS, DEFAULT_COLUMN_ID } from "@/data/kanban";
import { usePersistentKanbanTasks } from "@/hooks/use-persistent-kanban-tasks";
import {
  createSeedTasks,
  formatLabelsForInput,
  fromDateInputValue,
  generateTaskId,
  parseLabels,
  toDateInputValue,
} from "@/lib/kanban";
import type { KanbanTask, TaskStatus } from "@/types/Tasks";

type TaskEditorState =
  | { mode: "closed" }
  | { mode: "create"; columnId: TaskStatus }
  | { mode: "edit"; taskId: string };

export default function Home() {
  const seedTasksFactory = React.useCallback(() => createSeedTasks(), []);
  const { tasks, isLoading, replaceTasks, updateTasks } =
    usePersistentKanbanTasks(seedTasksFactory);

  const isReady = !isLoading && Array.isArray(tasks);
  const readyTasks = React.useMemo(() => tasks ?? [], [tasks]);

  const stats = React.useMemo(() => {
    if (!tasks) {
      return null;
    }

    return KANBAN_COLUMNS.reduce<Record<TaskStatus, number>>((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.columnId === column.id).length;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [tasks]);

  const [taskEditor, setTaskEditor] = React.useState<TaskEditorState>({
    mode: "closed",
  });

  const handleAddTaskRequest = React.useCallback(
    (columnId: TaskStatus) => {
      if (!isReady) return;
      setTaskEditor({ mode: "create", columnId });
    },
    [isReady]
  );

  const handleTaskOpen = React.useCallback(
    (task: KanbanTask) => {
      if (!isReady) return;
      setTaskEditor({ mode: "edit", taskId: task.id });
    },
    [isReady]
  );

  const dialogInitialValues = React.useMemo<TaskDialogFormValues>(() => {
    if (taskEditor.mode === "create") {
      return {
        title: "",
        description: "",
        columnId: taskEditor.columnId,
        priority: "medium",
        dueDate: "",
        labels: "",
      };
    }

    if (taskEditor.mode === "edit" && tasks) {
      const task = tasks.find((item) => item.id === taskEditor.taskId);
      if (task) {
        return {
          title: task.title,
          description: task.description ?? "",
          columnId: task.columnId as TaskStatus,
          priority: task.priority,
          dueDate: toDateInputValue(task.dueDate),
          labels: formatLabelsForInput(task.labels),
        };
      }
    }

    return {
      title: "",
      description: "",
      columnId: DEFAULT_COLUMN_ID,
      priority: "medium",
      dueDate: "",
      labels: "",
    };
  }, [taskEditor, tasks]);

  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setTaskEditor({ mode: "closed" });
    }
  }, []);

  const handleTaskDialogSubmit = React.useCallback(
    (values: TaskDialogFormValues) => {
      if (!isReady) {
        return;
      }

      const normalizedTitle = values.title.trim();
      const normalizedDescription = values.description.trim();
      const labels = parseLabels(values.labels);
      const dueDate = fromDateInputValue(values.dueDate);
      const timestamp = new Date().toISOString();

      if (taskEditor.mode === "create") {
        updateTasks((previous) => {
          const nextOrder = previous.filter(
            (task) => task.columnId === values.columnId
          ).length;

          const newTask: KanbanTask = {
            id: generateTaskId(),
            columnId: values.columnId,
            status: values.columnId,
            title: normalizedTitle,
            description: normalizedDescription ? normalizedDescription : undefined,
            labels,
            order: nextOrder,
            priority: values.priority,
            dueDate,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          return [...previous, newTask];
        });
      } else if (taskEditor.mode === "edit") {
        const taskId = taskEditor.taskId;

        updateTasks((previous) =>
          previous.map((task) => {
            if (task.id !== taskId) {
              return task;
            }

            return {
              ...task,
              title: normalizedTitle,
              description: normalizedDescription ? normalizedDescription : undefined,
              labels,
              priority: values.priority,
              dueDate,
              columnId: values.columnId,
              status: values.columnId,
              updatedAt: timestamp,
            };
          })
        );
      }

      setTaskEditor({ mode: "closed" });
    },
    [isReady, taskEditor, updateTasks]
  );

  const handleTaskDelete = React.useCallback(() => {
    if (!isReady || taskEditor.mode !== "edit") {
      return;
    }

    const taskId = taskEditor.taskId;
    updateTasks((previous) => previous.filter((task) => task.id !== taskId));
    setTaskEditor({ mode: "closed" });
  }, [isReady, taskEditor, updateTasks]);

  const dialogMode: "create" | "edit" =
    taskEditor.mode === "edit" ? "edit" : "create";
  const isDialogOpen = taskEditor.mode !== "closed";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Product Operations Kanban
              </h1>
              <p className="text-sm text-muted-foreground">
                Stay aligned on priorities across design, product, and growth. Drag any card to update its status.
              </p>
            </div>
            <Button
              size="lg"
              className="self-start sm:self-auto"
              onClick={() => handleAddTaskRequest(DEFAULT_COLUMN_ID)}
              disabled={!isReady}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add task
            </Button>
          </div>

          <Separator />

          {isReady && stats ? (
            <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              {KANBAN_COLUMNS.map((column) => (
                <div
                  key={column.id}
                  className="rounded-xl border border-border/60 bg-muted/40 p-4"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                    {column.title}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-foreground">
                    {stats[column.id] ?? 0}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <KanbanStatsSkeleton count={KANBAN_COLUMNS.length} />
          )}
        </section>

        {isReady ? (
          <KanbanBoard
            columns={KANBAN_COLUMNS}
            tasks={readyTasks}
            onTasksChange={replaceTasks}
            onAddTask={handleAddTaskRequest}
            onTaskOpen={handleTaskOpen}
          />
        ) : (
          <KanbanBoardSkeleton columns={KANBAN_COLUMNS.length} />
        )}
      </div>

      <TaskDialog
        open={isDialogOpen}
        mode={dialogMode}
        columns={KANBAN_COLUMNS.map(({ id, title }) => ({ id, title }))}
        initialValues={dialogInitialValues}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleTaskDialogSubmit}
        onDelete={
          dialogMode === "edit" ? handleTaskDelete : undefined
        }
      />
    </main>
  );
}
