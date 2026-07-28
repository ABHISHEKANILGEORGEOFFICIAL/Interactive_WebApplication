import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API, { getApiErrorMessage, toList } from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import { mergeTuitionDraft } from "./tuitionDraftCache";

const mockUser = { firstName:"Teacher", fullName:"Your Name", role:"Teacher", avatarDisplay:"T", posts:0, followers:0, following:0 };

const MATERIAL_SECTIONS = [
  { key: "assignments", label: "Assignments", icon: "📝", accent: "#e8f5e9" },
  { key: "homework", label: "Homework", icon: "📋", accent: "#fff8e1" },
  { key: "testpapers", label: "Test Papers", icon: "📄", accent: "#ffebee" },
  { key: "notes", label: "Notes", icon: "✏️", accent: "#ede7f6" },
  { key: "recordedClasses", label: "Recorded Classes", icon: "🎥", accent: "#fff7d6" },
];

const DETAIL_STYLES = `
  .class-detail-layout { display:grid; grid-template-columns:240px minmax(0, 1fr); gap:24px; max-width:1160px; margin:0 auto; padding:108px 24px 56px; }
  .class-detail-left, .class-detail-shell { display:flex; flex-direction:column; gap:16px; min-width:0; }
  .class-welcome, .class-detail-card, .material-card, .detail-widget { background:#fff; border:1.5px solid #e7d7a5; border-radius:20px; box-shadow:0 12px 30px rgba(0,0,0,0.12); }
  .class-welcome { background:#fff7d6; border-color:#f5e888; padding:22px; color:#3b2d00; }
  .class-detail-hero { background:linear-gradient(120deg,var(--y) 0%, #fff8a0 100%); border-radius:20px; padding:28px; display:flex; align-items:flex-start; gap:20px; color:#2b2308; }
  .class-detail-icon { width:70px; height:70px; border-radius:18px; background:rgba(255,255,255,0.55); display:flex; align-items:center; justify-content:center; font-size:36px; flex-shrink:0; }
  .class-detail-breadcrumb { display:inline-flex; align-items:center; gap:8px; color:rgba(43,35,8,0.75); font-size:12px; text-decoration:none; margin-bottom:12px; }
  .class-detail-title { font-size:22px; font-weight:900; color:#2b2308; }
  .class-detail-sub { font-size:13px; color:rgba(0,0,0,0.6); margin-top:4px; line-height:1.6; }
  .class-detail-schedule { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.72); border-radius:8px; padding:6px 16px; margin-top:10px; font-size:13px; font-weight:700; }
  .class-detail-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-left:auto; }
  .class-detail-btn, .class-detail-btn-outline { border-radius:12px; padding:10px 16px; font-weight:700; font-size:13px; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; font-family:var(--body); cursor:pointer; }
  .class-detail-btn { background:#1f2f1c; color:#fff; border:1px solid #1f2f1c; }
  .class-detail-btn-outline { background:#fff; color:#4a4124; border:1.5px solid #d8c692; }
  .class-detail-tabs { display:flex; gap:4px; background:#fff; border:1.5px solid #e7d7a5; border-radius:14px; padding:5px; overflow:auto; }
  .class-detail-tab { padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600; color:#7f7555; background:transparent; border:none; }
  .class-detail-tab.active { background:var(--y); color:#2b2308; font-weight:800; }
  .class-detail-card { padding:22px; }
  .class-detail-section-title { font-size:11px; font-weight:800; color:#a59a78; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
  .class-detail-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; }
  .class-detail-stat { border-radius:12px; padding:14px; text-align:center; }
  .class-detail-stat .stat-num { font-size:22px; font-weight:900; }
  .class-detail-stat .stat-lbl { font-size:11px; color:#8f8767; }
  .stat-recorded { background:#fff7d6; }
  .stat-homework { background:#e8f5e9; }
  .stat-assignments { background:#ffebee; }
  .stat-tests { background:#ede7f6; }
  .material-grid { display:grid; grid-template-columns:1fr; gap:14px; }
  .material-card { padding:18px; }
  .material-card-head { display:flex; justify-content:space-between; gap:12px; margin-bottom:14px; align-items:flex-start; }
  .material-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#2b2308; }
  .material-count { font-size:12px; color:#8f8767; }
  .material-form { display:grid; grid-template-columns:1fr; gap:10px; align-items:start; }
  .material-input, .material-textarea { width:100%; border-radius:12px; border:1.5px solid #e7d7a5; background:#fffdf5; color:#2b2308; padding:12px 14px; font-size:13px; font-family:var(--body); outline:none; }
  .material-textarea { min-height:48px; resize:vertical; }
  .material-save { border:none; border-radius:12px; padding:12px 16px; background:var(--y); color:#2b2308; font-weight:800; font-size:13px; cursor:pointer; font-family:var(--body); }
  .material-list { list-style:none; display:flex; flex-direction:column; gap:10px; margin-top:16px; }
  .material-item { border:1.5px solid #efe4be; border-radius:14px; background:#fffdf7; padding:14px; }
  .material-item-title { font-size:14px; font-weight:800; color:#2b2308; }
  .material-item-desc { color:#7f7555; font-size:12px; line-height:1.6; margin-top:6px; white-space:pre-wrap; }
  .material-item-link { display:inline-flex; margin-top:10px; color:#a06c00; font-size:12px; font-weight:700; text-decoration:none; }
  .material-empty { border:1.5px dashed #ecd787; border-radius:14px; padding:14px; color:#7f7555; font-size:12px; margin-top:16px; background:#fffdf1; }
  .class-detail-error { background:#fff1f1; color:#b42318; border:1.5px solid #f6c7c7; border-radius:18px; padding:16px; font-size:13px; margin-bottom:12px; }
  .detail-widget { padding:18px; }
  .detail-widget-title { font-size:10px; font-weight:800; color:#a59a78; letter-spacing:2px; text-transform:uppercase; margin-bottom:14px; }
  .detail-widget-note { font-size:12px; color:#7f7555; line-height:1.6; }
  .detail-highlight { background:#fff7d6; border-color:#f5e888; }
  @media(max-width:900px) { .class-detail-layout { grid-template-columns:1fr; padding:100px 16px 40px; } .class-detail-hero { flex-direction:column; } .class-detail-actions { margin-left:0; } .class-detail-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
  @media(max-width:600px) { .class-detail-grid { grid-template-columns:1fr; } }
`;

