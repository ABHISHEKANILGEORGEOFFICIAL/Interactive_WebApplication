import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";




/* 🔥 SAME STYLE AS TEACHER */
const TUITION_STYLES = `
  .tuition-layout { display:grid; grid-template-columns:220px 1fr; gap:22px; max-width:960px; margin:0 auto; padding:108px 28px 60px; }
  .tuition-card { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:24px; padding:32px; backdrop-filter:blur(12px); }

  .subj-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .subj-opt { border:1px solid var(--border); border-radius:12px; padding:10px 6px; text-align:center; cursor:pointer; transition:all .15s; background:rgba(245,197,24,0.04); }
  .subj-opt:hover, .subj-opt.selected { background:rgba(245,197,24,0.16); border-color:var(--y); }
  .subj-icon { font-size:20px; margin-bottom:4px; }
  .subj-label { font-size:10px; font-weight:700; color:var(--muted); }
  .subj-opt.selected .subj-label { color:var(--y); }

  .btn-primary { background:var(--y); color:#1a3010; border:none; border-radius:14px; padding:10px 16px; font-weight:700; font-size:13px; cursor:pointer; }
  .btn-outline-d { background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:14px; padding:10px 16px; font-weight:700; font-size:13px; cursor:pointer; }

  @media(max-width:860px) {
    .tuition-layout { grid-template-columns:1fr; padding:100px 16px 40px; }
    .subj-grid { grid-template-columns:repeat(2,1fr); }
  }
`;

export default function StudentTuition() {
  const navigate = useNavigate();

  const [myTuitions, setMyTuitions] = useState([]);
  const [availableTuitions, setAvailableTuitions] = useState([]);
  const [subjectFilters, setSubjectFilters] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");

  /* 🔥 INJECT STYLE LIKE TEACHER */
  useEffect(() => {
    const id = "saha-tuition-styles";

    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = TUITION_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [subjectFilter]);

  const fetchData = async () => {
    try {
      const res = await API.get("student/tuitions/", {
        params: { subject: subjectFilter },
      });

      const data = res.data;

      setMyTuitions(data.my_tuitions || []);
      setAvailableTuitions(data.available_tuitions || []);
      setSubjectFilters(data.subject_filters || []);
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

            <Link to="/student/tuition" className="sm-item active">
              <span className="sm-ic">📚</span>Tuition
            </Link>

            <Link to="/student/tasks" className="sm-item">
              <span className="sm-ic">📋</span>Tasks
            </Link>

            <a href="/logout" className="sm-item">
              <span className="sm-ic">🚪</span>Logout
            </a>
          </div>
        </aside>

        <main>

          {/* MY CLASSES */}
          <div className="tuition-card">
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 20, color: "var(--y)" }}>
              📚 My Classes
            </div>

            {myTuitions.length > 0 ? (
              myTuitions.map((t) => (
                <div key={t.id} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 26 }}>{t.subject_icon || "📘"}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {t.subject} — {t.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {t.teacher_name}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 5 }}>
                      {t.grade && `🏫 ${t.grade}`} · {t.task_count} tasks
                    </div>
                  </div>

                  <button className="btn-primary" onClick={() => navigate(`/student/tuition/${t.id}`)}>
                    Open →
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 20 }}>
                No classes joined yet.
              </div>
            )}
          </div>

          {/* FILTER */}
          <div className="tuition-card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
              🔍 Browse Subjects
            </div>

            <div className="subj-grid">
              <div
                className={`subj-opt ${!subjectFilter ? "selected" : ""}`}
                onClick={() => setSubjectFilter("")}
              >
                <div className="subj-label">All</div>
              </div>

              {subjectFilters.map((s) => (
                <div
                  key={s.value}
                  className={`subj-opt ${subjectFilter === s.value ? "selected" : ""}`}
                  onClick={() => setSubjectFilter(s.value)}
                >
                  <div className="subj-icon">{s.icon}</div>
                  <div className="subj-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AVAILABLE */}
          <div className="tuition-card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 20, color: "var(--y)" }}>
              📖 Available Classes
            </div>

            {availableTuitions.length > 0 ? (
              availableTuitions.map((t) => (
                <div key={t.id} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 26 }}>{t.subject_icon || "📘"}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {t.subject} — {t.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      By {t.teacher_name}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 5 }}>
                      👥 {t.enrolled_count}
                      {t.max_students && `/${t.max_students}`}
                    </div>
                  </div>

                  {t.is_full ? (
                    <button className="btn-outline-d" disabled>Full</button>
                  ) : (
                    <button className="btn-primary" onClick={() => navigate(`/student/join/${t.id}`)}>
                      Join
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 20 }}>
                No classes available.
              </div>
            )}
          </div>

        </main>
      </div>
    </StudentLayout>
  );
}