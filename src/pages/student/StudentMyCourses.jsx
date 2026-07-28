import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";

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

export default function StudentMyCourses() {
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const getThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return null;
    if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
      return thumbnail;
    }
    return `http://127.0.0.1:8000${thumbnail}`;
  };

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      const [enrollRes, courseRes, videoRes] = await Promise.all([
        API.get("teacher/enrollments/"),
        API.get("teacher/courses/"),
        API.get("teacher/videos/"),
      ]);

      const enrollments = Array.isArray(enrollRes.data) ? enrollRes.data : [];
      const courses = Array.isArray(courseRes.data) ? courseRes.data : [];
      const videos = Array.isArray(videoRes.data) ? videoRes.data : [];

      const enrolledCourses = enrollments
        .map((enrollment) => {
          const course = courses.find(
            (c) => String(c.id) === String(enrollment.course)
          );

          if (!course) return null;

          const savedCompleted = localStorage.getItem(
            `completed_videos_${course.id}`
          );

          let localProgress = 0;

          if (savedCompleted) {
            try {
              const completed = JSON.parse(savedCompleted);

              const courseVideos = videos.filter(
                (v) => String(v.course) === String(course.id)
              );

              localProgress =
                courseVideos.length === 0
                  ? 0
                  : Math.round((completed.length / courseVideos.length) * 100);
            } catch {
              localProgress = 0;
            }
          }

          const finalProgress = Math.max(
            Number(enrollment.progress_percent || 0),
            localProgress
          );

          return {
            ...course,
            enrollment_id: enrollment.id,
            progress_percent: finalProgress,
            enrolled_at: enrollment.enrolled_at,
          };
        })
        .filter(Boolean);

      setMyCourses(enrolledCourses);
    } catch (err) {
      console.error("My courses load error:", err?.response?.data || err);
      alert("Could not load your enrolled courses.");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = useMemo(() => {
    return myCourses.filter((c) => Number(c.progress_percent || 0) >= 100)
      .length;
  }, [myCourses]);

  if (loading) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={center}>Loading your courses...</div>
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
              <span style={heroBadge}>My Learning Hub</span>

              <h1 style={title}>My Courses</h1>

              <p style={sub}>
                Continue your enrolled courses, track your progress, and complete
                your learning journey.
              </p>

              <div style={heroStats}>
                <div style={statCard}>
                  <strong style={statNumber}>{myCourses.length}</strong>
                  <span style={statLabel}>Enrolled Courses</span>
                </div>

                <div style={statCard}>
                  <strong style={statNumber}>{completedCount}</strong>
                  <span style={statLabel}>Completed</span>
                </div>

                <div style={statCard}>
                  <strong style={statNumber}>
                    {myCourses.length - completedCount}
                  </strong>
                  <span style={statLabel}>In Progress</span>
                </div>
              </div>
            </div>

            <div style={heroPanel}>
              <div style={heroPanelIcon}>📚</div>
              <h3 style={heroPanelTitle}>Continue learning</h3>
              <p style={heroPanelText}>
                Pick up from where you stopped and keep moving forward.
              </p>
            </div>
          </section>

          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Enrolled Courses</h2>
              <p style={sectionSub}>
                Showing {myCourses.length} course
                {myCourses.length === 1 ? "" : "s"}
              </p>
            </div>

            <div style={headerActions}>
              <button
                style={collectionsBtn}
                onClick={() => navigate("/student/collections")}
              >
                My Collections
              </button>

              <button
                style={exploreBtn}
                onClick={() => navigate("/student/courses")}
              >
                Explore Courses
              </button>
            </div>
          </div>

          {myCourses.length === 0 ? (
            <div style={emptyBox}>
              <h2 style={emptyTitle}>No Enrolled Courses</h2>
              <p style={emptyText}>
                You have not enrolled in any course yet. Explore courses and
                start learning.
              </p>

              <button
                style={viewBtn}
                onClick={() => navigate("/student/courses")}
              >
                Explore Courses
              </button>
            </div>
          ) : (
            <div style={grid}>
              {myCourses.map((course) => {
                const thumbnailUrl = getThumbnailUrl(course.thumbnail);
                const progress = Number(course.progress_percent || 0);

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
                        {progress >= 100 ? "Completed" : `${progress}%`}
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

                      <div style={progressBox}>
                        <div style={progressTop}>
                          <span>Progress</span>
                          <strong>{progress}%</strong>
                        </div>

                        <div style={progressBar}>
                          <div
                            style={{
                              ...progressFill,
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <button
                        style={viewBtn}
                        onClick={() =>
                          navigate(`/student/courses/${course.id}/learn`)
                        }
                      >
                        {progress >= 100
                          ? "Review Course"
                          : "Continue Learning"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
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
  maxWidth: 720,
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
  marginTop: 26,
};

const statCard = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 18,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const statNumber = {
  fontSize: 22,
  fontWeight: 950,
  lineHeight: 1,
};

const statLabel = {
  fontSize: 14,
  fontWeight: 800,
  color: "rgba(255,255,255,0.85)",
};

const heroPanel = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 24,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const heroPanelIcon = {
  fontSize: 36,
  marginBottom: 14,
};

const heroPanelTitle = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
};

const heroPanelText = {
  color: "rgba(255,255,255,0.78)",
  fontSize: 16,
  lineHeight: 1.6,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  margin: "34px 0 18px",
};

const sectionTitle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 950,
  color: "#1f1f1f",
};

const sectionSub = {
  margin: "6px 0 0",
  color: "#777",
  fontWeight: 700,
};

const exploreBtn = {
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "13px 18px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
};
const headerActions = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const collectionsBtn = {
  border: "1px solid #102419",
  background: "#fff",
  color: "#102419",
  padding: "13px 18px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: 24,
};

const card = {
  background: "#fff",
  borderRadius: 28,
  overflow: "hidden",
  boxShadow: "0 18px 35px rgba(0,0,0,0.1)",
  border: "1px solid rgba(0,0,0,0.06)",
};

const thumbWrap = {
  height: 210,
  position: "relative",
  overflow: "hidden",
  background: "#102419",
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
  fontWeight: 950,
  fontSize: 24,
};

const pricePill = {
  position: "absolute",
  top: 16,
  right: 16,
  background: "#F5C518",
  color: "#111",
  padding: "10px 15px",
  borderRadius: 999,
  fontWeight: 950,
};

const body = {
  padding: 22,
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const badge = {
  background: "#ecfdf5",
  color: "#047857",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  textTransform: "capitalize",
};

const duration = {
  color: "#777",
  fontWeight: 800,
  fontSize: 13,
};

const courseTitle = {
  margin: "0 0 10px",
  color: "#1f1f1f",
  fontSize: 22,
  fontWeight: 950,
};

const desc = {
  color: "#666",
  lineHeight: 1.6,
  fontSize: 14,
  minHeight: 65,
};

const progressBox = {
  margin: "18px 0",
};

const progressTop = {
  display: "flex",
  justifyContent: "space-between",
  color: "#333",
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 8,
};

const progressBar = {
  height: 10,
  background: "#eee7d3",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFill = {
  height: "100%",
  background: "linear-gradient(90deg, #F5C518, #10b981)",
  borderRadius: 999,
};

const viewBtn = {
  width: "100%",
  border: "none",
  background: "#F5C518",
  color: "#111",
  padding: "14px 16px",
  borderRadius: 16,
  fontWeight: 950,
  cursor: "pointer",
};

const emptyBox = {
  background: "#fff",
  borderRadius: 28,
  padding: 40,
  textAlign: "center",
  boxShadow: "0 18px 35px rgba(0,0,0,0.08)",
};

const emptyTitle = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
};

const emptyText = {
  color: "#777",
  margin: "10px 0 22px",
};