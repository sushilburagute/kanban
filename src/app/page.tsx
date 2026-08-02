import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-12 px-6 py-20 sm:px-10">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[5px] bg-brand font-mono text-base font-semibold text-brand-foreground">
              k
            </span>
            <span className="eyebrow text-muted-foreground">Local-first kanban</span>
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            A signboard for your work.
            <br />
            Nothing else.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Kanban started as a card on a factory board — a signal you could read at a glance.
            This one lives entirely in your browser: no sign-in, no sync, no noise. Drag cards
            when plans change and always know where things stand.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" variant="brand" className="w-full gap-2 sm:w-auto">
              <Link href="/boards">
                Open your board
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              Your boards never leave this device.
            </span>
          </div>
        </header>

        <MiniBoard />
      </div>
    </main>
  );
}

/** A quiet, non-interactive board sketch — the product introducing itself. */
function MiniBoard() {
  const lanes: Array<{ title: string; cards: Array<{ w: string; signal?: boolean }> }> = [
    {
      title: "To do",
      cards: [{ w: "w-3/4" }, { w: "w-1/2" }],
    },
    {
      title: "In progress",
      cards: [{ w: "w-2/3", signal: true }],
    },
    {
      title: "Done",
      cards: [{ w: "w-3/5" }, { w: "w-4/5" }, { w: "w-1/2" }],
    },
  ];

  return (
    <div aria-hidden className="grid max-w-2xl grid-cols-3 gap-6">
      {lanes.map((lane) => (
        <div key={lane.title}>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="eyebrow text-foreground">{lane.title}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {lane.cards.length}
            </span>
          </div>
          <div className="flex flex-col gap-2 pt-2.5">
            {lane.cards.map((card, index) => (
              <div key={index} className="relative rounded-md border bg-card px-3 py-2.5 shadow-xs">
                <span
                  className={cn(
                    "absolute bottom-2.5 left-1.5 top-2.5 w-[3px] rounded-full",
                    card.signal ? "bg-brand" : "bg-foreground/15"
                  )}
                />
                <div className={`h-2 rounded-sm bg-foreground/60 ${card.w}`} />
                <div className="mt-1.5 h-1.5 w-1/3 rounded-sm bg-muted-foreground/30" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