const getClassId = (item) => String(item?.id ?? item?.pk ?? item?.tuition_id ?? "");
const getClassTitle = (item) => item?.title || item?.name || item?.class_name || "Class";
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

const getStorageKey = (classId) => `saha_tuition_materials_${classId}`;

const readStoredMaterials = (classId) => {
  if (!classId) return {};
  try {
    const raw = localStorage.getItem(getStorageKey(classId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export default function TuitionClassDetail() {
  const { id } = useParams();
  const [ddOpen, setDdOpen] = useState(false);
  const [tuitionClass, setTuitionClass] = useState(null);
  const [subjectLabelMap, setSubjectLabelMap] = useState({});
  const [error, setError] = useState("");
  const [materials, setMaterials] = useState({});
  const [forms, setForms] = useState(() => MATERIAL_SECTIONS.reduce((acc, section) => ({ ...acc, [section.key]: { title: "", description: "", link: "" } }), {}));
  // Tab state: 'overview', 'tasks', 'recorded', 'students'
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const styleId = "saha-class-detail-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = DETAIL_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    setMaterials(readStoredMaterials(id));
    fetchClass();
  }, [id]);

  const fetchClass = async () => {
    setError("");
    try {
      const subjectsResponse = await API.get("subjects/");
      const subjects = toList(subjectsResponse.data);
      const nextSubjectMap = subjects.reduce((acc, subject) => {
        const key = String(subject?.id ?? subject?.subjectid ?? "");
        const label = subject?.subject_name || subject?.subjectname || subject?.name || "";
        if (key && label) acc[key] = label;
        return acc;
      }, {});
      setSubjectLabelMap(nextSubjectMap);

      const response = await API.get(`tuition/${id}/`);
      setTuitionClass(mergeTuitionDraft(response.data));
      return;
    } catch (detailError) {
      try {
        const listResponse = await API.get("tuition/");
        const matched = toList(listResponse.data).map(mergeTuitionDraft).find((item) => getClassId(item) === String(id));
        if (matched) {
          setTuitionClass(matched);
          return;
        }
      } catch {
        // Ignore fallback failure and use the original message below.
      }
      setError(getApiErrorMessage(detailError, "Unable to load this tuition class."));
    }
  };

  const getSubjectLabel = (item) => {
    const direct = item?.subject_name || item?.subject?.subject_name || item?.subject?.subjectname || item?.subject?.name || item?.subject_title;
    if (direct) return direct;

    const subjectId = String(item?.subject ?? item?.subject_id ?? item?.subjectid ?? "");
    if (subjectId && subjectLabelMap[subjectId]) return subjectLabelMap[subjectId];

    return "Subject not set";
  };

  const updateForm = (sectionKey, field, value) => {
    setForms((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [field]: value,
      },
    }));
  };

  const addMaterial = (sectionKey) => {
    const draft = forms[sectionKey];
    if (!draft?.title?.trim()) return;

    const nextEntry = {
      id: `${sectionKey}-${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      link: draft.link.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextMaterials = {
      ...materials,
      [sectionKey]: [nextEntry, ...(Array.isArray(materials?.[sectionKey]) ? materials[sectionKey] : [])],
    };

    setMaterials(nextMaterials);
    localStorage.setItem(getStorageKey(id), JSON.stringify(nextMaterials));
    setForms((current) => ({
      ...current,
      [sectionKey]: { title: "", description: "", link: "" },
    }));
  };

  return (
    <TeacherLayout user={mockUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="class-detail-layout">
        <aside className="class-detail-left">
          <div className="class-welcome">
            <div style={{ fontSize:16, fontWeight:800, marginBottom:2 }}>{getSubjectIcon(getSubjectLabel(tuitionClass || {}))} {getSubjectLabel(tuitionClass || {})}</div>
            <div style={{ fontSize:12, color:"rgba(59,45,0,0.68)", marginBottom:14 }}>{tuitionClass ? getClassTitle(tuitionClass) : "Loading class"}</div>
            <div style={{ fontSize:12, color:"#6e6546" }}>👨‍🏫 Teacher • {getGrade(tuitionClass || {})}</div>
          </div>
          <div className="side-menu">
            <Link to="/teacher/home" className="sm-item"><span className="sm-ic">🏠</span>Home Feed</Link>
            <Link to="/teacher/tuition" className="sm-item"><span className="sm-ic">📚</span>Create Class</Link>
            <Link to="/teacher/tuition/classes" className="sm-item active"><span className="sm-ic">🎓</span>View Classes</Link>
            <Link to={`/teacher/tuition/classes/${id}/tasks`} className="sm-item"><span className="sm-ic">📝</span>Task</Link>
            <Link to="/teacher/tasks" className="sm-item"><span className="sm-ic">📋</span>All Tasks</Link>
            <a href="/logout" className="sm-item"><span className="sm-ic">🚪</span>Logout</a>
          </div>
        </aside>

        <main className="class-detail-shell">
          {error ? <div className="class-detail-error">{error}</div> : null}
          <section className="class-detail-hero">
            <div className="class-detail-icon">{getSubjectIcon(getSubjectLabel(tuitionClass || {}))}</div>
            <div style={{ flex:1 }}>
              <Link to="/teacher/tuition/classes" className="class-detail-breadcrumb">← Back to View Classes</Link>
              <div className="class-detail-title">{tuitionClass ? getClassTitle(tuitionClass) : "Loading tuition class..."}</div>
              <div className="class-detail-sub">
                {getSubjectLabel(tuitionClass || {})}
                {tuitionClass ? ` • ${getGrade(tuitionClass)}` : ""}
                {tuitionClass ? ` • ${getStudentCount(tuitionClass)} students enrolled` : ""}
              </div>
              {getScheduleLabel(tuitionClass || {}) !== "Schedule not set" ? (
                <div className="class-detail-schedule">🕐 {getScheduleLabel(tuitionClass || {})}</div>
              ) : null}
              <div className="class-detail-sub">{tuitionClass ? getDescription(tuitionClass) : "Fetching tuition details and class workspace."}</div>
            </div>

            <div className="class-detail-actions">
              {getMeetingLink(tuitionClass || {}) ? (
                <a className="class-detail-btn-outline" href={getMeetingLink(tuitionClass || {})} target="_blank" rel="noreferrer">🎥 Google Meet</a>
              ) : null}
              <button type="button" className="class-detail-btn" onClick={fetchClass}>Refresh</button>
            </div>
          </section>

          <div className="class-detail-tabs">
            <button
              type="button"
              className={`class-detail-tab${activeTab === 'overview' ? ' active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >📋 Overview</button>
            <button
              type="button"
              className={`class-detail-tab${activeTab === 'tasks' ? ' active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >📚 Tasks</button>
            <button
              type="button"
              className={`class-detail-tab${activeTab === 'recorded' ? ' active' : ''}`}
              onClick={() => setActiveTab('recorded')}
            >🎬 Recorded Classes</button>
            <button
              type="button"
              className={`class-detail-tab${activeTab === 'students' ? ' active' : ''}`}
              onClick={() => setActiveTab('students')}
            >👥 Students</button>
          </div>

          {/* Tab content switching */}
          {activeTab === 'overview' && (
            <>
              <section className="class-detail-card">
                <div className="class-detail-section-title">Class Summary</div>
                <div className="class-detail-grid">
                  <div className="class-detail-stat stat-recorded">
                    <div className="stat-num">{Array.isArray(materials?.recordedClasses) ? materials.recordedClasses.length : 0}</div>
                    <div className="stat-lbl">Recordings</div>
                  </div>
                  <div className="class-detail-stat stat-homework">
                    <div className="stat-num">{Array.isArray(materials?.homework) ? materials.homework.length : 0}</div>
                    <div className="stat-lbl">Homework</div>
                  </div>
                  <div className="class-detail-stat stat-assignments">
                    <div className="stat-num">{Array.isArray(materials?.assignments) ? materials.assignments.length : 0}</div>
                    <div className="stat-lbl">Assignments</div>
                  </div>
                  <div className="class-detail-stat stat-tests">
                    <div className="stat-num">{Array.isArray(materials?.testpapers) ? materials.testpapers.length : 0}</div>
                    <div className="stat-lbl">Tests</div>
                  </div>
                </div>
              </section>
              <section className="detail-widget detail-highlight">
                <div style={{ fontSize:22, marginBottom:8 }}>📚</div>
                <div style={{ fontSize:13, fontWeight:800, marginBottom:4, color:"#2b2308" }}>{getSubjectLabel(tuitionClass || {})}</div>
                <div className="detail-widget-note">Keep materials organized by section so students can find everything in one place.</div>
              </section>
            </>
          )}
          {activeTab === 'tasks' && (
            <section className="class-detail-card">
              <div className="class-detail-section-title">Tasks</div>
              {/* Example: Only show assignments, homework, test papers */}
              <div className="material-grid">
                {["assignments", "homework", "testpapers"].map((key) => {
                  const section = MATERIAL_SECTIONS.find((s) => s.key === key);
                  const items = Array.isArray(materials?.[section.key]) ? materials[section.key] : [];
                  const form = forms[section.key];
                  return (
                    <section key={section.key} className="material-card">
                      <div className="material-card-head">
                        <div>
                          <div className="material-badge" style={{ background: section.accent }}>
                            <span>{section.icon}</span>
                            <span>{section.label}</span>
                          </div>
                        </div>
                        <div className="material-count">{items.length} added</div>
                      </div>
                      <div className="material-form">
                        <input
                          className="material-input"
                          value={form.title}
                          onChange={(event) => updateForm(section.key, "title", event.target.value)}
                          placeholder={`Add ${section.label.toLowerCase()} title`}
                        />
                        <textarea
                          className="material-textarea"
                          value={form.description}
                          onChange={(event) => updateForm(section.key, "description", event.target.value)}
                          placeholder="Add details or instructions for students"
                        />
                        <input
                          className="material-input"
                          value={form.link}
                          onChange={(event) => updateForm(section.key, "link", event.target.value)}
                          placeholder="Optional file or video link"
                        />
                        <button type="button" className="material-save" onClick={() => addMaterial(section.key)}>Add</button>
                      </div>
                      {items.length ? (
                        <ul className="material-list">
                          {items.map((item) => (
                            <li key={item.id} className="material-item">
                              <div className="material-item-title">{item.title}</div>
                              {item.description ? <div className="material-item-desc">{item.description}</div> : null}
                              {item.link ? <a href={item.link} className="material-item-link" target="_blank" rel="noreferrer">📎 Open resource</a> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="material-empty">No {section.label.toLowerCase()} added yet for this class.</div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>
          )}
          {activeTab === 'recorded' && (
            <section className="class-detail-card">
              <div className="class-detail-section-title">Recorded Classes</div>
              <div className="material-grid">
                {["recordedClasses"].map((key) => {
                  const section = MATERIAL_SECTIONS.find((s) => s.key === key);
                  const items = Array.isArray(materials?.[section.key]) ? materials[section.key] : [];
                  const form = forms[section.key];
                  return (
                    <section key={section.key} className="material-card">
                      <div className="material-card-head">
                        <div>
                          <div className="material-badge" style={{ background: section.accent }}>
                            <span>{section.icon}</span>
                            <span>{section.label}</span>
                          </div>
                        </div>
                        <div className="material-count">{items.length} added</div>
                      </div>
                      <div className="material-form">
                        <input
                          className="material-input"
                          value={form.title}
                          onChange={(event) => updateForm(section.key, "title", event.target.value)}
                          placeholder={`Add ${section.label.toLowerCase()} title`}
                        />
                        <textarea
                          className="material-textarea"
                          value={form.description}
                          onChange={(event) => updateForm(section.key, "description", event.target.value)}
                          placeholder="Add details or instructions for students"
                        />
                        <input
                          className="material-input"
                          value={form.link}
                          onChange={(event) => updateForm(section.key, "link", event.target.value)}
                          placeholder="Optional file or video link"
                        />
                        {/* File upload field for recorded classes */}
                        <label style={{
                          display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#7f7555',
                          background: '#fffdf5', borderRadius: 12, border: '1.5px solid #e7d7a5', padding: '10px 14px', marginBottom: 0
                        }}>
                          <span style={{ marginBottom: 4 }}>Upload file (optional):</span>
                          <input
                            type="file"
                            style={{ border: 'none', padding: 0, background: 'none', fontSize: 13 }}
                            onChange={(event) => {
                              const file = event.target.files[0];
                              if (file) {
                                updateForm(section.key, "file", file);
                              }
                            }}
                          />
                        </label>
                        <button type="button" className="material-save" onClick={() => addMaterial(section.key)}>Add</button>
                      </div>
                      {items.length ? (
                        <ul className="material-list">
                          {items.map((item) => (
                            <li key={item.id} className="material-item">
                              <div className="material-item-title">{item.title}</div>
                              {item.description ? <div className="material-item-desc">{item.description}</div> : null}
                              {item.link ? <a href={item.link} className="material-item-link" target="_blank" rel="noreferrer">📎 Open resource</a> : null}
                              {item.file ? <div style={{ fontSize:12, color:'#7f7555', marginTop:6 }}>📁 {item.file.name || 'File attached'}</div> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="material-empty">No {section.label.toLowerCase()} added yet for this class.</div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>
          )}
          {activeTab === 'students' && (
            <section className="class-detail-card">
              <div className="class-detail-section-title">Students</div>
              {/* Placeholder: Add your students list or management UI here */}
              <div style={{ color: '#7f7555', fontSize: 14 }}>Student management coming soon...</div>
            </section>
          )}
        </main>
      </div>
    </TeacherLayout>
  );
}