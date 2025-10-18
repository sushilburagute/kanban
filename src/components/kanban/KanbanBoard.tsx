"use client";

import * as React from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusCircle } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { KanbanTask, TaskStatus } from "@/types/Tasks";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { KanbanTaskCard } from "./KanbanTaskCard";

type KanbanColumnDefinition = {
  id: TaskStatus;
  title: string;
  description?: string;
};

type KanbanBoardProps = {
  columns: KanbanColumnDefinition[];
  tasks: KanbanTask[];
  onTasksChange?: (tasks: KanbanTask[]) => void;
  onAddTask?: (columnId: TaskStatus) => void;
  onTaskOpen?: (task: KanbanTask) => void;
};

export function KanbanBoard({
  columns,
  tasks,
  onTasksChange,
  onAddTask,
  onTaskOpen,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const isMobile = useIsMobile();

  const tasksByColumn = React.useMemo(() => {
    const initialMap = new Map<string, KanbanTask[]>();

    columns.forEach((column) => {
      initialMap.set(column.id, []);
    });

    tasks.forEach((task) => {
      const existing = initialMap.get(task.columnId) ?? [];
      initialMap.set(task.columnId, [...existing, task]);
    });

    for (const [columnId, columnTasks] of initialMap) {
      columnTasks.sort((a, b) => a.order - b.order);
      initialMap.set(columnId, columnTasks);
    }

    return initialMap;
  }, [columns, tasks]);

  const totalTasks = tasks.length;

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !active) return;
      if (!onTasksChange) return;

      const activeId = String(active.id);
      const activeData = active.data.current as { type: "task"; columnId?: string } | undefined;
      const sourceColumnId = activeData?.columnId;

      if (!sourceColumnId) return;

      const overData = over.data.current as
        | { type: "task" | "column"; columnId?: string }
        | undefined;

      const overId = String(over.id);

      const potentialTarget =
        overData?.columnId ?? (columns.some((column) => column.id === overId) ? overId : undefined);

      if (!potentialTarget) return;

      const targetColumnId = potentialTarget as TaskStatus;

      const columnMap = new Map<string, KanbanTask[]>();
      const columnIds = new Set<string>();

      for (const column of columns) {
        columnIds.add(column.id);
        columnMap.set(
          column.id,
          [...(tasksByColumn.get(column.id) ?? [])] // clone
        );
      }

      if (!columnMap.has(sourceColumnId)) {
        columnMap.set(sourceColumnId, [...(tasksByColumn.get(sourceColumnId) ?? [])]);
        columnIds.add(sourceColumnId);
      }

      if (!columnMap.has(targetColumnId)) {
        columnMap.set(targetColumnId, [...(tasksByColumn.get(targetColumnId) ?? [])]);
        columnIds.add(targetColumnId);
      }

      const sourceList = columnMap.get(sourceColumnId) ?? [];
      const targetList = columnMap.get(targetColumnId) ?? [];

      const activeIndex = sourceList.findIndex((task) => task.id === activeId);
      if (activeIndex < 0) return;

      const activeTask = sourceList[activeIndex];

      if (sourceColumnId === targetColumnId) {
        const overIndex =
          overData?.type === "task"
            ? sourceList.findIndex((task) => task.id === overId)
            : sourceList.length - 1;

        if (overIndex < 0 || overIndex === activeIndex) return;

        const reordered = arrayMove(sourceList, activeIndex, overIndex).map((task, index) => ({
          ...task,
          order: index,
          updatedAt: task.id === activeTask.id ? new Date().toISOString() : task.updatedAt,
        }));

        columnMap.set(sourceColumnId, reordered);
      } else {
        const [removed] = sourceList.splice(activeIndex, 1);
        if (!removed) return;

        const destinationIndex =
          overData?.type === "task"
            ? targetList.findIndex((task) => task.id === overId)
            : targetList.length;

        const updatedTask: KanbanTask = {
          ...removed,
          columnId: targetColumnId,
          status: targetColumnId,
          updatedAt: new Date().toISOString(),
        };

        if (destinationIndex < 0 || destinationIndex >= targetList.length) {
          targetList.push(updatedTask);
        } else {
          targetList.splice(destinationIndex, 0, updatedTask);
        }

        columnMap.set(
          sourceColumnId,
          sourceList.map((task, index) => ({
            ...task,
            order: index,
            updatedAt: task.id === removed.id ? new Date().toISOString() : task.updatedAt,
          }))
        );

        columnMap.set(
          targetColumnId,
          targetList.map((task, index) => ({
            ...task,
            columnId: targetColumnId,
            status: targetColumnId,
            order: index,
            updatedAt: task.id === updatedTask.id ? updatedTask.updatedAt : task.updatedAt,
          }))
        );
      }

      const nextTasks: KanbanTask[] = [];

      for (const column of columns) {
        const list = columnMap.get(column.id);
        if (!list) continue;
        nextTasks.push(...list);
      }

      for (const columnId of columnIds) {
        if (columns.some((column) => column.id === columnId)) continue;
        const list = columnMap.get(columnId);
        if (!list) continue;
        nextTasks.push(...list);
      }

      onTasksChange(nextTasks);
    },
    [columns, onTasksChange, tasksByColumn]
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div
        className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
        )}
      >
        {columns.map((column) => {
          const columnTasks = tasksByColumn.get(column.id) ?? [];

          return (
            <SortableContext
              key={column.id}
              id={column.id}
              items={columnTasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                column={column}
                count={columnTasks.length}
                onAddTask={onAddTask ? () => onAddTask(column.id) : undefined}
              >
                {columnTasks.map((task) => (
                  <KanbanTaskCard key={task.id} task={task} onSelect={onTaskOpen} />
                ))}
              </KanbanColumn>
            </SortableContext>
          );
        })}
      </div>
      <p className="sr-only">Total tasks: {totalTasks}</p>
    </DndContext>
  );
}

type KanbanColumnProps = {
  column: KanbanColumnDefinition;
  count: number;
  children: React.ReactNode;
  onAddTask?: () => void;
};

function KanbanColumn({ column, count, onAddTask, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <section
      className={cn(
        "flex h-full min-h-[320px] flex-col rounded-2xl border border-border/60 bg-card/40 backdrop-blur",
        isOver && "border-primary/60 bg-accent/40 shadow-md"
      )}
    >
      <header className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {column.title}
          </p>
          {column.description ? (
            <p className="text-xs text-muted-foreground/80">{column.description}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </header>

      <Separator className="opacity-80" />

      <div
        ref={setNodeRef}
        className={cn("flex flex-1 flex-col gap-3 p-4 transition-colors", isOver && "bg-accent/20")}
      >
        {count ? (
          children
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-sm text-muted-foreground">
            Drag tasks here
          </div>
        )}
      </div>

      {onAddTask ? (
        <div className="p-4 pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={onAddTask}
          >
            <PlusCircle className="h-4 w-4" />
            Add task
          </Button>
        </div>
      ) : null}
    </section>
  );
}
