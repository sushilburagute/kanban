"use client";

import * as React from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BoardColumn, KanbanTask } from "@/types/kanban";

import { KanbanColumn } from "./KanbanColumn";
import { TaskCardGhost } from "./KanbanTaskCard";

type DragData = { type: "task" | "column" | "column-drop"; columnId?: string };

type KanbanBoardProps = {
  columns: BoardColumn[];
  /** Tasks currently visible (filtered). Equal to all tasks when not filtering. */
  tasks: KanbanTask[];
  totalsByColumn: Record<string, number>;
  filtering: boolean;
  onTasksChange: (tasks: KanbanTask[]) => void;
  onColumnsReorder: (fromIndex: number, toIndex: number) => void;
  onAddColumn: (title: string) => void;
  onAddTask: (columnId: string) => void;
  onTaskOpen: (task: KanbanTask) => void;
  onEditColumn: (column: BoardColumn) => void;
};

export function KanbanBoard({
  columns,
  tasks,
  totalsByColumn,
  filtering,
  onTasksChange,
  onColumnsReorder,
  onAddColumn,
  onAddTask,
  onTaskOpen,
  onEditColumn,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeTask, setActiveTask] = React.useState<KanbanTask | null>(null);

  // Cards re-develop once after landing in a new column. Cleared on a timer
  // so the animation can't re-fire on unrelated re-renders.
  const [lastMovedTaskId, setLastMovedTaskId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!lastMovedTaskId) return;
    const timer = window.setTimeout(() => setLastMovedTaskId(null), 400);
    return () => window.clearTimeout(timer);
  }, [lastMovedTaskId]);

  const tasksByColumn = React.useMemo(() => {
    const map = new Map<string, KanbanTask[]>();
    columns.forEach((column) => map.set(column.id, []));
    tasks.forEach((task) => {
      map.get(task.columnId)?.push(task);
    });
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [columns, tasks]);

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as DragData | undefined;
      if (data?.type === "task") {
        setActiveTask(tasks.find((task) => task.id === String(event.active.id)) ?? null);
      }
    },
    [tasks]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);

      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as DragData | undefined;
      const overData = over.data.current as DragData | undefined;
      if (!activeData) return;

      if (activeData.type === "column") {
        const targetColumnId = overData?.columnId;
        if (!targetColumnId || !activeData.columnId) return;

        const fromIndex = columns.findIndex((column) => column.id === activeData.columnId);
        const toIndex = columns.findIndex((column) => column.id === targetColumnId);
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

        onColumnsReorder(fromIndex, toIndex);
        return;
      }

      if (activeData.type !== "task" || !activeData.columnId) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      const sourceColumnId = activeData.columnId;
      const targetColumnId = overData?.columnId;
      if (!targetColumnId) return;

      const sourceList = [...(tasksByColumn.get(sourceColumnId) ?? [])];
      const activeIndex = sourceList.findIndex((task) => task.id === activeId);
      if (activeIndex < 0) return;

      const timestamp = new Date().toISOString();
      const nextByColumn = new Map<string, KanbanTask[]>();
      columns.forEach((column) => {
        nextByColumn.set(column.id, [...(tasksByColumn.get(column.id) ?? [])]);
      });

      if (sourceColumnId === targetColumnId) {
        const overIndex =
          overData?.type === "task"
            ? sourceList.findIndex((task) => task.id === overId)
            : sourceList.length - 1;
        if (overIndex < 0 || overIndex === activeIndex) return;

        nextByColumn.set(
          sourceColumnId,
          arrayMove(sourceList, activeIndex, overIndex).map((task) =>
            task.id === activeId ? { ...task, updatedAt: timestamp } : task
          )
        );
      } else {
        const targetList = [...(nextByColumn.get(targetColumnId) ?? [])];
        const [moved] = sourceList.splice(activeIndex, 1);
        if (!moved) return;

        const movedTask: KanbanTask = {
          ...moved,
          columnId: targetColumnId,
          updatedAt: timestamp,
        };

        const destinationIndex =
          overData?.type === "task"
            ? targetList.findIndex((task) => task.id === overId)
            : targetList.length;

        if (destinationIndex < 0 || destinationIndex >= targetList.length) {
          targetList.push(movedTask);
        } else {
          targetList.splice(destinationIndex, 0, movedTask);
        }

        nextByColumn.set(sourceColumnId, sourceList);
        nextByColumn.set(targetColumnId, targetList);
        setLastMovedTaskId(activeId);
      }

      const nextTasks: KanbanTask[] = [];
      for (const column of columns) {
        const list = nextByColumn.get(column.id) ?? [];
        list.forEach((task, index) => {
          nextTasks.push({ ...task, columnId: column.id, order: index });
        });
      }

      onTasksChange(nextTasks);
    },
    [columns, onColumnsReorder, onTasksChange, tasksByColumn]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex items-start gap-6 pb-4">
        <SortableContext
          items={columns.map((column) => `column:${column.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn.get(column.id) ?? []}
              totalCount={totalsByColumn[column.id] ?? 0}
              filtering={filtering}
              dragDisabled={filtering}
              lastMovedTaskId={lastMovedTaskId}
              onAddTask={onAddTask}
              onTaskOpen={onTaskOpen}
              onEditColumn={onEditColumn}
            />
          ))}
        </SortableContext>

        <AddColumnRail onAdd={onAddColumn} />
      </div>

      <DragOverlay>{activeTask ? <TaskCardGhost task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}

function AddColumnRail({ onAdd }: { onAdd: (title: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState("");

  const submit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setTitle("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-[220px] shrink-0 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add column
      </button>
    );
  }

  return (
    <form
      className="flex w-[260px] shrink-0 flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Input
        autoFocus
        value={title}
        placeholder="Column name"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setTitle("");
            setEditing(false);
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="brand" disabled={!title.trim()}>
          Add column
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setTitle("");
            setEditing(false);
          }}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
