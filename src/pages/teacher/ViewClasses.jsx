import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API, { getApiErrorMessage, toList } from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import { mergeTuitionDraft } from "./tuitionDraftCache";

const mockUser = { firstName:"Teacher", fullName:"Your Name", role:"Teacher", avatarDisplay:"T", posts:0, followers:0, following:0 };

const VIEW_CLASSES_STYLES = `
  .view-classes-layout { display:grid; grid-template-columns:240px minmax(0, 1fr); gap:24px; max-width:1160px; margin:0 auto; padding:108px 24px 56px; }
  .view-classes-left, .view-classes-shell { display:flex; flex-direction:column; gap:16px; min-width:0; }
  .vc-welcome-card, .view-classes-panel, .view-classes-widget, .view-class-item { background:#fff7d6; border:1.5px solid #f5e888; border-radius:20px; }
  .vc-welcome-card { padding:22px; color:#3b2d00; box-shadow:0 10px 24px rgba(0,0,0,0.12); }
  .vc-name { font-size:18px; font-weight:800; margin-bottom:2px; }
  .vc-sub { font-size:12px; color:rgba(59,45,0,0.68); margin-bottom:16px; }
  .vc-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .vc-stat { background:#fff; border-radius:10px; padding:10px 6px; text-align:center; border:1px solid #f5e888; }
  .vc-stat-num { font-size:20px; font-weight:800; color:#e8a800; }
  .vc-stat-label { font-size:10px; color:#9a8f69; text-transform:uppercase; letter-spacing:0.5px; }
  .view-classes-panel { background:#fff; border-color:#e7d7a5; padding:22px; box-shadow:0 14px 32px rgba(0,0,0,0.14); }
  .view-classes-panel-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px; }
  .view-classes-title { font-size:24px; font-weight:900; color:#2b2308; }
  .view-classes-sub { margin-top:6px; color:#7f7555; font-size:13px; line-height:1.6; max-width:680px; }
  .view-classes-actions { display:flex; gap:10px; flex-wrap:wrap; }
  .view-classes-count { font-size:12px; color:#9a8f69; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; }
  .view-classes-grid { display:flex; flex-direction:column; gap:12px; }
  .view-class-item { background:#fff; border-color:#e7d7a5; padding:18px 20px; display:grid; grid-template-columns:auto minmax(0, 1fr) auto; gap:16px; align-items:flex-start; transition:box-shadow .15s; }
  .view-class-item:hover { box-shadow:0 6px 20px rgba(245,197,24,0.13); }
  .view-class-icon { width:54px; height:54px; border-radius:14px; background:#fff4bf; display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0; }
  .view-class-main { flex:1; min-width:0; }
  .view-class-top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
  .view-class-name { font-size:15px; font-weight:800; color:#2b2308; margin-bottom:4px; }
  .view-class-desc { color:#7f7555; font-size:12px; line-height:1.55; margin-bottom:10px; }
  .view-class-meta { display:flex; gap:12px; flex-wrap:wrap; }
  .view-class-tag { font-size:11px; color:#8f8767; font-weight:600; }
  .view-class-tag.strong { color:#c89000; font-weight:700; }
  .view-class-tag.schedule { background:#fff8df; border:1px solid #f2df9f; border-radius:999px; padding:5px 10px; }
  .view-class-side { display:flex; flex-direction:column; gap:10px; align-items:flex-end; min-width:110px; }
  .view-class-grade { font-size:12px; color:#7f7555; font-weight:700; }
  .view-class-item.just-created { border-color:#e8b300; box-shadow:0 0 0 3px rgba(245,197,24,0.22), 0 10px 28px rgba(245,197,24,0.16); }
  .view-classes-notice { background:#fff7d6; border:1.5px solid #f5e888; color:#5c4f20; border-radius:18px; padding:14px 16px; margin-bottom:16px; font-size:13px; font-weight:700; }
  .btn-primary-vc, .btn-outline-vc { border-radius:14px; padding:10px 16px; font-weight:700; font-size:13px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; font-family:var(--body); transition:opacity .15s, background .15s, color .15s; }
  .btn-primary-vc { background:var(--y); color:#1a3010; border:1px solid var(--y); }
  .btn-outline-vc { background:#fff; color:#6e6546; border:1.5px solid #e7d7a5; }
  .btn-primary-vc:hover, .btn-outline-vc:hover { opacity:0.92; }
  .btn-outline-vc:hover { background:#fff7d6; color:#2b2308; }
  .view-classes-empty, .view-classes-error { border-radius:18px; padding:18px; font-size:13px; }
  .view-classes-empty { background:#fffdf1; border:1.5px dashed #ecd787; color:#7f7555; }
  .view-classes-error { background:#fff1f1; color:#b42318; border:1.5px solid #f6c7c7; margin-bottom:16px; }
  .view-classes-widget { background:#fff; border-color:#e7d7a5; padding:18px; box-shadow:0 10px 24px rgba(0,0,0,0.12); }
  .vc-widget-title { font-size:10px; font-weight:800; color:#a59a78; letter-spacing:2px; text-transform:uppercase; margin-bottom:14px; }
  .vc-widget-note { font-size:12px; color:#7f7555; line-height:1.6; }
  .vc-highlight { background:#fff7d6; border-color:#f5e888; }
  @media(max-width:860px) { .view-classes-layout { grid-template-columns:1fr; padding:100px 16px 40px; } .view-class-item { grid-template-columns:1fr; } .view-class-side { align-items:flex-start; min-width:0; } .view-classes-panel-head { flex-direction:column; align-items:flex-start; } }
`;

