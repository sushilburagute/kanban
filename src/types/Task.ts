export type Priority = "Low" | "Medium" | "High";
export type Status = "Todo" | "In Progress" | "Done";

export interface Task {
  title: string;
  description: string;
  completeby: number;
  pills: Array<string>;
  status: Status;
  priority: Priority;
}
