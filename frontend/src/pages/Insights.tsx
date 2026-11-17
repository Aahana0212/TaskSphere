import type { Task } from "../types/task";
import type { Project } from "../types/project";
type Props={tasks:Task[];projects:Project[]};
export default function Insights({tasks,projects}:Props){
 const total=tasks.length, done=tasks.filter(t=>t.status==="Done").length;
 const status=["To Do","In Progress","Done"].map(s=>({name:s,count:tasks.filter(t=>t.status===s).length}));
 const priority=["High","Medium","Low"].map(s=>({name:s,count:tasks.filter(t=>t.priority===s).length}));
 const byProject=projects.map(p=>({name:p.name,count:tasks.filter(t=>t.projectId===p.id).length}));
 const groups=[{title:"By Status",items:status},{title:"By Priority",items:priority},{title:"By Project",items:[...byProject,{name:"No Project",count:tasks.filter(t=>!t.projectId).length}]}];
 return <div className="ts-page"><h1>Productivity Insights</h1><div className="ts-insight-summary"><div className="ts-panel"><span>Total Tasks</span><strong>{total}</strong></div><div className="ts-panel"><span>Completed</span><strong>{done}</strong></div><div className="ts-panel"><span>Completion Rate</span><strong>{total?Math.round(done/total*100):0}%</strong></div></div><div className="ts-insight-grid">{groups.map(g=><section className="ts-panel" key={g.title}><h2>{g.title}</h2>{g.items.map(item=><div className="ts-bar-row" key={item.name}><div><span>{item.name}</span><b>{item.count}</b></div><div className="ts-bar-track"><div style={{width:`${total?item.count/total*100:0}%`}} /></div></div>)}</section>)}</div></div>
}
