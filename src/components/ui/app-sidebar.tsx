"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import { BarChart3, Moon, Plus, Settings, Sun, Trash2 } from "lucide-react";

import { CreateBoardDialog, DeleteBoardDialog } from "@/components/boards/BoardDialogs";
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
import { useWorkspaceHydration } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/store/workspace";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { KanbanBoard } from "@/types/kanban";

export function AppSidebar() {
  const hydrated = useWorkspaceHydration();
  const boards = useWorkspaceStore((state) => state.boards);
  const pathname = usePathname();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [boardToDelete, setBoardToDelete] = React.useState<KanbanBoard | null>(null);

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between gap-2 px-1 pt-3">
              <Wordmark />
              <ThemeToggle />
            </div>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="eyebrow flex items-center justify-between text-sidebar-foreground/60">
              <span>Boards</span>
              <SidebarGroupAction
                title="New board"
                type="button"
                onClick={() => setCreateOpen(true)}
                className="h-7 w-7 rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">New board</span>
              </SidebarGroupAction>
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              {!hydrated ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuSkeleton key={index} showIcon />
                  ))}
                </div>
              ) : boards.length === 0 ? (
                <p className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  No boards yet. Create one to get moving.
                </p>
              ) : (
                <SidebarMenu>
                  {boards.map((board) => {
                    const href = `/boards/${board.id}`;
                    const isActive = pathname === href;

                    return (
                      <SidebarMenuItem key={board.id} className="group/board flex items-center">
                        <SidebarMenuButton asChild>
                          <Link
                            href={href}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                              isActive
                                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "size-2 shrink-0 rounded-[2px] border transition-colors",
                                isActive
                                  ? "border-sidebar-primary bg-sidebar-primary"
                                  : "border-sidebar-foreground/40"
                              )}
                            />
                            <span className="truncate">{board.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuAction asChild showOnHover>
                          <button
                            type="button"
                            className="text-sidebar-foreground/60 transition-colors hover:text-destructive"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setBoardToDelete(board);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete board {board.name}</span>
                          </button>
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-2 bg-sidebar-border" />

          <SidebarGroup>
            <SidebarGroupLabel className="eyebrow text-sidebar-foreground/60">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu>
                <NavItem href="/stats" icon={<BarChart3 />} label="Stats" active={pathname === "/stats"} />
                <NavItem
                  href="/settings"
                  icon={<Settings />}
                  label="Settings"
                  active={pathname === "/settings"}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border py-3">
          <p className="px-2 text-[11px] leading-relaxed text-sidebar-foreground/45">
            Local-first — boards never leave this browser.
            <br />
            Made by{" "}
            <a
              href="https://sush.dev/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-sidebar-foreground"
            >
              sush
            </a>
            {" · "}
            <a
              href="https://sush.dev/articles"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-sidebar-foreground"
            >
              how it&apos;s made
            </a>
          </p>
        </SidebarFooter>
      </Sidebar>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteBoardDialog board={boardToDelete} onClose={() => setBoardToDelete(null)} />
    </>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md px-1 py-1 transition-opacity hover:opacity-80"
    >
      <span className="flex size-7 items-center justify-center rounded-[4px] bg-sidebar-primary font-mono text-sm font-semibold text-sidebar-primary-foreground">
        k
      </span>
      <span className="text-lg font-bold tracking-tight text-sidebar-foreground">kanban</span>
    </Link>
  );
}

function ThemeToggle() {
  const { setTheme } = useTheme();

  const handleToggle = React.useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      trackEvent("theme_toggle", { theme: next });
      return next;
    });
  }, [setTheme]);

  return (
    <button
      type="button"
      title="Toggle theme"
      onClick={handleToggle}
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={href}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors [&_svg]:size-4",
            active
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          {icon}
          <span className="truncate">{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