const getClassId = (item) => String(item?.id ?? item?.pk ?? item?.tuition_id ?? "");
const getClassTitle = (item, subjectLabel = "") => item?.title || item?.name || item?.class_name || `${subjectLabel || "Class"}`;
const getDescription = (item) => item?.description || item?.about || "No description added for this class yet.";
const getGrade = (item) => item?.grade || item?.class_level || item?.level || "General batch";
const getMeetingLink = (item) => item?.meeting_link || item?.meetingLink || item?.live_link || "";
const getMaxStudents = (item) => item?.max_students ?? item?.maxStudents ?? item?.student_limit ?? null;
const getStudentCount = (item) => item?.student_count ?? item?.students_count ?? item?.enrolled_students ?? item?.enrollment_count ?? 0;
const getSubjectIcon = (label = "") => {
  const value = String(label).toLowerCase();
  if (value.includes("math")) return "📐";
  if (value.includes("physics")) return "⚡";
  if (value.includes("chem")) return "🧪";
  if (value.includes("bio")) return "🌿";
  if (value.includes("english") || value.includes("language")) return "📖";
  if (value.includes("history")) return "🏛";
  if (value.includes("geo")) return "🌍";
  if (value.includes("computer") || value.includes("cs") || value.includes("it")) return "💻";
  return "📚";
};

const formatDayLabel = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const map = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };
  if (map[raw]) return map[raw];
  return raw.slice(0, 3).replace(/^./, (char) => char.toUpperCase());
};

const normalizeDays = (item) => {
  const rawDays = item?.class_days ?? item?.days ?? item?.classDays;
  if (Array.isArray(rawDays)) {
    return rawDays
      .map((entry) => (typeof entry === "object" ? entry?.day || entry?.value || entry?.label : entry))
      .map(formatDayLabel)
      .filter(Boolean);
  }

  if (typeof rawDays === "string") {
    const trimmed = rawDays.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(formatDayLabel).filter(Boolean);
      } catch {
        // Fallback to comma split below.
      }
    }

    return trimmed
      .split(",")
      .map((value) => value.trim())
      .map(formatDayLabel)
      .filter(Boolean);
  }

  return [];
};

const formatTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.slice(0, 5);
};

