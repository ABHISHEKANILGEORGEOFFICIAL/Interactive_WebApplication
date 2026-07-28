import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";
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

export default function StudentLearningPage() {
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
  const [completedVideos, setCompletedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    loadLearningPage();
  }, [id]);

  useEffect(() => {
    const saved = localStorage.getItem(`completed_videos_${id}`);
    if (saved) {
      setCompletedVideos(JSON.parse(saved));
    }
  }, [id]);

  const loadLearningPage = async () => {
    try {
      setLoading(true);

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
      console.error("Learning page load error:", err?.response?.data || err);
      alert("Could not load learning page.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = useMemo(() => {
    if (videos.length === 0) return 0;
    return Math.round((completedVideos.length / videos.length) * 100);
  }, [completedVideos, videos]);

  const currentLessonNumber = useMemo(() => {
    if (!activeVideo) return 0;
    const index = videos.findIndex((v) => v.id === activeVideo.id);
    return index >= 0 ? index + 1 : 1;
  }, [activeVideo, videos]);

  const markCurrentVideoComplete = () => {
    if (!activeVideo) return;

    const videoId = activeVideo.id;

    if (completedVideos.includes(videoId)) return;

    const updated = [...completedVideos, videoId];
    setCompletedVideos(updated);
    localStorage.setItem(`completed_videos_${id}`, JSON.stringify(updated));
  };

  const goToNextLesson = () => {
    if (!activeVideo) return;

    const index = videos.findIndex((v) => v.id === activeVideo.id);

    if (index >= 0 && index < videos.length - 1) {
      setActiveVideo(videos[index + 1]);
    }
  };

  const generateCertificate = async () => {
    try {
      await API.post("teacher/certificates/", {
        course: id,
      });

      navigate(`/student/certificate/${id}`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate certificate");
    }
  };

  const thumbnailUrl = getMediaUrl(course?.thumbnail);

  if (loading) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={center}>Loading your learning room...</div>
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
          <div style={topBar}>
            <button style={backBtn} onClick={() => navigate("/student/courses")}>
              ← Courses
            </button>

            <div style={topInfo}>
              <span style={topPill}>Learning Room</span>
              <strong>{course.title}</strong>
            </div>
          </div>

          <section style={hero}>
            <div style={heroLeft}>
              <span style={eyebrow}>Saha LMS Course Player</span>

              <h1 style={title}>{course.title}</h1>

              <p style={sub}>
                Watch lessons, open study notes, complete assignments, and track
                your course progress from one learning dashboard.
              </p>

              <div style={heroStats}>
                <div style={heroStat}>
                  <strong>{videos.length}</strong>
                  <span>Lessons</span>
                </div>

                <div style={heroStat}>
                  <strong>{notes.length}</strong>
                  <span>Notes</span>
                </div>

                <div style={heroStat}>
                  <strong>{assignments.length}</strong>
                  <span>Assignments</span>
                </div>

                <div style={heroStat}>
                  <strong>{progressPercent}%</strong>
                  <span>Progress</span>
                </div>
              </div>
            </div>

            <div style={heroProgressCard}>
              <div style={progressCircle}>
                <span>{progressPercent}%</span>
              </div>

              <h3 style={progressTitle}>Course Progress</h3>

              <p style={progressText}>
                {completedVideos.length} of {videos.length} lessons completed
              </p>

              <div style={progressBar}>
                <div
                  style={{
                    ...progressFill,
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
            </div>
          </section>

          <section style={learningGrid}>
            <main style={mainPanel}>
              <div style={videoHeader}>
                <div>
                  <span style={lessonPill}>
                    Lesson {currentLessonNumber} of {videos.length}
                  </span>

                  <h2 style={sectionTitle}>
                    {activeVideo ? activeVideo.title : "No lesson selected"}
                  </h2>
                </div>

                {activeVideo && (
                  <button style={completeBtn} onClick={markCurrentVideoComplete}>
                    {completedVideos.includes(activeVideo.id)
                      ? "Completed ✓"
                      : "Mark Complete"}
                  </button>
                )}
              </div>

              <div style={videoBox}>
                {activeVideo?.media_file ? (
                  <video
                    src={getMediaUrl(activeVideo.media_file)}
                    controls
                    style={videoPlayer}
                  />
                ) : activeVideo?.video_url ? (
                  <div style={externalBox}>
                    <h3>External Lesson Video</h3>
                    <p>This lesson uses an external video link.</p>

                    <a
                      href={activeVideo.video_url}
                      target="_blank"
                      rel="noreferrer"
                      style={openBtn}
                    >
                      Open Video
                    </a>
                  </div>
                ) : (
                  <div style={externalBox}>
                    <h3>No video available</h3>
                    <p>This lesson does not have a video source yet.</p>
                  </div>
                )}
              </div>

              <div style={lessonActions}>
                <button
                  style={secondaryBtn}
                  onClick={() => setActiveTab("notes")}
                >
                  Open Notes
                </button>

                <button
                  style={secondaryBtn}
                  onClick={() => setActiveTab("assignments")}
                >
                  View Assignments
                </button>

                <button
                  style={secondaryBtn}
                  disabled={progressPercent < 100}
                  onClick={generateCertificate}
                >
                  {progressPercent === 100
                    ? "Download Certificate"
                    : "Complete Course First"}
                </button>

                <button style={nextBtn} onClick={goToNextLesson}>
                  Next Lesson →
                </button>
              </div>

              <div style={tabs}>
                <button
                  style={activeTab === "overview" ? tabActive : tab}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>

                <button
                  style={activeTab === "notes" ? tabActive : tab}
                  onClick={() => setActiveTab("notes")}
                >
                  Notes
                </button>

                <button
                  style={activeTab === "assignments" ? tabActive : tab}
                  onClick={() => setActiveTab("assignments")}
                >
                  Assignments
                </button>
              </div>

              <div style={tabBody}>
                {activeTab === "overview" && (
                  <>
                    <h3 style={tabTitle}>Lesson Description</h3>

                    <p style={tabText}>
                      {activeVideo?.description ||
                        course.description ||
                        "No lesson description available."}
                    </p>

                    <div style={miniGrid}>
                      <div style={miniCard}>
                        <span>Course Level</span>
                        <strong>{course.level || "Beginner"}</strong>
                      </div>

                      <div style={miniCard}>
                        <span>Duration</span>
                        <strong>{course.duration_hours || 0} hrs</strong>
                      </div>

                      <div style={miniCard}>
                        <span>Status</span>
                        <strong>{course.is_active ? "Active" : "Inactive"}</strong>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "notes" && (
                  <>
                    <h3 style={tabTitle}>Course Notes</h3>

                    {notes.length === 0 ? (
                      <p style={tabText}>No notes uploaded for this course.</p>
                    ) : (
                      <div style={resourceGrid}>
                        {notes.map((note) => (
                          <div key={note.id} style={resourceCard}>
                            <div>
                              <span style={resourceIcon}>📝</span>
                              <h4>{note.title}</h4>
                              <p>{note.content || "Study material"}</p>
                            </div>

                            {note.attachment && (
                              <a
                                href={getMediaUrl(note.attachment)}
                                target="_blank"
                                rel="noreferrer"
                                style={resourceBtn}
                              >
                                Open Note
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "assignments" && (
                  <>
                    <h3 style={tabTitle}>Course Assignments</h3>

                    {assignments.length === 0 ? (
                      <p style={tabText}>
                        No assignments uploaded for this course.
                      </p>
                    ) : (
                      <div style={resourceGrid}>
                        {assignments.map((assignment) => (
                          <div key={assignment.id} style={resourceCard}>
                            <div>
                              <span style={resourceIcon}>📚</span>
                              <h4>{assignment.title}</h4>
                              <p>
                                {assignment.description ||
                                  "Assignment instructions"}
                              </p>
                            </div>

                            {assignment.attachment && (
                              <a
                                href={getMediaUrl(assignment.attachment)}
                                target="_blank"
                                rel="noreferrer"
                                style={resourceBtn}
                              >
                                Open Task
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={qnaWrapper}>
                <CourseQnA courseId={id} />
              </div>
            </main>

            <aside style={playlistPanel}>
              <div style={playlistTop}>
                <div>
                  <h2 style={playlistTitle}>Course Playlist</h2>
                  <p style={playlistSub}>
                    {sections.length} section(s), {videos.length} lesson(s)
                  </p>
                </div>
              </div>

              <div style={thumbnailBox}>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={course.title} style={thumb} />
                ) : (
                  <div style={thumbFallback}>Saha</div>
                )}
              </div>

              <div style={playlistList}>
                {sections.length === 0 ? (
                  <div style={emptyBox}>
                    <strong>No sections found</strong>
                    <p>Course content will appear here.</p>
                  </div>
                ) : (
                  sections.map((section, sectionIndex) => {
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
                      <div key={section.id} style={playlistSection}>
                        <div style={playlistSectionHead}>
                          <span>Section {sectionIndex + 1}</span>
                          <strong>{section.title}</strong>
                          <small>
                            {sectionVideos.length} lesson(s),{" "}
                            {sectionNotes.length} note(s),{" "}
                            {sectionAssignments.length} assignment(s)
                          </small>
                        </div>

                        <div style={playlistMiniBlock}>
                          <strong style={playlistMiniTitle}>Lessons</strong>

                          {sectionVideos.length === 0 ? (
                            <p style={emptySmall}>No lessons in this section.</p>
                          ) : (
                            sectionVideos.map((video, videoIndex) => {
                              const isActive = activeVideo?.id === video.id;
                              const isDone = completedVideos.includes(video.id);

                              return (
                                <button
                                  key={video.id}
                                  style={{
                                    ...playlistItem,
                                    background: isActive ? "#fff8d6" : "#fff",
                                    border: isActive
                                      ? "1px solid #F5C518"
                                      : "1px solid #e7e2d4",
                                  }}
                                  onClick={() => setActiveVideo(video)}
                                >
                                  <span
                                    style={{
                                      ...lessonNumber,
                                      background: isDone ? "#0d6b36" : "#102419",
                                    }}
                                  >
                                    {isDone ? "✓" : videoIndex + 1}
                                  </span>

                                  <span style={playlistLessonText}>
                                    <strong>{video.title}</strong>
                                    <small>
                                      {video.duration_minutes
                                        ? `${video.duration_minutes} min`
                                        : "Recorded lesson"}
                                    </small>
                                  </span>

                                  <span style={playSymbol}>
                                    {isActive ? "●" : "▶"}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div style={playlistMiniBlock}>
                          <strong style={playlistMiniTitle}>Notes</strong>

                          {sectionNotes.length === 0 ? (
                            <p style={emptySmall}>No notes in this section.</p>
                          ) : (
                            sectionNotes.map((note) => (
                              <div key={note.id} style={playlistResourceItem}>
                                <div style={playlistResourceText}>
                                  <strong>{note.title}</strong>
                                  <small>{note.content || "Study material"}</small>
                                </div>

                                {note.attachment && (
                                  <a
                                    href={getMediaUrl(note.attachment)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={playlistOpenBtn}
                                  >
                                    Open
                                  </a>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        <div style={playlistMiniBlock}>
                          <strong style={playlistMiniTitle}>Assignments</strong>

                          {sectionAssignments.length === 0 ? (
                            <p style={emptySmall}>
                              No assignments in this section.
                            </p>
                          ) : (
                            sectionAssignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                style={playlistResourceItem}
                              >
                                <div style={playlistResourceText}>
                                  <strong>{assignment.title}</strong>
                                  <small>
                                    {assignment.description ||
                                      "Assignment instructions"}
                                  </small>
                                </div>

                                {assignment.attachment && (
                                  <a
                                    href={getMediaUrl(assignment.attachment)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={playlistOpenBtn}
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
                  })
                )}
              </div>
            </aside>
          </section>
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
  maxWidth: 1380,
  margin: "0 auto",
  padding: "120px 28px 60px",
};

const center = {
  padding: "160px 30px",
  textAlign: "center",
  fontWeight: 950,
  color: "#1a1a1a",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 18,
};

const backBtn = {
  border: "none",
  background: "#fff",
  color: "#1a1a1a",
  padding: "11px 17px",
  borderRadius: "999px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};

const topInfo = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 999,
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#1a1a1a",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const topPill = {
  background: "#fff3bc",
  color: "#7a5a00",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1fr 280px",
  gap: 24,
  background: "linear-gradient(135deg, #102419, #1f3b2b)",
  borderRadius: 32,
  padding: 30,
  color: "#fff",
  marginBottom: 24,
  boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
};

const heroLeft = {
  minWidth: 0,
};

const eyebrow = {
  display: "inline-block",
  background: "rgba(245,197,24,0.16)",
  border: "1px solid rgba(245,197,24,0.4)",
  color: "#F5C518",
  padding: "8px 13px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
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
  maxWidth: 760,
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginTop: 24,
};

const heroStat = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  padding: 15,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const heroProgressCard = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 26,
  padding: 22,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
};

const progressCircle = {
  width: 112,
  height: 112,
  borderRadius: "50%",
  border: "10px solid rgba(245,197,24,0.35)",
  background: "rgba(0,0,0,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#F5C518",
  fontSize: 28,
  fontWeight: 950,
  marginBottom: 14,
};

const progressTitle = {
  margin: "0 0 6px",
  color: "#fff",
  fontWeight: 950,
};

const progressText = {
  margin: "0 0 14px",
  color: "rgba(255,255,255,0.72)",
  fontSize: 13,
};

const progressBar = {
  width: "100%",
  height: 9,
  background: "rgba(255,255,255,0.16)",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFill = {
  height: "100%",
  background: "#F5C518",
  borderRadius: 999,
};

const learningGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 390px",
  gap: 24,
  alignItems: "start",
};

const mainPanel = {
  background: "#fff",
  borderRadius: 30,
  padding: 24,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
};

const videoHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  marginBottom: 18,
};

const lessonPill = {
  display: "inline-block",
  background: "#fff3bc",
  color: "#7a5a00",
  padding: "7px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  marginBottom: 8,
};

const sectionTitle = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
  color: "#1a1a1a",
};

const completeBtn = {
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: "999px",
  fontWeight: 950,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const videoBox = {
  background: "#101010",
  borderRadius: 24,
  overflow: "hidden",
  minHeight: 430,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const videoPlayer = {
  width: "100%",
  maxHeight: 520,
  display: "block",
};

const externalBox = {
  color: "#fff",
  textAlign: "center",
  padding: 34,
};

const openBtn = {
  display: "inline-block",
  marginTop: 12,
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "12px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 950,
};

const lessonActions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 18,
};

const secondaryBtn = {
  border: "1px solid #e7e2d4",
  background: "#fff",
  color: "#1a1a1a",
  padding: "12px 16px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
};

const nextBtn = {
  marginLeft: "auto",
  border: "none",
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "12px 18px",
  borderRadius: 999,
  fontWeight: 950,
  cursor: "pointer",
};

const tabs = {
  display: "flex",
  gap: 10,
  marginTop: 24,
  borderTop: "1px solid #eee",
  paddingTop: 20,
};

const tab = {
  border: "1px solid #e7e2d4",
  background: "#fff",
  color: "#555",
  padding: "10px 15px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
};

const tabActive = {
  ...tab,
  background: "#102419",
  color: "#fff",
  border: "1px solid #102419",
};

const tabBody = {
  marginTop: 20,
  background: "#f7f6f2",
  border: "1px solid #e7e2d4",
  borderRadius: 24,
  padding: 22,
};

const tabTitle = {
  margin: "0 0 10px",
  fontSize: 21,
  color: "#102419",
  fontWeight: 950,
};

const tabText = {
  margin: 0,
  color: "#666",
  lineHeight: 1.7,
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
  marginTop: 18,
};

const miniCard = {
  background: "#fff",
  border: "1px solid #e7e2d4",
  borderRadius: 18,
  padding: 15,
  display: "flex",
  flexDirection: "column",
  gap: 5,
  color: "#555",
};

const qnaWrapper = {
  marginTop: 24,
};

const playlistPanel = {
  background: "#fff",
  borderRadius: 30,
  padding: 22,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
  position: "sticky",
  top: 100,
};

const playlistTop = {
  marginBottom: 16,
};

const playlistTitle = {
  margin: 0,
  fontSize: 23,
  fontWeight: 950,
  color: "#1a1a1a",
};

const playlistSub = {
  margin: "6px 0 0",
  color: "#777",
  fontSize: 13,
};

const thumbnailBox = {
  height: 160,
  borderRadius: 22,
  overflow: "hidden",
  background: "#102419",
  marginBottom: 18,
};

const thumb = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbFallback = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#F5C518",
  fontWeight: 950,
  fontSize: 28,
};

const playlistList = {
  display: "grid",
  gap: 16,
  maxHeight: 680,
  overflowY: "auto",
  paddingRight: 4,
};

const playlistSection = {
  background: "#f7f6f2",
  border: "1px solid #e7e2d4",
  borderRadius: 22,
  padding: 14,
};

const playlistSectionHead = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginBottom: 12,
  color: "#1a1a1a",
};

const playlistMiniBlock = {
  marginTop: 12,
};

const playlistMiniTitle = {
  display: "block",
  marginBottom: 8,
  color: "#102419",
  fontSize: 14,
  fontWeight: 950,
};

const playlistItem = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 11,
  padding: 12,
  borderRadius: 17,
  cursor: "pointer",
  marginBottom: 9,
  textAlign: "left",
};

const lessonNumber = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  color: "#F5C518",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  flexShrink: 0,
};

const playlistLessonText = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#1a1a1a",
};

const playSymbol = {
  color: "#0d6b36",
  fontWeight: 950,
};

const playlistResourceItem = {
  background: "#fff",
  border: "1px solid #e7e2d4",
  borderRadius: 16,
  padding: 12,
  marginBottom: 9,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  color: "#1a1a1a",
};

const playlistResourceText = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minWidth: 0,
};

const playlistOpenBtn = {
  background: "#102419",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 12,
  flexShrink: 0,
};

const resourceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const resourceCard = {
  background: "#fff",
  border: "1px solid #e7e2d4",
  borderRadius: 20,
  padding: 18,
  color: "#1a1a1a",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 12,
};

const resourceIcon = {
  fontSize: 26,
};

const resourceBtn = {
  background: "#102419",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
  width: "fit-content",
};

const emptyBox = {
  background: "#fff",
  border: "1px solid #e7e2d4",
  borderRadius: 18,
  padding: 18,
  color: "#555",
};

const emptySmall = {
  color: "#777",
  fontSize: 13,
  margin: 0,
};