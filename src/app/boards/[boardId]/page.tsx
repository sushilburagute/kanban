"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, SquareKanban } from "lucide-react";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { BoardHeaderSkeleton, KanbanBoardSkeleton } from "@/components/kanban/KanbanSkeleton";
import { TaskDialog, type TaskDialogFormValues } from "@/components/kanban/TaskDialog";
import { ColumnDialog } from "@/components/kanban/ColumnDialog";
import {
  EMPTY_FILTER,
  FilterBar,
  isFilterActive,
  taskMatchesFilter,
  type BoardFilter,
} from "@/components/kanban/FilterBar";
import { CreateBoardDialog } from "@/components/boards/BoardDialogs";
import { Button } from "@/components/ui/button";
import { useBoardTasks, useWorkspaceHydration } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/store/workspace";
import {
  formatLabelsForInput,
  fromDateInputValue,
  parseLabels,
  toDateInputValue,
} from "@/lib/kanban";
import { cn } from "@/lib/utils";
import type { BoardColumn, KanbanBoard as Board, KanbanTask } from "@/types/kanban";

type TaskEditorState =
  | { mode: "closed" }
  | { mode: "create"; columnId: string }
  | { mode: "edit"; taskId: string };

type BoardPageParams = { boardId?: string };

export default function BoardPage({ params }: { params?: Promise<BoardPageParams> }) {
  const router = useRouter();
  const hydrated = useWorkspaceHydration();
  const boards = useWorkspaceStore((state) => state.boards);

  const paramsPromise = React.useMemo(
    () => params ?? Promise.resolve<BoardPageParams>({}),
    [params]
  );
  const resolvedParams = React.use(paramsPromise);
  const requestedBoardId = resolvedParams?.boardId;

  const activeBoard = boards.find((board) => board.id === requestedBoardId);

  React.useEffect(() => {
    if (!hydrated || activeBoard) return;
    if (boards.length > 0) {
      router.replace(`/boards/${boards[0].id}`);
    }
  }, [hydrated, activeBoard, boards, router]);

  if (!hydrated) {
    return (
      <BoardShell>
        <BoardHeaderSkeleton />
        <KanbanBoardSkeleton />
      </BoardShell>
    );
  }

  if (!activeBoard) {
    if (boards.length === 0) {
      return <EmptyWorkspace />;
    }
    return (
      <BoardShell>
        <BoardHeaderSkeleton />
        <KanbanBoardSkeleton />
      </BoardShell>
    );
  }

  return <BoardView key={activeBoard.id} board={activeBoard} />;
}

