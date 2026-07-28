import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";

const pageUser = {
  firstName: "Teacher",
  username: "teacher",
  fullName: "Your Name",
  role: "Teacher",
  avatarDisplay: "T",
  avatarUrl: null,
};

const VIEW_STYLES = `
  .course-view-layout {
    display:grid;
    grid-template-columns:220px minmax(0, 1fr);
    gap:22px;
    max-width:1180px;
    margin:0 auto;
    padding:108px 28px 60px;
  }

  .course-view-shell {
    min-width:0;
  }

  .view-hero,
  .view-card,
  .view-playlist-wide,
  .view-tabs {
    background:rgba(10,28,16,0.92);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:24px;
    backdrop-filter:blur(12px);
    color:#e8f0e2;
  }

  .view-hero {
    position:relative;
    overflow:hidden;
    padding:34px;
    margin-bottom:18px;
    min-height:240px;
    display:flex;
    justify-content:space-between;
    gap:22px;
    align-items:flex-start;
  }

  .view-hero-bg {
    position:absolute;
    inset:0;
    background-size:cover;
    background-position:center;
    opacity:.34;
    pointer-events:none;
  }

  .view-hero-shade {
    position:absolute;
    inset:0;
    background:linear-gradient(120deg, rgba(10,28,16,.92), rgba(10,28,16,.68));
    pointer-events:none;
  }

  .view-hero-content,
  .view-hero-actions {
    position:relative;
    z-index:2;
  }

  .view-hero-content {
    flex:1;
    min-width:0;
  }

  .view-hero-actions {
    display:flex;
    flex-direction:row;
    align-items:center;
    justify-content:flex-end;
    gap:12px;
    flex-wrap:nowrap;
    min-width:max-content;
  }

  .view-eyebrow {
    font-size:10px;
    font-weight:900;
    color:rgba(160,210,170,0.52);
    letter-spacing:2px;
    text-transform:uppercase;
    margin-bottom:10px;
  }

  .view-title {
    font-size:30px;
    font-weight:950;
    color:#F5C518;
    margin:0 0 10px;
    line-height:1.2;
  }

  .view-desc {
    color:rgba(180,230,180,0.72);
    line-height:1.7;
    font-size:14px;
    margin:0;
    max-width:760px;
  }

  .view-badge-row {
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-top:18px;
  }

  .view-badge {
    background:rgba(245,197,24,.14);
    color:#F5C518;
    border:1px solid rgba(245,197,24,.25);
    padding:7px 11px;
    border-radius:999px;
    font-size:12px;
    font-weight:900;
  }

  .view-badge-active {
    background:rgba(16,185,129,.16);
    color:#5eead4;
    border-color:rgba(16,185,129,.25);
  }

  .view-badge-inactive {
    background:rgba(220,38,38,.16);
    color:#fca5a5;
    border-color:rgba(220,38,38,.25);
  }

  .view-btn-primary {
    background:#F5C518;
    color:#1a3010;
    border:none;
    border-radius:14px;
    padding:12px 18px;
    font-weight:900;
    cursor:pointer;
    font-family:inherit;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    white-space:nowrap;
  }

  .view-btn-outline {
    background:transparent;
    color:rgba(180,230,180,.78);
    border:1px solid rgba(120,200,145,.22);
    border-radius:14px;
    padding:12px 18px;
    font-weight:900;
    cursor:pointer;
    font-family:inherit;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    white-space:nowrap;
  }

  .view-btn-outline:hover {
    background:rgba(245,197,24,.08);
    color:#F5C518;
  }

  .view-playlist-wide {
    padding:22px;
    margin-bottom:18px;
  }

  .view-playlist-head {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:16px;
    margin-bottom:18px;
    flex-wrap:wrap;
  }

  .view-playlist-title {
    margin:0;
    font-size:22px;
    font-weight:950;
    color:#F5C518;
  }

  .view-playlist-sub {
    color:rgba(180,230,180,.62);
    font-size:13px;
    margin:6px 0 0;
    line-height:1.6;
  }

  .view-playlist-summary {
    display:flex;
    gap:8px;
    flex-wrap:wrap;
  }

  .view-summary-pill {
    border:1px solid rgba(120,200,145,.22);
    background:rgba(245,197,24,.06);
    color:rgba(232,240,226,.86);
    border-radius:999px;
    padding:8px 12px;
    font-size:12px;
    font-weight:900;
  }

  .view-section-tab-row {
    display:flex;
    gap:10px;
    overflow-x:auto;
    padding:8px 2px 14px;
    margin-bottom:16px;
    border-bottom:1px solid rgba(120,200,145,.16);
  }

  .view-section-tab-btn {
    border:1px solid rgba(120,200,145,.18);
    background:rgba(245,197,24,.05);
    color:#e8f0e2;
    border-radius:16px;
    padding:12px 15px;
    cursor:pointer;
    font-family:inherit;
    min-width:170px;
    text-align:left;
    flex-shrink:0;
    transition:all .15s ease;
  }

  .view-section-tab-btn:hover {
    background:rgba(245,197,24,.09);
    border-color:rgba(245,197,24,.34);
    transform:translateY(-1px);
  }

  .view-section-tab-btn.active {
    background:rgba(245,197,24,.16);
    border-color:#F5C518;
    box-shadow:0 0 0 3px rgba(245,197,24,.08);
  }

  .view-section-tab-top {
    display:flex;
    align-items:center;
    gap:9px;
    margin-bottom:6px;
  }

  .view-section-tab-number {
    width:26px;
    height:26px;
    border-radius:50%;
    display:grid;
    place-items:center;
    background:rgba(245,197,24,.12);
    border:1px solid rgba(245,197,24,.28);
    color:#F5C518;
    font-size:12px;
    font-weight:950;
    flex-shrink:0;
  }

  .view-section-tab-btn.active .view-section-tab-number {
    background:#F5C518;
    color:#1a3010;
  }

  .view-section-tab-title {
    color:#e8f0e2;
    font-size:13px;
    font-weight:950;
    line-height:1.35;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }

  .view-section-tab-meta {
    color:rgba(180,230,180,.56);
    font-size:11px;
    font-weight:800;
  }

  .view-selected-section-panel {
    background:rgba(10,28,16,.52);
    border:1px solid rgba(120,200,145,.18);
    border-radius:18px;
    padding:16px;
  }

  .view-selected-section-head {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:14px;
    margin-bottom:14px;
    padding-bottom:14px;
    border-bottom:1px solid rgba(120,200,145,.14);
  }

  .view-selected-section-title {
    margin:0;
    color:#F5C518;
    font-size:18px;
    font-weight:950;
  }

  .view-selected-section-meta {
    color:rgba(180,230,180,.58);
    font-size:12px;
    margin-top:5px;
  }

  .view-lesson-list {
    display:grid;
    gap:10px;
  }

  .view-lesson-row {
    width:100%;
    border:1px solid rgba(120,200,145,.18);
    background:rgba(245,197,24,.04);
    color:#e8f0e2;
    border-radius:15px;
    padding:13px 14px;
    display:grid;
    grid-template-columns:auto minmax(0, 1fr) auto;
    align-items:center;
    gap:12px;
    cursor:pointer;
    font-family:inherit;
    text-align:left;
    transition:background .14s, border-color .14s, transform .14s;
  }

  .view-lesson-row:hover {
    background:rgba(245,197,24,.08);
    border-color:rgba(245,197,24,.28);
    transform:translateY(-1px);
  }

  .view-lesson-row.active {
    background:rgba(245,197,24,.14);
    border-color:#F5C518;
  }

  .view-lesson-play {
    width:34px;
    height:34px;
    border-radius:50%;
    background:#F5C518;
    color:#1a3010;
    display:grid;
    place-items:center;
    font-size:12px;
    font-weight:950;
    flex-shrink:0;
  }

  .view-lesson-row:not(.active) .view-lesson-play {
    background:rgba(245,197,24,.12);
    color:#F5C518;
    border:1px solid rgba(245,197,24,.28);
  }

  .view-lesson-title {
    color:#e8f0e2;
    font-weight:950;
    font-size:14px;
    margin:0;
    line-height:1.35;
  }

  .view-lesson-tag {
    display:inline-flex;
    margin-left:8px;
    background:rgba(16,185,129,.18);
    color:#5eead4;
    border-radius:999px;
    padding:3px 8px;
    font-size:10px;
    font-weight:950;
    vertical-align:middle;
  }

  .view-lesson-meta {
    color:rgba(180,230,180,.55);
    font-size:12px;
    margin-top:4px;
  }

  .view-lesson-duration {
    color:rgba(180,230,180,.62);
    font-size:12px;
    font-weight:900;
    white-space:nowrap;
  }

  .view-main-single {
    display:block;
  }

  .view-card {
    padding:22px;
    margin-bottom:18px;
  }

  .view-player-top {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:16px;
    flex-wrap:wrap;
  }

  .view-player-title {
    margin:0;
    font-size:23px;
    font-weight:950;
    color:#e8f0e2;
  }

  .view-video {
    width:100%;
    height:430px;
    border-radius:18px;
    background:#000;
    object-fit:contain;
    margin-top:14px;
  }

  .view-empty-player {
    height:430px;
    border-radius:18px;
    background:rgba(0,0,0,.62);
    color:rgba(180,230,180,.72);
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight:900;
    margin-top:14px;
  }

  .view-video-desc {
    color:rgba(180,230,180,.68);
    line-height:1.7;
    margin:14px 0 0;
  }

  .view-tabs {
    display:flex;
    gap:5px;
    padding:6px;
    overflow:auto;
    margin-bottom:18px;
  }

  .view-tab {
    border:none;
    background:transparent;
    color:rgba(180,230,180,.62);
    border-radius:12px;
    padding:11px 16px;
    font-size:13px;
    font-weight:900;
    cursor:pointer;
    white-space:nowrap;
    font-family:inherit;
  }

  .view-tab.active {
    background:#F5C518;
    color:#1a3010;
  }

  .view-section-title {
    margin:0 0 16px;
    color:#F5C518;
    font-size:24px;
    font-weight:950;
  }

  .view-overview-grid {
    display:grid;
    grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));
    gap:14px;
    margin-top:18px;
  }

  .view-info-tile {
    background:rgba(245,197,24,.06);
    border:1px solid rgba(120,200,145,.18);
    border-radius:16px;
    padding:16px;
  }

  .view-info-label {
    color:rgba(160,210,170,.52);
    font-size:11px;
    font-weight:900;
    display:block;
    margin-bottom:6px;
    text-transform:uppercase;
    letter-spacing:1px;
  }

  .view-info-value {
    color:#e8f0e2;
    font-weight:900;
  }

  .view-accordion-card {
    border:1px solid rgba(120,200,145,.18);
    border-radius:18px;
    overflow:hidden;
    margin-bottom:14px;
    background:rgba(245,197,24,.04);
  }

  .view-accordion-head {
    width:100%;
    background:rgba(245,197,24,.06);
    border:none;
    padding:16px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    cursor:pointer;
    text-align:left;
    font-family:inherit;
  }

  .view-small-badge {
    background:#F5C518;
    color:#1a3010;
    padding:5px 10px;
    border-radius:999px;
    font-size:11px;
    font-weight:900;
  }

  .view-section-name {
    margin:10px 0 0;
    color:#e8f0e2;
    font-size:18px;
    font-weight:950;
  }

  .view-count-badge {
    background:rgba(10,28,16,.75);
    border:1px solid rgba(120,200,145,.18);
    color:rgba(180,230,180,.78);
    padding:8px 12px;
    border-radius:999px;
    font-size:12px;
    font-weight:900;
    height:fit-content;
  }

  .view-accordion-body {
    padding:16px;
    display:grid;
    grid-template-columns:repeat(auto-fit, minmax(230px, 1fr));
    gap:14px;
  }

  .view-content-box {
    background:rgba(10,28,16,.72);
    border:1px solid rgba(120,200,145,.18);
    border-radius:16px;
    padding:14px;
  }

  .view-box-title {
    margin:0 0 12px;
    color:#F5C518;
    font-size:16px;
    font-weight:950;
  }

  .view-list {
    display:grid;
    gap:10px;
  }

  .view-list-item {
    background:rgba(245,197,24,.05);
    border:1px solid rgba(120,200,145,.18);
    border-radius:12px;
    padding:12px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
  }

  .view-mini-badge {
    font-size:10px;
    font-weight:950;
    color:#F5C518;
    text-transform:uppercase;
  }

  .view-item-title {
    color:#e8f0e2;
    font-weight:900;
    margin-top:4px;
  }

  .view-mini-btn {
    background:#F5C518;
    color:#1a3010;
    border:none;
    border-radius:999px;
    padding:7px 12px;
    font-size:12px;
    font-weight:900;
    cursor:pointer;
    text-decoration:none;
    white-space:nowrap;
  }

  .view-empty {
    border:1px dashed rgba(120,200,145,.28);
    border-radius:16px;
    padding:22px;
    color:rgba(180,230,180,.58);
    text-align:center;
    background:rgba(245,197,24,.03);
  }

  .view-empty-small {
    color:rgba(180,230,180,.5);
    font-size:12px;
    margin:6px 0;
  }

  .view-helper {
    margin:-8px 0 18px;
    color:rgba(180,230,180,.62);
    line-height:1.6;
  }

  .view-discussion-list {
    display:grid;
    gap:16px;
  }

  .view-discussion-card {
    border:1px solid rgba(120,200,145,.18);
    background:rgba(245,197,24,.05);
    border-radius:18px;
    padding:18px;
  }

  .view-discussion-top {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:14px;
    margin-bottom:10px;
  }

  .view-discussion-name {
    color:#e8f0e2;
    font-size:16px;
    font-weight:950;
  }

  .view-discussion-text {
    color:rgba(232,240,226,.82);
    line-height:1.7;
    font-size:15px;
    margin:12px 0;
  }

  .view-role-row {
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-top:8px;
  }

  .view-pill {
    padding:5px 9px;
    border-radius:999px;
    font-size:11px;
    font-weight:950;
  }

  .view-student-pill {
    background:rgba(245,197,24,.16);
    color:#F5C518;
  }

  .view-answered-pill {
    background:rgba(16,185,129,.16);
    color:#5eead4;
  }

  .view-instructor-pill {
    background:#F5C518;
    color:#1a3010;
  }

  .view-date {
    color:rgba(180,230,180,.45);
    font-size:12px;
    white-space:nowrap;
  }

  .view-student-reply-list {
    display:grid;
    gap:10px;
    margin-top:16px;
    margin-left:22px;
    padding-left:14px;
    border-left:3px solid rgba(245,197,24,.32);
  }

  .view-reply-section-label {
    color:#F5C518;
    font-size:11px;
    font-weight:950;
    text-transform:uppercase;
    letter-spacing:1px;
  }

  .view-reply-card {
    background:rgba(10,28,16,.72);
    border:1px solid rgba(120,200,145,.18);
    border-radius:15px;
    padding:14px;
    margin-top:12px;
  }

  .view-instructor-reply-list {
    display:grid;
    gap:10px;
    margin-top:16px;
    margin-left:22px;
    padding:14px;
    border-left:5px solid #5eead4;
    background:rgba(16,185,129,.08);
    border-radius:16px;
  }

  .view-instructor-answer-label {
    color:#5eead4;
    font-size:12px;
    font-weight:950;
    text-transform:uppercase;
    letter-spacing:1px;
  }

  .view-reply-header {
    display:flex;
    justify-content:space-between;
    gap:10px;
    align-items:center;
    color:#e8f0e2;
  }

  .view-reply-text {
    margin:8px 0 0;
    color:rgba(232,240,226,.76);
    line-height:1.6;
  }

  .view-reply-box {
    margin-top:14px;
    display:grid;
    gap:10px;
  }

  .view-reply-input {
    width:100%;
    min-height:86px;
    border:1px solid rgba(120,200,145,.22);
    border-radius:14px;
    padding:12px;
    resize:vertical;
    font-family:inherit;
    font-size:14px;
    outline:none;
    box-sizing:border-box;
    background:#fff;
    color:#1a1a1a;
  }

  .view-stars {
    color:#F5C518;
    font-size:18px;
    letter-spacing:2px;
    margin-top:6px;
  }

  .view-loading {
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#F5C518;
    font-weight:900;
    padding-top:100px;
  }

  @media(max-width:900px) {
    .course-view-layout {
      grid-template-columns:1fr;
      padding:100px 16px 40px;
    }

    .view-hero {
      flex-direction:column;
    }

    .view-hero-actions {
      justify-content:flex-start;
    }
  }

  @media(max-width:600px) {
    .view-card,
    .view-hero,
    .view-playlist-wide {
      padding:22px;
    }

    .view-hero-actions {
      flex-wrap:wrap;
      min-width:0;
    }

    .view-video,
    .view-empty-player {
      height:260px;
    }

    .view-accordion-head,
    .view-list-item,
    .view-discussion-top,
    .view-selected-section-head,
    .view-lesson-row {
      grid-template-columns:1fr;
      flex-direction:column;
      align-items:flex-start;
    }

    .view-lesson-duration {
      white-space:normal;
    }
  }
`;

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("curriculum");
  const [openSections, setOpenSections] = useState({});
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [reviewReplyTexts, setReviewReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const styleId = "saha-course-view-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = VIEW_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const fixUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://127.0.0.1:8000${url.startsWith("/") ? url : `/${url}`}`;
  };

  const loadCourseData = async () => {
    try {
      const [
        courseRes,
        sectionRes,
        videoRes,
        noteRes,
        assignmentRes,
        commentRes,
        reviewRes,
      ] = await Promise.all([
        API.get(`teacher/courses/${id}/`),
        API.get("teacher/sections/"),
        API.get("teacher/videos/"),
        API.get("teacher/notes/"),
        API.get("teacher/assignments/"),
        API.get(`teacher/courses/${id}/comments/`),
        API.get(`teacher/courses/${id}/reviews/`),
      ]);

      const filteredSections = Array.isArray(sectionRes.data)
        ? sectionRes.data.filter((s) => String(s.course) === String(id))
        : [];

      const filteredVideos = Array.isArray(videoRes.data)
        ? videoRes.data.filter((v) => String(v.course) === String(id))
        : [];

      const filteredNotes = Array.isArray(noteRes.data)
        ? noteRes.data.filter((n) => String(n.course) === String(id))
        : [];

      const filteredAssignments = Array.isArray(assignmentRes.data)
        ? assignmentRes.data.filter((a) => String(a.course) === String(id))
        : [];

      setCourse(courseRes.data);
      setSections(filteredSections);
      setVideos(filteredVideos);
      setNotes(filteredNotes);
      setAssignments(filteredAssignments);
      setComments(Array.isArray(commentRes.data) ? commentRes.data : []);
      setReviews(Array.isArray(reviewRes.data) ? reviewRes.data : []);

      if (filteredVideos.length > 0) {
        setActiveVideo(filteredVideos[0]);
      }

      const initialOpen = {};
      filteredSections.forEach((s, index) => {
        initialOpen[s.id] = index === 0;
      });
      setOpenSections(initialOpen);
    } catch (err) {
      console.error("Course view error:", err?.response?.data || err);
      alert("Course could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const getVideoSrc = (video) => {
    return video?.media_file ? fixUrl(video.media_file) : video?.video_url || "";
  };

  const groupedSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,

      videos: videos.filter(
        (v) => String(v.section || v.section_id) === String(section.id)
      ),

      notes: notes.filter((n) => {
        const noteSection =
          n.section || n.section_id || n.course_section || n.course_section_id;

        return String(noteSection) === String(section.id);
      }),

      assignments: assignments.filter((a) => {
        const assignmentSection =
          a.section || a.section_id || a.course_section || a.course_section_id;

        return String(assignmentSection) === String(section.id);
      }),
    }));
  }, [sections, videos, notes, assignments]);

  const totalCourseDurationSeconds = useMemo(() => {
    return videos.reduce(
      (sum, video) => sum + Number(video.duration_minutes || 0),
      0
    );
  }, [videos]);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleCommentReplyChange = (commentId, value) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: value }));
  };

  const handleReviewReplyChange = (reviewId, value) => {
    setReviewReplyTexts((prev) => ({ ...prev, [reviewId]: value }));
  };

  const submitCommentReply = async (commentId) => {
    const content = (replyTexts[commentId] || "").trim();
    if (!content) return;

    try {
      await API.post(`teacher/courses/${id}/comments/`, {
        content,
        parent: commentId,
      });

      setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
      await loadCourseData();
    } catch (err) {
      console.error("Comment reply error:", err?.response?.data || err);
      alert(err?.response?.data?.error || "Could not reply to this question.");
    }
  };

  const submitReviewReply = async (reviewId) => {
    const reply = (reviewReplyTexts[reviewId] || "").trim();
    if (!reply) return;

    try {
      await API.post(`teacher/reviews/${reviewId}/reply/`, { reply });
      setReviewReplyTexts((prev) => ({ ...prev, [reviewId]: "" }));
      await loadCourseData();
    } catch (err) {
      console.error("Review reply error:", err?.response?.data || err);
      alert(err?.response?.data?.error || "Could not reply to this review.");
    }
  };

  if (loading) {
    return (
      <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div className="view-loading">Loading course...</div>
      </TeacherLayout>
    );
  }

  if (!course) {
    return (
      <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div className="view-loading">Course not found</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="course-view-layout">
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

        <main className="course-view-shell">
          <section className="view-hero">
            <div
              className="view-hero-bg"
              style={{
                backgroundImage: `url(${
                  fixUrl(course.thumbnail) ||
                  "https://picsum.photos/seed/course/900/400"
                })`,
              }}
            />

            <div className="view-hero-shade" />

            <div className="view-hero-content">
              <div className="view-eyebrow">Teacher Course Preview</div>

              <h1 className="view-title">{course.title}</h1>

              <p className="view-desc">
                {course.description || "No description"}
              </p>

              <div className="view-badge-row">
                <span className="view-badge">{course.level || "beginner"}</span>

                <span className="view-badge">
                  {course.is_paid ? `₹${course.price}` : "Free"}
                </span>

                <span
                  className={`view-badge ${
                    course.is_active
                      ? "view-badge-active"
                      : "view-badge-inactive"
                  }`}
                >
                  {course.is_active ? "Active" : "Inactive"}
                </span>

                <span className="view-badge">{sections.length} Sections</span>
                <span className="view-badge">{videos.length} Videos</span>
                <span className="view-badge">{notes.length} Notes</span>
                <span className="view-badge">
                  {assignments.length} Assignments
                </span>
              </div>
            </div>

            <div className="view-hero-actions">
              <button
                className="view-btn-outline"
                onClick={() => navigate("/teacher/courses")}
              >
                ← Back to Courses
              </button>

              <button
                className="view-btn-primary"
                onClick={() => navigate(`/teacher/courses/${id}/edit`)}
              >
                ✎ Edit Course
              </button>
            </div>
          </section>

          <PlaylistBlock
            groupedSections={groupedSections}
            activeVideo={activeVideo}
            setActiveVideo={setActiveVideo}
          />

          <div className="view-main-single">
            <main>
              <div className="view-card">
                <div className="view-player-top">
                  <div>
                    <div className="view-eyebrow">Now Playing</div>

                    <h2 className="view-player-title">
                      {activeVideo ? activeVideo.title : "No video selected"}
                    </h2>
                  </div>
                </div>

                {activeVideo && getVideoSrc(activeVideo) ? (
                  <video
                    src={getVideoSrc(activeVideo)}
                    controls
                    className="view-video"
                  />
                ) : (
                  <div className="view-empty-player">
                    No playable video selected.
                  </div>
                )}

                {activeVideo?.description && (
                  <p className="view-video-desc">{activeVideo.description}</p>
                )}
              </div>

              <div className="view-tabs">
                {["overview", "curriculum", "qna", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    className={`view-tab${activeTab === tab ? " active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "overview"
                      ? "📋 Overview"
                      : tab === "curriculum"
                      ? "📚 Curriculum"
                      : tab === "qna"
                      ? `💬 Q&A (${comments.length})`
                      : `⭐ Reviews (${reviews.length})`}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="view-card">
                  <h2 className="view-section-title">Course Overview</h2>

                  <p className="view-desc">
                    {course.description || "No description added."}
                  </p>

                  <div className="view-overview-grid">
                    <InfoTile label="Level" value={course.level || "Beginner"} />

                    <InfoTile
                      label="Pricing"
                      value={course.is_paid ? `₹${course.price}` : "Free"}
                    />

                    <InfoTile
                      label="Status"
                      value={course.is_active ? "Active" : "Inactive"}
                    />

                    <InfoTile
                      label="Duration"
                      value={
                        totalCourseDurationSeconds
                          ? formatDuration(totalCourseDurationSeconds)
                          : course.duration_hours
                          ? `${course.duration_hours} hr`
                          : "Not calculated"
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === "curriculum" && (
                <div className="view-card">
                  <h2 className="view-section-title">Course Curriculum</h2>

                  {groupedSections.length === 0 ? (
                    <div className="view-empty">No sections added yet.</div>
                  ) : (
                    groupedSections.map((section, index) => (
                      <div key={section.id} className="view-accordion-card">
                        <button
                          className="view-accordion-head"
                          onClick={() => toggleSection(section.id)}
                        >
                          <div>
                            <span className="view-small-badge">
                              Section {index + 1}
                            </span>

                            <h3 className="view-section-name">
                              {section.title}
                            </h3>
                          </div>

                          <span className="view-count-badge">
                            {section.videos.length} videos ·{" "}
                            {section.notes.length} notes ·{" "}
                            {section.assignments.length} assignments{" "}
                            {openSections[section.id] ? "▲" : "▼"}
                          </span>
                        </button>

                        {openSections[section.id] && (
                          <div className="view-accordion-body">
                            <ContentBox
                              title="Videos"
                              items={section.videos}
                              type="video"
                              onVideoClick={setActiveVideo}
                              fixUrl={fixUrl}
                            />

                            <ContentBox
                              title="Notes"
                              items={section.notes}
                              type="note"
                              fixUrl={fixUrl}
                            />

                            <ContentBox
                              title="Assignments"
                              items={section.assignments}
                              type="assignment"
                              fixUrl={fixUrl}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "qna" && (
                <div className="view-card">
                  <h2 className="view-section-title">Course Q&A</h2>

                  <p className="view-helper">
                    Reply to student questions. Instructor answers are highlighted and kept separate from student replies.
                  </p>

                  {comments.length === 0 ? (
                    <div className="view-empty">No questions asked yet.</div>
                  ) : (
                    <div className="view-discussion-list">
                      {comments.map((comment) => {
                        const replies = Array.isArray(comment.replies)
                          ? comment.replies
                          : [];

                        const studentReplies = replies.filter(
                          (reply) => !reply.is_instructor_reply
                        );

                        const instructorReplies = replies.filter(
                          (reply) => reply.is_instructor_reply
                        );

                        const hasInstructorAnswer =
                          instructorReplies.length > 0;

                        return (
                          <div key={comment.id} className="view-discussion-card">
                            <div className="view-discussion-top">
                              <div>
                                <strong className="view-discussion-name">
                                  {comment.username || "Student"}
                                </strong>

                                <div className="view-role-row">
                                  <span className="view-pill view-student-pill">
                                    Student
                                  </span>

                                  {hasInstructorAnswer && (
                                    <span className="view-pill view-answered-pill">
                                      Answered
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className="view-date">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>

                            <p className="view-discussion-text">
                              {comment.content}
                            </p>

                            {studentReplies.length > 0 && (
                              <div className="view-student-reply-list">
                                <div className="view-reply-section-label">
                                  Student replies
                                </div>

                                {studentReplies.map((reply) => (
                                  <div key={reply.id} className="view-reply-card">
                                    <div className="view-reply-header">
                                      <strong>
                                        {reply.username || "Student"}
                                      </strong>

                                      <span className="view-pill view-student-pill">
                                        Student
                                      </span>
                                    </div>

                                    <p className="view-reply-text">
                                      {reply.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {instructorReplies.length > 0 && (
                              <div className="view-instructor-reply-list">
                                <div className="view-instructor-answer-label">
                                  ✔ Instructor answer
                                </div>

                                {instructorReplies.map((reply) => (
                                  <div key={reply.id} className="view-reply-card">
                                    <div className="view-reply-header">
                                      <strong>{reply.username || "Teacher"}</strong>

                                      <span className="view-pill view-instructor-pill">
                                        ✔ Instructor
                                      </span>
                                    </div>

                                    <p className="view-reply-text">
                                      {reply.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="view-reply-box">
                              <textarea
                                className="view-reply-input"
                                placeholder={
                                  hasInstructorAnswer
                                    ? "Add another instructor reply..."
                                    : "Write instructor answer..."
                                }
                                value={replyTexts[comment.id] || ""}
                                onChange={(e) =>
                                  handleCommentReplyChange(
                                    comment.id,
                                    e.target.value
                                  )
                                }
                              />

                              <button
                                className="view-mini-btn"
                                onClick={() => submitCommentReply(comment.id)}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="view-card">
                  <h2 className="view-section-title">Course Reviews</h2>

                  <p className="view-helper">
                    View student feedback and reply to reviews from your students.
                  </p>

                  {reviews.length === 0 ? (
                    <div className="view-empty">No reviews yet.</div>
                  ) : (
                    <div className="view-discussion-list">
                      {reviews.map((review) => (
                        <div key={review.id} className="view-discussion-card">
                          <div className="view-discussion-top">
                            <div>
                              <strong className="view-discussion-name">
                                {review.student_name || "Student"}
                              </strong>

                              <div className="view-stars">
                                {"★".repeat(Number(review.rating || 0))}
                              </div>
                            </div>

                            <span className="view-date">
                              {formatDate(review.created_at)}
                            </span>
                          </div>

                          <p className="view-discussion-text">
                            {review.comment || "No written review."}
                          </p>

                          {review.teacher_reply ? (
                            <div className="view-reply-card">
                              <div className="view-reply-header">
                                <strong>
                                  {review.teacher_reply.teacher_name || "Teacher"}
                                </strong>

                                <span className="view-pill view-instructor-pill">
                                  Teacher Reply
                                </span>
                              </div>

                              <p className="view-reply-text">
                                {review.teacher_reply.reply}
                              </p>
                            </div>
                          ) : (
                            <div className="view-reply-box">
                              <textarea
                                className="view-reply-input"
                                placeholder="Reply to this review..."
                                value={reviewReplyTexts[review.id] || ""}
                                onChange={(e) =>
                                  handleReviewReplyChange(
                                    review.id,
                                    e.target.value
                                  )
                                }
                              />

                              <button
                                className="view-mini-btn"
                                onClick={() => submitReviewReply(review.id)}
                              >
                                Reply to Review
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </main>
      </div>
    </TeacherLayout>
  );
}

function PlaylistBlock({ groupedSections, activeVideo, setActiveVideo }) {
  const [selectedSectionId, setSelectedSectionId] = useState("");

  useEffect(() => {
    if (!selectedSectionId && groupedSections.length > 0) {
      setSelectedSectionId(String(groupedSections[0].id));
    }
  }, [groupedSections, selectedSectionId]);

  const selectedSection =
    groupedSections.find(
      (section) => String(section.id) === String(selectedSectionId)
    ) || groupedSections[0];

  const totalVideos = groupedSections.reduce(
    (sum, section) => sum + section.videos.length,
    0
  );

  const totalNotes = groupedSections.reduce(
    (sum, section) => sum + section.notes.length,
    0
  );

  const totalAssignments = groupedSections.reduce(
    (sum, section) => sum + section.assignments.length,
    0
  );

  return (
    <section className="view-playlist-wide">
      <div className="view-playlist-head">
        <div>
          <div className="view-eyebrow">Course Playlist</div>
          <h2 className="view-playlist-title">Lessons by Section</h2>
          <p className="view-playlist-sub">
            Select a section tab to view its videos below.
          </p>
        </div>

        <div className="view-playlist-summary">
          <span className="view-summary-pill">
            {groupedSections.length} Sections
          </span>
          <span className="view-summary-pill">{totalVideos} Videos</span>
          <span className="view-summary-pill">{totalNotes} Notes</span>
          <span className="view-summary-pill">
            {totalAssignments} Assignments
          </span>
        </div>
      </div>

      {groupedSections.length === 0 ? (
        <div className="view-empty">No playlist content added yet.</div>
      ) : (
        <>
          <div className="view-section-tab-row">
            {groupedSections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                className={`view-section-tab-btn ${
                  String(selectedSection?.id) === String(section.id)
                    ? "active"
                    : ""
                }`}
                onClick={() => setSelectedSectionId(String(section.id))}
              >
                <span className="view-section-tab-top">
                  <span className="view-section-tab-number">{index + 1}</span>

                  <span className="view-section-tab-title">
                    {section.title}
                  </span>
                </span>

                <span className="view-section-tab-meta">
                  {section.videos.length} video
                  {section.videos.length === 1 ? "" : "s"} ·{" "}
                  {section.notes.length} note
                  {section.notes.length === 1 ? "" : "s"} ·{" "}
                  {section.assignments.length} assignment
                  {section.assignments.length === 1 ? "" : "s"}
                </span>
              </button>
            ))}
          </div>

          <div className="view-selected-section-panel">
            <div className="view-selected-section-head">
              <div>
                <h3 className="view-selected-section-title">
                  {selectedSection?.title || "Selected Section"}
                </h3>

                <div className="view-selected-section-meta">
                  {selectedSection?.videos?.length || 0} video lesson
                  {(selectedSection?.videos?.length || 0) === 1 ? "" : "s"} ·{" "}
                  {selectedSection?.notes?.length || 0} note
                  {(selectedSection?.notes?.length || 0) === 1 ? "" : "s"} ·{" "}
                  {selectedSection?.assignments?.length || 0} assignment
                  {(selectedSection?.assignments?.length || 0) === 1 ? "" : "s"}
                </div>
              </div>

              <span className="view-summary-pill">
                Section{" "}
                {groupedSections.findIndex(
                  (section) =>
                    String(section.id) === String(selectedSection?.id)
                ) + 1}
              </span>
            </div>

            {!selectedSection || selectedSection.videos.length === 0 ? (
              <div className="view-empty">
                No videos added in this section.
              </div>
            ) : (
              <div className="view-lesson-list">
                {selectedSection.videos.map((video, videoIndex) => (
                  <button
                    key={video.id}
                    type="button"
                    className={`view-lesson-row ${
                      activeVideo?.id === video.id ? "active" : ""
                    }`}
                    onClick={() => setActiveVideo(video)}
                  >
                    <span className="view-lesson-play">▶</span>

                    <span>
                      <p className="view-lesson-title">
                        {videoIndex + 1}. {video.title}
                        {activeVideo?.id === video.id && (
                          <span className="view-lesson-tag">Now Playing</span>
                        )}
                      </p>

                      <div className="view-lesson-meta">
                        {video.description
                          ? video.description.slice(0, 90)
                          : "Video lesson"}
                      </div>
                    </span>

                    <span className="view-lesson-duration">
                      {video.duration_minutes
                        ? formatDuration(video.duration_minutes)
                        : "Lesson"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

function formatDuration(seconds) {
  const total = Number(seconds || 0);

  if (!total) return "Video lesson";

  if (total < 60) {
    return `${total} sec`;
  }

  const mins = Math.floor(total / 60);
  const secs = total % 60;

  if (mins < 60) {
    return secs ? `${mins} min ${secs} sec` : `${mins} min`;
  }

  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;

  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function InfoTile({ label, value }) {
  return (
    <div className="view-info-tile">
      <span className="view-info-label">{label}</span>
      <strong className="view-info-value">{value}</strong>
    </div>
  );
}

function ContentBox({ title, items, type, onVideoClick, fixUrl }) {
  return (
    <div className="view-content-box">
      <h4 className="view-box-title">{title}</h4>

      {items.length === 0 ? (
        <p className="view-empty-small">No {title.toLowerCase()} added.</p>
      ) : (
        <div className="view-list">
          {items.map((item, index) => (
            <div key={item.id} className="view-list-item">
              <div>
                <span className="view-mini-badge">
                  {type === "video" ? "▶" : type === "note" ? "📄" : "📝"}{" "}
                  {type} {index + 1}
                </span>

                <div className="view-item-title">
                  {item.title || "Untitled"}
                </div>
              </div>

              {type === "video" && (
                <button
                  className="view-mini-btn"
                  onClick={() => onVideoClick(item)}
                >
                  Play
                </button>
              )}

              {type !== "video" && item.attachment && (
                <a
                  className="view-mini-btn"
                  href={fixUrl(item.attachment)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}