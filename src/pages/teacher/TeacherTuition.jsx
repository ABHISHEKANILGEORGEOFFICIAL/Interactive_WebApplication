import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import { saveCreatedTuitionDraft } from "./tuitionDraftCache";

const mockUser = { firstName:"Teacher", fullName:"Your Name", role:"Teacher", avatarDisplay:"T", posts:0, followers:0, following:0 };

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getSubjectValue = (subject) => String(subject?.id ?? subject?.subjectid ?? "");
const getSubjectLabel = (subject) => subject?.subject_name || subject?.subjectname || "Unnamed Subject";
const getSubjectType = (subject) => String(subject?.type ?? subject?.subject_type ?? "").toLowerCase();
const getEntityId = (value, keys = ["id", "pk", "school_id", "schoolid", "college_id", "collegeid"]) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  for (const key of keys) {
    const next = value?.[key];
    if (next !== undefined && next !== null && next !== "") return String(next);
  }
  return "";
};
const getNestedValue = (source, path) => {
  if (!source || !path) return undefined;
  return path.split(".").reduce((value, key) => value?.[key], source);
};
const resolveProfileEntityId = (profile, paths) => {
  for (const path of paths) {
    const resolved = getEntityId(getNestedValue(profile, path));
    if (resolved) return resolved;
  }
  return "";
};
const getSubjectIcon = (label) => {
  const value = label.toLowerCase();
  if (value.includes("math")) return "📐";
  if (value.includes("physics")) return "⚡";
  if (value.includes("chem")) return "🧪";
  if (value.includes("bio")) return "🌿";
  if (value.includes("english") || value.includes("language")) return "📖";
  if (value.includes("history")) return "🏛";
  if (value.includes("geo")) return "🌍";
  if (value.includes("computer") || value.includes("cs") || value.includes("it")) return "💻";
  if (value.includes("economic") || value.includes("commerce")) return "📊";
  if (value.includes("account")) return "🧾";
  if (value.includes("social")) return "👥";
  if (value.includes("arabic")) return "📜";
  if (value.includes("hindi")) return "🇮🇳";
  if (value.includes("malayalam")) return "🌴";
  return "📚";
};

const dayChoices = [
  { value:"monday",    label:"Mon" },
  { value:"tuesday",   label:"Tue" },
  { value:"wednesday", label:"Wed" },
  { value:"thursday",  label:"Thu" },
  { value:"friday",    label:"Fri" },
  { value:"saturday",  label:"Sat" },
  { value:"sunday",    label:"Sun" },
];

const formatApiError = (data) => {
  if (!data) return "Failed to create tuition class. Please try again.";
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;

  const entries = Object.entries(data)
    .flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values
        .filter(Boolean)
        .map((item) => `${field.replace(/_/g, " ")}: ${String(item)}`);
    });

  return entries.length
    ? entries.join(" ")
    : "Failed to create tuition class. Please try again.";
};

