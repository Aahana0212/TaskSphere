
import { useState, type FormEvent } from "react";

import type {
  Project,
  ProjectInput,
} from "../types/project";

import type { Task } from "../types/task";

type ProjectsProps = {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: ProjectInput) => void;
};

function Projects({
  projects,
  tasks,
  onAddProject,
}: ProjectsProps) {
  // =====================================
  // FORM STATES
  // =====================================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // =====================================
  // CREATE NEW PROJECT
  // =====================================

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Please enter a project name.");
      return;
    }

    onAddProject({
      name: name.trim(),
      description: description.trim(),
    });

    // Reset form
    setName("");
    setDescription("");
  }

  // =====================================
  // PROJECTS PAGE UI
  // =====================================

  return (
    <div className="projects-page">
      <h1>My Projects</h1>

      {/* CREATE PROJECT FORM */}
      <form
        className="project-form"
        onSubmit={handleSubmit}
      >
        <h2>Create New Project</h2>

        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
        />

        <textarea
          placeholder="Project description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          rows={3}
        />

        <button type="submit">
          Create Project
        </button>
      </form>

      {/* PROJECT LIST */}
      <h2>All Projects ({projects.length})</h2>

      {projects.length === 0 ? (
        <p>
          No projects yet. Create your first project!
        </p>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            // Tasks belonging to this project
            const projectTasks = tasks.filter(
              (task) =>
                task.projectId === project.id
            );

            // Number of completed tasks
            const completedTasks =
              projectTasks.filter(
                (task) => task.status === "Done"
              ).length;

            // Calculate completion percentage
            const completionPercentage =
              projectTasks.length === 0
                ? 0
                : Math.round(
                    (completedTasks /
                      projectTasks.length) *
                      100
                  );

            return (
              <div
                className="project-card"
                key={project.id}
              >
                <h3>{project.name}</h3>

                {project.description && (
                  <p>{project.description}</p>
                )}

                <p>
                  Total Tasks: {projectTasks.length}
                </p>

                <p>
                  Completed: {completedTasks}
                </p>

                {/* PROJECT PROGRESS */}
                <div className="project-progress">
                  <p>
                    Progress: {completionPercentage}%
                  </p>

                  <div className="project-progress-track">
                    <div
                      className="project-progress-fill"
                      style={{
                        width: `${completionPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Projects;
