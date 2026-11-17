import { useState } from "react";
import StatCard from "../components/StatCard";
import type { TaskActivity, ActivityType } from "../types/activity";

import type {
  Task,
  TaskCategory,
} from "../types/task";

import {
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueSoon,
} from "../utils/taskUtils";

type DashboardProps = {
  tasks: Task[];
  activities: TaskActivity[];
  onClearActivityHistory: () => void;
};

// =====================================
// TASK CATEGORIES
// =====================================

const taskCategories: TaskCategory[] = [
  "Frontend",
  "Backend",
  "Bug",
  "Documentation",
  "Other",
];

// =====================================
// DAY 17 - CATEGORY CHART COLORS
// =====================================

const categoryColors: Record<TaskCategory, string> = {
  Frontend: "#2563eb",
  Backend: "#16a34a",
  Bug: "#ef4444",
  Documentation: "#f59e0b",
  Other: "#8b5cf6",
};

const activityLabels: Record<ActivityType, string> = {
  created: "Task created",
  updated: "Task updated",
  completed: "Task completed",
  reopened: "Task reopened",
  deleted: "Task deleted",
};

const activityIcons: Record<ActivityType, string> = {
  created: "➕",
  updated: "✏️",
  completed: "✅",
  reopened: "🔄",
  deleted: "🗑️",
};

function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// =====================================
// DASHBOARD COMPONENT
// =====================================

