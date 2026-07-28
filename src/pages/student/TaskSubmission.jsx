import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";

/* 🔥 reuse same style system */
const TASK_STYLES = `
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

export default function StudentTaskSubmit() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [existing, setExisting] = useState(null);

  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* inject styles */
  useEffect(() => {
    const id = "task-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = TASK_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  /* fetch task */
  useEffect(() => {
    fetchTask();
  }, []);

  const fetchTask = async () => {
    try {
      const res = await API.get(`student/task/${taskId}/`);
      setTask(res.data.task);
      setExisting(res.data.existing);

      if (res.data.existing) {
        setContent(res.data.existing.content || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please write your answer");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (file) formData.append("attachment", file);

      await API.post(`student/task/${taskId}/submit/`, formData);

      navigate(-1);
    } catch (err) {
      setError("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <StudentLayout>
      <div className="tuition-layout">
        <aside />

        <main>
          <div className="tuition-card wrap">

            {/* TITLE */}
            <div style={{ fontSize: 11, fontWeight: 800, color: "#AAA", marginBottom: 8 }}>
              {task.type}
            </div>

            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
              {task.title}
            </div>

            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
              {task.subject} — {task.tuition_title}
            </div>

            {/* DESCRIPTION */}
            {task.description && (
              <div style={{
                background: "rgba(245,197,24,0.1)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20
              }}>
                {task.description}
              </div>
            )}

            {/* ATTACHMENT */}
            {task.attachment && (
              <div className="attachment-card">
                <a href={task.attachment} target="_blank">
                  📎 {task.attachment_name}
                </a>
              </div>
            )}

            {/* DUE DATE */}
            {task.due_date && (
              <div style={{ color: "#E65100", fontWeight: 700, marginBottom: 20 }}>
                ⏰ Due: {task.due_date}
              </div>
            )}

            {/* EXISTING */}
            {existing && (
              <div style={{
                background: "#E8F5E9",
                padding: 12,
                borderRadius: 12,
                marginBottom: 20
              }}>
                ✅ Already submitted

                {existing.score && (
                  <div>Score: {existing.score}</div>
                )}

                {existing.teacher_feedback && (
                  <div>{existing.teacher_feedback}</div>
                )}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div style={{ color: "red", marginBottom: 10 }}>
                {error}
              </div>
            )}

            {/* FORM */}
            <div className="form-group">
              <label className="form-label">Your Answer</label>

              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attach File</label>

              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="form-input"
              />
            </div>

            {/* BUTTONS */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                Submit →
              </button>

              <button
                className="btn-outline-d"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            </div>

          </div>
        </main>
      </div>
    </StudentLayout>
  );
}