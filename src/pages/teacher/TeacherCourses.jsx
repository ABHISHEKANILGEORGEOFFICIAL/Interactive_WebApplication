import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";

const pageUser = {
  firstName: "Teacher",
  username: "teacher",
  fullName: "Your Name",
  role: "Teacher",
  avatarDisplay: "T",
  avatarUrl: null,
  posts: 0,
  followers: 0,
  following: 0,
};

const COURSE_LIST_STYLES = `
  .course-list-layout {
    display:grid;
    grid-template-columns:220px 1fr;
    gap:22px;
    max-width:1180px;
    margin:0 auto;
    padding:108px 28px 60px;
  }

  .course-list-card {
    background:rgba(10,28,16,0.92);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:24px;
    padding:32px;
    backdrop-filter:blur(12px);
    color:#e8f0e2;
  }

  .course-list-header {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:16px;
    flex-wrap:wrap;
    margin-bottom:22px;
  }

  .course-list-title {
    font-size:26px;
    font-weight:900;
    color:#F5C518;
    margin:0 0 6px;
  }

  .course-list-sub {
    font-size:13px;
    color:rgba(180,230,180,0.65);
    margin:0;
    line-height:1.6;
  }

  .course-btn-primary {
    background:#F5C518;
    color:#1a3010;
    border:none;
    border-radius:14px;
    padding:13px 20px;
    font-weight:900;
    font-size:14px;
    cursor:pointer;
    font-family:inherit;
    transition:opacity .15s, transform .15s;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
  }

  .course-btn-primary:hover {
    opacity:0.9;
    transform:translateY(-1px);
  }

  .course-btn-outline {
    background:transparent;
    color:rgba(180,230,180,0.75);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:14px;
    padding:11px 16px;
    font-weight:800;
    font-size:13px;
    cursor:pointer;
    font-family:inherit;
    transition:background .12s, color .12s;
  }

  .course-btn-outline:hover {
    background:rgba(245,197,24,0.08);
    color:#F5C518;
  }

  .course-btn-danger {
    background:rgba(220,38,38,0.13);
    color:#fca5a5;
    border:1px solid rgba(220,38,38,0.28);
    border-radius:14px;
    padding:11px 16px;
    font-weight:800;
    font-size:13px;
    cursor:pointer;
    font-family:inherit;
    transition:background .12s, transform .12s;
  }

  .course-btn-danger:hover {
    background:rgba(220,38,38,0.22);
    transform:translateY(-1px);
  }

  .course-filter-card {
    background:rgba(245,197,24,0.05);
    border:1px solid rgba(120,200,145,0.18);
    border-radius:18px;
    padding:16px;
    margin-bottom:22px;
    display:grid;
    grid-template-columns:1fr 180px;
    gap:12px;
  }

  .course-input,
  .course-select {
    width:100%;
    border:1px solid rgba(120,200,145,0.22);
    border-radius:14px;
    padding:13px 15px;
    font-size:14px;
    background:#fff;
    color:#1a1a1a;
    font-family:inherit;
    outline:none;
    box-sizing:border-box;
  }

  .course-input:focus,
  .course-select:focus {
    border-color:rgba(245,197,24,0.7);
    box-shadow:0 0 0 3px rgba(245,197,24,0.08);
  }

  .course-stats {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:12px;
    margin-bottom:22px;
  }

  .course-stat-box {
    background:rgba(245,197,24,0.06);
    border:1px solid rgba(120,200,145,0.18);
    border-radius:16px;
    padding:14px;
  }

  .course-stat-number {
    font-size:22px;
    font-weight:900;
    color:#F5C518;
    margin-bottom:4px;
  }

  .course-stat-label {
    font-size:11px;
    font-weight:800;
    color:rgba(180,230,180,0.55);
    text-transform:uppercase;
    letter-spacing:1px;
  }

  .course-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(270px, 1fr));
    gap:18px;
  }

  .course-item {
    background:rgba(245,197,24,0.05);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:20px;
    overflow:hidden;
    transition:transform .15s, border-color .15s, background .15s;
  }

  .course-item:hover {
    transform:translateY(-3px);
    border-color:rgba(245,197,24,0.48);
    background:rgba(245,197,24,0.08);
  }

  .course-img-wrap {
    height:155px;
    background:rgba(245,197,24,0.08);
    position:relative;
    overflow:hidden;
  }

  .course-img {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }

  .course-status-chip {
    position:absolute;
    top:12px;
    right:12px;
    border-radius:999px;
    padding:6px 10px;
    font-size:10px;
    font-weight:900;
    letter-spacing:.5px;
    text-transform:uppercase;
    border:1px solid rgba(255,255,255,0.28);
    backdrop-filter:blur(8px);
  }

  .course-status-active {
    background:rgba(16,185,129,0.86);
    color:#052e24;
  }

  .course-status-inactive {
    background:rgba(220,38,38,0.86);
    color:#fff;
  }

  .course-body {
    padding:16px;
  }

  .course-card-title {
    font-size:16px;
    font-weight:900;
    color:#e8f0e2;
    margin:0 0 7px;
    line-height:1.35;
  }

  .course-desc {
    font-size:13px;
    color:rgba(180,230,180,0.62);
    margin:0 0 13px;
    line-height:1.55;
    min-height:40px;
  }

  .course-badge-row {
    display:flex;
    gap:7px;
    flex-wrap:wrap;
    margin-bottom:14px;
  }

  .course-badge {
    background:rgba(245,197,24,0.14);
    color:#F5C518;
    border:1px solid rgba(245,197,24,0.26);
    padding:5px 9px;
    border-radius:999px;
    font-size:11px;
    font-weight:900;
  }

  .course-action-row {
    display:grid;
    grid-template-columns:1fr 1fr 1fr;
    gap:8px;
  }

  .course-mini-primary {
    background:#F5C518;
    color:#1a3010;
    border:none;
    border-radius:12px;
    padding:10px 8px;
    font-weight:900;
    font-size:12px;
    cursor:pointer;
  }

  .course-mini-outline {
    background:transparent;
    color:rgba(180,230,180,0.8);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:12px;
    padding:10px 8px;
    font-weight:900;
    font-size:12px;
    cursor:pointer;
  }

  .course-mini-danger {
    background:rgba(220,38,38,0.13);
    color:#fca5a5;
    border:1px solid rgba(220,38,38,0.28);
    border-radius:12px;
    padding:10px 8px;
    font-weight:900;
    font-size:12px;
    cursor:pointer;
  }

  .course-empty {
    border:1px dashed rgba(120,200,145,0.28);
    border-radius:20px;
    padding:42px 24px;
    color:rgba(180,230,180,0.65);
    text-align:center;
    background:rgba(245,197,24,0.03);
  }

  .course-empty-title {
    color:#F5C518;
    font-size:22px;
    font-weight:900;
    margin:0 0 8px;
  }

  .course-empty-text {
    font-size:14px;
    margin:0 0 18px;
    line-height:1.6;
  }

  .course-loading {
    border:1px solid rgba(120,200,145,0.18);
    border-radius:18px;
    padding:32px;
    text-align:center;
    color:#F5C518;
    background:rgba(245,197,24,0.04);
    font-weight:900;
  }

  @media(max-width:900px) {
    .course-list-layout {
      grid-template-columns:1fr;
      padding:100px 16px 40px;
    }

    .course-stats {
      grid-template-columns:repeat(2,1fr);
    }
  }

  @media(max-width:620px) {
    .course-list-card {
      padding:22px;
    }

    .course-filter-card {
      grid-template-columns:1fr;
    }

    .course-stats {
      grid-template-columns:1fr;
    }

    .course-action-row {
      grid-template-columns:1fr;
    }
  }
`;

