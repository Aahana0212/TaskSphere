
import type { Task } from "../types/task";

// =====================================
// HELPER: GET TODAY'S LOCAL DATE
// =====================================

function getTodayString(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================
// DAY 9 - CHECK OVERDUE TASKS
// =====================================

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "Done") {
    return false;
  }

  return task.dueDate < getTodayString();
}

// =====================================
// DAY 13 - CHECK DUE TODAY
// =====================================

export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate || task.status === "Done") {
    return false;
  }

  return task.dueDate === getTodayString();
}

// =====================================
// DAY 13 - CHECK DUE SOON
// NEXT 1 TO 3 DAYS
// =====================================

export function isTaskDueSoon(task: Task): boolean {
  if (!task.dueDate || task.status === "Done") {
    return false;
  }

  const today = new Date();

  // Set time to midnight
  today.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(
    threeDaysLater.getDate() + 3
  );

  const year = threeDaysLater.getFullYear();

  const month = String(
    threeDaysLater.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    threeDaysLater.getDate()
  ).padStart(2, "0");

  const threeDaysLaterString =
    `${year}-${month}-${day}`;

  return (
    task.dueDate > getTodayString() &&
    task.dueDate <= threeDaysLaterString
  );
}
