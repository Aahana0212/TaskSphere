
export type ActivityType =
  | "created"
  | "updated"
  | "completed"
  | "reopened"
  | "deleted";

export type TaskActivity = {
  id: string;
  taskId: string;
  taskTitle: string;
  type: ActivityType;
  description: string;
  timestamp: string;
};