function BoardShell({ children }: { children: React.ReactNode }) {
  return (
    // min-w-0 is load-bearing: as a flex item beside the sidebar this defaults
    // to min-width:auto, so the board's columns set a min-content floor that
    // stops it shrinking and pushes the whole document into horizontal scroll.
    // Letting it shrink hands scrolling back to the overflow-x-auto rail below.
    <main className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-4 pt-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

function EmptyWorkspace() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-brand text-brand-foreground">
          <SquareKanban className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">No boards yet</h1>
          <p className="text-sm text-muted-foreground">
            A board is a signboard for one stream of work. Create your first one — it stays in
            this browser, nowhere else.
          </p>
        </div>
        <Button size="lg" variant="brand" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Create board
        </Button>
      </div>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}

function BoardView({ board }: { board: Board }) {
  const { tasks, ready } = useBoardTasks(board.id);
  const setBoardTasks = useWorkspaceStore((state) => state.setBoardTasks);
  const reorderColumns = useWorkspaceStore((state) => state.reorderColumns);
  const addColumn = useWorkspaceStore((state) => state.addColumn);
  const createTask = useWorkspaceStore((state) => state.createTask);
  const updateTask = useWorkspaceStore((state) => state.updateTask);
  const deleteTask = useWorkspaceStore((state) => state.deleteTask);

  const [taskEditor, setTaskEditor] = React.useState<TaskEditorState>({ mode: "closed" });
  const [editingColumn, setEditingColumn] = React.useState<BoardColumn | null>(null);
  const [filter, setFilter] = React.useState<BoardFilter>(EMPTY_FILTER);

  const filtering = isFilterActive(filter);
  const visibleTasks = React.useMemo(
    () => (filtering ? tasks.filter((task) => taskMatchesFilter(task, filter)) : tasks),
    [tasks, filter, filtering]
  );

  const totalsByColumn = React.useMemo(() => {
    const totals: Record<string, number> = {};
    for (const task of tasks) {
      totals[task.columnId] = (totals[task.columnId] ?? 0) + 1;
    }
    return totals;
  }, [tasks]);

  const allLabels = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => task.labels.forEach((label) => set.add(label)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const doneCount = React.useMemo(() => {
    const doneColumns = new Set(
      board.columns.filter((column) => column.countsAsDone).map((column) => column.id)
    );
    return tasks.filter((task) => doneColumns.has(task.columnId)).length;
  }, [board.columns, tasks]);

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
      const task = tasks.find((item) => item.id === taskEditor.taskId);
      if (task) {
        return {
          title: task.title,
          description: task.description ?? "",
          columnId: task.columnId,
          priority: task.priority,
          dueDate: toDateInputValue(task.dueDate),
          labels: formatLabelsForInput(task.labels),
        };
      }
    }

    return {
      title: "",
      description: "",
      columnId: board.columns[0]?.id ?? "",
      priority: "medium",
      dueDate: "",
      labels: "",
    };
  }, [taskEditor, tasks, board.columns]);

  const handleTaskDialogSubmit = React.useCallback(
    (values: TaskDialogFormValues) => {
      const input = {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        columnId: values.columnId,
        priority: values.priority,
        dueDate: fromDateInputValue(values.dueDate),
        labels: parseLabels(values.labels),
      };

      if (taskEditor.mode === "create") {
        createTask(board.id, input);
      } else if (taskEditor.mode === "edit") {
        updateTask(board.id, taskEditor.taskId, input);
      }

      setTaskEditor({ mode: "closed" });
    },
    [board.id, taskEditor, createTask, updateTask]
  );

  const handleTaskDelete = React.useCallback(() => {
    if (taskEditor.mode !== "edit") return;
    deleteTask(board.id, taskEditor.taskId);
    setTaskEditor({ mode: "closed" });
  }, [board.id, taskEditor, deleteTask]);

  return (
    <BoardShell>
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="eyebrow flex items-center gap-2 text-muted-foreground">
              Board
              <span className="font-mono normal-case tracking-normal">
                · {tasks.length} {tasks.length === 1 ? "card" : "cards"} · {doneCount} done
              </span>
            </p>
            <BoardTitle board={board} />
          </div>

          <Button
            variant="brand"
            className="self-start sm:self-auto"
            onClick={() =>
              setTaskEditor({ mode: "create", columnId: board.columns[0]?.id ?? "" })
            }
            disabled={!ready || board.columns.length === 0}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add card
          </Button>
        </div>

        <FilterBar filter={filter} onChange={setFilter} labels={allLabels} />

        {filtering ? (
          <p className="font-mono text-xs text-muted-foreground">
            Showing {visibleTasks.length} of {tasks.length} cards — drag is off while filtering.
          </p>
        ) : null}
      </header>

      <div className="-mx-4 flex-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {ready ? (
          <KanbanBoard
            columns={board.columns}
            tasks={visibleTasks}
            totalsByColumn={totalsByColumn}
            filtering={filtering}
            onTasksChange={(next) => setBoardTasks(board.id, next)}
            onColumnsReorder={(from, to) => reorderColumns(board.id, from, to)}
            onAddColumn={(title) => addColumn(board.id, title)}
            onAddTask={(columnId) => setTaskEditor({ mode: "create", columnId })}
            onTaskOpen={(task: KanbanTask) => setTaskEditor({ mode: "edit", taskId: task.id })}
            onEditColumn={setEditingColumn}
          />
        ) : (
          <KanbanBoardSkeleton columns={board.columns.length} />
        )}
      </div>

      <TaskDialog
        open={taskEditor.mode !== "closed"}
        mode={taskEditor.mode === "edit" ? "edit" : "create"}
        columns={board.columns}
        initialValues={dialogInitialValues}
        onOpenChange={(open) => !open && setTaskEditor({ mode: "closed" })}
        onSubmit={handleTaskDialogSubmit}
        onDelete={taskEditor.mode === "edit" ? handleTaskDelete : undefined}
      />

      <ColumnDialog
        boardId={board.id}
        column={editingColumn}
        columnCount={board.columns.length}
        onClose={() => setEditingColumn(null)}
      />
    </BoardShell>
  );
}

function BoardTitle({ board }: { board: Board }) {
  const renameBoard = useWorkspaceStore((state) => state.renameBoard);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(board.name);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== board.name) {
      renameBoard(board.id, trimmed);
    } else {
      setDraft(board.name);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft(board.name);
            setEditing(false);
          }
        }}
        className="w-full max-w-xl border-b-2 border-brand bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none"
        aria-label="Board name"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(board.name);
        setEditing(true);
      }}
      className={cn(
        "group flex min-w-0 items-center gap-2 rounded-sm text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      title="Rename board"
    >
      <h1 className="truncate border-b-2 border-transparent text-3xl font-bold tracking-tight text-foreground group-hover:border-brand">
        {board.name}
      </h1>
      <Pencil
        className="h-4 w-4 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
}
