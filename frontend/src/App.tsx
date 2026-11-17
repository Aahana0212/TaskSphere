
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Kanban from "./pages/Kanban";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import Insights from "./pages/Insights";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import ArchivedTasks from "./pages/ArchivedTasks";

import type {
  Task,
  TaskInput,
  TaskStatus,
  TaskCategory,
} from "./types/task";

import type {
  Project,
  ProjectInput,
} from "./types/project";

import type { ActivityType, TaskActivity } from "./types/activity";

import "./App.css";
import "./TaskSphereTheme.css";
import { api, type Workspace } from "./auth/api";
import { scopedKey } from "./auth/storage";


// ========================================
// LOCAL STORAGE KEYS
// ========================================

const MAX_ACTIVITIES = 200;

type DeletedTaskSnapshot = {
  task: Task;
  index: number;
};

// ========================================
// DAY 15 - VALID TASK CATEGORIES
// ========================================

const TASK_CATEGORIES: TaskCategory[] = [
  "Frontend",
  "Backend",
  "Bug",
  "Documentation",
  "Other",
];

// ========================================
// DAY 16 - TAG NORMALIZATION
// ========================================

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const tags = value
    .filter(
      (tag): tag is string =>
        typeof tag === "string"
    )
    .map((tag) =>
      tag.trim().replace(/^#+/, "").toLowerCase()
    )
    .filter((tag) => tag.length > 0);

  return [...new Set(tags)];
}

// ========================================
// DEFAULT TASKS
// ========================================

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Create login page",
    description: "Build login form with validation",
    status: "To Do",
    priority: "High",
    dueDate: "2026-11-20",
    projectId: "",
    category: "Frontend",
    tags: ["react", "ui"],
  },
  {
    id: "2",
    title: "Design database",
    description: "Create database schema",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-11-25",
    projectId: "",
    category: "Backend",
    tags: ["database", "sql"],
  },
  {
    id: "3",
    title: "Set up project",
    description: "Initialize React and TypeScript",
    status: "Done",
    priority: "Low",
    dueDate: "",
    projectId: "",
    category: "Other",
    tags: ["setup"],
  },
  {
    id: "4",
    title: "Build Dashboard UI",
    description: "Create dashboard and statistics",
    status: "To Do",
    priority: "Medium",
    dueDate: "2026-11-30",
    projectId: "",
    category: "Frontend",
    tags: ["dashboard", "react"],
  },
];

// ========================================
// APP COMPONENT
// ========================================

type AppProps = { onLogout: () => Promise<void>; userName: string };

// Never mount workspace state until the authentication layer has supplied a user ID.
function App(props: AppProps) {
  const userId = sessionStorage.getItem("tasksphere_user_id");

  if (!userId) {
    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2>Session not ready</h2>
        <p>Please sign in again to access your TaskSphere workspace.</p>
        <button type="button" onClick={() => void props.onLogout()}>
          Return to sign in
        </button>
      </main>
    );
  }

  // Remount all workspace state when the signed-in account changes.
  return <AuthenticatedWorkspace key={userId} {...props} />;
}

