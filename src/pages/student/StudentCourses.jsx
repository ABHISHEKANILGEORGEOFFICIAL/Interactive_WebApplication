import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";
import SaveCourseModal from "../../components/student/SaveCourseModal";

const pageUser = {
  firstName: "Student",
  username: "student",
  fullName: "Student",
  role: "Student",
  avatarDisplay: "S",
  avatarUrl: null,
  posts: 0,
  followers: 0,
  following: 0,
};

export default function StudentCourses() {
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const getThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return null;

    if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
      return thumbnail;
    }

    return `http://127.0.0.1:8000${thumbnail}`;
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await API.get("teacher/courses/");

      const activeCourses = Array.isArray(res.data)
        ? res.data.filter((course) => course.is_active === true)
        : [];

      setCourses(activeCourses);
    } catch (err) {
      console.error("Courses load error:", err?.response?.data || err);
      alert("Could not load courses.");
    } finally {
      setLoading(false);
    }
  };

  const openSaveModal = (course) => {
    setSelectedCourse(course);
    setSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setSaveModalOpen(false);
    setSelectedCourse(null);
  };
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const title = course.title?.toLowerCase() || "";
      const description = course.description?.toLowerCase() || "";
      const query = search.toLowerCase();

      const matchesSearch =
        title.includes(query) || description.includes(query);

      const matchesLevel =
        levelFilter === "all" || course.level === levelFilter;

      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && !course.is_paid) ||
        (priceFilter === "paid" && course.is_paid);

      return matchesSearch && matchesLevel && matchesPrice;
    });
  }, [courses, search, levelFilter, priceFilter]);

  if (loading) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={center}>Loading your learning catalog...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div style={page}>
        <div style={container}>
          <section style={hero}>
            <div>
              <span style={heroBadge}>Student Learning Hub</span>
              <h1 style={title}>Explore Courses</h1>
              <p style={sub}>
                Discover recorded lessons, notes, assignments, and structured
                sections created by your teachers.
              </p>

              <div style={heroStats}>
                <div style={statCard}>
                  <strong>{courses.length}</strong>
                  <span>Available Courses</span>
                </div>
                <div style={statCard}>
                  <strong>{courses.filter((c) => !c.is_paid).length}</strong>
                  <span>Free Courses</span>
                </div>
                <div style={statCard}>
                  <strong>{courses.filter((c) => c.is_paid).length}</strong>
                  <span>Paid Courses</span>
                </div>
              </div>
            </div>

            <div style={heroPanel}>
              <div style={heroPanelIcon}>🎓</div>
              <h3 style={heroPanelTitle}>Start learning today</h3>
              <p style={heroPanelText}>
                Choose a course, view the syllabus, and continue at your own
                pace.
              </p>
            </div>
          </section>

          <section style={toolbar}>
            <input
              style={searchInput}
              placeholder="Search courses by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={filterSelect}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              style={filterSelect}
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="all">All Pricing</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </section>

          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Recommended Courses</h2>
              <p style={sectionSub}>
                Showing {filteredCourses.length} course
                {filteredCourses.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div style={emptyBox}>
              <h2 style={emptyTitle}>No Courses Found</h2>
              <p style={emptyText}>
                Try changing your search or filter options.
              </p>
            </div>
          ) : (
            <div style={grid}>
              {filteredCourses.map((course) => {
                const thumbnailUrl = getThumbnailUrl(course.thumbnail);

                return (
                  <article key={course.id} style={card}>
                    <div style={thumbWrap}>
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={course.title}
                          style={thumb}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div style={noThumb}>Saha Course</div>
                      )}

                      <div style={pricePill}>
                        {course.is_paid ? `₹${course.price || 0}` : "Free"}
                      </div>
                    </div>

                    <div style={body}>
                      <div style={cardTop}>
                        <span style={badge}>{course.level || "beginner"}</span>
                        <span style={duration}>
                          {course.duration_hours || 0} hrs
                        </span>
                      </div>

                      <h2 style={courseTitle}>{course.title}</h2>

                      <p style={desc}>
                        {course.description
                          ? course.description.slice(0, 130)
                          : "No description available."}
                        {course.description?.length > 130 ? "..." : ""}
                      </p>

                      <div style={features}>
                        <span>▶ Recorded videos</span>
                        <span>📝 Notes</span>
                        <span>📚 Assignments</span>
                      </div>

                      <div style={actionRow}>
                        <button
                          style={saveBtn}
                          onClick={() => openSaveModal(course)}
                        >
                          Save
                        </button>

                        <button
                          style={viewBtn}
                          onClick={() => navigate(`/student/courses/${course.id}`)}
                        >
                          View Course
                        </button>
                      </div>
                      <SaveCourseModal
                        open={saveModalOpen}
                        course={selectedCourse}
                        onClose={closeSaveModal}
                        onSaved={() => { }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout >
  );
}

const page = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f7f6f2 0%, #fffaf0 45%, #f7f6f2 100%)",
};

const container = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "120px 30px 60px",
};

