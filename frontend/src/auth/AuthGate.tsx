import { useEffect, useState } from "react";
import App from "../App";
import AuthScreen from "./AuthScreen";
import { api, type User, type Workspace } from "./api";
import { scopedKey } from "./storage";
const keys = { tasks: "tasksphere_tasks", projects: "tasksphere_projects", activities: "tasksphere_activities", archivedTasks: "tasksphere_archived_tasks" } as const;
function cacheWorkspace(data: Workspace) {
  (Object.keys(keys) as Array<keyof Workspace>).forEach(key => localStorage.setItem(scopedKey(keys[key]), JSON.stringify(data[key])));
}
export default function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function initialize(nextUser: User) {
    sessionStorage.setItem("tasksphere_user_id", nextUser.id);
    try { const data = await api.workspace(); cacheWorkspace(data); setUser(nextUser); }
    catch (err) { sessionStorage.removeItem("tasksphere_user_id"); throw err; }
  }
  useEffect(() => {
    let active = true;
    api.me().then(async ({ user }) => {
      if (!active) return;
      sessionStorage.setItem("tasksphere_user_id", user.id);
      try {
        const data = await api.workspace();
        if (!active) return;
        cacheWorkspace(data);
        setUser(user);
      } catch (err) {
        if (active) sessionStorage.removeItem("tasksphere_user_id");
        throw err;
      }
    }).catch(err => { if (active && err.message !== "Not authenticated") setError(err.message); }).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  }, []);
  async function logout() { await api.logout(); setUser(null); sessionStorage.removeItem("tasksphere_user_id"); }
  if (loading) return <div className="auth-loading">Loading your workspace…</div>;
  if (!user) return <><AuthScreen onAuthenticated={initialize}/>{error && <div role="alert" style={{position:"fixed",bottom:12,right:12,background:"white",padding:12}}>{error}</div>}</>;
  return <App key={user.id} userName={user.name} onLogout={logout}/>;
}
