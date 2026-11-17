import type { Task } from "../types/task";
import type { Project } from "../types/project";

type ArchivedTasksProps = {
  archivedTasks: Task[];
  projects: Project[];
  onRestoreTask: (id: string) => void;
  onDeleteArchivedTask: (id: string) => void;
};

function ArchivedTasks({
  archivedTasks,
  projects,
  onRestoreTask,
  onDeleteArchivedTask,
}: ArchivedTasksProps) {
  function confirmPermanentDelete(task: Task) {
    const confirmed = window.confirm(
      `Permanently delete "${task.title}" from the archive? This action cannot be undone.`
    );
    if (confirmed) onDeleteArchivedTask(task.id);
  }

  return (
    <section className="archived-tasks-page">
      <h1>Archived Tasks</h1>
      <p>
        {archivedTasks.length} archived task{archivedTasks.length === 1 ? "" : "s"}.
        Restore a task to return it to your active task list.
      </p>

      {archivedTasks.length === 0 ? (
        <p className="archive-empty-message">No archived tasks yet.</p>
      ) : (
        <div className="task-list">
          {archivedTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-card-header">
                <h3>{task.title}</h3>
                <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              </div>

              {task.description && <p>{task.description}</p>}
              <p>Status: {task.status}</p>
              <p>Category: {task.category}</p>
              <p>Due: {task.dueDate || "No due date"}</p>
              <p>
                Project: {projects.find((project) => project.id === task.projectId)?.name ?? "No Project"}
              </p>
              {task.tags.length > 0 && (
                <div className="task-tags-container">
                  {task.tags.map((tag) => (
                    <span className="task-tag-badge" key={tag}>#{tag}</span>
                  ))}
                </div>
              )}

              <div className="task-actions">
                <button type="button" onClick={() => onRestoreTask(task.id)}>
                  Restore
                </button>
                <button
                  type="button"
                  className="archive-delete-btn"
                  onClick={() => confirmPermanentDelete(task)}
                >
                  Permanently Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ArchivedTasks;
