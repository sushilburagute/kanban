"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CalendarClock, GripVertical } from "lucide-react";

import { PRIORITY_DOT, PRIORITY_FILL, PRIORITY_HEIGHT } from "@/lib/priority";
import { cn } from "@/lib/utils";
import type { KanbanTask, TaskPriority } from "@/types/kanban";

/**
 * The step wedge. Priority is read from two redundant channels — how tall
 * the fill is and how dense it is — so it survives the palette carrying
 * only one hue.
 */
function PrioritySpine({ priority }: { priority: TaskPriority }) {
  return (
    <span aria-hidden className="absolute inset-y-2.5 left-1.5 w-[3px]">
      <span className={cn("block w-full rounded-[1px]", PRIORITY_HEIGHT[priority], PRIORITY_FILL[priority])} />
    </span>
  );
}

type KanbanTaskCardProps = {
  task: KanbanTask;
  /** Whether the task sits in a column that counts as done (mutes overdue state). */
  isDone?: boolean;
  dragDisabled?: boolean;
  /** Position within the column, used to stagger the develop animation. */
  developIndex?: number;
  /** Re-develops this card once after it lands in a new column. */
  justMoved?: boolean;
  onSelect?: (task: KanbanTask) => void;
};

export function KanbanTaskCard({
  task,
  isDone,
  dragDisabled,
  developIndex = 0,
  justMoved,
  onSelect,
}: KanbanTaskCardProps) {
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
    data: { type: "task", columnId: task.columnId },
    disabled: dragDisabled,
  });

  const style = React.useMemo<React.CSSProperties>(
    () =>
      ({
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        // A card that just landed develops immediately and a little faster;
        // otherwise it waits its turn down the column. Capped at 8 so a long
        // column doesn't leave the last cards visibly lagging.
        animationDelay: justMoved ? "0ms" : `${Math.min(developIndex, 8) * 40}ms`,
        "--develop-duration": justMoved ? "240ms" : undefined,
      }) as React.CSSProperties,
    [transform, transition, developIndex, justMoved]
  );

  const handleSelect = React.useCallback(() => {
    onSelect?.(task);
  }, [onSelect, task]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(task);
      }
    },
    [onSelect, task]
  );

  // Captured once per mount; overdue state doesn't need to tick live.
  const [now] = React.useState(() => Date.now());

  const due = React.useMemo(() => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) return null;

    const label = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);

    return { label, overdue: !isDone && date.getTime() < now };
  }, [task.dueDate, isDone, now]);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "develop group relative rounded-md border bg-card py-3 pl-4 pr-3 shadow-xs transition-shadow",
        !dragDisabled && "cursor-grab",
        "hover:border-input hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDragging && "opacity-40"
      )}
      tabIndex={onSelect ? 0 : -1}
      role={onSelect ? "button" : undefined}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      onPointerDown={
        dragDisabled
          ? undefined
          : (listeners?.onPointerDown as React.PointerEventHandler<HTMLElement> | undefined)
      }
    >
      <PrioritySpine priority={task.priority} />

      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "text-sm font-semibold leading-snug text-foreground",
            isDone && "text-muted-foreground line-through decoration-border"
          )}
        >
          {task.title}
        </h3>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          disabled={dragDisabled}
          onClick={(event) => event.stopPropagation()}
          className="-mr-1 -mt-1 rounded p-1 text-muted-foreground/40 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 disabled:hidden"
          aria-label={`Drag ${task.title}`}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 capitalize">
          <span aria-hidden className={cn("text-[9px]", PRIORITY_DOT[task.priority])}>
            ●
          </span>
          {task.priority}
        </span>

        {due ? (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              due.overdue && "font-medium text-destructive"
            )}
          >
            <CalendarClock className="h-3 w-3" aria-hidden="true" />
            {due.label}
          </span>
        ) : null}

        {task.labels.map((label) => (
          <span key={label} className="text-muted-foreground/80">
            #{label}
          </span>
        ))}
      </div>
    </article>
  );
}

/** Static clone rendered inside the DragOverlay while a card is being dragged. */
export function TaskCardGhost({ task }: { task: KanbanTask }) {
  return (
    <article className="relative w-full rotate-2 rounded-md border border-brand bg-card py-3 pl-4 pr-3 shadow-xl">
      <PrioritySpine priority={task.priority} />
      <h3 className="text-sm font-semibold leading-snug text-foreground">{task.title}</h3>
      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      ) : null}
    </article>
  );
}