const center = {
  padding: "160px 30px",
  textAlign: "center",
  fontWeight: 900,
  color: "#1a1a1a",
};

const hero = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  gap: 22,
  alignItems: "stretch",
  background: "linear-gradient(135deg, #102419, #1f3b2b)",
  borderRadius: 28,
  padding: 30,
  color: "#fff",
  boxShadow: "0 18px 40px rgba(0,0,0,0.16)",
  marginBottom: 24,
};

const heroBadge = {
  display: "inline-block",
  background: "rgba(245,197,24,0.16)",
  border: "1px solid rgba(245,197,24,0.4)",
  color: "#F5C518",
  padding: "8px 13px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 900,
};

const title = {
  margin: "16px 0 8px",
  fontSize: 42,
  lineHeight: 1.1,
  fontWeight: 950,
  color: "#fff",
};

const sub = {
  color: "rgba(255,255,255,0.78)",
  margin: 0,
  fontSize: 15,
  lineHeight: 1.7,
  maxWidth: 680,
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginTop: 24,
};

const statCard = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const heroPanel = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 24,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const heroPanelIcon = {
  fontSize: 42,
  marginBottom: 14,
};

const heroPanelTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 21,
  fontWeight: 900,
};

const heroPanelText = {
  color: "rgba(255,255,255,0.74)",
  lineHeight: 1.6,
};

const toolbar = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 22,
  padding: 16,
  display: "grid",
  gridTemplateColumns: "1fr 180px 180px",
  gap: 12,
  boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
  marginBottom: 24,
};

const searchInput = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 15,
  padding: "14px 15px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const filterSelect = {
  border: "1px solid #ddd",
  borderRadius: 15,
  padding: "14px 15px",
  fontSize: 14,
  background: "#fff",
  fontWeight: 800,
  outline: "none",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: 16,
};

const sectionTitle = {
  margin: 0,
  fontSize: 25,
  fontWeight: 950,
  color: "#1a1a1a",
};

const sectionSub = {
  margin: "6px 0 0",
  color: "#777",
  fontSize: 14,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
  gap: 24,
};

const card = {
  background: "#fff",
  borderRadius: 24,
  overflow: "hidden",
  border: "1px solid #ece7d8",
  boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
};

const thumbWrap = {
  position: "relative",
  width: "100%",
  height: 190,
  background: "#13251b",
};

const thumb = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const noThumb = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#F5C518",
  fontWeight: 900,
  fontSize: 24,
};

const pricePill = {
  position: "absolute",
  top: 14,
  right: 14,
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
};

const body = {
  padding: 20,
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const badge = {
  display: "inline-block",
  background: "#fff3bc",
  color: "#7a5a00",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
  textTransform: "capitalize",
};

const duration = {
  color: "#555",
  fontSize: 12,
  fontWeight: 900,
};

const courseTitle = {
  margin: "14px 0 8px",
  fontSize: 21,
  fontWeight: 950,
  color: "#1a1a1a",
};

const desc = {
  color: "#666",
  fontSize: 14,
  lineHeight: 1.6,
  minHeight: 72,
};

const features = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 14,
  marginBottom: 18,
  color: "#3c3c3c",
  fontSize: 12,
  fontWeight: 800,
};
const actionRow = {
  display: "grid",
  gridTemplateColumns: "110px 1fr",
  gap: 10,
};

const saveBtn = {
  width: "100%",
  background: "#fff",
  color: "#102419",
  border: "1px solid #102419",
  padding: "14px 18px",
  borderRadius: "999px",
  fontWeight: 950,
  cursor: "pointer",
};
const viewBtn = {
  width: "100%",
  background: "#102419",
  color: "#fff",
  border: "none",
  padding: "14px 18px",
  borderRadius: "999px",
  fontWeight: 950,
  cursor: "pointer",
};

const emptyBox = {
  background: "#fff",
  borderRadius: 24,
  padding: 44,
  textAlign: "center",
  border: "1px solid #eee",
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
};

const emptyTitle = {
  margin: 0,
  color: "#1a1a1a",
  fontWeight: 950,
};

const emptyText = {
  color: "#777",
};