export default function TeacherCourses() {
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const styleId = "saha-teacher-course-list-styles";

    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = COURSE_LIST_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const close = () => setDdOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const fixImageUrl = (url) => {
    if (!url) return "https://picsum.photos/seed/course/400/200";
    if (url.startsWith("http")) return url;

    return `http://127.0.0.1:8000${url.startsWith("/") ? url : `/${url}`}`;
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const [courseRes, sectionRes] = await Promise.all([
        API.get("teacher/courses/"),
        API.get("teacher/sections/"),
      ]);

      setCourses(Array.isArray(courseRes.data) ? courseRes.data : []);
      setSections(Array.isArray(sectionRes.data) ? sectionRes.data : []);
    } catch (err) {
      console.error("Error loading courses:", err?.response?.data || err);
      alert("Courses could not be loaded. Check backend URL or token.");
    } finally {
      setLoading(false);
    }
  };

  const getSectionCount = (courseId) => {
    return sections.filter((s) => String(s.course) === String(courseId)).length;
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const title = c.title || "";
      const matchesSearch = title.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ? true : filter === "paid" ? c.is_paid : !c.is_paid;

      return matchesSearch && matchesFilter;
    });
  }, [courses, search, filter]);

  const stats = useMemo(() => {
    return {
      total: courses.length,
      active: courses.filter((course) => course.is_active).length,
      draft: courses.filter((course) => !course.is_active).length,
      paid: courses.filter((course) => course.is_paid).length,
    };
  }, [courses]);

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await API.delete(`teacher/courses/${id}/`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err?.response?.data || err);
      alert("Delete failed");
    }
  };

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="course-list-layout">
        <aside>
          <div className="side-menu">
            <Link to="/teacher/home" className="sm-item">
              <span className="sm-ic">🏠</span>Home Feed
            </Link>

            <Link to="/teacher/courses" className="sm-item active">
              <span className="sm-ic">🎓</span>My Courses
            </Link>

            <Link to="/teacher/courses/create" className="sm-item">
              <span className="sm-ic">📚</span>Create Course
            </Link>

            <Link to="/teacher/tuition" className="sm-item">
              <span className="sm-ic">📚</span>Tuition
            </Link>

            <Link to="/teacher/tasks" className="sm-item">
              <span className="sm-ic">📋</span>Tasks
            </Link>

            <a href="/logout" className="sm-item">
              <span className="sm-ic">🚪</span>Logout
            </a>
          </div>
        </aside>

        <main>
          <div className="course-list-card">
            <div className="course-list-header">
              <div>
                <h1 className="course-list-title">🎓 My Courses</h1>
                <p className="course-list-sub">
                  Manage your recorded courses, drafts, lessons, notes, and assignments in one place.
                </p>
              </div>

              <button
                className="course-btn-primary"
                onClick={() => navigate("/teacher/courses/create")}
              >
                + Create Course
              </button>
            </div>

            <div className="course-stats">
              <div className="course-stat-box">
                <div className="course-stat-number">{stats.total}</div>
                <div className="course-stat-label">Total Courses</div>
              </div>

              <div className="course-stat-box">
                <div className="course-stat-number">{stats.active}</div>
                <div className="course-stat-label">Active</div>
              </div>

              <div className="course-stat-box">
                <div className="course-stat-number">{stats.draft}</div>
                <div className="course-stat-label">Draft / Inactive</div>
              </div>

              <div className="course-stat-box">
                <div className="course-stat-number">{stats.paid}</div>
                <div className="course-stat-label">Paid Courses</div>
              </div>
            </div>

            <div className="course-filter-card">
              <input
                className="course-input"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="course-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Courses</option>
                <option value="free">Free Courses</option>
                <option value="paid">Paid Courses</option>
              </select>
            </div>

            {loading ? (
              <div className="course-loading">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="course-empty">
                <h3 className="course-empty-title">No Courses Found</h3>
                <p className="course-empty-text">
                  No courses match your current search or filter.
                </p>

                <button className="course-btn-primary" onClick={loadData}>
                  Refresh
                </button>
              </div>
            ) : (
              <div className="course-grid">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="course-item">
                    <div className="course-img-wrap">
                      <img
                        src={fixImageUrl(course.thumbnail)}
                        alt={course.title}
                        className="course-img"
                      />

                      <span
                        className={`course-status-chip ${
                          course.is_active
                            ? "course-status-active"
                            : "course-status-inactive"
                        }`}
                      >
                        {course.is_active ? "Active" : "Draft"}
                      </span>
                    </div>

                    <div className="course-body">
                      <h3 className="course-card-title">{course.title}</h3>

                      <p className="course-desc">
                        {course.description?.slice(0, 90) || "No description"}
                        {course.description?.length > 90 ? "..." : ""}
                      </p>

                      <div className="course-badge-row">
                        <span className="course-badge">
                          {course.level || "beginner"}
                        </span>

                        <span className="course-badge">
                          {course.is_paid ? `₹${course.price}` : "Free"}
                        </span>

                        <span className="course-badge">
                          {getSectionCount(course.id)} Sections
                        </span>
                      </div>

                      <div className="course-action-row">
                        <button
                          className="course-mini-primary"
                          onClick={() => navigate(`/teacher/courses/${course.id}`)}
                        >
                          View
                        </button>

                        <button
                          className="course-mini-outline"
                          onClick={() =>
                            navigate(`/teacher/courses/${course.id}/edit`)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="course-mini-danger"
                          onClick={() => deleteCourse(course.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </TeacherLayout>
  );
}