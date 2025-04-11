import KanbanBoard from "@/components/KanbanBoard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full flex flex-col p-4 bg-slate-50 rounded-sm dark:bg-slate-950">
      <div className="mx-2 flex justify-between">
        <h1 className="font-bold text-2xl text-slate-900 dark:text-slate-50">Tasks</h1>
        <ThemeToggle />
        <Button className="font-thin" size={"sm"}>
          <CirclePlus />
          Add Task
        </Button>
      </div>
      <KanbanBoard />
    </div>
  );
}
