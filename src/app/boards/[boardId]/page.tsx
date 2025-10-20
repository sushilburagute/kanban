"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, SquareKanban } from "lucide-react";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanBoardSkeleton, KanbanStatsSkeleton } from "@/components/kanban/KanbanSkeleton";
import { useBoards } from "@/components/contexts/BoardsProvider";
import { TaskDialog, type TaskDialogFormValues } from "@/components/kanban/TaskDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KANBAN_COLUMNS, DEFAULT_COLUMN_ID, DEFAULT_BOARD_ID } from "@/data/kanban";
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
import { CreateBoardDialog } from "@/components/ui/boardsSidebarSection";
import { trackEvent } from "@/lib/analytics";

type TaskEditorState =
  | { mode: "closed" }
  | { mode: "create"; columnId: TaskStatus }
  | { mode: "edit"; taskId: string };

type BoardPageParams = { boardId?: string };

type BoardPageProps = {
  params?: Promise<BoardPageParams>;
};

export default function BoardPage({ params }: BoardPageProps) {
  const router = useRouter();
  const { boards, isLoading: boardsLoading, addBoard } = useBoards();

  const paramsPromise = React.useMemo(
    () => params ?? Promise.resolve<BoardPageParams>({}),
    [params]
  );

  const resolvedParams = React.use(paramsPromise);
  const requestedBoardId = resolvedParams?.boardId ?? DEFAULT_BOARD_ID;

  const activeBoard = React.useMemo(
    () => boards.find((board) => board.id === requestedBoardId),
    [boards, requestedBoardId]
  );

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newBoardName, setNewBoardName] = React.useState("");
  const [isCreatingBoard, setIsCreatingBoard] = React.useState(false);
  const [createWithSeedData, setCreateWithSeedData] = React.useState(false);

  const handleCreateBoardSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isCreatingBoard) return;

      const name = newBoardName.trim();

      setIsCreatingBoard(true);
      try {
        const board = await addBoard(name, { withSeedData: createWithSeedData });
        setCreateDialogOpen(false);
        setNewBoardName("");
        setCreateWithSeedData(false);
        router.push(`/boards/${board.id}`);
      } finally {
        setIsCreatingBoard(false);
      }
    },
    [addBoard, createWithSeedData, isCreatingBoard, newBoardName, router]
  );

  const handleCreateDialogOpenChange = React.useCallback((open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setNewBoardName("");
      setCreateWithSeedData(false);
    }
  }, []);

  const handleCreateDialogCancel = React.useCallback(() => {
    setCreateDialogOpen(false);
    setNewBoardName("");
    setCreateWithSeedData(false);
  }, []);

  React.useEffect(() => {
    if (boardsLoading) return;

    if (!activeBoard) {
      if (boards.length > 0) {
        router.replace(`/boards/${boards[0].id}`);
      }
    }
  }, [boardsLoading, activeBoard, boards, router]);

  if (boardsLoading) {
    return (
      <main className="min-h-screen bg-background w-full">
        <div className="mx-auto flex w-full max-w flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
          <KanbanBoardSkeleton columns={KANBAN_COLUMNS.length} />
        </div>
      </main>
    );
  }

  if (!activeBoard) {
    if (boards.length === 0) {
      return (
        <>
          <main className="min-h-screen bg-background w-full">
            <div className="mx-auto my-auto flex w-full max-w h-full flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-10">
              <div className="flex max-w-md flex-col items-center gap-5 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <SquareKanban className="h-6 w-6" />
                </span>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground">No boards yet</h1>
                  <p className="text-sm text-muted-foreground">
                    Create your first board to start organizing tasks and tracking progress.
                  </p>
                </div>
                <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create board
                </Button>
              </div>
            </div>
          </main>

          <CreateBoardDialog
            open={createDialogOpen}
            onOpenChange={handleCreateDialogOpenChange}
            onSubmit={handleCreateBoardSubmit}
            isCreating={isCreatingBoard}
            name={newBoardName}
            onNameChange={(event) => setNewBoardName(event.target.value)}
            onCancel={handleCreateDialogCancel}
            withSeedData={createWithSeedData}
            onSeedToggle={(value) => setCreateWithSeedData(value)}
          />
        </>
      );
    }

    return (
      <main className="min-h-screen bg-background w-full">
        <div className="mx-auto flex w-full max-w flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
          <KanbanBoardSkeleton columns={KANBAN_COLUMNS.length} />
        </div>
      </main>
    );
  }

  return <BoardContent boardId={activeBoard.id} boardName={activeBoard.name} />;
}

