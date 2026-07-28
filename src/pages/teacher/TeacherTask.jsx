import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";

const mockUser = { firstName:"Teacher", fullName:"Your Name", role:"Teacher", avatarDisplay:"T", posts:0, followers:0, following:0 };

const TASK_STYLES = `
  .task-layout { display:grid; grid-template-columns:220px 1fr; gap:22px; max-width:960px; margin:0 auto; padding:108px 28px 60px; }
  .task-card { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:24px; padding:28px; backdrop-filter:blur(12px); }
  .task-heading { font-size:22px; font-weight:900; color:var(--y); margin-bottom:4px; }
  .task-sub { font-size:13px; color:var(--muted); margin-bottom:22px; }
  .task-input-row { display:flex; gap:10px; margin-bottom:18px; }
  .task-inp { flex:1; background:rgba(245,197,24,0.08); border:1px solid var(--border); border-radius:12px; padding:11px 14px; font-size:13px; color:var(--text); font-family:var(--body); outline:none; }
  .task-inp:focus { border-color:rgba(245,197,24,0.4); }
  .task-add-btn { background:var(--y); color:#1a3010; border:none; border-radius:12px; padding:11px 20px; font-weight:700; font-size:13px; cursor:pointer; font-family:var(--body); white-space:nowrap; transition:opacity .15s; }
  .task-add-btn:hover { opacity:0.88; }
  .task-list { list-style:none; display:flex; flex-direction:column; gap:8px; }
  .task-item { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-radius:14px; background:rgba(245,197,24,0.06); border:1px solid var(--border); color:var(--text); font-size:13px; }
  .task-item:hover { border-color:rgba(245,197,24,0.3); }
  .task-del { background:rgba(220,38,38,0.15); color:#fca5a5; border:1px solid rgba(220,38,38,0.22); border-radius:8px; padding:5px 12px; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--body); transition:background .12s; }
  .task-del:hover { background:rgba(220,38,38,0.28); }
  .task-empty { text-align:center; padding:30px; color:var(--muted); font-size:13px; }
  @media(max-width:860px) { .task-layout { grid-template-columns:1fr; padding:100px 16px 40px; } }
`;

export default function TeacherTask() {
  const [ddOpen, setDdOpen] = useState(false);
  const [tasks, setTasks]   = useState([]);
  const [title, setTitle]   = useState("");

  useEffect(() => {
    const id = "saha-task-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id; el.textContent = TASK_STYLES; document.head.appendChild(el);
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try { const res = await API.get("task/"); setTasks(res.data); }
    catch (err) { console.error("Failed to load tasks", err); }
  };

  const addTask = async () => {
    if (!title.trim()) return;
    try { await API.post("task/", { title }); setTitle(""); fetchTasks(); }
    catch (err) { console.error("Failed to add task", err); }
  };

  const deleteTask = async (id) => {
    try { await API.delete(`task/${id}/`); fetchTasks(); }
    catch (err) { console.error("Failed to delete task", err); }
  };

  return (
    <TeacherLayout user={mockUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="task-layout">
        <aside>
          <div className="side-menu">
            <Link to="/teacher/home"    className="sm-item"><span className="sm-ic">🏠</span>Home Feed</Link>
            <Link to="/teacher/tuition" className="sm-item"><span className="sm-ic">📚</span>Tuition</Link>
            <Link to="/teacher/tasks"   className="sm-item active"><span className="sm-ic">📋</span>Tasks</Link>
            <a href="/logout"           className="sm-item"><span className="sm-ic">🚪</span>Logout</a>
          </div>
        </aside>
        <main>
          <div className="task-card">
            <div className="task-heading">📋 Tasks</div>
            <div className="task-sub">Manage homework, assignments, and tests for your classes.</div>
            <div className="task-input-row">
              <input
                className="task-inp"
                value={title}
                onChange={e=>setTitle(e.target.value)}
                placeholder="Enter task title…"
                onKeyDown={e=>e.key==="Enter" && addTask()}
              />
              <button className="task-add-btn" onClick={addTask}>+ Add Task</button>
            </div>
            {tasks.length === 0
              ? <div className="task-empty">No tasks yet. Add one above.</div>
              : (
                <ul className="task-list">
                  {tasks.map(t => (
                    <li key={t.id} className="task-item">
                      <span>{t.title}</span>
                      <button className="task-del" onClick={()=>deleteTask(t.id)}>Delete</button>
                    </li>
                  ))}
                </ul>
              )
            }
          </div>
        </main>
      </div>
    </TeacherLayout>
  );
}
