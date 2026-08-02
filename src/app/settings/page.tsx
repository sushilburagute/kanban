"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Download, Laptop, Loader2, Moon, Sun, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspaceHydration } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/store/workspace";
import { exportWorkspace, parseWorkspaceExport, type ParsedImport } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { TOGGLE_OFF, TOGGLE_ON } from "@/lib/styles";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  useWorkspaceHydration();
  const boards = useWorkspaceStore((state) => state.boards);

  return (
    <main className="min-h-screen w-full bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="space-y-1.5">
          <p className="eyebrow text-muted-foreground">Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Everything here applies to this browser only — that&apos;s where your data lives.
          </p>
        </header>

        <SettingsSection title="Appearance" description="How the signboard reads.">
          <ThemePicker />
        </SettingsSection>

        <SettingsSection
          title="Your data"
          description={`${boards.length} ${boards.length === 1 ? "board" : "boards"} stored locally in this browser. Back them up as a file you keep.`}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <ExportButton disabled={boards.length === 0} />
            <ImportControl />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Danger zone"
          description="Removes every board and card from this browser. Export a backup first."
          tone="danger"
        >
          <ResetControl />
        </SettingsSection>

        <footer className="border-t pt-5 text-xs leading-relaxed text-muted-foreground">
          <p>
            kanban is local-first: no account, no server, no tracking of your cards. Made by{" "}
            <a
              href="https://sush.dev/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              sush
            </a>
            {" — read "}
            <a
              href="https://sush.dev/articles"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              how it&apos;s made
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}

function SettingsSection({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h2 className={cn("text-base font-semibold", tone === "danger" && "text-destructive")}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

const emptySubscribe = () => () => {};

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  // True after hydration only — theme is unknowable during SSR.
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const options = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "System", icon: <Laptop className="h-4 w-4" /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
      {options.map((option) => {
        const selected = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              setTheme(option.value);
              trackEvent("theme_toggle", { theme: option.value });
            }}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? TOGGLE_ON : TOGGLE_OFF
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ExportButton({ disabled }: { disabled: boolean }) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportWorkspace();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kanban-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      trackEvent("workspace_export", { board_count: data.boards.length });
      toast.success("Backup downloaded", {
        description: "Keep the file somewhere safe — it's the only copy outside this browser.",
      });
    } catch {
      toast.error("Couldn't read your data to export it");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={disabled || isExporting}>
      {isExporting ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      Export backup
    </Button>
  );
}

function ImportControl() {
  const router = useRouter();
  const applyImport = useWorkspaceStore((state) => state.applyImport);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState<ParsedImport | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = parseWorkspaceExport(JSON.parse(await file.text()));
      setPending(parsed);
    } catch (error) {
      toast.error("Can't import that file", {
        description:
          error instanceof Error && error.message !== "Unexpected end of JSON input"
            ? error.message
            : "It doesn't look like a kanban backup.",
      });
    }
  };

  const handleConfirm = async () => {
    if (!pending || isImporting) return;

    setIsImporting(true);
    try {
      await applyImport(pending);
      const first = pending.boards[0];
      setPending(null);
      toast.success(
        `Imported ${pending.boards.length} ${pending.boards.length === 1 ? "board" : "boards"}`
      );
      if (first) {
        router.push(`/boards/${first.id}`);
      }
    } catch {
      toast.error("Import failed", {
        description: "Your existing data was not changed.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-1 h-4 w-4" />
        Import backup
      </Button>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace workspace with backup?</DialogTitle>
            <DialogDescription>
              This loads {pending?.boards.length ?? 0}{" "}
              {(pending?.boards.length ?? 0) === 1 ? "board" : "boards"} from the file and replaces
              everything currently in this browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleConfirm} disabled={isImporting}>
              {isImporting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Import and replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResetControl() {
  const router = useRouter();
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);

  const [open, setOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await resetWorkspace();
      setOpen(false);
      toast.success("Workspace reset");
      router.push("/");
    } catch {
      // resetWorkspace already surfaced the error.
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="mr-1 h-4 w-4" />
        Reset workspace
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset workspace</DialogTitle>
            <DialogDescription>
              Removes every board and card from this browser. There is no undo — export a backup
              first if you might want any of it back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
              {isResetting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
