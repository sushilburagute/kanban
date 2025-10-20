"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Loader2,
  LucideEarth,
  Moon,
  Sun,
  TerminalSquareIcon,
  Trash2,
} from "lucide-react";

import { useBoards } from "@/components/contexts/BoardsProvider";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SidebarLink } from "@/types/SidebarLink";
import { SidebarNavMenu } from "./sidebarNavMenu";
import { BoardsSidebarSection, type BoardsSidebarSectionHandle } from "./boardsSidebarSection";
import { trackEvent } from "@/lib/analytics";

const sidebarLinks: SidebarLink[] = [{ name: "stats", url: "/stats", icon: <BarChart3 /> }];

const sidebarFooterLinks: SidebarLink[] = [
  { name: "howItsMade", url: "https://sush.dev/articles", icon: <LucideEarth />, external: true },
  { name: "madeBySush", url: "https://sush.dev/", icon: <TerminalSquareIcon />, external: true },
];

export function AppSidebar() {
  const { setTheme } = useTheme();
  const { resetBoards, isLoading: isBoardsLoading } = useBoards();
  const router = useRouter();

  const boardsSectionRef = React.useRef<BoardsSidebarSectionHandle | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleToggleTheme = React.useCallback(() => {
    setTheme((val) => {
      const next = val === "light" ? "dark" : "light";
      trackEvent("theme_toggle", { theme: next });
      return next;
    });
  }, [setTheme]);

  const handleResetWorkspace = React.useCallback(async () => {
    if (isResetting) return;

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
          <SidebarHeaderSection links={sidebarLinks} onToggleTheme={handleToggleTheme} />
          <SidebarSeparator className="my-4" />
          <BoardsSidebarSection ref={boardsSectionRef} />
        </SidebarContent>

        <SidebarSeparator className="my-4" />
        <SidebarFooterSection
          links={sidebarFooterLinks}
          isLoading={isBoardsLoading}
          isResetting={isResetting}
          onResetClick={() => setResetDialogOpen(true)}
        />
      </Sidebar>

      <ResetWorkspaceDialog
        open={resetDialogOpen}
        isResetting={isResetting}
        onOpenChange={setResetDialogOpen}
        onConfirm={handleResetWorkspace}
      />
    </>
  );
}

type SidebarHeaderSectionProps = {
  links: SidebarLink[];
  onToggleTheme: () => void;
};

function SidebarHeaderSection({ links, onToggleTheme }: SidebarHeaderSectionProps) {
  return (
    <SidebarGroup>
      <div className="flex items-center justify-between gap-2 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-1 text-2xl font-semibold text-foreground transition-colors hover:bg-muted"
        >
          kanban
        </Link>
        <ThemeToggleButton onClick={onToggleTheme} />
      </div>

      <SidebarSeparator className="my-4" />
      <SidebarGroupContent>
        <SidebarNavMenu links={links} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ThemeToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <SidebarGroupAction
      title="Toggle theme"
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background text-foreground transition-colors hover:bg-muted"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </SidebarGroupAction>
  );
}

type SidebarFooterSectionProps = {
  links: SidebarLink[];
  isLoading: boolean;
  isResetting: boolean;
  onResetClick: () => void;
};

function SidebarFooterSection({
  links,
  isLoading,
  isResetting,
  onResetClick,
}: SidebarFooterSectionProps) {
  return (
    <SidebarFooter>
      {!isLoading ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            onClick={onResetClick}
            disabled={isResetting}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-rose-500"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="truncate">Reset workspace</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
      <SidebarNavMenu links={links} />
    </SidebarFooter>
  );
}

type ResetWorkspaceDialogProps = {
  open: boolean;
  isResetting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function ResetWorkspaceDialog({
  open,
  isResetting,
  onOpenChange,
  onConfirm,
}: ResetWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset workspace</DialogTitle>
          <DialogDescription>
            Remove every board, task, and preference. You&apos;ll start with a clean workspace and
            can create new boards from scratch afterwards.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isResetting}>
            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
