import { useState } from "react";
import { api, type User } from "./api";
import "./auth.css";
export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = mode === "login" ? await api.login(email, password) : await api.signup(name, email, password);
      await onAuthenticated(result.user);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-hero"><div className="auth-brand">✦ TaskSphere</div><div><span className="auth-kicker">YOUR WORK. BEAUTIFULLY ORGANIZED.</span><h1>Make space for<br/><em>what matters.</em></h1><p>Plan projects, track progress, and turn your ideas into finished work—all in one focused workspace.</p><div className="auth-pills"><span>✓ Kanban boards</span><span>✓ Smart reminders</span><span>✓ Productivity insights</span></div></div><small>Built for the way you work.</small></section><section className="auth-panel"><form className="auth-card" onSubmit={submit}><div className="auth-mobile-brand">✦ TaskSphere</div><div className="auth-eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</div><h2>{mode === "login" ? "Sign in to TaskSphere" : "Create your account"}</h2><p className="auth-subtitle">{mode === "login" ? "Pick up right where you left off." : "Start organizing your work today."}</p>{mode === "signup" && <label>Full name<input required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input required minLength={8} maxLength={128} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>{error && <div className="auth-error" role="alert">{error}</div>}<button disabled={busy} className="auth-submit" type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}</button><p className="auth-switch">{mode === "login" ? "New to TaskSphere?" : "Already have an account?"} <button type="button" onClick={()=>{setMode(mode === "login" ? "signup" : "login");setError("")}}>{mode === "login" ? "Create an account" : "Sign in"}</button></p></form></section></main>;
}