const TUITION_STYLES = `
  .tuition-layout { display:grid; grid-template-columns:220px 1fr; gap:22px; max-width:960px; margin:0 auto; padding:108px 28px 60px; }
  .tuition-card { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:24px; padding:32px; backdrop-filter:blur(12px); }
  .tuition-card .form-group { margin-bottom:18px; }
  .tuition-card .form-label { display:block; font-size:13px; font-weight:700; margin-bottom:10px; color:var(--text); }
  .tuition-card .form-input, .tuition-card .form-textarea { width:100%; border:1px solid var(--border); border-radius:14px; padding:12px 14px; font-size:14px; background:rgba(245,197,24,0.06); color:var(--text); font-family:var(--body); outline:none; }
  .tuition-card .form-input:focus, .tuition-card .form-textarea:focus { border-color:rgba(245,197,24,0.4); }
  .tuition-card .form-textarea { min-height:100px; resize:vertical; }
  .subj-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .subj-opt { border:1px solid var(--border); border-radius:12px; padding:10px 6px; text-align:center; cursor:pointer; transition:all .15s; background:rgba(245,197,24,0.04); }
  .subj-opt:hover, .subj-opt.selected { background:rgba(245,197,24,0.16); border-color:var(--y); }
  .subj-opt input { display:none; }
  .subj-icon { font-size:20px; margin-bottom:4px; }
  .subj-label { font-size:10px; font-weight:700; color:var(--muted); line-height:1.3; }
  .subj-opt.selected .subj-label { color:var(--y); }
  .day-grid { display:flex; gap:8px; flex-wrap:wrap; }
  .day-opt { position:relative; }
  .day-opt input { display:none; }
  .day-btn { display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:12px; border:1px solid var(--border); background:rgba(245,197,24,0.04); font-size:12px; font-weight:800; cursor:pointer; color:var(--muted); transition:all .15s; }
  .day-opt input:checked + .day-btn { background:var(--y); border-color:var(--y); color:#1a3010; }
  .day-btn:hover { border-color:var(--y); background:rgba(245,197,24,0.16); color:var(--y); }
  .time-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .section-divider { font-size:10px; font-weight:800; color:rgba(160,210,170,0.45); letter-spacing:2px; text-transform:uppercase; margin:22px 0 14px; padding-top:18px; border-top:1px solid var(--border); }
  .btn-primary { background:var(--y); color:#1a3010; border:none; border-radius:14px; padding:13px 20px; font-weight:700; font-size:14px; cursor:pointer; font-family:var(--body); transition:opacity .15s; }
  .btn-primary:hover { opacity:0.88; }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-outline-d { background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:14px; padding:13px 20px; font-weight:700; font-size:14px; cursor:pointer; font-family:var(--body); transition:background .12s; }
  .btn-outline-d:hover { background:rgba(245,197,24,0.08); color:var(--y); }
  .btn-link-d { display:inline-flex; align-items:center; justify-content:center; text-decoration:none; }
  .status-msg { margin-bottom:16px; padding:12px 14px; border-radius:12px; font-size:13px; }
  .msg-success { background:rgba(16,185,129,0.12); color:#5eead4; border:1px solid rgba(16,185,129,0.22); }
  .msg-error   { background:rgba(220,38,38,0.12);  color:#fca5a5; border:1px solid rgba(220,38,38,0.22); }
  @media(max-width:860px) { .tuition-layout { grid-template-columns:1fr; padding:100px 16px 40px; } .subj-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:500px) { .subj-grid { grid-template-columns:1fr; } .time-row { grid-template-columns:1fr; } }
`;