function AuthenticatedWorkspace({ onLogout, userName }: AppProps) {
  // These keys are evaluated only after a signed-in user ID exists.
  const STORAGE_KEY = scopedKey("tasksphere_tasks");
  const PROJECTS_STORAGE_KEY = scopedKey("tasksphere_projects");
  const ACTIVITIES_STORAGE_KEY = scopedKey("tasksphere_activities");
  const ARCHIVED_STORAGE_KEY = scopedKey("tasksphere_archived_tasks");
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // ======================================
  // TASK STATE + OLD DATA MIGRATION
  // ======================================

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved === null) {
        return initialTasks;
      }

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return initialTasks;
      }

      const validTasks = parsed.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          ["To Do", "In Progress", "Done"].includes(
            item.status
          )
      );

      if (!validTasks) {
        return initialTasks;
      }

      // DAY 16 - MIGRATE OLDER TASKS
      return parsed.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,

        description:
          typeof task.description === "string"
            ? task.description
            : "",

        priority:
          ["Low", "Medium", "High"].includes(
            task.priority
          )
            ? task.priority
            : "Medium",

        dueDate:
          typeof task.dueDate === "string"
            ? task.dueDate
            : "",

        projectId:
          typeof task.projectId === "string"
            ? task.projectId
            : "",

        category:
          TASK_CATEGORIES.includes(task.category)
            ? task.category
            : "Other",

        tags: normalizeTags(task.tags),
      })) as Task[];

    } catch (error) {
      console.error(
        "Failed to load tasks:",
        error
      );

      return initialTasks;
    }
  });

  // ======================================
  // PROJECT STATE + LOCAL STORAGE
  // ======================================

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = localStorage.getItem(
        PROJECTS_STORAGE_KEY
      );

      if (!savedProjects) {
        return [];
      }

      const parsed: unknown = JSON.parse(
        savedProjects
      );

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (project): project is Project =>
          typeof project === "object" &&
          project !== null &&
          typeof project.id === "string" &&
          typeof project.name === "string" &&
          typeof project.description === "string"
      );

    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );

      return [];
    }
  });

  // ======================================
  // DAY 19 - ACTIVITY HISTORY
  // ======================================

  const [activities, setActivities] = useState<TaskActivity[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITIES_STORAGE_KEY);

      if (!saved) return [];

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter((item): item is TaskActivity => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return false;
        }

        const activity = item as Record<string, unknown>;

        return (
          typeof activity.id === "string" &&
          typeof activity.taskId === "string" &&
          typeof activity.taskTitle === "string" &&
          [
            "created",
            "updated",
            "completed",
            "reopened",
            "deleted",
          ].includes(String(activity.type)) &&
          typeof activity.description === "string" &&
          typeof activity.timestamp === "string"
        );
      }).slice(0, MAX_ACTIVITIES);

    } catch (error) {
      console.error(
        "Failed to load activities:",
        error
      );

      return [];
    }
  });

  // ======================================
  // DAY 24 - ARCHIVED TASKS STATE
  // ======================================

  const [archivedTasks, setArchivedTasks] =
    useState<Task[]>(() => {
      try {
        const saved = localStorage.getItem(
          ARCHIVED_STORAGE_KEY
        );

        if (!saved) return [];

        const parsed: unknown = JSON.parse(saved);

        if (!Array.isArray(parsed)) return [];

        const ids = new Set<string>();

        return parsed
          .filter((item): item is Task => {
            if (
              typeof item !== "object" ||
              item === null ||
              Array.isArray(item)
            ) {
              return false;
            }

            const task = item as Record<string, unknown>;

            if (
              typeof task.id !== "string" ||
              !task.id.trim() ||
              ids.has(task.id) ||
              typeof task.title !== "string" ||
              !task.title.trim() ||
              typeof task.description !== "string" ||
              !["To Do", "In Progress", "Done"].includes(
                String(task.status)
              ) ||
              !["Low", "Medium", "High"].includes(
                String(task.priority)
              ) ||
              typeof task.dueDate !== "string" ||
              typeof task.projectId !== "string" ||
              !TASK_CATEGORIES.includes(
                task.category as TaskCategory
              ) ||
              !Array.isArray(task.tags) ||
              !task.tags.every(
                (tag) => typeof tag === "string"
              )
            ) {
              return false;
            }

            ids.add(task.id);
            return true;
          })
          .map((task) => ({
            ...task,
            tags: normalizeTags(task.tags),
          }));

      } catch (error) {
        console.error(
          "Failed to load archived tasks:",
          error
        );

        return [];
      }
    });

  // ======================================
  // DAY 24 - SAVE ARCHIVED TASKS
  // ======================================

  useEffect(() => {
    try {
      localStorage.setItem(
        ARCHIVED_STORAGE_KEY,
        JSON.stringify(archivedTasks)
      );
    } catch (error) {
      console.error(
        "Failed to save archived tasks:",
        error
      );
    }
  }, [archivedTasks]);

  // Persist the whole user-owned workspace to MongoDB. Saves are serialized
  // to prevent an older request from overwriting a newer snapshot.
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  // Compare snapshots rather than skipping an effect invocation: React StrictMode
  // deliberately re-runs effects in development and must not write stale data.
  const lastQueuedSnapshot = useRef<string | null>(null);
  useEffect(() => {
    const serialized = JSON.stringify({ tasks, projects, activities, archivedTasks });
    if (lastQueuedSnapshot.current === null) {
      lastQueuedSnapshot.current = serialized;
      return;
    }
    if (lastQueuedSnapshot.current === serialized) return;
    lastQueuedSnapshot.current = serialized;
    const snapshot: Workspace = JSON.parse(serialized) as Workspace;
    saveQueue.current = saveQueue.current
      .catch((error) => {
        console.error("Previous workspace sync failed", error);
      })
      .then(async () => {
        await api.saveWorkspace(snapshot);
      });
    saveQueue.current.catch((error) => console.error("Workspace sync failed", error));
  }, [tasks, projects, activities, archivedTasks]);

  async function logout() {
    try {
      await saveQueue.current;
      await onLogout();
    } catch (error) {
      window.alert("Could not sync or log out. Check your connection and try again.");
      console.error(error);
    }
  }

  // ======================================
  // DAY 22 - UNDO DELETION STATE
  // ======================================

  const [lastDeletion, setLastDeletion] =
    useState<DeletedTaskSnapshot[]>([]);

  // Undo available for five seconds
  useEffect(() => {
    if (lastDeletion.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setLastDeletion([]);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [lastDeletion]);

  // ======================================
  // ACTIVITY LOGGER
  // ======================================

  function logActivity(
    task: Pick<Task, "id" | "title">,
    type: ActivityType,
    description: string
  ) {
    const activity: TaskActivity = {
      id: crypto.randomUUID(),
      taskId: task.id,
      taskTitle: task.title,
      type,
      description,
      timestamp: new Date().toISOString(),
    };

    setActivities((previous) =>
      [activity, ...previous].slice(
        0,
        MAX_ACTIVITIES
      )
    );
  }

  // ======================================
  // SAVE ACTIVITIES
  // ======================================

  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVITIES_STORAGE_KEY,
        JSON.stringify(activities)
      );
    } catch (error) {
      console.error(
        "Failed to save activities:",
        error
      );
    }
  }, [activities]);

  // ======================================
  // SAVE TASKS
  // ======================================

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
      );
    } catch (error) {
      console.error(
        "Failed to save tasks:",
        error
      );
    }
  }, [tasks]);

  // ======================================
  // SAVE PROJECTS
  // ======================================

  useEffect(() => {
    try {
      localStorage.setItem(
        PROJECTS_STORAGE_KEY,
        JSON.stringify(projects)
      );
    } catch (error) {
      console.error(
        "Failed to save projects:",
        error
      );
    }
  }, [projects]);

  // ======================================
  // PART 1 ENDS HERE
  // PART 2 CONTINUES INSIDE App()
  // ======================================

  // ======================================
  // ADD TASK
  // ======================================

  function addTask(task: TaskInput) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...task,
      category: task.category || "Other",
      tags: normalizeTags(task.tags),
    };

    setTasks((previous) => [...previous, newTask]);

    logActivity(
      newTask,
      "created",
      `Created task: ${newTask.title}`
    );
  }

  // ======================================
  // DELETE TASK
  // ======================================

  function deleteTask(id: string) {
    const index = tasks.findIndex(
      (task) => task.id === id
    );

    if (index === -1) return;

    const task = tasks[index];

    setLastDeletion([{ task, index }]);

    setTasks((previous) =>
      previous.filter((item) => item.id !== id)
    );

    logActivity(
      task,
      "deleted",
      `Deleted task: ${task.title}`
    );
  }

  // ======================================
  // CHANGE TASK STATUS
  // ======================================

  function changeTaskStatus(
    id: string,
    status: TaskStatus
  ) {
    const existing = tasks.find(
      (task) => task.id === id
    );

    if (!existing || existing.status === status) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, status }
          : task
      )
    );

    const type: ActivityType =
      status === "Done"
        ? "completed"
        : existing.status === "Done"
          ? "reopened"
          : "updated";

    logActivity(
      existing,
      type,
      `Changed status from ${existing.status} to ${status}`
    );
  }

  // ======================================
  // DAY 21 - BULK CHANGE TASK STATUS
  // ======================================

  function bulkChangeTaskStatus(
    ids: string[],
    status: TaskStatus
  ) {
    const selectedIds = new Set(ids);

    if (selectedIds.size === 0) return;

    const changedTasks = tasks.filter(
      (task) =>
        selectedIds.has(task.id) &&
        task.status !== status
    );

    if (changedTasks.length === 0) return;

    setTasks((previous) =>
      previous.map((task) =>
        selectedIds.has(task.id)
          ? { ...task, status }
          : task
      )
    );

    const newActivities: TaskActivity[] =
      changedTasks.map((task) => {
        const type: ActivityType =
          status === "Done"
            ? "completed"
            : task.status === "Done"
              ? "reopened"
              : "updated";

        return {
          id: crypto.randomUUID(),
          taskId: task.id,
          taskTitle: task.title,
          type,
          description:
            `Bulk status change from ${task.status} to ${status}`,
          timestamp: new Date().toISOString(),
        };
      });

    setActivities((previous) =>
      [...newActivities.reverse(), ...previous].slice(
        0,
        MAX_ACTIVITIES
      )
    );
  }

  // ======================================
  // DAY 21 - BULK DELETE TASKS
  // ======================================

  function bulkDeleteTasks(ids: string[]) {
    const selectedIds = new Set(ids);

    if (selectedIds.size === 0) return;

    const deletedSnapshots = tasks.flatMap(
      (task, index) =>
        selectedIds.has(task.id)
          ? [{ task, index }]
          : []
    );

    if (deletedSnapshots.length === 0) return;

    setLastDeletion(deletedSnapshots);

    setTasks((previous) =>
      previous.filter(
        (task) => !selectedIds.has(task.id)
      )
    );

    const timestamp = new Date().toISOString();

    const deletionActivities: TaskActivity[] =
      deletedSnapshots.map(({ task }) => ({
        id: crypto.randomUUID(),
        taskId: task.id,
        taskTitle: task.title,
        type: "deleted",
        description:
          `Bulk deleted task: ${task.title}`,
        timestamp,
      }));

    setActivities((previous) =>
      [
        ...deletionActivities.reverse(),
        ...previous,
      ].slice(0, MAX_ACTIVITIES)
    );
  }

  // ======================================
  // DAY 22 - UNDO LAST DELETION
  // ======================================

  function undoLastDeletion() {
    if (lastDeletion.length === 0) return;

    const snapshots = [...lastDeletion].sort(
      (a, b) => a.index - b.index
    );

    const existingIds = new Set(
      tasks.map((task) => task.id)
    );

    const restored = snapshots.filter(
      ({ task }) => !existingIds.has(task.id)
    );

    if (restored.length === 0) {
      setLastDeletion([]);
      return;
    }

    const nextTasks = [...tasks];

    restored.forEach(({ task, index }) => {
      nextTasks.splice(
        Math.min(index, nextTasks.length),
        0,
        task
      );
    });

    setTasks(nextTasks);

    const timestamp = new Date().toISOString();

    const restorationActivities: TaskActivity[] =
      restored.map(({ task }) => ({
        id: crypto.randomUUID(),
        taskId: task.id,
        taskTitle: task.title,
        type: "updated",
        description:
          `Restored deleted task: ${task.title}`,
        timestamp,
      }));

    setActivities((previous) =>
      [
        ...restorationActivities.reverse(),
        ...previous,
      ].slice(0, MAX_ACTIVITIES)
    );

    setLastDeletion([]);
  }

  // ======================================
  // UPDATE TASK
  // ======================================

  function updateTask(
    id: string,
    updates: TaskInput
  ) {
    const existing = tasks.find(
      (task) => task.id === id
    );

    if (!existing) return;

    const nextTask: Task = {
      ...existing,
      ...updates,
      category: updates.category || "Other",
      tags: normalizeTags(updates.tags),
    };

    const trackedFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "projectId",
      "category",
    ] as const;

    const changedFields: string[] =
      trackedFields.filter(
        (field) =>
          existing[field] !== nextTask[field]
      );

    if (
      existing.tags.join(",") !==
      nextTask.tags.join(",")
    ) {
      changedFields.push("tags");
    }

    if (changedFields.length === 0) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? nextTask : task
      )
    );

    const type: ActivityType =
      nextTask.status === "Done" &&
      existing.status !== "Done"
        ? "completed"
        : existing.status === "Done" &&
            nextTask.status !== "Done"
          ? "reopened"
          : "updated";

    logActivity(
      nextTask,
      type,
      `Updated ${changedFields.join(", ")}${
        existing.status !== nextTask.status
          ? ` (${existing.status} → ${nextTask.status})`
          : ""
      }`
    );
  }

  // ======================================
  // RESET TASKS
  // ======================================

  function resetTasks() {
    const confirmed = window.confirm(
      "Are you sure you want to reset all active tasks?"
    );

    if (!confirmed) return;

    setTasks(
      initialTasks.map((task) => ({
        ...task,
        tags: [...task.tags],
      }))
    );

    setActivities([]);
    setLastDeletion([]);
  }

  // ======================================
  // CLEAR ACTIVITY HISTORY
  // ======================================

  function clearActivityHistory() {
    if (activities.length === 0) return;

    const confirmed = window.confirm(
      "Clear all activity history? This cannot be undone. Your tasks and projects will not be deleted."
    );

    if (!confirmed) return;

    setActivities([]);
  }

  // ======================================
  // ADD PROJECT
  // ======================================

  function addProject(project: ProjectInput) {
    const newProject: Project = {
      id: crypto.randomUUID(),
      ...project,
    };

    setProjects((previous) => [
      ...previous,
      newProject,
    ]);
  }

  // ======================================
  // DAY 24 - ARCHIVE TASK
  // ======================================

  function archiveTask(id: string) {
    const task = tasks.find(
      (item) => item.id === id
    );

    if (!task) return;

    if (
      archivedTasks.some(
        (item) => item.id === id
      )
    ) {
      window.alert(
        "This task already exists in the archive."
      );
      return;
    }

    setArchivedTasks((previous) => [
      ...previous,
      task,
    ]);

    setTasks((previous) =>
      previous.filter((item) => item.id !== id)
    );

    // An archived task should not remain in
    // the Undo Delete snapshot.
    setLastDeletion((previous) =>
      previous.filter(
        ({ task: deletedTask }) =>
          deletedTask.id !== id
      )
    );

    logActivity(
      task,
      "updated",
      `Archived task: ${task.title}`
    );
  }

  // ======================================
  // DAY 24 - RESTORE ARCHIVED TASK
  // ======================================

  function restoreArchivedTask(id: string) {
    const task = archivedTasks.find(
      (item) => item.id === id
    );

    if (!task) return;

    const alreadyExists = tasks.some(
      (item) => item.id === id
    );

    if (alreadyExists) {
      window.alert(
        "Cannot restore this task: an active task with the same ID already exists."
      );
      return;
    }

    setTasks((previous) => [
      ...previous,
      task,
    ]);

    setArchivedTasks((previous) =>
      previous.filter((item) => item.id !== id)
    );

    logActivity(
      task,
      "updated",
      `Restored archived task: ${task.title}`
    );
  }

  // ======================================
  // DAY 24 - PERMANENT DELETE FROM ARCHIVE
  // ======================================

  function deleteArchivedTask(id: string) {
    const task = archivedTasks.find(
      (item) => item.id === id
    );

    if (!task) return;

    // Confirmation handled by ArchivedTasks.tsx
    setArchivedTasks((previous) =>
      previous.filter((item) => item.id !== id)
    );

    logActivity(
      task,
      "deleted",
      `Permanently deleted archived task: ${task.title}`
    );
  }

  // ======================================
  // DAY 23 - EXPORT TASKS TO JSON
  // ======================================

  function exportTasksToJSON() {
    const backup = {
      app: "TaskSphere",
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
    };

    try {
      const json = JSON.stringify(backup, null, 2);

      const blob = new Blob(
        [json],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download =
        `tasksphere-tasks-backup-${new Date().toLocaleDateString("en-CA")}.json`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(url),
        1000
      );
    } catch (error) {
      console.error(
        "Failed to export tasks:",
        error
      );

      window.alert(
        "Unable to export tasks. Please try again."
      );
    }
  }

  // ======================================
  // DAY 23 - IMPORT TASKS FROM JSON
  // ======================================

  async function importTasksFromJSON(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith(".json") ||
      file.size > 5 * 1024 * 1024
    ) {
      window.alert(
        "Choose a JSON backup file smaller than 5 MB."
      );
      return;
    }

    try {
      const parsed: unknown = JSON.parse(
        await file.text()
      );

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Invalid backup format."
        );
      }

      const backup = parsed as Record<
        string,
        unknown
      >;

      if (
        backup.app !== "TaskSphere" ||
        backup.version !== 1 ||
        !Array.isArray(backup.tasks)
      ) {
        throw new Error(
          "This is not a supported TaskSphere v1 tasks backup."
        );
      }

      const ids = new Set<string>();

      const importedTasks: Task[] =
        backup.tasks.map(
          (value: unknown, index: number) => {
            if (
              typeof value !== "object" ||
              value === null ||
              Array.isArray(value)
            ) {
              throw new Error(
                `Task ${index + 1} is invalid.`
              );
            }

            const item = value as Record<
              string,
              unknown
            >;

            if (
              typeof item.id !== "string" ||
              item.id.trim() === "" ||
              typeof item.title !== "string" ||
              item.title.trim() === "" ||
              typeof item.description !== "string" ||
              ![
                "To Do",
                "In Progress",
                "Done",
              ].includes(String(item.status)) ||
              ![
                "Low",
                "Medium",
                "High",
              ].includes(String(item.priority)) ||
              typeof item.dueDate !== "string" ||
              typeof item.projectId !== "string" ||
              !TASK_CATEGORIES.includes(
                item.category as TaskCategory
              ) ||
              !Array.isArray(item.tags) ||
              !item.tags.every(
                (tag: unknown) =>
                  typeof tag === "string"
              )
            ) {
              throw new Error(
                `Task ${index + 1} has missing or invalid fields.`
              );
            }

            if (ids.has(item.id)) {
              throw new Error(
                `Duplicate task ID found at task ${index + 1}.`
              );
            }

            ids.add(item.id);

            return {
              id: item.id as string,
              title: item.title as string,
              description: item.description as string,
              status: item.status as TaskStatus,
              priority:
                item.priority as Task["priority"],
              dueDate: item.dueDate as string,
              projectId: item.projectId as string,
              category:
                item.category as TaskCategory,
              tags: normalizeTags(item.tags),
            };
          }
        );

      const mode = window.prompt(
        `Validated ${importedTasks.length} task(s).\n\n` +
          `Type MERGE to keep existing tasks, or REPLACE to replace all ${tasks.length} tasks.\n` +
          `Type CANCEL (or press Cancel) to abort.\n\n` +
          `Projects and activity history are not included.`,
        "MERGE"
      )?.trim().toUpperCase();

      if (!mode || mode === "CANCEL") return;

      if (
        mode !== "MERGE" &&
        mode !== "REPLACE"
      ) {
        window.alert(
          "Import cancelled: choose MERGE or REPLACE."
        );
        return;
      }

      if (mode === "REPLACE") {
        const confirmed = window.confirm(
          `Replace all ${tasks.length} existing tasks with ${importedTasks.length} imported tasks?\n` +
            `This cannot be undone using the Undo toast. Export a backup first.`
        );

        if (!confirmed) return;

        setTasks(importedTasks);
        setLastDeletion([]);

        window.alert(
          `Replaced task list with ${importedTasks.length} imported task(s).`
        );

        return;
      }

      const existingIds = new Set(
        tasks.map((task) => task.id)
      );

      const conflicts = importedTasks.filter(
        (task) => existingIds.has(task.id)
      );

      let conflictMode:
        | "SKIP"
        | "OVERWRITE"
        | "COPY" = "SKIP";

      if (conflicts.length > 0) {
        const choice = window.prompt(
          `${conflicts.length} imported task ID(s) already exist.\n\n` +
            `Type SKIP to keep existing versions, OVERWRITE to update matching tasks, ` +
            `or COPY to add imported versions with fresh IDs.\n` +
            `Press Cancel to abort.`,
          "SKIP"
        )?.trim().toUpperCase();

        if (
          choice !== "SKIP" &&
          choice !== "OVERWRITE" &&
          choice !== "COPY"
        ) {
          window.alert(
            "Import cancelled: no valid duplicate-handling option selected."
          );
          return;
        }

        conflictMode = choice;
      }

      const confirmed = window.confirm(
        `Merge ${importedTasks.length} imported task(s) into ${tasks.length} existing task(s)?\n` +
          `Matching IDs: ${conflicts.length}. Strategy: ${conflictMode}.\n` +
          `Existing tasks will not be removed. Continue?`
      );

      if (!confirmed) return;

      const mergedTasks = [...tasks];

      const indexById = new Map(
        tasks.map(
          (task, index) =>
            [task.id, index] as const
        )
      );

      let added = 0;
      let overwritten = 0;
      let skipped = 0;
      let copied = 0;

      importedTasks.forEach((task) => {
        const existingIndex =
          indexById.get(task.id);

        if (existingIndex === undefined) {
          indexById.set(
            task.id,
            mergedTasks.length
          );

          mergedTasks.push(task);
          added++;
        } else if (
          conflictMode === "OVERWRITE"
        ) {
          mergedTasks[existingIndex] = task;
          overwritten++;
        } else if (
          conflictMode === "COPY"
        ) {
          mergedTasks.push({
            ...task,
            id: crypto.randomUUID(),
          });

          copied++;
        } else {
          skipped++;
        }
      });

      setTasks(mergedTasks);
      setLastDeletion([]);

      window.alert(
        `Merge complete! Added: ${added}, overwritten: ${overwritten}, ` +
          `copied: ${copied}, skipped: ${skipped}. Total tasks: ${mergedTasks.length}.`
      );
    } catch (error) {
      console.error(
        "Failed to import tasks:",
        error
      );

      window.alert(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed: Invalid JSON backup."
      );
    }
  }

  // ======================================
  // APPLICATION UI + ROUTES
  // ======================================

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar userName={userName} onLogout={logout} />

        <main className="main-content">

          <div className="ts-global-toolbar" aria-label="Task data tools">
            <div className="ts-global-toolbar-label"><span className="ts-toolbar-dot"/> Workspace <span className="ts-toolbar-sep">/</span> Personal dashboard</div>
            <div className="ts-global-actions">
              <button type="button" className="ts-action-btn" onClick={exportTasksToJSON}>↓ Export JSON</button>
              <input ref={importFileInputRef} type="file" accept=".json,application/json" onChange={importTasksFromJSON} style={{display:"none"}} aria-label="Choose TaskSphere JSON backup" />
              <button type="button" className="ts-action-btn" onClick={() => importFileInputRef.current?.click()}>↑ Import JSON</button>
              <button type="button" className="ts-action-btn ts-danger-btn" onClick={resetTasks}>Reset Tasks</button>
            </div>
          </div>

          {/* DAY 22 - UNDO TOAST */}
          {lastDeletion.length > 0 && (
            <div
              className="undo-toast"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="undo-toast-content">
                <span
                  className="undo-toast-icon"
                  aria-hidden="true"
                >
                  ✓
                </span>

                <div className="undo-toast-message">
                  <strong>
                    {lastDeletion.length === 1
                      ? "Task deleted"
                      : `${lastDeletion.length} tasks deleted`}
                  </strong>

                  <span>
                    {lastDeletion.length === 1
                      ? lastDeletion[0].task.title
                      : "You can restore all selected tasks."}
                  </span>
                </div>
              </div>

              <div className="undo-toast-actions">
                <button
                  type="button"
                  className="undo-toast-undo"
                  onClick={undoLastDeletion}
                >
                  Undo
                </button>

                <button
                  type="button"
                  className="undo-toast-close"
                  onClick={() =>
                    setLastDeletion([])
                  }
                  aria-label="Dismiss undo notification"
                >
                  ×
                </button>
              </div>

              <div
                className="undo-toast-progress"
                aria-hidden="true"
              />
            </div>
          )}

          <Routes>

            {/* DASHBOARD */}
            <Route
              path="/"
              element={
                <Dashboard
                  tasks={tasks}
                  activities={activities}
                  onClearActivityHistory={
                    clearActivityHistory
                  }
                />
              }
            />

            {/* PROJECTS */}
            <Route
              path="/projects"
              element={
                <Projects
                  projects={projects}
                  tasks={tasks}
                  onAddProject={addProject}
                />
              }
            />

            {/* ACTIVE TASKS */}
            <Route
              path="/tasks"
              element={
                <Tasks
                  tasks={tasks}
                  projects={projects}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onChangeStatus={
                    changeTaskStatus
                  }
                  onBulkChangeStatus={
                    bulkChangeTaskStatus
                  }
                  onBulkDeleteTasks={
                    bulkDeleteTasks
                  }
                  onUpdateTask={updateTask}
                  onArchiveTask={archiveTask}
                />
              }
            />

            {/* DAY 24 - ARCHIVED TASKS */}
            <Route
              path="/archived"
              element={
                <ArchivedTasks
                  archivedTasks={archivedTasks}
                  projects={projects}
                  onRestoreTask={
                    restoreArchivedTask
                  }
                  onDeleteArchivedTask={
                    deleteArchivedTask
                  }
                />
              }
            />
            <Route
  path="/kanban"
  element={
    <Kanban
      tasks={tasks}
      projects={projects}
      onChangeStatus={changeTaskStatus}
    />
  }
/>

            <Route path="/calendar" element={<Calendar tasks={tasks} projects={projects} />} />
            <Route path="/notifications" element={<Notifications tasks={tasks} onChangeStatus={changeTaskStatus} />} />
            <Route path="/insights" element={<Insights tasks={tasks} projects={projects} />} />
            {/* SETTINGS */}
            <Route
              path="/settings"
              element={<Settings />}
            />

            {/* INVALID ROUTE */}
            <Route
              path="*"
              element={
                <h1>Page not found</h1>
              }
            />

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
