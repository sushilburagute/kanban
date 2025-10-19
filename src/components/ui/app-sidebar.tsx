"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  KanbanIcon,
  LucideEarth,
  Moon,
  Plus,
  Sun,
  TerminalSquareIcon,
  Trash2,
  Loader2,
  BarChart3,
} from "lucide-react";
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
import { useBoards } from "@/components/contexts/BoardsProvider";
import type { KanbanBoardMeta } from "@/types/Board";
import { cn } from "@/lib/utils";

const sidebarLinks = [{ name: "stats", url: "/stats", icon: <BarChart3 /> }];

const sidebarFooterLinks = [
  { name: "howItsMade", url: "https://sush.dev/articles", icon: <LucideEarth />, external: true },
  { name: "madeBySush", url: "https://sush.dev/", icon: <TerminalSquareIcon />, external: true },
];

type SidebarLink = {
  name: string;
  url: string;
  icon: React.ReactNode;
  external?: boolean;
};

type BoardsSidebarSectionHandle = {
  resetLocalState: () => void;
};

function SidebarNavMenu({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map(({ name, url, icon, external }) => {
        const isActive = pathname === url;
        const classNames = cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive ? "bg-muted text-primary" : "hover:bg-muted"
        );

        return (
          <SidebarMenuItem key={name}>
            <SidebarMenuButton asChild>
              {external ? (
                <a href={url} target="_blank" rel="noreferrer" className={classNames}>
                  {icon}
                  <span className="truncate">{name}</span>
                </a>
              ) : (
                <Link href={url} className={classNames}>
                  {icon}
                  <span className="truncate">{name}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const { setTheme } = useTheme();
  const { resetBoards, isLoading: isBoardsLoading } = useBoards();
  const router = useRouter();
  const boardsSectionRef = React.useRef<BoardsSidebarSectionHandle | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleResetWorkspace = React.useCallback(async () => {
    if (isResetting) {
      return;
    }

    setIsResetting(true);
    try {
      await resetBoards();
      setResetDialogOpen(false);
      boardsSectionRef.current?.resetLocalState();
      router.push("/");
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, resetBoards, router]);

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between gap-2 pt-3">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-md px-2 py-1 text-2xl font-semibold text-foreground transition-colors hover:bg-muted"
              >
                kanban
              </Link>
              <SidebarGroupAction
                title="Toggle theme"
                type="button"
                onClick={() => setTheme((val) => (val === "light" ? "dark" : "light"))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background text-foreground transition-colors hover:bg-muted"
              >
                <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </SidebarGroupAction>
            </div>

            <SidebarSeparator className="my-4" />
            <SidebarGroupContent>
              <SidebarNavMenu links={sidebarLinks} />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-4" />
          {/* TODO: fix this type */}
          <BoardsSidebarSection ref={boardsSectionRef} />
        </SidebarContent>

        <SidebarSeparator className="my-4" />
        <SidebarFooter>
          <SidebarNavMenu links={sidebarFooterLinks} />
          {!isBoardsLoading ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
              onClick={() => setResetDialogOpen(true)}
              disabled={isResetting}
            >
              <Trash2 className="h-4 w-4" />
              Reset workspace
            </Button>
          ) : null}
        </SidebarFooter>
      </Sidebar>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset workspace</DialogTitle>
            <DialogDescription>
              Remove every board, task, and preference. A fresh welcome board will be created
              afterwards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleResetWorkspace}
              disabled={isResetting}
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
type BoardsSidebarSectionProps = object;

const BoardsSidebarSection = React.forwardRef<
  BoardsSidebarSectionHandle,
  BoardsSidebarSectionProps
>((_, ref) => {
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

      setDeleteDialog(null);
      if (pathname === `/boards/${deleteDialog.id}` && remaining.length > 0) {
        router.replace(`/boards/${remaining[0].id}`);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [boards, deleteBoard, deleteDialog, isDeleting, pathname, router]);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Boards</span>
          <SidebarGroupAction
            title="Add board"
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="h-8 w-8 rounded-md border border-border/60 bg-background transition-colors hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add board</span>
          </SidebarGroupAction>
        </SidebarGroupLabel>

        <SidebarGroupContent className="mt-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <SidebarMenuSkeleton key={index} showIcon />
              ))}
            </div>
          ) : (
            <SidebarMenu>
              {boards.map((board) => {
                const href = `/boards/${board.id}`;
                const isActive = pathname === href;
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
                        <KanbanIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{board.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction asChild showOnHover>
                      <button
                        type="button"
                        className={cn(
                          "text-muted-foreground transition-colors hover:text-destructive",
                          boards.length <= 1 && "pointer-events-none opacity-40"
                        )}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (boards.length <= 1) return;
                          setDeleteDialog(board);
                          setDeleteError(null);
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
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setNewBoardName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create board</DialogTitle>
            <DialogDescription>
              Give your board a clear name so the team can find it later.
            </DialogDescription>
          </DialogHeader>

          <form id="create-board-form" className="space-y-4" onSubmit={handleCreateBoard}>
            <div className="space-y-2">
              <label htmlFor="board-name" className="text-sm font-medium text-foreground">
                Board name
              </label>
              <Input
                id="board-name"
                autoFocus
                placeholder="Growth roadmap"
                value={newBoardName}
                onChange={(event) => setNewBoardName(event.target.value)}
              />
            </div>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewBoardName("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-board-form" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete board</DialogTitle>
            <DialogDescription>
              This removes {deleteDialog?.name ?? "this board"} and all of its tasks. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteBoard}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
BoardsSidebarSection.displayName = "BoardsSidebarSection";
