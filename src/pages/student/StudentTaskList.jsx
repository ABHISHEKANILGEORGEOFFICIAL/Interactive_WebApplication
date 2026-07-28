import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";




/* 🔥 SAME STYLE SYSTEM */
const TASK_LIST_STYLES = `
  .tuition-layout { display:grid; grid-template-columns:220px 1fr; gap:22px; max-width:960px; margin:0 auto; padding:108px 28px 60px; }

  .tuition-card { 
    background:rgba(10,28,16,0.92); 
    border:1px solid var(--border); 
    border-radius:24px; 
    padding:32px; 
    backdrop-filter:blur(12px); 
  }

  .task-item {
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:14px;
    border-radius:14px;
    margin-bottom:12px;
    border:1px solid var(--border);
    background:rgba(245,197,24,0.05);
    cursor:pointer;
    transition:all .15s;
  }

  .task-item:hover {
    background:rgba(245,197,24,0.15);
  }

  .task-title {
    font-weight:800;
  }

  .task-meta {
    font-size:12px;
    color:var(--muted);
    margin-top:4px;
  }

  .status-badge {
    font-size:11px;
    font-weight:700;
    padding:6px 10px;
    border-radius:10px;
  }

  .status-submitted { background:#1B5E20; color:#A5D6A7; }
  .status-pending { background:#4E342E; color:#FFCCBC; }
  .status-graded { background:#0D47A1; color:#90CAF9; }

  .btn-primary {
    background:var(--y);
    color:#1a3010;
    border:none;
    border-radius:12px;
    padding:8px 14px;
    font-weight:700;
    cursor:pointer;
  }
`;

export default function StudentTaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  /* 🔥 Inject style */
  useEffect(() => {
    const id = "task-list-style";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = TASK_LIST_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  /* 🔹 Fetch tasks */
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await API.get("student/tasks/");
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StudentLayout>
      <div className="tuition-layout">

        {/* SIDEBAR */}
        <aside>
          <div className="side-menu">
            <Link to="/student/home" className="sm-item">
              <span className="sm-ic">🏠</span>Home
            </Link>

            <Link to="/student/tuition" className="sm-item">
              <span className="sm-ic">📚</span>Tuition
            </Link>

            <Link to="/student/tasks" className="sm-item active">
              <span className="sm-ic">📋</span>Tasks
            </Link>

            <a href="/logout" className="sm-item">
              <span className="sm-ic">🚪</span>Logout
            </a>
          </div>
        </aside>

        <main>

          <div className="tuition-card">

            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 20, color: "var(--y)" }}>
              📋 Your Tasks
            </div>

            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="task-item"
                  onClick={() => navigate(`/student/task/${task.id}`)}
                >

                  {/* LEFT */}
                  <div>
                    <div className="task-title">
                      {task.title}
                    </div>

                    <div className="task-meta">
                      {task.type} {task.due_date && `• Due: ${task.due_date}`}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                    <span className={`status-badge status-${task.status}`}>
                      {task.status}
                    </span>

                    <button className="btn-primary">
                      Open →
                    </button>

                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 20 }}>
                No tasks available.
              </div>
            )}

          </div>

        </main>
      </div>
    </StudentLayout>
  );
}