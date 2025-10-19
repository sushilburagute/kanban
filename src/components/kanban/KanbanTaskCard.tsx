"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import type { KanbanTask } from "@/types/Tasks";
import { CalendarClock, GripVertical, TagIcon } from "lucide-react";

type KanbanTaskCardProps = {
  task: KanbanTask;
  onSelect?: (task: KanbanTask) => void;
};

const priorityAccent: Record<KanbanTask["priority"], string> = {
  high: "bg-rose-200 text-rose-900 dark:bg-rose-500/10 dark:text-rose-500",
  medium: "bg-amber-200 text-amber-900 dark:bg-amber-500/10 dark:text-amber-500",
  low: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-500",
};

export function KanbanTaskCard({ task, onSelect }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      columnId: task.columnId,
    },
  });

  const style = React.useMemo<React.CSSProperties>(() => {
    const translate = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;

    return {
      transform: translate,
      transition,
    };
  }, [transform, transition]);

  const handleSelect = React.useCallback(() => {
    onSelect?.(task);
  }, [onSelect, task]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(task);
      }
    },
    [onSelect, task]
  );

  const dueDate = React.useMemo(() => {
    if (!task.dueDate) return null;

    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });

    return formatter.format(new Date(task.dueDate));
  }, [task.dueDate]);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all",
        "hover:border-border hover:shadow-md",
        isDragging && "z-10 border-primary shadow-lg ring-2 ring-primary/40"
      )}
      tabIndex={onSelect ? 0 : -1}
      role={onSelect ? "button" : undefined}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight text-foreground">{task.title}</h3>
        <button
          type="button"
          className="rounded-md border border-transparent p-1 text-muted-foreground/60 transition-colors hover:border-border hover:bg-muted/40 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          onClick={(event) => event.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{task.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium capitalize shadow-sm",
            priorityAccent[task.priority]
          )}
        >
          {task.priority} priority
        </span>

        {dueDate ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {dueDate}
          </span>
        ) : null}
      </div>

      {task.labels.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground/80"
            >
              <TagIcon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
