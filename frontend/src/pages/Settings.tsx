import { useEffect, useState } from "react";

export default function Settings() {
  const [name, setName] = useState(() => localStorage.getItem("tasksphere_display_name") || "");
  const [compact, setCompact] = useState(() => localStorage.getItem("tasksphere_compact") === "true");
  const [reminders, setReminders] = useState(() => localStorage.getItem("tasksphere_reminders") !== "false");
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem("tasksphere_week_start") || "monday");
  const [saved, setSaved] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("ts-compact", compact); return () => document.documentElement.classList.remove("ts-compact"); }, [compact]);
  function save() {
    localStorage.setItem("tasksphere_display_name", name.trim());
    localStorage.setItem("tasksphere_compact", String(compact));
    localStorage.setItem("tasksphere_reminders", String(reminders));
    localStorage.setItem("tasksphere_week_start", weekStart);
    setSaved(true);
  }
  return <div className="ts-settings-page">
    <div className="ts-settings-heading"><div><span className="ts-eyebrow">PREFERENCES & ACCOUNT</span><h1>Settings</h1><p>Make your workspace feel like yours. Your preferences stay in this browser.</p></div><span className="ts-settings-symbol" aria-hidden="true">⚙</span></div>
    <div className="ts-settings-grid">
      <section className="ts-settings-card"><div className="ts-settings-card-head"><span className="ts-settings-card-icon">◉</span><div><h2>Profile & workspace</h2><p>Customize how TaskSphere greets you.</p></div></div><label className="ts-field-label" htmlFor="ts-display-name">Display name</label><input id="ts-display-name" className="ts-field" value={name} maxLength={60} onChange={e=>{setName(e.target.value);setSaved(false)}} placeholder="Enter your name"/><p className="ts-field-hint">This is a local display preference, not an online account.</p></section>
      <section className="ts-settings-card"><div className="ts-settings-card-head"><span className="ts-settings-card-icon">◫</span><div><h2>Appearance</h2><p>Choose a layout that works for you.</p></div></div><label className="ts-toggle-row"><span><strong>Compact task cards</strong><small>Show more tasks with less spacing.</small></span><input type="checkbox" checked={compact} onChange={e=>{setCompact(e.target.checked);setSaved(false)}} /></label><div className="ts-field-divider"/><label className="ts-field-label" htmlFor="ts-week-start">Preferred week start</label><select id="ts-week-start" className="ts-field" value={weekStart} onChange={e=>{setWeekStart(e.target.value);setSaved(false)}}><option value="monday">Monday</option><option value="sunday">Sunday</option></select><p className="ts-field-hint">Saved for future calendar customization.</p></section>
      <section className="ts-settings-card"><div className="ts-settings-card-head"><span className="ts-settings-card-icon">♧</span><div><h2>Reminders</h2><p>Control your deadline preferences.</p></div></div><label className="ts-toggle-row"><span><strong>Deadline reminder preference</strong><small>Save whether you want reminders enabled.</small></span><input type="checkbox" checked={reminders} onChange={e=>{setReminders(e.target.checked);setSaved(false)}} /></label><p className="ts-field-hint">This preference does not enable browser push notifications; reminders remain available on the Reminders page.</p></section>
      <section className="ts-settings-card"><div className="ts-settings-card-head"><span className="ts-settings-card-icon">▣</span><div><h2>Data & privacy</h2><p>Your tasks belong to you.</p></div></div><div className="ts-privacy-note"><strong>Stored locally</strong><p>Tasks and projects are saved in your browser's localStorage. They are not synced across devices.</p></div><p className="ts-field-hint">Use the Export JSON and Import JSON buttons in the top toolbar to back up or restore your tasks. Keep a backup before clearing browser data.</p></section>
    </div>
    <div className="ts-settings-save"><span role="status">{saved ? "✓ Preferences saved on this device" : "Changes are not saved until you click Save preferences."}</span><button type="button" onClick={save}>Save preferences</button></div>
  </div>;
}
