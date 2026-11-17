
import { useState } from "react";
import type { DragEvent } from "react";

import type { Task, TaskStatus, TaskPriority } from "../types/task";
import type { Project } from "../types/project";

// ===================================
// TYPES
// ===================================

type KanbanProps = {
  tasks: Task[];
  projects: Project[];
  onChangeStatus: (id: string, status: TaskStatus) => void;
};

// ===================================
// COLUMNS
// ===================================

const columns: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Done",
];

const statusLabels: Record<TaskStatus, string> = {
  "To Do": "To Do",
  "In Progress": "In Progress",
  Done: "Done",
};

// ===================================
// COMPONENT
// ===================================

function Kanban({
  tasks,
  projects,
  onChangeStatus,
}: KanbanProps) {
  // DRAG AND DROP STATES

  const [draggedTaskId, setDraggedTaskId] =
    useState<string | null>(null);

  const [activeColumn, setActiveColumn] =
    useState<TaskStatus | null>(null);

  // DAY 26 - SEARCH STATE

  const [search, setSearch] = useState("");

  // DAY 26 - PROJECT FILTER STATE

  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [priority, setPriority] = useState<"All" | TaskPriority>("All");
  const [sortBy, setSortBy] = useState<"priority" | "due" | "title">("priority");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ===================================
  // DRAG AND DROP HANDLERS
  // ===================================

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    taskId: string
  ) {
    setDraggedTaskId(taskId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    status: TaskStatus
  ) {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";
    setActiveColumn(status);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    newStatus: TaskStatus
  ) {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("text/plain") ||
      draggedTaskId;

    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (task && task.status !== newStatus) {
      onChangeStatus(task.id, newStatus);
    }

    setDraggedTaskId(null);
    setActiveColumn(null);
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setActiveColumn(null);
  }

  // ===================================
  // PROJECT NAME
  // ===================================

  function getProjectName(projectId: string) {
    if (!projectId) return "No Project";

    return (
      projects.find(
        (project) => project.id === projectId
      )?.name || "Unknown Project"
    );
  }

  // ===================================
  // DAY 26 - COMBINED FILTERS
  // ===================================

  const filteredTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase();

    // SEARCH FILTER

    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      (task.description ?? "")
        .toLowerCase()
        .includes(query);

    // PROJECT FILTER

    const matchesProject =
      selectedProjectId === "all" ||
      (selectedProjectId === "none"
        ? !task.projectId
        : task.projectId === selectedProjectId);

    return matchesSearch && matchesProject && (priority === "All" || task.priority === priority);
  });

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedProjectId !== "all" || priority !== "All";

  // ===================================
  // UI
  // ===================================

  return (
    <div className="kanban-page">

      {/* HEADER */}

      <div className="kanban-header">
        <div>
          <h1>Kanban Board</h1>

          <p>
            Organize tasks by dragging them between
            workflow columns.
          </p>
        </div>

        <span className="kanban-total-count">
          {tasks.length} Total Tasks
        </span>
      </div>

      {/* ===================================
          DAY 26 - SEARCH + PROJECT FILTER
      =================================== */}

      <div className="kanban-filters">

        {/* SEARCH */}

        <input
          type="search"
          className="kanban-search-input"
          placeholder="🔍 Search tasks..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          aria-label="Search Kanban tasks"
        />

        {/* PROJECT FILTER */}

        <select
          className="kanban-project-filter"
          value={selectedProjectId}
          onChange={(event) =>
            setSelectedProjectId(event.target.value)
          }
          aria-label="Filter Kanban tasks by project"
        >
          <option value="all">All Projects</option>
          <option value="none">No Project</option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>

        <select className="kanban-project-filter" aria-label="Filter by priority" value={priority} onChange={e => setPriority(e.target.value as "All" | TaskPriority)}>
          <option value="All">All Priorities</option>
          <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
        </select>
        <select className="kanban-project-filter" aria-label="Sort tasks" value={sortBy} onChange={e => setSortBy(e.target.value as "priority" | "due" | "title")}>
          <option value="priority">Sort: Priority</option><option value="due">Sort: Due Date</option><option value="title">Sort: Title</option>
        </select>
        {hasActiveFilters && <button type="button" className="clear-filters-btn" onClick={() => { setSearch(""); setSelectedProjectId("all"); setPriority("All"); }}>Clear All Filters</button>}
        {/* CLEAR SEARCH */}

        {search.trim() !== "" && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={() => setSearch("")}
          >
            Clear Search
          </button>
        )}

      </div>

      {/* FILTER RESULTS */}

      {hasActiveFilters && (
        <p
          className="kanban-search-results"
          aria-live="polite"
        >
          Showing {filteredTasks.length} of{" "}
          {tasks.length} tasks
        </p>
      )}

      {/* ===================================
          KANBAN BOARD
      =================================== */}

      <div className="kanban-board">

        {columns.map((status) => {
          const columnTasks = filteredTasks.filter(task => task.status === status).sort((a,b) => {
            if (sortBy === "title") return a.title.localeCompare(b.title);
            if (sortBy === "due") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
            const rank = { High: 0, Medium: 1, Low: 2 };
            return rank[a.priority] - rank[b.priority];
          });

          return (
            <div
              key={status}
              className={`kanban-column ${
                activeColumn === status
                  ? "kanban-column-active"
                  : ""
              }`}
              onDragOver={(event) =>
                handleDragOver(event, status)
              }
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node
                  )
                ) {
                  setActiveColumn(null);
                }
              }}
              onDrop={(event) =>
                handleDrop(event, status)
              }
            >

              {/* COLUMN HEADER */}

              <div className="kanban-column-header">
                <h2>{statusLabels[status]}</h2>

                <span className="kanban-count">
                  {columnTasks.length}
                </span>
              </div>

              {/* TASK CARDS */}

              <div className="kanban-column-content">

                {columnTasks.length === 0 ? (
                  <div className="kanban-empty">
                    {hasActiveFilters
                      ? "No matching tasks"
                      : "Drop tasks here"}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`kanban-task-card ${
                        draggedTaskId === task.id
                          ? "kanban-task-dragging"
                          : ""
                      }`}
                      draggable
                      onDragStart={(event) =>
                        handleDragStart(event, task.id)
                      }
                      onDragEnd={handleDragEnd}
                    >

                      {/* PRIORITY + CATEGORY */}

                      <div className="kanban-task-top">
                        <span
                          className={`priority-badge priority-${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
                        </span>

                        <span className="kanban-category">
                          {task.category}
                        </span>
                      </div>

                      {/* TITLE */}

                      <h3>{task.title}</h3>

                      {/* DESCRIPTION */}

                      {task.description && (
                        <p className="kanban-description">
                          {task.description}
                        </p>
                      )}

                      {/* PROJECT + DUE DATE */}

                      <div className="kanban-task-meta">
                        <span>
                          📁 {getProjectName(task.projectId)}
                        </span>

                        {task.dueDate && (
                          <span>
                            📅 {task.dueDate}
                          </span>
                        )}
                      </div>

                      {/* TAGS */}

                      {(task.tags ?? []).length > 0 && (
                        <div className="kanban-task-tags">
                          {(task.tags ?? []).map((tag) => (
                            <span key={tag}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <button type="button" className="kanban-details-btn" onClick={() => setSelectedTask(task)}>View Details</button>
                      {/* STATUS DROPDOWN */}

                      <label className="kanban-status-control">
                        Move to

                        <select
                          value={task.status}
                          onChange={(event) =>
                            onChangeStatus(
                              task.id,
                              event.target.value as TaskStatus
                            )
                          }
                        >
                          {columns.map((option) => (
                            <option
                              key={option}
                              value={option}
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                    </div>
                  ))
                )}

              </div>
            </div>
          );
        })}

      </div>
      {selectedTask && (() => {
        const latest = tasks.find(t => t.id === selectedTask.id);
        if (!latest) return null;
        return <div className="ts-modal-backdrop" onMouseDown={() => setSelectedTask(null)}>
          <section className="ts-modal" role="dialog" aria-modal="true" aria-label="Task details" onMouseDown={e => e.stopPropagation()}>
            <button type="button" className="ts-modal-close" onClick={() => setSelectedTask(null)} aria-label="Close details">✕</button>
            <h2>{latest.title}</h2><p>{latest.description || "No description"}</p>
            <p><strong>Project:</strong> {getProjectName(latest.projectId)}</p>
            <p><strong>Priority:</strong> {latest.priority} · <strong>Category:</strong> {latest.category}</p>
            <p><strong>Due:</strong> {latest.dueDate || "Not set"}</p>
            <p><strong>Tags:</strong> {(latest.tags ?? []).join(", ") || "None"}</p>
            <label>Status <select value={latest.status} onChange={e => onChangeStatus(latest.id, e.target.value as TaskStatus)}>{columns.map(st => <option key={st}>{st}</option>)}</select></label>
          </section>
        </div>;
      })()}
    </div>
  );
}

export default Kanban;
