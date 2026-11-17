import { useState } from "react";

import EditTaskForm from "./EditTaskForm";
import { isTaskOverdue, isTaskDueToday, isTaskDueSoon } from "../utils/taskUtils";
import type { Project } from "../types/project";
import type { Task, TaskInput, TaskStatus } from "../types/task";

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  onDeleteTask: (id: string) => void;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: TaskInput) => void;

  // DAY 24 - ARCHIVE TASK
  // Optional until Tasks.tsx and App.tsx are connected in Steps 2B/2C.
  onArchiveTask?: (id: string) => void;

  // DAY 21 - MULTI-SELECT
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (id: string) => void;
};

function TaskList({
  tasks,
  projects,
  onDeleteTask,
  onChangeStatus,
  onUpdateTask,
  onArchiveTask,
  selectedTaskIds = [],
  onToggleTaskSelection,
}: TaskListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const isSelected = selectedTaskIds.includes(task.id);

        return (
          <div
            className={`task-card ${isSelected ? "task-card-selected" : ""}`}
            key={task.id}
          >
            {editingTaskId === task.id ? (
              <EditTaskForm
                task={task}
                projects={projects}
                onSave={(updates) => {
                  onUpdateTask(task.id, updates);
                  setEditingTaskId(null);
                }}
                onCancel={() => setEditingTaskId(null)}
              />
            ) : (
              <>
                {/* DAY 21 - TASK SELECTION */}
                {onToggleTaskSelection && (
                  <div className="task-selection-container" style={{ marginBottom: "12px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleTaskSelection(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                      <span>Select Task</span>
                    </label>
                  </div>
                )}

                {/* TASK HEADER */}
                <div className="task-card-header">
                  <h3>{task.title}</h3>
                  <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>

                {/* DAY 15 - CATEGORY BADGE */}
                <div className="task-category-container">
                  <span className={`category-badge category-${task.category.toLowerCase()}`}>
                    🏷️ {task.category}
                  </span>
                </div>

                {/* DAY 16 - MULTIPLE TAG BADGES */}
                {task.tags.length > 0 && (
                  <div className="task-tags-container">
                    {task.tags.map((tag) => (
                      <span key={tag} className="task-tag-badge">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* TASK DESCRIPTION */}
                {task.description && <p>{task.description}</p>}

                {/* DUE DATE */}
                <p>Due: {task.dueDate || "No due date"}</p>

                {/* PROJECT NAME */}
                <p>
                  Project:{" "}
                  {projects.find((project) => project.id === task.projectId)?.name ?? "No Project"}
                </p>

                {/* DAY 13 - DEADLINE REMINDERS */}
                <div className="task-reminders">
                  {isTaskOverdue(task) && <span className="overdue-badge">⚠ Overdue</span>}
                  {isTaskDueToday(task) && <span className="due-today-badge">🔔 Due Today</span>}
                  {isTaskDueSoon(task) && <span className="due-soon-badge">⏳ Due Soon</span>}
                </div>

                {/* TASK ACTIONS */}
                <div className="task-actions">
                  <select
                    value={task.status}
                    onChange={(event) => onChangeStatus(task.id, event.target.value as TaskStatus)}
                    aria-label={`Status for ${task.title}`}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>

                  <button type="button" onClick={() => setEditingTaskId(task.id)}>
                    Edit
                  </button>

                  {/* DAY 24 STEP 2A - ARCHIVE TASK */}
                  {onArchiveTask && (
                    <button
                      type="button"
                      className="archive-task-btn"
                      onClick={() => onArchiveTask(task.id)}
                      aria-label={`Archive ${task.title}`}
                      title="Move task to archive"
                    >
                      📦 Archive
                    </button>
                  )}

                  <button type="button" onClick={() => onDeleteTask(task.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
