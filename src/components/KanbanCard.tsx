import { Task } from "@/types/Task";

export function KanbanCard({ task }: { task: Task }) {
  return <div>{task.title}</div>;
}