const getScheduleLabel = (item) => {
  const displayValue = item?.schedule_display || item?.get_schedule_display || item?.class_schedule;
  if (typeof displayValue === "string" && displayValue.trim() && displayValue !== "Schedule not set") {
    return displayValue;
  }

  const days = normalizeDays(item);
  const start = formatTime(item?.start_time || item?.startTime);
  const end = formatTime(item?.end_time || item?.endTime);
  const dayLabel = days.length ? days.join(", ") : "";
  const timeLabel = start && end ? `${start} - ${end}` : start || end;

  if (dayLabel && timeLabel) return `${dayLabel} • ${timeLabel}`;
  if (dayLabel) return dayLabel;
  if (timeLabel) return timeLabel;
  return "Schedule not set";
};

const matchesTeacher = (item, teacherId) => {
  if (!teacherId) return false;
  const owner = item?.teacher ?? item?.created_by ?? item?.user ?? item?.owner;
  const candidateIds = [
    item?.teacher_id,
    item?.created_by_id,
    item?.user_id,
    item?.owner_id,
    owner?.id,
    owner?.pk,
  ].filter((value) => value !== undefined && value !== null && value !== "").map(String);
  return candidateIds.includes(String(teacherId));
};

export default function ViewClasses() {
  const location = useLocation();
  const [ddOpen, setDdOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjectLabelMap, setSubjectLabelMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = "saha-view-classes-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = VIEW_CLASSES_STYLES;
      document.head.appendChild(el);
    }
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const [classesResponse, subjectsResponse] = await Promise.all([
        API.get("tuition/"),
        API.get("subjects/"),
      ]);

      const nextClasses = toList(classesResponse.data).map(mergeTuitionDraft);
      const subjects = toList(subjectsResponse.data);
      const nextSubjectMap = subjects.reduce((acc, subject) => {
        const key = String(subject?.id ?? subject?.subjectid ?? "");
        const label = subject?.subject_name || subject?.subjectname || subject?.name || "";
        if (key && label) acc[key] = label;
        return acc;
      }, {});

      setSubjectLabelMap(nextSubjectMap);
      const teacherId = localStorage.getItem("user_id");
      const ownedClasses = nextClasses.filter((item) => matchesTeacher(item, teacherId));
      setClasses(ownedClasses.length ? ownedClasses : nextClasses);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load tuition classes right now."));
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const createdClassId = String(location.state?.createdClassId ?? "");
  const createdClassTitle = location.state?.createdClassTitle || "";

  const getSubjectLabel = (item) => {
    const direct = item?.subject_name || item?.subject?.subject_name || item?.subject?.subjectname || item?.subject?.name || item?.subject_title;
    if (direct) return direct;

    const subjectId = String(item?.subject ?? item?.subject_id ?? item?.subjectid ?? "");
    if (subjectId && subjectLabelMap[subjectId]) return subjectLabelMap[subjectId];

    return "Subject not set";
  };

  return (
    <TeacherLayout user={mockUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="view-classes-layout">
        <aside className="view-classes-left">
          <div className="vc-welcome-card">
            <div className="vc-name">Teacher Classes 📚</div>
            <div className="vc-sub">Manage your tuition classroom spaces</div>
            <div className="vc-stats">
              <div className="vc-stat"><div className="vc-stat-num">{classes.length}</div><div className="vc-stat-label">Classes</div></div>
              <div className="vc-stat"><div className="vc-stat-num">{classes.reduce((sum, item) => sum + Number(getStudentCount(item) || 0), 0)}</div><div className="vc-stat-label">Students</div></div>
              <div className="vc-stat"><div className="vc-stat-num">{classes.filter((item) => getMeetingLink(item)).length}</div><div className="vc-stat-label">Live Links</div></div>
            </div>
          </div>
          <div className="side-menu">
            <Link to="/teacher/home" className="sm-item"><span className="sm-ic">🏠</span>Home Feed</Link>
            <Link to="/teacher/tuition" className="sm-item"><span className="sm-ic">📚</span>Create Class</Link>
            <Link to="/teacher/tuition/classes" className="sm-item active"><span className="sm-ic">🎓</span>View Classes</Link>
            <Link to="/teacher/tasks" className="sm-item"><span className="sm-ic">📋</span>Tasks</Link>
            <a href="/logout" className="sm-item"><span className="sm-ic">🚪</span>Logout</a>
          </div>
        </aside>

        <main className="view-classes-shell">
          <section className="view-classes-panel">
            <div className="view-classes-panel-head">
              <div>
              <div className="view-classes-title">🎓 View Classes</div>
              <div className="view-classes-sub">
                Review every tuition class you created, open the full class workspace, and manage assignments, homework, test papers, notes, and recorded classes from one place.
              </div>
              </div>
              <div className="view-classes-actions">
                <Link to="/teacher/tuition" className="btn-outline-vc">+ Create Class</Link>
                <button type="button" className="btn-primary-vc" onClick={fetchClasses}>Refresh List</button>
              </div>
            </div>
            <div className="view-classes-count">{loading ? "Loading classes..." : `${classes.length} class${classes.length === 1 ? "" : "es"} found`}</div>

            {error && <div className="view-classes-error">{error}</div>}
            {createdClassTitle ? <div className="view-classes-notice">Created class: {createdClassTitle}. Review the selected days and time below.</div> : null}

            {!loading && !classes.length ? (
              <div className="view-classes-empty">
                No tuition classes are available yet. Create one first, then return here to open its details page.
              </div>
            ) : null}

            {classes.length ? (
              <div className="view-classes-grid">
                {classes.map((item) => {
                  const classId = getClassId(item);
                  const subjectLabel = getSubjectLabel(item);
                  const scheduleLabel = getScheduleLabel(item);
                  return (
                    <article key={classId || getClassTitle(item)} className={`view-class-item ${createdClassId && classId === createdClassId ? "just-created" : ""}`}>
                      <div className="view-class-icon">{getSubjectIcon(subjectLabel)}</div>
                      <div className="view-class-main">
                        <div className="view-class-top">
                          <div>
                            <div className="view-class-name">{subjectLabel} - {getClassTitle(item, subjectLabel)}</div>
                            <div className="view-class-desc">{getDescription(item)}</div>
                          </div>
                          <div className="view-class-grade">{getGrade(item)}</div>
                        </div>
                        <div className="view-class-meta">
                          {scheduleLabel !== "Schedule not set" ? <span className="view-class-tag strong schedule">🕐 {scheduleLabel}</span> : null}
                          <span className="view-class-tag">👥 {getStudentCount(item)}{getMaxStudents(item) ? `/${getMaxStudents(item)}` : ""} students</span>
                          {getGrade(item) ? <span className="view-class-tag">🏫 {getGrade(item)}</span> : null}
                          {getMeetingLink(item) ? <span className="view-class-tag">🎥 Live link added</span> : null}
                        </div>
                      </div>

                      <div className="view-class-side">
                        {classId ? (
                          <Link to={`/teacher/tuition/classes/${classId}`} className="btn-primary-vc">View</Link>
                        ) : (
                          <span className="btn-outline-vc" aria-disabled="true">Unavailable</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="view-classes-widget">
            <div className="vc-widget-title">Quick Actions</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <Link to="/teacher/tuition" className="btn-primary-vc">+ New Tuition Class</Link>
              <Link to="/teacher/tasks" className="btn-outline-vc">📋 Open Tasks</Link>
            </div>
          </section>

          <section className="view-classes-widget vc-highlight">
            <div style={{ fontSize:24, marginBottom:8 }}>🎯</div>
            <div style={{ fontSize:13, fontWeight:800, marginBottom:4, color:"#2b2308" }}>Stay on Track</div>
            <div className="vc-widget-note">Open each class from the View button and manage assignments, homework, test papers, notes, and recordings inside the class workspace.</div>
          </section>
        </main>
      </div>
    </TeacherLayout>
  );
}