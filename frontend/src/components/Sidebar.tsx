import { NavLink } from "react-router-dom";

const links = [
  { to: "/", icon: "◫", label: "Dashboard", end: true },
  { to: "/projects", icon: "▦", label: "Projects" },
  { to: "/tasks", icon: "☑", label: "My Tasks" },
  { to: "/kanban", icon: "▥", label: "Kanban Board" },
  { to: "/calendar", icon: "▣", label: "Calendar" },
  { to: "/notifications", icon: "♧", label: "Reminders" },
  { to: "/insights", icon: "◴", label: "Insights" },
  { to: "/archived", icon: "▤", label: "Archived Tasks" },
  { to: "/settings", icon: "⚙", label: "Settings" },
];
export default function Sidebar({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  return <aside className="sidebar ts-sidebar">
    <div className="ts-brand"><span className="ts-brand-mark">✦</span><div><strong>TaskSphere</strong><small>YOUR PRODUCTIVITY SPACE</small></div></div>
    <div className="ts-nav-label">WORKSPACE</div>
    <nav>{links.map(({to,icon,label,end}) => <NavLink key={to} to={to} end={end} className={({isActive})=>isActive?"active":""}><span className="ts-nav-icon" aria-hidden="true">{icon}</span>{label}</NavLink>)}</nav>
    <div className="ts-sidebar-footer"><span className="ts-avatar">TS</span><div><strong>{userName}</strong><small>Cloud-synced workspace</small></div></div><button type="button" className="ts-logout-btn" onClick={onLogout}>↪ Log out</button>
  </aside>;
}
