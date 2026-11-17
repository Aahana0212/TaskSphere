
export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Done";

export type TaskPriority =
  | "Low"
  | "Medium"
  | "High";

// DAY 15 - TASK CATEGORIES
export type TaskCategory =
  | "Frontend"
  | "Backend"
  | "Bug"
  | "Documentation"
  | "Other";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
  

  // DAY 15 - NEW FIELD
  category: TaskCategory;
  tags: string[];
};

export type TaskInput = Omit<Task, "id">;