function BoardContent({ boardId, boardName }: { boardId: string; boardName: string }) {
  const seedTasksFactory = React.useCallback(
    () => (boardId === DEFAULT_BOARD_ID ? createSeedTasks() : []),
    [boardId]
  );
  const {
    tasks,
    isLoading: tasksLoading,
    replaceTasks,
    updateTasks,
  } = usePersistentKanbanTasks(seedTasksFactory, boardId);

  const isReady = !tasksLoading;
  const [taskEditor, setTaskEditor] = React.useState<TaskEditorState>({
    mode: "closed",
  });

  const readyTasks = React.useMemo(() => tasks, [tasks]);

  const stats = React.useMemo(() => {
    return KANBAN_COLUMNS.reduce<Record<TaskStatus, number>>((acc, column) => {
      acc[column.id] = readyTasks.filter((task) => task.columnId === column.id).length;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [readyTasks]);

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

    if (taskEditor.mode === "edit") {
      const task = readyTasks.find((item) => item.id === taskEditor.taskId);
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
  }, [taskEditor, readyTasks]);

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
        const newTaskId = generateTaskId();
        updateTasks((previous) => {
          const nextOrder = previous.filter((task) => task.columnId === values.columnId).length;

          const newTask: KanbanTask = {
            id: newTaskId,
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
        trackEvent("task_create", {
          board_id: boardId,
          task_id: newTaskId,
          column_id: values.columnId,
          has_due_date: Boolean(dueDate),
          label_count: labels.length,
          priority: values.priority,
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
        trackEvent("task_update", {
          board_id: boardId,
          task_id: taskId,
          column_id: values.columnId,
          has_due_date: Boolean(dueDate),
          label_count: labels.length,
          priority: values.priority,
        });
      }

      setTaskEditor({ mode: "closed" });
    },
    [boardId, isReady, taskEditor, updateTasks]
  );

  const handleTaskDelete = React.useCallback(() => {
    if (!isReady || taskEditor.mode !== "edit") {
      return;
    }

    const taskId = taskEditor.taskId;
    const task = readyTasks.find((item) => item.id === taskId);
    updateTasks((previous) => previous.filter((task) => task.id !== taskId));
    setTaskEditor({ mode: "closed" });
    trackEvent("task_delete", {
      board_id: boardId,
      task_id: taskId,
      column_id: task?.columnId,
      had_due_date: Boolean(task?.dueDate),
    });
  }, [boardId, isReady, readyTasks, taskEditor, updateTasks]);

  const dialogMode: "create" | "edit" = taskEditor.mode === "edit" ? "edit" : "create";
  const isDialogOpen = taskEditor.mode !== "closed";

  return (
    <main className="min-h-screen bg-background w-full">
      <div className="mx-auto flex w-full max-w flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{boardName}</h1>
              <p className="text-sm text-muted-foreground">
                Stay aligned on priorities across design, product, and growth. Drag any card to
                update its status.
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

          {isReady ? (
            <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              {KANBAN_COLUMNS.map((column) => (
                <div key={column.id} className="rounded-xl border border-border/60 bg-muted/40 p-4">
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
        onDelete={dialogMode === "edit" ? handleTaskDelete : undefined}
      />
    </main>
  );
}