export default function TeacherTuition() {
  const navigate = useNavigate();
  const [ddOpen, setDdOpen] = useState(false);
  const [subjects, setSubjects]       = useState([]);
  const [subjectsError, setSubjectsError] = useState("");
  const [teacherSchoolId, setTeacherSchoolId] = useState(localStorage.getItem("user_school_id") || "");
  const [teacherCollegeId, setTeacherCollegeId] = useState(localStorage.getItem("user_college_id") || "");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade]           = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime]   = useState("");
  const [endTime, setEndTime]       = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [maxStudents, setMaxStudents] = useState(0);
  const [status, setStatus]         = useState({ success:"", error:"" });
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const id = "saha-tuition-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id; el.textContent = TUITION_STYLES; document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectsError("");
      try {
        const [subjectsResponse, profileResponse] = await Promise.allSettled([
          API.get("subjects/"),
          API.get("chat/context/"),
        ]);

        const profileUser =
          profileResponse.status === "fulfilled"
            ? profileResponse.value.data?.current_user
            : null;

        const schoolIdFromProfile = profileUser
          ? resolveProfileEntityId(profileUser, [
              "school_id",
              "school",
              "school.id",
              "school.pk",
            ])
          : "";
        const collegeIdFromProfile = profileUser
          ? resolveProfileEntityId(profileUser, [
              "college_id",
              "college",
              "college.id",
              "college.pk",
              "department.college",
              "department.college_id",
              "department.college.pk",
              "course.college",
              "course.college_id",
              "course.department.college",
              "course.department.college_id",
            ])
          : "";

        const hasFreshProfile = profileResponse.status === "fulfilled";
        const resolvedSchoolId = hasFreshProfile
          ? schoolIdFromProfile
          : localStorage.getItem("user_school_id") || "";
        const resolvedCollegeId = hasFreshProfile
          ? collegeIdFromProfile
          : localStorage.getItem("user_college_id") || "";
        if (resolvedSchoolId) {
          setTeacherSchoolId(resolvedSchoolId);
          localStorage.setItem("user_school_id", resolvedSchoolId);
        } else if (hasFreshProfile) {
          setTeacherSchoolId("");
          localStorage.removeItem("user_school_id");
        }
        if (resolvedCollegeId) {
          setTeacherCollegeId(resolvedCollegeId);
          localStorage.setItem("user_college_id", resolvedCollegeId);
        } else if (hasFreshProfile) {
          setTeacherCollegeId("");
          localStorage.removeItem("user_college_id");
        }

        const nextSubjects =
          subjectsResponse.status === "fulfilled" ? normalizeList(subjectsResponse.value.data) : [];

        const filteredSubjects = nextSubjects.filter((subject) => {
          const type = getSubjectType(subject);
          if (type === "school") return Boolean(resolvedSchoolId) || !resolvedCollegeId;
          if (type === "college") return Boolean(resolvedCollegeId) || !resolvedSchoolId;
          return true;
        });

        setSubjects(filteredSubjects);
        setSelectedSubject((current) => {
          if (current && filteredSubjects.some((subject) => getSubjectValue(subject) === String(current))) {
            return current;
          }
          return getSubjectValue(filteredSubjects[0]);
        });
      } catch (err) {
        console.error("Unable to load subjects", err);
        setSubjects([]);
        setSelectedSubject("");
        setSubjectsError("Unable to load subjects right now. Please refresh and try again.");
      }
    };

    fetchSubjects();
  }, []);

  const toggleDay = (v) => setSelectedDays(cur => cur.includes(v) ? cur.filter(x=>x!==v) : [...cur,v]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ success:"", error:"" });
    if (!selectedSubject) { setStatus({ error:"Please select a subject.", success:"" }); return; }
    if (!title.trim()) { setStatus({ error:"Please enter a class title.", success:"" }); return; }
    if ((startTime && !endTime) || (!startTime && endTime)) {
      setStatus({ error:"Please provide both a start time and end time.", success:"" });
      return;
    }

    const payload = {
      subject: selectedSubject,
      title: title.trim(),
    };

    const selectedSubjectData = subjects.find((subject) => getSubjectValue(subject) === String(selectedSubject));
    const selectedSubjectType = getSubjectType(selectedSubjectData);

    if (selectedSubjectType === "school") {
      // Backend can resolve school from the authenticated teacher profile.
      if (teacherSchoolId) {
        payload.school = Number(teacherSchoolId);
      } else {
        setStatus({ error:"Your teacher profile does not have a school assigned. Choose a college subject or contact admin.", success:"" });
        return;
      }
    }

    if (selectedSubjectType === "college") {
      if (teacherCollegeId) {
        payload.college = Number(teacherCollegeId);
      } else {
        setStatus({ error:"Your teacher profile does not have a college assigned. Choose a school subject or contact admin.", success:"" });
        return;
      }
    }

    if (description.trim()) payload.description = description.trim();
    if (grade.trim()) payload.grade = grade.trim();
    if (selectedDays.length) payload.class_days = selectedDays;
    if (startTime) payload.start_time = startTime;
    if (endTime) payload.end_time = endTime;
    if (meetingLink.trim()) payload.meeting_link = meetingLink.trim();

    const parsedMaxStudents = Number(maxStudents);
    if (Number.isFinite(parsedMaxStudents) && parsedMaxStudents > 0) {
      payload.max_students = parsedMaxStudents;
    }

    try {
      setSaving(true);
      const response = await API.post("tuition/", payload);
      saveCreatedTuitionDraft(payload, response.data);
      setStatus({ success:"Tuition class created successfully.", error:"" });
      setTitle(""); setDescription(""); setGrade(""); setSelectedDays([]);
      setStartTime(""); setEndTime(""); setMeetingLink(""); setMaxStudents(0);
      setSelectedSubject(getSubjectValue(subjects[0]));
      navigate("/teacher/tuition/classes", {
        state: {
          createdClassId: String(response.data?.id ?? response.data?.pk ?? response.data?.tuition_id ?? ""),
          createdClassTitle: payload.title,
        },
      });
    } catch (err) {
      setStatus({ success:"", error: formatApiError(err.response?.data) });
    } finally { setSaving(false); }
  };

  return (
    <TeacherLayout user={mockUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="tuition-layout">
        <aside>
          <div className="side-menu">
            <Link to="/teacher/home"    className="sm-item"><span className="sm-ic">🏠</span>Home Feed</Link>
            <Link to="/teacher/tuition" className="sm-item active"><span className="sm-ic">📚</span>Tuition</Link>
            <Link to="/teacher/tuition/classes" className="sm-item"><span className="sm-ic">🎓</span>View Classes</Link>
            <Link to="/teacher/tasks"   className="sm-item"><span className="sm-ic">📋</span>Tasks</Link>
            <a href="/logout"           className="sm-item"><span className="sm-ic">🚪</span>Logout</a>
          </div>
        </aside>
        <main>
          <div className="tuition-card">
            <div style={{fontSize:22,fontWeight:900,marginBottom:4,color:"var(--y)"}}>📚 Create Tuition Class</div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>Set up a subject class with a schedule and optional live class link</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
              <Link to="/teacher/tuition/classes" className="btn-outline-d btn-link-d">View Created Classes</Link>
            </div>
            {subjectsError && <div className="status-msg msg-error">{subjectsError}</div>}
            {status.error   && <div className="status-msg msg-error">{status.error}</div>}
            {status.success && <div className="status-msg msg-success">{status.success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="subject-choice">Choose Subject</label>
                <div className="subj-grid" id="subject-choice">
                  {subjects.map(subject => {
                    const value = getSubjectValue(subject);
                    const label = getSubjectLabel(subject);
                    return (
                    <label key={value} className={`subj-opt ${selectedSubject===value?"selected":""}`} htmlFor={`subject-radio-${value}`}>
                      <input id={`subject-radio-${value}`} type="radio" name="subject" value={value} checked={selectedSubject===value} onChange={()=>setSelectedSubject(value)}/>
                      <div className="subj-icon">{getSubjectIcon(label)}</div>
                      <div className="subj-label">{label}</div>
                    </label>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="class-title">Class Title</label>
                <input id="class-title" name="title" className="form-input" value={title} onChange={e=>setTitle(e.target.value)} required placeholder="e.g. Class 10 Mathematics — Algebra Batch"/>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="class-description">Description</label>
                <textarea id="class-description" name="description" className="form-textarea" rows="3" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What will students learn?"/>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="class-grade">Grade / Class Level</label>
                <input id="class-grade" name="grade" className="form-input" value={grade} onChange={e=>setGrade(e.target.value)} placeholder="e.g. Grade 10, Class 11"/>
              </div>
              <div className="section-divider">📅 Class Schedule</div>
              <div className="form-group">
                <label className="form-label" htmlFor="class-days">Class Days</label>
                <div className="day-grid" id="class-days">
                  {dayChoices.map(d => (
                    <label key={d.value} className="day-opt" htmlFor={`day-checkbox-${d.value}`}>
                      <input id={`day-checkbox-${d.value}`} type="checkbox" name="days" value={d.value} checked={selectedDays.includes(d.value)} onChange={()=>toggleDay(d.value)}/>
                      <div className="day-btn">{d.label}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="time-row form-group">
                <div>
                  <label className="form-label" htmlFor="start-time">Start Time</label>
                  <input id="start-time" name="startTime" className="form-input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/>
                </div>
                <div>
                  <label className="form-label" htmlFor="end-time">End Time</label>
                  <input id="end-time" name="endTime" className="form-input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="meet-link">Google Meet Link <span style={{fontWeight:400,color:"var(--muted)"}}>(optional)</span></label>
                <input id="meet-link" name="meetingLink" className="form-input" type="url" value={meetingLink} onChange={e=>setMeetingLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij"/>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="max-students">Max Students <span style={{fontWeight:400,color:"var(--muted)"}}>(0 = unlimited)</span></label>
                <input id="max-students" name="maxStudents" className="form-input" type="number" value={maxStudents} min="0" onChange={e=>setMaxStudents(e.target.value)} style={{maxWidth:140}}/>
              </div>
              <div style={{display:"flex",gap:12,marginTop:8}}>
                <button type="submit" className="btn-primary" style={{flex:2}} disabled={saving || !subjects.length || !!subjectsError}>{saving?"Saving…":"Create Class →"}</button>
                <Link to="/teacher/home" style={{flex:1,textDecoration:"none"}}>
                  <button type="button" className="btn-outline-d" style={{width:"100%"}}>Cancel</button>
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </TeacherLayout>
  );
}
