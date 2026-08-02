"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
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
import { useWorkspaceStore } from "@/store/workspace";
import type { BoardColumn } from "@/types/kanban";

type ColumnDialogProps = {
  boardId: string;
  column: BoardColumn | null;
  columnCount: number;
  onClose: () => void;
};

export function ColumnDialog({ boardId, column, columnCount, onClose }: ColumnDialogProps) {
  const updateColumn = useWorkspaceStore((state) => state.updateColumn);
  const deleteColumn = useWorkspaceStore((state) => state.deleteColumn);

  const [title, setTitle] = React.useState("");
  const [countsAsDone, setCountsAsDone] = React.useState(false);
  const [deleteMode, setDeleteMode] = React.useState<"move" | "delete">("move");
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  // Re-seed the form when a different column is opened.
  const [prevColumn, setPrevColumn] = React.useState(column);
  if (prevColumn !== column) {
    setPrevColumn(column);
    if (column) {
      setTitle(column.title);
      setCountsAsDone(column.countsAsDone);
      setDeleteMode("move");
      setConfirmingDelete(false);
    }
  }

  const isLastColumn = columnCount <= 1;

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!column) return;

    const trimmed = title.trim();
    if (!trimmed) return;

    updateColumn(boardId, column.id, { title: trimmed, countsAsDone });
    onClose();
  };

  const handleDelete = () => {
    if (!column) return;
    deleteColumn(boardId, column.id, deleteMode);
    onClose();
  };

  return (
    <Dialog open={!!column} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit column</DialogTitle>
          <DialogDescription>
            Rename the column or change how its cards are counted.
          </DialogDescription>
        </DialogHeader>

        <form id="column-form" className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label htmlFor="column-title">Name</Label>
            <Input
              id="column-title"
              value={title}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <label
            htmlFor="column-done"
            className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/40 p-3"
          >
            <input
              id="column-done"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand"
              checked={countsAsDone}
              onChange={(event) => setCountsAsDone(event.target.checked)}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                Cards here count as done
              </span>
              <span className="block text-xs text-muted-foreground">
                Completed work for this board&apos;s progress in Stats.
              </span>
            </span>
          </label>
        </form>

        <div className="rounded-md border border-destructive/30 p-3">
          {!confirmingDelete ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Delete this column</p>
                <p className="text-xs text-muted-foreground">
                  {isLastColumn
                    ? "A board needs at least one column."
                    : "Choose what happens to its cards first."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructiveOutline"
                disabled={isLastColumn}
                onClick={() => setConfirmingDelete(true)}
              >
                Delete…
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                What should happen to the cards in “{column?.title}”?
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="delete-mode"
                    className="accent-brand"
                    checked={deleteMode === "move"}
                    onChange={() => setDeleteMode("move")}
                  />
                  Move them to the first remaining column
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="delete-mode"
                    className="accent-brand"
                    checked={deleteMode === "delete"}
                    onChange={() => setDeleteMode("delete")}
                  />
                  Delete them with the column
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="destructive" onClick={handleDelete}>
                  Delete column
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep it
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="column-form" disabled={!title.trim()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
