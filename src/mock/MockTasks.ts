import { Task } from "@/types/Task";

export const mockTasks: Task[] = [
  {
    title: "Setup project repo",
    description: "Initialize Git repository and push the first commit.",
    completeby: Date.now() + 86400000, // Due in 1 day
    pills: ["Setup", "Git"],
    status: "Done",
    priority: "Low",
  },
  {
    title: "Design wireframes",
    description: "Create low-fidelity wireframes for the main screens.",
    completeby: Date.now() + 3 * 86400000, // Due in 3 days
    pills: ["Design", "UI/UX"],
    status: "In Progress",
    priority: "Medium",
  },
  {
    title: "Implement authentication",
    description: "Setup JWT-based authentication with email/password login.",
    completeby: Date.now() + 5 * 86400000, // Due in 5 days
    pills: ["Auth", "Backend"],
    status: "Todo",
    priority: "High",
  },
  {
    title: "Create Kanban board UI",
    description: "Develop a drag-and-drop Kanban board for task management.",
    completeby: Date.now() + 7 * 86400000, // Due in 7 days
    pills: ["Frontend", "React", "Drag-and-Drop"],
    status: "In Progress",
    priority: "High",
  },
  {
    title: "Optimize database queries",
    description: "Analyze and improve query performance for large datasets.",
    completeby: Date.now() + 10 * 86400000, // Due in 10 days
    pills: ["Database", "Optimization"],
    status: "Todo",
    priority: "Medium",
  },
  {
    title: "Setup CI/CD pipeline",
    description: "Implement automated builds, tests, and deployments.",
    completeby: Date.now() + 14 * 86400000, // Due in 14 days
    pills: ["DevOps", "CI/CD"],
    status: "Todo",
    priority: "Medium",
  },
  {
    title: "User feedback & improvements",
    description: "Gather user feedback and refine features accordingly.",
    completeby: Date.now() + 20 * 86400000, // Due in 20 days
    pills: ["User Research", "Improvements"],
    status: "Todo",
    priority: "Low",
  },
];
