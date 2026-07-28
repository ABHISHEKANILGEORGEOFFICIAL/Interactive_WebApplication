import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";
import CourseReviews from "../../components/student/CourseReviews";
import CourseQnA from "../../components/student/CourseQnA";

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

export default function StudentCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [activeVideo, setActiveVideo] = useState(null);

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const [courseRes, sectionRes, videoRes, noteRes, assignmentRes] =
        await Promise.all([
          API.get(`teacher/courses/${id}/`),
          API.get("teacher/sections/"),
          API.get("teacher/videos/"),
          API.get("teacher/notes/"),
          API.get("teacher/assignments/"),
        ]);

      const courseData = courseRes.data;

      const courseSections = Array.isArray(sectionRes.data)
        ? sectionRes.data
          .filter((s) => String(s.course) === String(id))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];

      const courseVideos = Array.isArray(videoRes.data)
        ? videoRes.data
          .filter((v) => String(v.course) === String(id))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];

      const courseNotes = Array.isArray(noteRes.data)
        ? noteRes.data.filter((n) => String(n.course) === String(id))
        : [];

      const courseAssignments = Array.isArray(assignmentRes.data)
        ? assignmentRes.data.filter((a) => String(a.course) === String(id))
        : [];

      setCourse(courseData);
      setSections(courseSections);
      setVideos(courseVideos);
      setNotes(courseNotes);
      setAssignments(courseAssignments);

      if (courseVideos.length > 0) {
        setActiveVideo(courseVideos[0]);
      }
    } catch (err) {
      console.error("Course detail load error:", err?.response?.data || err);
      alert("Could not load course detail.");
    } finally {
      setLoading(false);
    }
  };

  const totalLessons = videos.length;
  const totalNotes = notes.length;
  const totalAssignments = assignments.length;

  const thumbnailUrl = useMemo(() => {
    return getMediaUrl(course?.thumbnail);
  }, [course]);

  if (loading) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={center}>Loading course...</div>
        </div>
      </StudentLayout>
    );
  }

  if (!course) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={center}>Course not found.</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div style={page}>
        <div style={container}>
          <button style={backBtn} onClick={() => navigate("/student/courses")}>
            ← Back to Courses
          </button>

          <section style={hero}>
            <div style={heroLeft}>
              <span style={badge}>{course.level || "beginner"}</span>

              <h1 style={title}>{course.title}</h1>

              <p style={sub}>
                {course.description || "No description available."}
              </p>

              <div style={statsGrid}>
                <div style={statCard}>
                  <strong>{totalLessons}</strong>
                  <span>Lessons</span>
                </div>
                <div style={statCard}>
                  <strong>{totalNotes}</strong>
                  <span>Notes</span>
                </div>
                <div style={statCard}>
                  <strong>{totalAssignments}</strong>
                  <span>Assignments</span>
                </div>
                <div style={statCard}>
                  <strong>{course.duration_hours || 0}</strong>
                  <span>Hours</span>
                </div>
              </div>
            </div>

            <div style={heroImageWrap}>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={course.title} style={heroImage} />
              ) : (
                <div style={noImage}>Saha Course</div>
              )}

              <div style={pricePill}>
                {course.is_paid ? `₹${course.price || 0}` : "Free"}
              </div>
            </div>
          </section>

          <section style={mainGrid}>
            <div style={playerCard}>
              <h2 style={sectionTitle}>Now Learning</h2>

              {activeVideo ? (
                <>
                  <div style={videoBox}>
                    {activeVideo.media_file ? (
                      <video
                        src={getMediaUrl(activeVideo.media_file)}
                        controls
                        style={videoPlayer}
                      />
                    ) : activeVideo.video_url ? (
                      <div style={urlBox}>
                        <p style={urlText}>This lesson uses an external video URL.</p>
                        <a
                          href={activeVideo.video_url}
                          target="_blank"
                          rel="noreferrer"
                          style={openVideoBtn}
                        >
                          Open Video
                        </a>
                      </div>
                    ) : (
                      <div style={urlBox}>No video source available.</div>
                    )}
                  </div>

                  <h3 style={activeVideoTitle}>{activeVideo.title}</h3>
                  <p style={videoDesc}>
                    {activeVideo.description || "No lesson description."}
                  </p>
                </>
              ) : (
                <div style={emptyBox}>
                  <h3 style={emptyTitle}>No videos yet</h3>
                  <p style={emptyText}>This course has no uploaded lessons.</p>
                </div>
              )}
            </div>

            <aside style={sidebar}>
              <h2 style={sectionTitle}>Course Overview</h2>

              <div style={overviewItem}>
                <span>Pricing</span>
                <strong>{course.is_paid ? `₹${course.price || 0}` : "Free"}</strong>
              </div>

              <div style={overviewItem}>
                <span>Level</span>
                <strong>{course.level || "Beginner"}</strong>
              </div>

              <div style={overviewItem}>
                <span>Status</span>
                <strong>{course.is_active ? "Active" : "Inactive"}</strong>
              </div>

              <button
                style={enrollBtn}
                onClick={() => {
                  if (course.is_paid) {
                    navigate(`/student/courses/${id}/payment`);
                  } else {
                    navigate(`/student/courses/${id}`);
                  }
                }}
              >
                {course.is_paid ? "Enroll & Pay" : "Start Learning"}
              </button>
            </aside>
          </section>

          <section style={contentCard}>
            <div style={sectionHeader}>
              <div>
                <h2 style={sectionTitle}>Course Curriculum</h2>
                <p style={smallText}>
                  Watch lessons and access notes and assignments section by section.
                </p>
              </div>
            </div>

            {sections.length === 0 ? (
              <div style={emptyBox}>
                <h3 style={emptyTitle}>No sections added</h3>
                <p style={emptyText}>Course content will appear here.</p>
              </div>
            ) : (
              <div style={sectionList}>
                {sections.map((section, index) => {
                  const sectionVideos = videos.filter(
                    (v) => String(v.section) === String(section.id)
                  );
                  const sectionNotes = notes.filter(
                    (n) => String(n.section) === String(section.id)
                  );
                  const sectionAssignments = assignments.filter(
                    (a) => String(a.section) === String(section.id)
                  );

                  return (
                    <div key={section.id} style={curriculumSection}>
                      <div style={curriculumTop}>
                        <div>
                          <span style={sectionBadge}>Section {index + 1}</span>
                          <h3 style={sectionName}>{section.title}</h3>
                          <p style={smallText}>
                            {sectionVideos.length} lesson(s), {sectionNotes.length} note(s),{" "}
                            {sectionAssignments.length} assignment(s)
                          </p>
                        </div>
                      </div>

                      <div style={block}>
                        <h4 style={blockTitle}>Lessons</h4>

                        {sectionVideos.length === 0 ? (
                          <p style={emptyText}>No lessons in this section.</p>
                        ) : (
                          sectionVideos.map((video, videoIndex) => (
                            <button
                              key={video.id}
                              style={{
                                ...lessonItem,
                                border:
                                  activeVideo?.id === video.id
                                    ? "1px solid #F5C518"
                                    : "1px solid #eee",
                              }}
                              onClick={() => setActiveVideo(video)}
                            >
                              <span style={lessonNumber}>{videoIndex + 1}</span>
                              <span style={lessonText}>
                                <strong>{video.title}</strong>
                                <small>
                                  {video.duration_minutes
                                    ? `${video.duration_minutes} min`
                                    : "Recorded lesson"}
                                </small>
                              </span>
                              <span style={playIcon}>▶</span>
                            </button>
                          ))
                        )}
                      </div>

                      <div style={block}>
                        <h4 style={blockTitle}>Notes</h4>

                        {sectionNotes.length === 0 ? (
                          <p style={emptyText}>No notes in this section.</p>
                        ) : (
                          sectionNotes.map((note) => (
                            <div key={note.id} style={resourceItem}>
                              <div>
                                <strong>{note.title}</strong>
                                <p>{note.content || "Study material"}</p>
                              </div>

                              {note.attachment && (
                                <a
                                  href={getMediaUrl(note.attachment)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={downloadBtn}
                                >
                                  Open
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div style={block}>
                        <h4 style={blockTitle}>Assignments</h4>

                        {sectionAssignments.length === 0 ? (
                          <p style={emptyText}>No assignments in this section.</p>
                        ) : (
                          sectionAssignments.map((assignment) => (
                            <div key={assignment.id} style={resourceItem}>
                              <div>
                                <strong>{assignment.title}</strong>
                                <p>{assignment.description || "Assignment task"}</p>
                              </div>

                              {assignment.attachment && (
                                <a
                                  href={getMediaUrl(assignment.attachment)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={downloadBtn}
                                >
                                  Open
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={studentEngagementGrid}>
            <CourseReviews courseId={id} />
            <CourseQnA courseId={id} />
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}

const studentEngagementGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 24,
  marginTop: 24,
};

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f7f6f2 0%, #fffaf0 100%)",
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

const backBtn = {
  marginBottom: 18,
  border: "none",
  background: "#fff",
  color: "#1a1a1a",
  padding: "11px 17px",
  borderRadius: "999px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: 24,
  background: "linear-gradient(135deg, #102419, #1f3b2b)",
  borderRadius: 30,
  padding: 30,
  color: "#fff",
  boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
  marginBottom: 24,
};

const heroLeft = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const badge = {
  width: "fit-content",
  display: "inline-block",
  background: "rgba(245,197,24,0.16)",
  border: "1px solid rgba(245,197,24,0.4)",
  color: "#F5C518",
  padding: "8px 13px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
  textTransform: "capitalize",
};

const title = {
  margin: "16px 0 10px",
  fontSize: 42,
  lineHeight: 1.08,
  fontWeight: 950,
  color: "#fff",
};

const sub = {
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  lineHeight: 1.7,
  fontSize: 15,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginTop: 24,
};

const statCard = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  padding: 15,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const heroImageWrap = {
  position: "relative",
  borderRadius: 24,
  overflow: "hidden",
  background: "#13251b",
  minHeight: 240,
};

const heroImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const noImage = {
  height: "100%",
  minHeight: 240,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#F5C518",
  fontWeight: 950,
  fontSize: 24,
};

const pricePill = {
  position: "absolute",
  top: 14,
  right: 14,
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "8px 13px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  gap: 24,
  marginBottom: 24,
};

const playerCard = {
  background: "#fff",
  borderRadius: 26,
  padding: 22,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
};

const sidebar = {
  background: "#fff",
  borderRadius: 26,
  padding: 22,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
  height: "fit-content",
};

const sectionTitle = {
  margin: "0 0 14px",
  fontSize: 23,
  fontWeight: 950,
  color: "#1a1a1a",
};

const videoBox = {
  background: "#111",
  borderRadius: 22,
  overflow: "hidden",
  minHeight: 360,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const videoPlayer = {
  width: "100%",
  maxHeight: 420,
  display: "block",
};

const urlBox = {
  color: "#fff",
  textAlign: "center",
  padding: 30,
};

const urlText = {
  color: "rgba(255,255,255,0.72)",
};

const openVideoBtn = {
  display: "inline-block",
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "12px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 950,
};

const activeVideoTitle = {
  margin: "18px 0 6px",
  color: "#1a1a1a",
  fontSize: 22,
  fontWeight: 950,
};

const videoDesc = {
  margin: 0,
  color: "#666",
  lineHeight: 1.6,
};

const overviewItem = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 0",
  borderBottom: "1px solid #eee",
  color: "#555",
};

const enrollBtn = {
  width: "100%",
  marginTop: 18,
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "14px 18px",
  borderRadius: "999px",
  fontWeight: 950,
  cursor: "pointer",
};

const contentCard = {
  background: "#fff",
  borderRadius: 26,
  padding: 24,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
};

const sectionHeader = {
  marginBottom: 18,
};

const smallText = {
  color: "#777",
  fontSize: 13,
  margin: "5px 0 0",
};

const sectionList = {
  display: "grid",
  gap: 18,
};

const curriculumSection = {
  background: "#f7f6f2",
  border: "1px solid #e7e2d4",
  borderRadius: 22,
  padding: 18,
};

const curriculumTop = {
  marginBottom: 14,
};

const sectionBadge = {
  display: "inline-block",
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "6px 11px",
  borderRadius: "999px",
  fontSize: 11,
  fontWeight: 950,
};

const sectionName = {
  margin: "9px 0 0",
  color: "#1a1a1a",
  fontSize: 19,
  fontWeight: 950,
};

const block = {
  background: "#fff",
  borderRadius: 18,
  padding: 15,
  border: "1px solid #eee",
  marginTop: 12,
};

const blockTitle = {
  margin: "0 0 10px",
  color: "#1a1a1a",
  fontWeight: 950,
};

const lessonItem = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#fff",
  padding: 13,
  borderRadius: 15,
  cursor: "pointer",
  textAlign: "left",
  marginBottom: 10,
};

const lessonNumber = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#fff3bc",
  color: "#7a5a00",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
};

const lessonText = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#1a1a1a",
};

const playIcon = {
  color: "#102419",
  fontWeight: 950,
};

const resourceItem = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 15,
  padding: 14,
  marginBottom: 10,
  color: "#1a1a1a",
};

const downloadBtn = {
  height: "fit-content",
  background: "#102419",
  color: "#fff",
  textDecoration: "none",
  padding: "9px 14px",
  borderRadius: "999px",
  fontWeight: 900,
  fontSize: 13,
};

const emptyBox = {
  background: "#fff",
  borderRadius: 20,
  padding: 30,
  textAlign: "center",
  border: "1px solid #eee",
};

const emptyTitle = {
  margin: 0,
  color: "#1a1a1a",
  fontWeight: 950,
};

const emptyText = {
  color: "#777",
  fontSize: 14,
};