
import { useState, type FormEvent } from "react";

import type { Project } from "../types/project";

import type {
  TaskInput,
  TaskPriority,
  TaskStatus,
  TaskCategory,
} from "../types/task";

type TaskFormProps = {
  onAddTask: (task: TaskInput) => void;
  projects: Project[];
};

function TaskForm({ onAddTask, projects }: TaskFormProps) {
  // =====================================
  // FORM STATES
  // =====================================

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<TaskStatus>("To Do");

  const [priority, setPriority] =
    useState<TaskPriority>("Medium");

  const [dueDate, setDueDate] =
    useState("");

  const [projectId, setProjectId] =
    useState("");

  // DAY 15 - CATEGORY STATE
  const [category, setCategory] =
    useState<TaskCategory>("Other");

  // DAY 16 - MULTIPLE TAGS INPUT
  const [tagsInput, setTagsInput] =
    useState("");

  // =====================================
  // HANDLE FORM SUBMISSION
  // =====================================

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    // DAY 16 - CONVERT INPUT INTO TAGS
    const tags = [
      ...new Set(
        tagsInput
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

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate,
      projectId,

      // DAY 15 - CATEGORY
      category,

      // DAY 16 - MULTIPLE TAGS
      tags,
    });

    // =====================================
    // RESET FORM
    // =====================================

    setTitle("");
    setDescription("");
    setStatus("To Do");
    setPriority("Medium");
    setDueDate("");
    setProjectId("");

    // DAY 15 - RESET CATEGORY
    setCategory("Other");

    // DAY 16 - RESET TAGS
    setTagsInput("");
  }

  // =====================================
  // FORM UI
  // =====================================

  return (
    <form
      className="task-form"
      onSubmit={handleSubmit}
    >
      {/* TASK TITLE */}
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
        required
      />

      {/* TASK DESCRIPTION */}
      <textarea
        placeholder="Task description"
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
        <option value="To Do">
          To Do
        </option>

        <option value="In Progress">
          In Progress
        </option>

        <option value="Done">
          Done
        </option>
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
        <option value="Low">
          Low Priority
        </option>

        <option value="Medium">
          Medium Priority
        </option>

        <option value="High">
          High Priority
        </option>
      </select>

      {/* DAY 15 - TASK CATEGORY */}
      <div className="ts-form-field ts-category-field">
        <label htmlFor="task-category">
          Select Category
        </label>
  
        <select
          id="task-category"
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value as TaskCategory
            )
          }
        >
          <option value="Other">
            Other
          </option>
  
          <option value="Frontend">
            Frontend
          </option>
  
          <option value="Backend">
            Backend
          </option>
  
          <option value="Bug">
            Bug
          </option>
  
          <option value="Documentation">
            Documentation
          </option>
        </select>

      </div>

      {/* DAY 16 - TASK TAGS */}
      <div className="ts-form-field ts-tags-field">
        <label htmlFor="task-tags">
          Task Tags
        </label>
  
        <input
          id="task-tags"
          type="text"
          placeholder="react, api, urgent"
          value={tagsInput}
          onChange={(event) =>
            setTagsInput(event.target.value)
          }
        />

      </div>

      {/* DUE DATE */}
      <input
        type="date"
        value={dueDate}
        onChange={(event) =>
          setDueDate(event.target.value)
        }
      />

      {/* PROJECT SELECTION */}
      <div className="ts-form-field ts-project-field">
        <label htmlFor="task-project">
          Select Project
        </label>
  
        <select
          id="task-project"
          value={projectId}
          onChange={(event) =>
            setProjectId(event.target.value)
          }
        >
          <option value="">
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

      {/* SUBMIT BUTTON */}
      <button type="submit">
        Add Task
      </button>
    </form>
  );
}

export default TaskForm;
