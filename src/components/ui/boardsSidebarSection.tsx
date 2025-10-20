"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Loader2, Plus, SquareKanban, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBoards } from "@/components/contexts/BoardsProvider";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { KanbanBoardMeta } from "@/types/Board";

export type BoardsSidebarSectionHandle = {
  resetLocalState: () => void;
};

type BoardsSidebarSectionProps = Record<string, object>;

export const BoardsSidebarSection = React.forwardRef<
  BoardsSidebarSectionHandle,
  BoardsSidebarSectionProps
>(function BoardsSidebarSection(_, ref) {
  const { boards, isLoading, addBoard, deleteBoard } = useBoards();
  const pathname = usePathname();
  const router = useRouter();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newBoardName, setNewBoardName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const [deleteDialog, setDeleteDialog] = React.useState<KanbanBoardMeta | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    resetLocalState: () => {
      setCreateDialogOpen(false);
      setNewBoardName("");
      setDeleteDialog(null);
      setDeleteError(null);
    },
  }));

  const handleCreateBoard = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isCreating) return;

      const name = newBoardName.trim();

      setIsCreating(true);
      try {
        const board = await addBoard(name);
        setCreateDialogOpen(false);
        setNewBoardName("");
        router.push(`/boards/${board.id}`);
      } finally {
        setIsCreating(false);
      }
    },
    [addBoard, isCreating, newBoardName, router]
  );

  const handleDeleteBoard = React.useCallback(async () => {
    if (!deleteDialog || isDeleting) return;

    setDeleteError(null);
    setIsDeleting(true);

    const remaining = boards.filter((board) => board.id !== deleteDialog.id);
    try {
      const success = await deleteBoard(deleteDialog.id);
      if (!success) {
        setDeleteError("Keep at least one board active.");
        return;
      }

      const deletedBoardId = deleteDialog.id;
      setDeleteDialog(null);
      if (pathname === `/boards/${deletedBoardId}` && remaining.length > 0) {
        router.replace(`/boards/${remaining[0].id}`);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [boards, deleteBoard, deleteDialog, isDeleting, pathname, router]);

  const handleCreateDialogOpenChange = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setNewBoardName("");
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialog(null);
    setDeleteError(null);
  };

  return (
    <>
      <SidebarGroup>
        <BoardSectionHeader onAddBoard={() => setCreateDialogOpen(true)} />
        <SidebarGroupContent className="mt-2">
          <BoardsList
            boards={boards}
            isLoading={isLoading}
            activePath={pathname}
            onDeleteRequest={(board) => {
              setDeleteDialog(board);
              setDeleteError(null);
            }}
          />
        </SidebarGroupContent>
      </SidebarGroup>

      <CreateBoardDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogOpenChange}
        onSubmit={handleCreateBoard}
        isCreating={isCreating}
        name={newBoardName}
        onNameChange={(event) => setNewBoardName(event.target.value)}
        onCancel={() => {
          setCreateDialogOpen(false);
          setNewBoardName("");
        }}
      />

      <DeleteBoardDialog
        board={deleteDialog}
        error={deleteError}
        isDeleting={isDeleting}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteBoard}
      />
    </>
  );
});
BoardsSidebarSection.displayName = "BoardsSidebarSection";

type BoardSectionHeaderProps = {
  onAddBoard: () => void;
};

function BoardSectionHeader({ onAddBoard }: BoardSectionHeaderProps) {
  return (
    <>
      <SidebarGroupLabel className="flex items-center justify-between gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Boards</span>
        <SidebarGroupAction
          title="Add board"
          type="button"
          onClick={onAddBoard}
          className="h-8 w-8 rounded-md border border-border/60 bg-background transition-colors hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add board</span>
        </SidebarGroupAction>
      </SidebarGroupLabel>
    </>
  );
}

type BoardsListProps = {
  boards: KanbanBoardMeta[];
  isLoading: boolean;
  activePath: string | null;
  onDeleteRequest: (board: KanbanBoardMeta) => void;
};

function BoardsList({ boards, isLoading, activePath, onDeleteRequest }: BoardsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <SidebarMenuSkeleton key={index} showIcon />
        ))}
      </div>
    );
  }

  return (
    <SidebarMenu>
      {boards.map((board) => {
        const href = `/boards/${board.id}`;
        const isActive = activePath === href;

        return (
          <SidebarMenuItem key={board.id} className="group flex items-center">
            <SidebarMenuButton asChild>
              <Link
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive ? "bg-muted text-primary" : "hover:bg-muted"
                )}
              >
                <SquareKanban className="h-4 w-4 shrink-0" />
                <span className="truncate">{board.name}</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuAction asChild showOnHover>
              <button
                type="button"
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDeleteRequest(board);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete board</span>
              </button>
            </SidebarMenuAction>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

type CreateBoardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isCreating: boolean;
  name: string;
  onNameChange: React.ChangeEventHandler<HTMLInputElement>;
  onCancel: () => void;
};

export function CreateBoardDialog({
  open,
  onOpenChange,
  onSubmit,
  isCreating,
  name,
  onNameChange,
  onCancel,
}: CreateBoardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
          <DialogDescription>
            Give your board a clear name so the team can find it later.
          </DialogDescription>
        </DialogHeader>

        <form id="create-board-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="board-name" className="text-sm font-medium text-foreground">
              Board name
            </label>
            <Input
              id="board-name"
              autoFocus
              placeholder="Growth roadmap"
              value={name}
              onChange={onNameChange}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form="create-board-form" disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteBoardDialogProps = {
  board: KanbanBoardMeta | null;
  error: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteBoardDialog({
  board,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteBoardDialogProps) {
  return (
    <Dialog open={!!board} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete board</DialogTitle>
          <DialogDescription>
            This removes {board?.name ?? "this board"} and all of its tasks. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
