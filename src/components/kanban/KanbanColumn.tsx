"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Check, GripVertical, Pencil, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BoardColumn, KanbanTask } from "@/types/kanban";

import { KanbanTaskCard } from "./KanbanTaskCard";

type KanbanColumnProps = {
  column: BoardColumn;
  tasks: KanbanTask[];
  totalCount: number;
  filtering: boolean;
  dragDisabled: boolean;
  /** Task that most recently landed here from a drag, re-developed once. */
  lastMovedTaskId?: string | null;
  onAddTask: (columnId: string) => void;
  onTaskOpen: (task: KanbanTask) => void;
  onEditColumn: (column: BoardColumn) => void;
};

export function KanbanColumn({
  column,
  tasks,
  totalCount,
  filtering,
  dragDisabled,
  lastMovedTaskId,
  onAddTask,
  onTaskOpen,
  onEditColumn,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column:${column.id}`,
    data: { type: "column", columnId: column.id },
    disabled: dragDisabled,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop:${column.id}`,
    data: { type: "column-drop", columnId: column.id },
  });

  const style = React.useMemo<React.CSSProperties>(
    () => ({
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
    }),
    [transform, transition]
  );

  return (
    <section
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex w-[300px] shrink-0 flex-col",
        isDragging && "opacity-50"
      )}
      aria-label={`${column.title} column`}
    >
      <header
        className={cn(
          "group/column flex items-center gap-1.5 border-b pb-2 transition-colors",
          isOver && "border-b-brand"
        )}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          disabled={dragDisabled}
          className="-ml-1 cursor-grab rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/column:opacity-100 disabled:hidden"
          aria-label={`Reorder ${column.title} column`}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 className="eyebrow min-w-0 truncate text-foreground">{column.title}</h2>

        {column.countsAsDone ? (
          <Check
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-label="Cards here count as done"
          />
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-[11px] leading-none text-muted-foreground">
            {filtering ? `${tasks.length}/${totalCount}` : totalCount}
          </span>
          <button
            type="button"
            onClick={() => onEditColumn(column)}
            className="rounded p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/column:opacity-100"
            aria-label={`Edit ${column.title} column`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <SortableContext
        id={column.id}
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setDroppableRef}
          className={cn(
            "flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg py-2.5 transition-colors",
            isOver && "bg-secondary/60"
          )}
        >
          {tasks.length ? (
            tasks.map((task, index) => (
              <div key={task.id} className="flex items-start gap-2">
                {/* Contact-sheet frame number. Decorative — the card below
                    already carries everything a screen reader needs. */}
                <span
                  aria-hidden
                  className="w-5 shrink-0 pt-3.5 text-right font-mono text-[10px] leading-none text-muted-foreground/30"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <KanbanTaskCard
                    task={task}
                    isDone={column.countsAsDone}
                    dragDisabled={dragDisabled}
                    developIndex={index}
                    justMoved={task.id === lastMovedTaskId}
                    onSelect={onTaskOpen}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="ml-7 flex flex-1 items-center justify-center rounded-md border border-dashed p-4 text-center font-mono text-xs text-muted-foreground/70">
              {filtering && totalCount > 0 ? "No matching cards" : "No cards yet"}
            </div>
          )}
        </div>
      </SortableContext>

      <div className="pl-7">
        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add card
        </button>
      </div>
    </section>
  );
}
