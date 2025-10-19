import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";
import { KanbanColumnType } from "@/types/KanbanColumn";

type KanbanColumnProps = {
  column: KanbanColumnType;
  count: number;
  children: React.ReactNode;
  onAddTask?: () => void;
};

export function KanbanColumn({ column, count, onAddTask, children }: KanbanColumnProps) {
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
