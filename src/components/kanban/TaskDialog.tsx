"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PRIORITY_DOT, PRIORITY_LABEL, PRIORITY_ORDER_ASC } from "@/lib/priority";
import { TOGGLE_OFF, TOGGLE_ON } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { BoardColumn, TaskPriority } from "@/types/kanban";

export type TaskDialogFormValues = {
  title: string;
  description: string;
  columnId: string;
  priority: TaskPriority;
  dueDate: string;
  labels: string;
};

type TaskDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  columns: BoardColumn[];
  initialValues: TaskDialogFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskDialogFormValues) => void;
  onDelete?: () => void;
};

export function TaskDialog({
  open,
  mode,
  columns,
  initialValues,
  onOpenChange,
  onSubmit,
  onDelete,
}: TaskDialogProps) {
  const [formValues, setFormValues] = React.useState<TaskDialogFormValues>(initialValues);

  // Re-seed the form when the dialog is opened for a different task.
  const [prevInitialValues, setPrevInitialValues] = React.useState(initialValues);
  if (prevInitialValues !== initialValues) {
    setPrevInitialValues(initialValues);
    setFormValues(initialValues);
  }

  const handleChange = <Field extends keyof TaskDialogFormValues>(
    field: Field,
    value: TaskDialogFormValues[Field]
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  const isValid = formValues.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add card" : "Edit card"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Just enough detail to pick it up later."
              : "Update the details, or move it to another column."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} id="task-dialog-form">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Summarize the work item"
              value={formValues.title}
              onChange={(event) => handleChange("title", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Objective, context, or next steps."
              value={formValues.description}
              onChange={(event) => handleChange("description", event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Priority">
              {PRIORITY_ORDER_ASC.map((priority) => {
                const selected = formValues.priority === priority;
                return (
                  <button
                    key={priority}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleChange("priority", priority)}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? TOGGLE_ON : TOGGLE_OFF
                    )}
                  >
                    <span aria-hidden className={cn("text-[9px]", PRIORITY_DOT[priority])}>
                      ●
                    </span>
                    {PRIORITY_LABEL[priority]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-column">Column</Label>
              <select
                id="task-column"
                value={formValues.columnId}
                onChange={(event) => handleChange("columnId", event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id} className="bg-card text-foreground">
                    {column.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formValues.dueDate}
                onChange={(event) => handleChange("dueDate", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-labels">Labels</Label>
            <Input
              id="task-labels"
              placeholder="Design, Research"
              value={formValues.labels}
              onChange={(event) => handleChange("labels", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate multiple labels with commas.</p>
          </div>
        </form>

        <DialogFooter className="gap-3 sm:justify-between">
          <div>
            {mode === "edit" && onDelete ? (
              <Button
                type="button"
                variant="destructiveOutline"
                onClick={onDelete}
              >
                Delete card
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="task-dialog-form" variant="brand" disabled={!isValid}>
              {mode === "create" ? "Add card" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
