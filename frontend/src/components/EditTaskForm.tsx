
import { useState, type FormEvent } from "react";

import type { Project } from "../types/project";

import type {
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
  TaskCategory,
} from "../types/task";

type EditTaskFormProps = {
  task: Task;
  projects: Project[];
  onSave: (updatedTask: TaskInput) => void;
  onCancel: () => void;
};

// =====================================
// DAY 16 - TAG NORMALIZATION
// =====================================

function parseTags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(",")
        .map((tag) =>
          tag
            .trim()
            .replace(/^#+/, "")
            .toLowerCase()
        )
        .filter((tag) => tag.length > 0)
    ),
  ];
}

function EditTaskForm({
  task,
  projects,
  onSave,
  onCancel,
}: EditTaskFormProps) {
  // =====================================
  // FORM STATES
  // =====================================

  const [title, setTitle] = useState(task.title);

  const [description, setDescription] =
    useState(task.description);

  const [status, setStatus] =
    useState<TaskStatus>(task.status);

  const [priority, setPriority] =
    useState<TaskPriority>(task.priority);

  const [dueDate, setDueDate] =
    useState(task.dueDate);

  const [projectId, setProjectId] =
    useState(task.projectId);

  // DAY 15 - CATEGORY STATE
  const [category, setCategory] =
    useState<TaskCategory>(task.category);

  // DAY 16 - TAGS STATE
  const [tagsInput, setTagsInput] =
    useState(task.tags.join(", "));

  // =====================================
  // DAY 16 - PARSE TAGS
  // =====================================

  const parsedTags = parseTags(tagsInput);

  const originalTags = parseTags(
    task.tags.join(", ")
  );

  const tagsChanged =
    JSON.stringify(parsedTags) !==
    JSON.stringify(originalTags);

  // =====================================
  // CHECK FOR UNSAVED CHANGES
  // =====================================

  const hasUnsavedChanges =
    title !== task.title ||
    description !== task.description ||
    status !== task.status ||
    priority !== task.priority ||
    dueDate !== task.dueDate ||
    projectId !== task.projectId ||
    category !== task.category ||
    tagsChanged;

  // =====================================
  // SAVE UPDATED TASK
  // =====================================

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Task title cannot be empty.");
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate,
      projectId,
      category,

      // DAY 16 - SAVE TAGS
      tags: parsedTags,
    });
  }

  // =====================================
  // CANCEL EDITING
  // =====================================

  function handleCancel() {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );

      if (!confirmed) {
        return;
      }
    }

    onCancel();
  }

  // =====================================
  // EDIT FORM UI
  // =====================================

  return (
    <form
      className="edit-task-form"
      onSubmit={handleSubmit}
    >
      {/* TASK TITLE */}
      <input
        type="text"
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
        required
      />

      {/* TASK DESCRIPTION */}
      <textarea
        value={description}
        onChange={(event) =>
          setDescription(event.target.value)
        }
        rows={3}
      />

      {/* TASK STATUS */}
      <select
        value={status}
        onChange={(event) =>
          setStatus(
            event.target.value as TaskStatus
          )
        }
      >
        <option value="To Do">To Do</option>

        <option value="In Progress">
          In Progress
        </option>

        <option value="Done">Done</option>
      </select>

      {/* TASK PRIORITY */}
      <select
        value={priority}
        onChange={(event) =>
          setPriority(
            event.target.value as TaskPriority
          )
        }
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      {/* DAY 15 - CATEGORY SELECTION */}
      <label htmlFor={`edit-category-${task.id}`}>
        Select Category
      </label>

      <select
        id={`edit-category-${task.id}`}
        value={category}
        onChange={(event) =>
          setCategory(
            event.target.value as TaskCategory
          )
        }
      >
        <option value="Other">Other</option>
        <option value="Frontend">Frontend</option>
        <option value="Backend">Backend</option>
        <option value="Bug">Bug</option>

        <option value="Documentation">
          Documentation
        </option>
      </select>

      {/* DAY 16 - MULTIPLE TAGS */}
      <label htmlFor={`edit-tags-${task.id}`}>
        Task Tags
      </label>

      <input
        id={`edit-tags-${task.id}`}
        type="text"
        placeholder="react, api, urgent"
        value={tagsInput}
        onChange={(event) =>
          setTagsInput(event.target.value)
        }
      />

      {/* DUE DATE */}
      <input
        type="date"
        value={dueDate}
        onChange={(event) =>
          setDueDate(event.target.value)
        }
      />

      {/* PROJECT SELECTION */}
      <label htmlFor={`edit-project-${task.id}`}>
        Select Project
      </label>

      <select
        id={`edit-project-${task.id}`}
        value={projectId}
        onChange={(event) =>
          setProjectId(event.target.value)
        }
      >
        <option value="">No Project</option>

        {projects.map((project) => (
          <option
            key={project.id}
            value={project.id}
          >
            {project.name}
          </option>
        ))}
      </select>

      {/* SAVE AND CANCEL BUTTONS */}
      <div className="edit-form-actions">
        <button type="submit">
          Save Changes
        </button>

        <button
          type="button"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default EditTaskForm;
