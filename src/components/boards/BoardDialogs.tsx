"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
import type { KanbanBoard } from "@/types/kanban";

type CreateBoardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const router = useRouter();
  const addBoard = useWorkspaceStore((state) => state.addBoard);

  const [name, setName] = React.useState("");
  const [withSeedData, setWithSeedData] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setName("");
      setWithSeedData(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const board = await addBoard(name, { withSeedData });
      handleOpenChange(false);
      router.push(`/boards/${board.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
          <DialogDescription>
            A board starts with To do, In progress, and Done — you can rename, add, and reorder
            columns once it exists.
          </DialogDescription>
        </DialogHeader>

        <form id="create-board-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="board-name">Board name</Label>
            <Input
              id="board-name"
              autoFocus
              placeholder="Growth roadmap"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <label
            htmlFor="board-seed"
            className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/40 p-3"
          >
            <input
              id="board-seed"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand"
              checked={withSeedData}
              onChange={(event) => setWithSeedData(event.target.checked)}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                Include guide cards
              </span>
              <span className="block text-xs text-muted-foreground">
                Six sample cards that walk through dragging, editing, and customizing the board.
              </span>
            </span>
          </label>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-board-form" variant="brand" disabled={isCreating}>
            {isCreating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Create board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteBoardDialogProps = {
  board: KanbanBoard | null;
  onClose: () => void;
};

export function DeleteBoardDialog({ board, onClose }: DeleteBoardDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    if (!board || isDeleting) return;

    setIsDeleting(true);
    try {
      const remaining = useWorkspaceStore
        .getState()
        .boards.filter((item) => item.id !== board.id);

      await useWorkspaceStore.getState().deleteBoard(board.id);
      onClose();

      if (pathname === `/boards/${board.id}`) {
        router.replace(remaining.length ? `/boards/${remaining[0].id}` : "/boards");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!board} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete board</DialogTitle>
          <DialogDescription>
            This removes “{board?.name ?? "this board"}” and every task on it from this browser.
            There is no undo — export a backup from Settings first if you might want it back.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Delete board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
