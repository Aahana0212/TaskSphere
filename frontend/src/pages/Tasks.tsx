
import { useState } from "react";

import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

import { isTaskOverdue } from "../utils/taskUtils";

import type { Project } from "../types/project";

import type {
  Task,
  TaskInput,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from "../types/task";

// ===================================
// FILTER TYPES
// ===================================

type TaskFilter = "All" | TaskStatus;
type PriorityFilter = "All" | TaskPriority;
type CategoryFilter = "All" | TaskCategory;

// ===================================
// SORTING OPTIONS
// ===================================

type SortOption =
  | "priority"
  | "dueDate"
  | "dueDateLatest"
  | "title";

// ===================================
// COMPONENT PROPS
// ===================================

type TasksProps = {
  tasks: Task[];
  projects: Project[];
  onAddTask: (task: TaskInput) => void;
  onDeleteTask: (id: string) => void;
  // DAY 24 STEP 2B - Archive callback (connected in App.tsx next)
  onArchiveTask?: (id: string) => void;
  onChangeStatus: (
    id: string,
    status: TaskStatus
  ) => void;
  onUpdateTask: (
    id: string,
    updates: TaskInput
  ) => void;
  onBulkChangeStatus?: (ids: string[], status: TaskStatus) => void;
  onBulkDeleteTasks?: (ids: string[]) => void;
};

// ===================================
// STATUS FILTERS
// ===================================

const filters: TaskFilter[] = [
  "All",
  "To Do",
  "In Progress",
  "Done",
];

// ===================================
// PRIORITY FILTERS
// ===================================

const priorityFilters: PriorityFilter[] = [
  "All",
  "High",
  "Medium",
  "Low",
];

// ===================================
// CATEGORY FILTERS
// ===================================

const categoryFilters: CategoryFilter[] = [
  "All",
  "Frontend",
  "Backend",
  "Bug",
  "Documentation",
  "Other",
];

// ===================================
// PRIORITY SORTING ORDER
// ===================================

const priorityOrder: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// ===================================
// TASKS COMPONENT
// ===================================

function Tasks({
  tasks,
  projects,
  onAddTask,
  onDeleteTask,
  onArchiveTask,
  onChangeStatus,
  onUpdateTask,
  onBulkChangeStatus,
  onBulkDeleteTasks,
}: TasksProps) {
  // ===================================
  // FILTER STATES
  // ===================================

  const [activeFilter, setActiveFilter] =
    useState<TaskFilter>("All");

  const [activePriority, setActivePriority] =
    useState<PriorityFilter>("All");

  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("All");

  // DAY 16 - SELECTED TAG
  const [activeTag, setActiveTag] =
    useState<string>("All");

  const [search, setSearch] = useState("");

  // ===================================
  // SORTING STATE
  // ===================================

  const [sortBy, setSortBy] =
    useState<SortOption>("priority");

  // ===================================
  // OVERDUE FILTER STATE
  // ===================================

  const [showOverdueOnly, setShowOverdueOnly] =
    useState(false);

  // ===================================
  // PROJECT FILTER STATE
  // ===================================

  const [selectedProjectId, setSelectedProjectId] =
    useState("all");

  // DAY 21 - TASK MULTI-SELECTION
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>("Done");

  function toggleTaskSelection(id: string) {
    setSelectedTaskIds((previous) =>
      previous.includes(id)
        ? previous.filter((taskId) => taskId !== id)
        : [...previous, id]
    );
  }

  function deleteTaskAndDeselect(id: string) {
    setSelectedTaskIds((previous) => previous.filter((taskId) => taskId !== id));
    onDeleteTask(id);
  }

  // DAY 24 STEP 2B - Archive and clear selection for the archived task.
  function archiveTaskAndDeselect(id: string) {
    if (!onArchiveTask) return;
    onArchiveTask(id);
    setSelectedTaskIds((previous) => previous.filter((taskId) => taskId !== id));
  }

  // ===================================
  // DAY 16 - COLLECT UNIQUE TAGS
  // ===================================

  const availableTags = [
    ...new Set(
      tasks.flatMap((task) => task.tags ?? [])
    ),
  ].sort((a, b) => a.localeCompare(b));

  // ===================================
  // FILTER TASKS
  // ===================================

  const filteredTasks = tasks.filter((task) => {
    // Status filter
    const matchesStatus =
      activeFilter === "All" ||
      task.status === activeFilter;

    // Search filter
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    // Priority filter
    const matchesPriority =
      activePriority === "All" ||
      task.priority === activePriority;

    // Project filter
    const matchesProject =
      selectedProjectId === "all" ||
      (selectedProjectId === "none"
        ? task.projectId === ""
        : task.projectId === selectedProjectId);

    // Category filter
    const matchesCategory =
      activeCategory === "All" ||
      task.category === activeCategory;

    // DAY 16 - TAG FILTER
    const matchesTag =
      activeTag === "All" ||
      (task.tags ?? []).includes(activeTag);

    // All filters must match
    return (
      matchesStatus &&
      matchesSearch &&
      matchesPriority &&
      matchesProject &&
      matchesCategory &&
      matchesTag
    );
  });

  // ===================================
  // OVERDUE FILTER + SORTING
  // ===================================

  const displayedTasks = filteredTasks
    .filter((task) =>
      showOverdueOnly
        ? isTaskOverdue(task)
        : true
    )
    .sort((a, b) => {
      // Priority: High to Low
      if (sortBy === "priority") {
        return (
          priorityOrder[b.priority] -
          priorityOrder[a.priority]
        );
      }

      // Due Date sorting
      if (
        sortBy === "dueDate" ||
        sortBy === "dueDateLatest"
      ) {
        // Both tasks have no due date
        if (!a.dueDate && !b.dueDate) {
          return 0;
        }

        // Tasks without due dates go last
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        // Latest first
        if (sortBy === "dueDateLatest") {
          return b.dueDate.localeCompare(
            a.dueDate
          );
        }

        // Earliest first
        return a.dueDate.localeCompare(
          b.dueDate
        );
      }

      // Title: A to Z
      return a.title.localeCompare(b.title);
    });

  // Select All applies only to tasks currently visible after filters.
  const displayedTaskIds = displayedTasks.map((task) => task.id);
  const selectedVisibleCount = displayedTaskIds.filter((id) =>
    selectedTaskIds.includes(id)
  ).length;
  const allVisibleSelected =
    displayedTaskIds.length > 0 && selectedVisibleCount === displayedTaskIds.length;

  function toggleSelectAllVisible() {
    setSelectedTaskIds((previous) => {
      if (allVisibleSelected) {
        return previous.filter((id) => !displayedTaskIds.includes(id));
      }
      return [...new Set([...previous, ...displayedTaskIds])];
    });
  }

  // DAY 21 - BULK STATUS UPDATE
  const validSelectedIds = selectedTaskIds.filter((id) =>
    tasks.some((task) => task.id === id)
  );

  function applyBulkStatus() {
    if (validSelectedIds.length === 0) return;
    if (onBulkChangeStatus) {
      onBulkChangeStatus(validSelectedIds, bulkStatus);
    } else {
      validSelectedIds.forEach((id) => onChangeStatus(id, bulkStatus));
    }
    setSelectedTaskIds([]);
  }

  // DAY 21 - STEP 3: BULK DELETE WITH CONFIRMATION
  function deleteSelectedTasks() {
    if (validSelectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Permanently delete ${validSelectedIds.length} selected task(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    if (onBulkDeleteTasks) {
      onBulkDeleteTasks(validSelectedIds);
    } else {
      validSelectedIds.forEach((id) => onDeleteTask(id));
    }
    setSelectedTaskIds([]);
  }

  // ===================================
  // RESET ALL FILTERS
  // ===================================

  function clearAllFilters() {
    setSearch("");
    setActiveFilter("All");
    setActivePriority("All");
    setShowOverdueOnly(false);
    setSelectedProjectId("all");
    setActiveCategory("All");

    // DAY 16 - RESET TAG FILTER
    setActiveTag("All");
  }

  // ===================================
  // UI
  // ===================================

  return (
    <div className="ts-tasks-page">
      <header className="ts-tasks-header">
        <div><span className="ts-eyebrow">WORKSPACE / TASK MANAGEMENT</span><h1>My Tasks</h1><p>Stay focused, track progress, and get things done.</p></div>
        <div className="ts-tasks-count">{tasks.length} total tasks</div>
      </header>
      <div className="ts-task-metrics">
        <div className="ts-metric"><span>Total tasks</span><strong>{tasks.length}</strong></div>
        <div className="ts-metric"><span>To do</span><strong>{tasks.filter(t => t.status === "To Do").length}</strong></div>
        <div className="ts-metric"><span>In progress</span><strong>{tasks.filter(t => t.status === "In Progress").length}</strong></div>
        <div className="ts-metric"><span>Completed</span><strong>{tasks.filter(t => t.status === "Done").length}</strong></div>
      </div>
      <section className="ts-panel ts-create-panel"><div className="ts-section-head"><div><span className="ts-eyebrow">QUICK CREATE</span><h2>Add a New Task</h2></div></div>

      {/* ADD TASK */}
      <TaskForm
        onAddTask={onAddTask}
        projects={projects}
      />

      </section>
      <section className="ts-panel ts-filters-panel ts-filters-redesign">
        <div className="ts-section-head">
          <div><span className="ts-eyebrow">FIND YOUR WORK</span><h2>Search & Filters</h2></div>
        </div>
        <div className="ts-filter-search">
      {/* SEARCH */}
      <label className="ts-field-label" htmlFor="ts-search">Search tasks</label>

      <input
        type="text"
        id="ts-search"
        className="search-input"
        placeholder="Search tasks by title..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
      />
        </div>
        <div className="ts-filter-grid">
          <div className="ts-filter-group ts-filter-project">
      {/* PROJECT FILTER */}
      <h3>Project</h3>

      <select
        className="project-filter-select"
        value={selectedProjectId}
        onChange={(event) =>
          setSelectedProjectId(event.target.value)
        }
      >
        <option value="all">
          All Projects
        </option>

        <option value="none">
          No Project
        </option>

        {projects.map((project) => (
          <option
            key={project.id}
            value={project.id}
          >
            {project.name}
          </option>
        ))}
      </select>
          </div>
          <div className="ts-filter-group ts-filter-sort">
      {/* SORTING */}
      <h3>Sort Tasks</h3>

      <select
        className="sort-select"
        value={sortBy}
        onChange={(event) =>
          setSortBy(
            event.target.value as SortOption
          )
        }
      >
        <option value="priority">
          Priority: High to Low
        </option>

        <option value="dueDate">
          Due Date: Earliest First
        </option>

        <option value="dueDateLatest">
          Due Date: Latest First
        </option>

        <option value="title">
          Title: A to Z
        </option>
      </select>
          </div>
          <div className="ts-filter-group ts-filter-status">
      {/* STATUS FILTER */}
      <h3>Filter Tasks</h3>

      <div className="filter-buttons">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={
              activeFilter === filter
                ? "filter-btn active-filter"
                : "filter-btn"
            }
            onClick={() =>
              setActiveFilter(filter)
            }
          >
            {filter}
          </button>
        ))}
      </div>
          </div>
          <div className="ts-filter-group ts-filter-priority">
      {/* PRIORITY FILTER */}
      <h3>Filter by Priority</h3>

      <div className="priority-filter-buttons">
        {priorityFilters.map((priority) => (
          <button
            key={priority}
            type="button"
            className={
              activePriority === priority
                ? "priority-filter-btn active-priority"
                : "priority-filter-btn"
            }
            onClick={() =>
              setActivePriority(priority)
            }
          >
            {priority}
          </button>
        ))}
      </div>
          </div>
          <div className="ts-filter-group ts-filter-category">
      {/* CATEGORY FILTER */}
      <h3>Filter by Category</h3>

      <div className="category-filter-buttons">
        {categoryFilters.map((category) => (
          <button
            key={category}
            type="button"
            className={
              activeCategory === category
                ? "category-filter-btn active-category"
                : "category-filter-btn"
            }
            onClick={() =>
              setActiveCategory(category)
            }
          >
            {category}
          </button>
        ))}
      </div>
          </div>
          <div className="ts-filter-group ts-filter-tags">
      {/* DAY 16 - TAG FILTER */}
      <h3>Filter by Tags</h3>

      <div className="tag-filter-buttons">
        <button
          type="button"
          className={
            activeTag === "All"
              ? "tag-filter-btn active-tag"
              : "tag-filter-btn"
          }
          onClick={() => setActiveTag("All")}
        >
          All Tags
        </button>

        {availableTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={
              activeTag === tag
                ? "tag-filter-btn active-tag"
                : "tag-filter-btn"
            }
            onClick={() => setActiveTag(tag)}
          >
            #{tag}
          </button>
        ))}
      </div>

      {availableTags.length === 0 && (
        <p className="no-tags-message">
          No tags yet. Add tags to a task to
          enable tag filtering.
        </p>
      )}
          </div>
        </div>
        <div className="ts-filter-footer">
          <div className="ts-filter-overdue">
      {/* OVERDUE FILTER */}
      <label className="overdue-filter">
        <input
          type="checkbox"
          checked={showOverdueOnly}
          onChange={(event) =>
            setShowOverdueOnly(
              event.target.checked
            )
          }
        />

        Show Only Overdue Tasks
      </label>
          </div>
          <div className="ts-filter-clear">
      {/* CLEAR FILTERS */}
      <button
        type="button"
        className="clear-filters-btn"
        onClick={clearAllFilters}
      >
        Clear All Filters
      </button>
          </div>
        </div>
      </section>
      <section className="ts-panel ts-list-panel">
      {/* TASK LIST */}
      <div className="ts-section-head"><div><span className="ts-eyebrow">YOUR WORK</span><h2>Task List</h2></div></div>

      <p>
        Showing {displayedTasks.length} of{" "}
        {tasks.length} tasks
      </p>

      {/* DAY 21 - MULTI-SELECT CONTROLS */}
      <div className="task-selection-toolbar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", margin: "16px 0" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={allVisibleSelected}
            disabled={displayedTasks.length === 0}
            onChange={toggleSelectAllVisible}
            aria-label="Select all visible tasks"
          />
          Select All Visible
        </label>
        <span aria-live="polite">
          {selectedTaskIds.filter((id) => tasks.some((task) => task.id === id)).length} selected
          {selectedVisibleCount > 0 ? ` (${selectedVisibleCount} visible)` : ""}
        </span>
        <button
          type="button"
          onClick={() => setSelectedTaskIds([])}
          disabled={selectedTaskIds.length === 0}
        >
          Clear Selection
        </button>
      </div>

      {/* DAY 21 - STEP 2: BULK STATUS UPDATE */}
      <div className="bulk-status-toolbar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", margin: "16px 0" }}>
        <label htmlFor="bulk-task-status">Change selected tasks to:</label>
        <select
          id="bulk-task-status"
          value={bulkStatus}
          onChange={(event) => setBulkStatus(event.target.value as TaskStatus)}
          disabled={validSelectedIds.length === 0}
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <button type="button" onClick={applyBulkStatus} disabled={validSelectedIds.length === 0}>
          Update Selected Tasks ({validSelectedIds.length})
        </button>
      </div>

      {/* DAY 21 - STEP 3: BULK DELETE */}
      <div className="bulk-delete-toolbar" style={{ margin: "16px 0" }}>
        <button
          type="button"
          className="bulk-delete-btn"
          onClick={deleteSelectedTasks}
          disabled={validSelectedIds.length === 0}
        >
          Delete Selected Tasks ({validSelectedIds.length})
        </button>
      </div>

      {displayedTasks.length === 0 ? (
        <p>
          {tasks.length === 0
            ? "No tasks yet. Add your first task!"
            : "No matching tasks found."}
        </p>
      ) : (
        <TaskList
          tasks={displayedTasks}
          projects={projects}
          onDeleteTask={deleteTaskAndDeselect}
          onArchiveTask={onArchiveTask ? archiveTaskAndDeselect : undefined}
          selectedTaskIds={selectedTaskIds}
          onToggleTaskSelection={toggleTaskSelection}
          onChangeStatus={onChangeStatus}
          onUpdateTask={onUpdateTask}
        />
      )}
      </section>
    </div>
  );
}

export default Tasks;