function Dashboard({ tasks, activities, onClearActivityHistory }: DashboardProps) {
  // DAY 20 - ACTIVITY FILTERS AND SEARCH
  const [activityFilter, setActivityFilter] = useState<ActivityType | "all">("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

  const filteredActivities = [...activities]
    .filter((activity) =>
      activityFilter === "all" || activity.type === activityFilter
    )
    .filter((activity) => {
      const query = activitySearch.trim().toLowerCase();
      return (
        query === "" ||
        activity.taskTitle.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const recentActivities = filteredActivities.slice(
    0,
    showAllActivities ? undefined : 10
  );

  // =====================================
  // EXISTING TASK STATISTICS
  // =====================================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const overdueTasks = tasks.filter(
    (task) => isTaskOverdue(task)
  ).length;

  // =====================================
  // DAY 14 - DEADLINE STATISTICS
  // =====================================

  const dueTodayTasks = tasks.filter(
    (task) => isTaskDueToday(task)
  ).length;

  const dueSoonTasks = tasks.filter(
    (task) => isTaskDueSoon(task)
  ).length;

  // =====================================
  // PRIORITY STATISTICS
  // =====================================

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "High"
  ).length;

  const mediumPriorityTasks = tasks.filter(
    (task) => task.priority === "Medium"
  ).length;

  const lowPriorityTasks = tasks.filter(
    (task) => task.priority === "Low"
  ).length;

  // =====================================
  // OVERALL COMPLETION PERCENTAGE
  // =====================================

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) * 100
        );

  // =====================================
  // MOTIVATIONAL MESSAGE
  // =====================================

  let motivationalMessage = "";

  if (completionPercentage === 0) {
    motivationalMessage = "🚀 Let's get started!";
  } else if (completionPercentage < 50) {
    motivationalMessage = "💪 Keep going!";
  } else if (completionPercentage < 100) {
    motivationalMessage = "🔥 Great progress!";
  } else {
    motivationalMessage = "🎉 All tasks completed!";
  }

  // =====================================
  // DAY 14 - UPCOMING DEADLINES
  // =====================================

  const upcomingTasks = tasks
    .filter(
      (task) =>
        isTaskDueToday(task) ||
        isTaskDueSoon(task)
    )
    .sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );

  // =====================================
  // DAY 17 - CATEGORY-WISE ANALYTICS
  // =====================================

  const categoryStats = taskCategories.map(
    (category) => {
      const categoryTasks = tasks.filter(
        (task) => task.category === category
      );

      const total = categoryTasks.length;

      const completed = categoryTasks.filter(
        (task) => task.status === "Done"
      ).length;

      const inProgress = categoryTasks.filter(
        (task) => task.status === "In Progress"
      ).length;

      const todo = categoryTasks.filter(
        (task) => task.status === "To Do"
      ).length;

      const percentage =
        total === 0
          ? 0
          : Math.round(
              (completed / total) * 100
            );

      return {
        category,
        total,
        completed,
        inProgress,
        todo,
        percentage,
      };
    }
  );

  // =====================================
  // DAY 17 - TOP 5 MOST USED TAGS
  // =====================================

  const tagCounts = new Map<string, number>();

  tasks.forEach((task) => {
    // Count each tag only once per task
    const uniqueTags = new Set(
      (task.tags ?? [])
        .map((tag) =>
          tag.trim().replace(/^#+/, "").toLowerCase()
        )
        .filter(Boolean)
    );

    uniqueTags.forEach((tag) => {
      tagCounts.set(
        tag,
        (tagCounts.get(tag) ?? 0) + 1
      );
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.tag.localeCompare(b.tag)
    )
    .slice(0, 5);

  const maxTagCount = topTags[0]?.count ?? 0;

  // =====================================
  // DAY 17 - CATEGORY DISTRIBUTION CHART
  // =====================================

  let cumulativePercentage = 0;

  const chartSegments = categoryStats.map(
    (stat) => {
      const percentage =
        totalTasks === 0
          ? 0
          : (stat.total / totalTasks) * 100;

      const start = cumulativePercentage;

      cumulativePercentage += percentage;

      return {
        category: stat.category,
        total: stat.total,
        percentage,
        start,
        end: cumulativePercentage,
        color: categoryColors[stat.category],
      };
    }
  );

  const donutGradient =
    totalTasks === 0
      ? "#e2e8f0 0% 100%"
      : chartSegments
          .filter((segment) => segment.total > 0)
          .map(
            (segment) =>
              `${segment.color} ${segment.start}% ${segment.end}%`
          )
          .join(", ");

  // =====================================
  // DAY 18 - PRODUCTIVITY SCORE
  // =====================================

  const pendingTasks = totalTasks - completedTasks;

  const highPriorityPendingTasks = tasks.filter(
    (task) =>
      task.priority === "High" && task.status !== "Done"
  ).length;

  // Weighted score: 70% completion, 20% overdue control,
  // 10% high-priority completion. Each component is 0-100.
  // Empty task lists are treated as "not yet rated".
  const completionScore = completionPercentage;
  const overdueControlScore =
    totalTasks === 0
      ? 0
      : ((totalTasks - overdueTasks) / totalTasks) * 100;
  const priorityControlScore =
    highPriorityTasks === 0
      ? 100
      : ((highPriorityTasks - highPriorityPendingTasks) /
          highPriorityTasks) * 100;

  const productivityScore =
    totalTasks === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              completionScore * 0.7 +
                overdueControlScore * 0.2 +
                priorityControlScore * 0.1
            )
          )
        );

  const productivityStatus =
    totalTasks === 0
      ? "No tasks yet"
      : productivityScore >= 80
        ? "Excellent"
        : productivityScore >= 60
          ? "Good"
          : "Needs Improvement";

  const productivityMessage =
    totalTasks === 0
      ? "Add your first task to start tracking productivity."
      : pendingTasks === 0
        ? "Amazing! All tasks are complete."
        : overdueTasks > 0
          ? `Focus on ${overdueTasks} overdue ${overdueTasks === 1 ? "task" : "tasks"} first.`
          : highPriorityPendingTasks > 0
            ? `Prioritize ${highPriorityPendingTasks} unfinished high-priority ${highPriorityPendingTasks === 1 ? "task" : "tasks"}.`
            : "You're on track. Keep working through your pending tasks.";

  // =====================================
  // DAY 18 - SMART RECOMMENDATIONS
  // =====================================

  const recommendations: string[] = [];

  if (overdueTasks > 0) {
    recommendations.push(
      `⚠️ ${overdueTasks} overdue ${
        overdueTasks === 1 ? "task needs" : "tasks need"
      } attention. Review overdue work first.`
    );
  }

  if (highPriorityPendingTasks > 0) {
    recommendations.push(
      `🎯 ${highPriorityPendingTasks} high-priority ${
        highPriorityPendingTasks === 1
          ? "task is"
          : "tasks are"
      } still pending. Focus on important work.`
    );
  }

  if (dueTodayTasks > 0) {
    recommendations.push(
      `🔔 ${dueTodayTasks} ${
        dueTodayTasks === 1 ? "task is" : "tasks are"
      } due today. Complete time-sensitive work.`
    );
  }

  if (dueSoonTasks > 0) {
    recommendations.push(
      `📅 ${dueSoonTasks} ${
        dueSoonTasks === 1 ? "task is" : "tasks are"
      } due soon. Plan ahead to avoid delays.`
    );
  }

  if (totalTasks === 0) {
    recommendations.push(
      "🚀 Create your first task to start tracking productivity."
    );
  } else if (completedTasks === totalTasks) {
    recommendations.push(
      "🏆 Excellent! All tasks are completed. Keep up the momentum!"
    );
  } else if (recommendations.length === 0) {
    recommendations.push(
      "💪 You're on track! Keep working on your remaining tasks."
    );
  }


  return (
    <div className="dashboard-page">
      <h1>TaskSphere Dashboard</h1>

      <p>Track your tasks and productivity.</p>

      {/* =====================================
          EXISTING TASK STATISTICS
      ===================================== */}

      <div className="stats-grid">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
        />

        <StatCard
          title="To Do"
          value={todoTasks}
        />

        <StatCard
          title="In Progress"
          value={inProgressTasks}
        />

        <StatCard
          title="Completed"
          value={completedTasks}
        />

        <StatCard
          title="Overdue"
          value={overdueTasks}
        />

        <StatCard
          title="Due Today"
          value={dueTodayTasks}
        />

        <StatCard
          title="Due Soon"
          value={dueSoonTasks}
        />
      </div>

      {/* =====================================
          TASK COMPLETION PROGRESS
      ===================================== */}

      <section className="dashboard-section">
        <h2>Task Completion Progress</h2>

        <div className="progress-info">
          <span>Overall Progress</span>

          <strong>
            {completionPercentage}%
          </strong>
        </div>

        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Task completion"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill"
            style={{
              width: `${completionPercentage}%`,
            }}
          />
        </div>

        <p>
          {completedTasks} out of {totalTasks} tasks
          completed
        </p>

        <p className="motivational-message">
          {motivationalMessage}
        </p>
      </section>

      {/* =====================================
          DAY 18 - SMART PRODUCTIVITY INSIGHTS
      ===================================== */}

      <section className="dashboard-section productivity-insights-section">
        <h2>Smart Productivity Insights</h2>
        <p>
          A custom score based on completion (70%), overdue control
          (20%), and high-priority completion (10%).
        </p>

        <div className="productivity-insights-grid">
          <div className="productivity-insight-card productivity-score-card">
            <h3>Productivity Score</h3>
            <strong className="productivity-score-value">
              {totalTasks === 0 ? "Not rated" : `${productivityScore}/100`}
            </strong>
            <div
              className="productivity-score-bar"
              role="progressbar"
              aria-label="Productivity score"
              aria-valuenow={productivityScore}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="productivity-score-fill"
                style={{ width: `${productivityScore}%` }}
              />
            </div>
            <span
              className={`productivity-status ${
                productivityStatus === "Excellent"
                  ? "excellent"
                  : productivityStatus === "Good"
                    ? "good"
                    : "needs-improvement"
              }`}
            >
              {productivityStatus}
            </span>
            <p>{productivityMessage}</p>
          </div>

          <div className="productivity-insight-card">
            <h3>Completion Rate</h3>
            <strong>{completionPercentage}%</strong>
          </div>
          <div className="productivity-insight-card">
            <h3>Pending Tasks</h3>
            <strong>{pendingTasks}</strong>
          </div>
          <div className="productivity-insight-card">
            <h3>High-Priority Pending</h3>
            <strong>{highPriorityPendingTasks}</strong>
          </div>
          <div className="productivity-insight-card">
            <h3>Overdue Tasks</h3>
            <strong>{overdueTasks}</strong>
          </div>
        </div>
      </section>

      {/* =====================================
          DAY 18 - SMART RECOMMENDATIONS
      ===================================== */}

      <section className="dashboard-section">
        <h2>Smart Productivity Recommendations</h2>
        <p>Suggestions based on your task priorities and deadlines.</p>
        <div className="productivity-recommendations">
          {recommendations.map((recommendation, index) => (
            <div
              key={`${index}-${recommendation}`}
              className="productivity-recommendation"
            >
              {recommendation}
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          PRIORITY BREAKDOWN
      ===================================== */}

      <section className="dashboard-section">
        <h2>Priority Breakdown</h2>

        <div className="priority-stats">
          <div className="priority-stat high">
            <span>High Priority</span>
            <strong>{highPriorityTasks}</strong>
          </div>

          <div className="priority-stat medium">
            <span>Medium Priority</span>
            <strong>{mediumPriorityTasks}</strong>
          </div>

          <div className="priority-stat low">
            <span>Low Priority</span>
            <strong>{lowPriorityTasks}</strong>
          </div>
        </div>
      </section>

      {/* =====================================
          DAY 17 - CATEGORY-WISE ANALYTICS
      ===================================== */}

      <section className="dashboard-section">
        <h2>Category-wise Task Analytics</h2>

        <p>
          Track task distribution and completion
          progress across categories.
        </p>

        <div className="category-analytics-grid">
          {categoryStats.map((stat) => (
            <div
              key={stat.category}
              className="category-analytics-card"
            >
              <div className="category-analytics-header">
                <h3>{stat.category}</h3>

                <span className="category-task-count">
                  {stat.total} Tasks
                </span>
              </div>

              <div className="category-status-counts">
                <span>
                  To Do: {stat.todo}
                </span>

                <span>
                  In Progress: {stat.inProgress}
                </span>

                <span>
                  Done: {stat.completed}
                </span>
              </div>

              <div className="category-progress-info">
                <span>Completion</span>

                <strong>
                  {stat.percentage}%
                </strong>
              </div>

              <div
                className="category-progress-bar"
                role="progressbar"
                aria-label={`${stat.category} completion`}
                aria-valuenow={stat.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="category-progress-fill"
                  style={{
                    width: `${stat.percentage}%`,
                  }}
                />
              </div>

              <p className="category-completion-text">
                {stat.completed} of {stat.total} tasks
                completed
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          DAY 17 - CATEGORY DISTRIBUTION
      ===================================== */}

      <section className="dashboard-section">
        <h2>Task Distribution by Category</h2>

        <p>
          See how your tasks are distributed
          across different categories.
        </p>

        <div className="category-chart-container">
          <div
            className="category-donut-chart"
            role="img"
            aria-label={
              totalTasks === 0
                ? "No tasks available"
                : chartSegments
                    .map(
                      (segment) =>
                        `${segment.category}: ${segment.total} tasks`
                    )
                    .join(", ")
            }
            style={{
              background: `conic-gradient(${donutGradient})`,
            }}
          >
            <div className="category-donut-center">
              <strong>{totalTasks}</strong>
              <span>Total Tasks</span>
            </div>
          </div>

          <div className="category-chart-legend">
            {chartSegments.map((segment) => (
              <div
                key={segment.category}
                className="category-legend-item"
              >
                <div className="category-legend-name">
                  <span
                    className="category-legend-dot"
                    style={{
                      backgroundColor: segment.color,
                    }}
                  />

                  <span>{segment.category}</span>
                </div>

                <strong>
                  {segment.total} (
                  {Math.round(segment.percentage)}%)
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================
          DAY 17 - TOP 5 MOST USED TAGS
      ===================================== */}

      <section className="dashboard-section">
        <h2>Top 5 Most-Used Tags</h2>

        <p>
          Discover which tags are used most
          frequently across your tasks.
        </p>

        {topTags.length === 0 ? (
          <p className="no-tags-message">
            No tags available yet. Add tags
            to your tasks to see analytics.
          </p>
        ) : (
          <div className="tag-analytics-list">
            {topTags.map((item, index) => {
              const percentage =
                maxTagCount === 0
                  ? 0
                  : Math.round(
                      (item.count / maxTagCount) *
                        100
                    );

              return (
                <div
                  key={item.tag}
                  className="tag-analytics-item"
                >
                  <div className="tag-analytics-header">
                    <div className="tag-analytics-name">
                      <span className="tag-rank">
                        #{index + 1}
                      </span>

                      <span className="tag-name">
                        #{item.tag}
                      </span>
                    </div>

                    <strong className="tag-usage-count">
                      {item.count}{" "}
                      {item.count === 1
                        ? "task"
                        : "tasks"}
                    </strong>
                  </div>

                  <div
                    className="tag-analytics-progress"
                    role="progressbar"
                    aria-label={`${item.tag} usage relative to most used tag`}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="tag-analytics-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* =====================================
          DAY 20 - ACTIVITY FILTERS + SEARCH
      ===================================== */}
      <section className="dashboard-section activity-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h2>Recent Activity</h2>
            <p>Filter and search your latest task changes.</p>
          </div>
          <button
            type="button"
            onClick={onClearActivityHistory}
            disabled={activities.length === 0}
            aria-label="Clear all activity history"
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #dc2626",
              color: activities.length === 0 ? "#94a3b8" : "#b91c1c",
              background: "transparent",
              cursor: activities.length === 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            🗑️ Clear History
          </button>
        </div>

        <div
          className="activity-filter-controls"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            margin: "18px 0",
          }}
        >
          <label style={{ display: "grid", gap: "6px", flex: "1 1 180px" }}>
            <span>Activity Type</span>
            <select
              aria-label="Filter activities by type"
              value={activityFilter}
              onChange={(event) => {
                setActivityFilter(event.target.value as ActivityType | "all");
                setShowAllActivities(false);
              }}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%" }}
            >
              <option value="all">All Activities</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="completed">Completed</option>
              <option value="reopened">Reopened</option>
              <option value="deleted">Deleted</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "6px", flex: "2 1 240px" }}>
            <span>Search Activity</span>
            <input
              type="search"
              value={activitySearch}
              onChange={(event) => {
                setActivitySearch(event.target.value);
                setShowAllActivities(false);
              }}
              placeholder="Search task title or description..."
              aria-label="Search activities"
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", boxSizing: "border-box" }}
            />
          </label>
        </div>

        <p aria-live="polite">
          Showing {recentActivities.length} of {filteredActivities.length} matching activities
          {activities.length !== filteredActivities.length
            ? ` (${activities.length} total)`
            : ""}
        </p>

        {recentActivities.length === 0 ? (
          <p className="activity-empty">
            {activities.length === 0
              ? "No activity recorded yet. Create or update a task to get started."
              : "No matching activities found. Try a different filter or search."}
          </p>
        ) : (
          <ol className="activity-timeline">
            {recentActivities.map((activity) => (
              <li key={activity.id} className={`activity-item activity-${activity.type}`}>
                <span className="activity-icon" aria-hidden="true">
                  {activityIcons[activity.type]}
                </span>
                <div className="activity-details">
                  <div className="activity-heading">
                    <strong>{activityLabels[activity.type]}</strong>
                    <time dateTime={activity.timestamp}>
                      {formatActivityTime(activity.timestamp)}
                    </time>
                  </div>
                  <p className="activity-task-title">{activity.taskTitle}</p>
                  <p className="activity-description">{activity.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {filteredActivities.length > 10 && (
          <div style={{ marginTop: "18px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setShowAllActivities((previous) => !previous)}
              aria-expanded={showAllActivities}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {showAllActivities ? "Show Less" : `Show More (${filteredActivities.length - 10} more)`}
            </button>
          </div>
        )}
      </section>

      {/* =====================================
          DAY 14 - UPCOMING DEADLINES
      ===================================== */}

      <section className="dashboard-section">
        <h2>Upcoming Deadlines</h2>

        {upcomingTasks.length === 0 ? (
          <p>
            No upcoming deadlines in the next
            3 days. 🎉
          </p>
        ) : (
          <div className="upcoming-tasks">
            {upcomingTasks.map((task) => (
              <div
                className="upcoming-task-card"
                key={task.id}
              >
                <div>
                  <h3>{task.title}</h3>

                  <p>
                    Due Date: {task.dueDate}
                  </p>

                  <p>
                    Priority: {task.priority}
                  </p>
                </div>

                <div>
                  {isTaskDueToday(task) ? (
                    <span className="due-today-badge">
                      🔔 Due Today
                    </span>
                  ) : (
                    <span className="due-soon-badge">
                      ⏳ Due Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
