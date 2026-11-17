import { useState } from "react";
import type { Task, TaskStatus } from "../types/task";

type Props = {
  tasks: Task[];
  onChangeStatus: (id: string, status: TaskStatus) => void;
};

export default function Notifications({ tasks, onChangeStatus }: Props) {
  const [days, setDays] = useState(7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notices = tasks
    .filter((t) => t.status !== "Done" && t.dueDate)
    .map((t) => ({
      task: t,
      remaining: Math.round(
        (new Date(t.dueDate + "T00:00:00").getTime() - today.getTime()) / 86400000
      ),
    }))
    .filter((x) => x.remaining <= days)
    .sort((a, b) => a.remaining - b.remaining);

  return (
    <div className="ts-page">
      <div className="ts-page-header">
        <div>
          <h1>Deadline Reminders</h1>
          <p>In-app reminders based on your task deadlines</p>
        </div>
        <label className="ts-reminder-window" htmlFor="ts-reminder-window">
          <span>Upcoming window</span>
          <select
            id="ts-reminder-window"
            className="ts-reminder-select"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
      </div>
      <div className="ts-stack">
        {notices.length === 0 ? (
          <div className="ts-panel">No overdue or upcoming tasks in this window 🎉</div>
        ) : (
          notices.map(({ task, remaining }) => (
            <article className="ts-panel ts-notice" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <p>
                  {remaining < 0
                    ? `${Math.abs(remaining)} day(s) overdue`
                    : remaining === 0
                      ? "Due today"
                      : `Due in ${remaining} day(s)`}{" "}
                  · {task.priority} priority · {task.dueDate}
                </p>
              </div>
              <button onClick={() => onChangeStatus(task.id, "Done")}>Mark Done</button>
            </article>
          ))
        )}
      </div>
      <p className="ts-muted">
        Reminders appear when you open TaskSphere; this version does not send background push notifications.
      </p>
    </div>
  );
}
