import { mockTasks } from "@/mock/MockTasks";
import { Task } from "./../types/Task";
import { KanbanCard } from "./KanbanCard";

export default function KanbanBoard() {
  return (
    <div className="grid grid-cols-3 gap-4 h-full mt-4 dark:bg-slate-950">
      <div className="flex flex-col h-full bg-red-50 dark:bg-slate-900" id="todo">
        {mockTasks
          .filter((task: Task) => task.status === "Todo")
          .map((task: Task) => {
            return <KanbanCard task={task} key={task.title} />;
          })}
      </div>
      <div className="flex flex-col h-full bg-red-50 dark:bg-slate-900" id="in-progress"></div>
      <div className="flex flex-col h-full bg-red-50 dark:bg-slate-900" id="done"></div>
    </div>
  );
}
