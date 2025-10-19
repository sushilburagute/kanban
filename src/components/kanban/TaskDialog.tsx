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
import type { TaskPriority, TaskStatus } from "@/types/Tasks";

export type TaskDialogFormValues = {
  title: string;
  description: string;
  columnId: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  labels: string;
};

type TaskDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  columns: Array<{
    id: TaskStatus;
    title: string;
  }>;
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
  const [formValues, setFormValues] =
    React.useState<TaskDialogFormValues>(initialValues);

  React.useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const handleChange = <Field extends keyof TaskDialogFormValues>(
    field: Field,
    value: TaskDialogFormValues[Field]
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit(formValues);
    },
    [formValues, onSubmit]
  );

  const dialogTitle = mode === "create" ? "Add task" : "Edit task";
  const dialogDescription =
    mode === "create"
      ? "Input just enough detail so the team can pick it up quickly."
      : "Update the task details and reassign status or priority.";

  const isValid = formValues.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit}
          id="task-dialog-form"
        >
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Summarize the work item"
              value={formValues.title}
              onChange={(event) =>
                handleChange("title", event.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Outline the objective, context, or next steps."
              value={formValues.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <select
                id="task-status"
                value={formValues.columnId}
                onChange={(event) =>
                  handleChange("columnId", event.target.value as TaskStatus)
                }
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id} className="bg-background text-foreground">
                    {column.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={formValues.priority}
                onChange={(event) =>
                  handleChange("priority", event.target.value as TaskPriority)
                }
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low" className="bg-background text-foreground">
                  Low
                </option>
                <option value="medium" className="bg-background text-foreground">
                  Medium
                </option>
                <option value="high" className="bg-background text-foreground">
                  High
                </option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formValues.dueDate}
                onChange={(event) =>
                  handleChange("dueDate", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-labels">Labels</Label>
              <Input
                id="task-labels"
                placeholder="Design, Research"
                value={formValues.labels}
                onChange={(event) =>
                  handleChange("labels", event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple labels with commas.
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>

            {mode === "edit" && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="flex-1 sm:flex-none"
              >
                Delete
              </Button>
            ) : null}
          </div>

          <Button type="submit" form="task-dialog-form" disabled={!isValid}>
            {mode === "create" ? "Create task" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
