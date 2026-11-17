import { useState } from "react";
import type { Task } from "../types/task";
import type { Project } from "../types/project";
type Props = { tasks: Task[]; projects: Project[] };
export default function Calendar({tasks,projects}: Props) {
  const [month,setMonth] = useState(() => new Date().toISOString().slice(0,7));
  const [year,m] = month.split("-").map(Number);
  const first = new Date(year,m-1,1).getDay();
  const days = new Date(year,m,0).getDate();
  const cells = Array.from({length: Math.ceil((first+days)/7)*7},(_,i)=>i-first+1);
  const shift = (delta:number) => {const d = new Date(year,m-1+delta,1); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`)};
  return <div className="ts-page"><div className="ts-page-header"><div><h1>Task Calendar</h1><p>Deadlines across your projects</p></div><div className="ts-toolbar"><button onClick={()=>shift(-1)}>← Previous</button><strong>{new Date(year,m-1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><button onClick={()=>shift(1)}>Next →</button></div></div><div className="ts-calendar">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div className="ts-calendar-weekday" key={d}>{d}</div>)}{cells.map((day,i)=>{const date=`${month}-${String(day).padStart(2,"0")}`;const matching=day>0&&day<=days?tasks.filter(t=>t.dueDate===date):[];return <div className={`ts-calendar-day ${day<1||day>days?"ts-calendar-outside":""}`} key={i}>{day>0&&day<=days&&<><b>{day}</b>{matching.map(t=><div className="ts-calendar-task" key={t.id} title={`${t.description} — ${projects.find(p=>p.id===t.projectId)?.name||"No project"}`}>{t.status==="Done"?"✓ ":""}{t.title}</div>)}</>}</div>})}</div></div>
}
