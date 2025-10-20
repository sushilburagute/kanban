"use client";

import Link from "next/link";
import { ArrowRight, SquareKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBoards } from "@/components/contexts/BoardsProvider";
import { DEFAULT_BOARD_ID } from "@/data/kanban";

export default function Home() {
  const { boards, isLoading } = useBoards();
  const primaryBoard = boards[0];
  const boardHref = primaryBoard ? `/boards/${primaryBoard.id}` : `/boards/${DEFAULT_BOARD_ID}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-16 px-6 py-24 sm:px-10">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <SquareKanban className="h-3.5 w-3.5" />
            Kanban workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Calm structure for work that never stops moving.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A minimal board designed to breathe,not shout. Capture what matters, drag cards when
            plans change, and stay on top of what matters.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
              <Link href={boardHref}>
                {isLoading ? "Loading boards…" : "Enter your board"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              Your boards live locally. No sign-in, no noise.
            </span>
          </div>
        </header>
      </div>
    </main>
  );
}
