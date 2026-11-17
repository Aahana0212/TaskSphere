import type { Task } from "../types/task";
import type { Project } from "../types/project";
import type { TaskActivity } from "../types/activity";

export type User = { id: string; name: string; email: string };
export type Workspace = { tasks: Task[]; projects: Project[]; activities: TaskActivity[]; archivedTasks: Task[] };
const BASE = import.meta.env.VITE_API_URL || "/api";
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init, credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}
export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  signup: (name: string, email: string, password: string) => request<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) => request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  workspace: () => request<Workspace>("/workspace"),
  saveWorkspace: (workspace: Workspace) => request<{ message: string }>("/workspace", { method: "PUT", body: JSON.stringify(workspace) }),
};
