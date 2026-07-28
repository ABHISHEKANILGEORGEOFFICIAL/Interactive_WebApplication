import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import logo from "../../assets/logo.png";

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

const STEP_LABELS = [
  "Details",
  "Sections",
  "Videos",
  "Notes",
  "Assignments",
  "Publish",
];

const COURSE_STYLES = `
  .course-create-layout {
    display:grid;
    grid-template-columns:220px 1fr;
    gap:22px;
    max-width:1180px;
    margin:0 auto;
    padding:108px 28px 60px;
  }

  .course-main-grid {
    display:grid;
    grid-template-columns:1fr 310px;
    gap:20px;
    align-items:start;
  }

  .course-card,
  .course-side-card,
  .course-success-card {
    background:rgba(10,28,16,0.92);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:24px;
    padding:32px;
    backdrop-filter:blur(12px);
    color:#e8f0e2;
  }

  .course-side-card {
    padding:22px;
    margin-bottom:16px;
    position:sticky;
    top:100px;
  }

  .course-title {
    font-size:24px;
    font-weight:900;
    margin:0 0 6px;
    color:#F5C518;
  }

  .course-subtitle {
    font-size:13px;
    color:rgba(180,230,180,0.65);
    margin:0 0 26px;
    line-height:1.6;
  }

  .course-label {
    display:block;
    font-size:13px;
    font-weight:800;
    margin-bottom:10px;
    color:#e8f0e2;
  }

  .course-group {
    margin-bottom:18px;
  }

  .course-input,
  .course-select,
  .course-textarea {
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

  .course-input::placeholder,
  .course-textarea::placeholder {
    color:#999;
  }

  .course-input:focus,
  .course-select:focus,
  .course-textarea:focus {
    border-color:rgba(245,197,24,0.7);
    box-shadow:0 0 0 3px rgba(245,197,24,0.08);
  }

  .course-textarea {
    min-height:120px;
    resize:vertical;
  }

  .course-two-grid {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
  }

  .course-btn-primary {
    background:#F5C518;
    color:#1a3010;
    border:none;
    border-radius:14px;
    padding:13px 24px;
    font-weight:900;
    font-size:14px;
    cursor:pointer;
    font-family:inherit;
    transition:opacity .15s, transform .15s;
  }

  .course-btn-primary:hover {
    opacity:0.9;
    transform:translateY(-1px);
  }

  .course-btn-primary:disabled {
    opacity:0.5;
    cursor:not-allowed;
    transform:none;
  }

  .course-btn-outline {
    background:transparent;
    color:rgba(180,230,180,0.75);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:14px;
    padding:13px 24px;
    font-weight:800;
    font-size:14px;
    cursor:pointer;
    font-family:inherit;
    transition:background .12s, color .12s;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }

  .course-btn-outline:hover {
    background:rgba(245,197,24,0.08);
    color:#F5C518;
  }

  .course-actions {
    display:flex;
    justify-content:space-between;
    gap:12px;
    flex-wrap:wrap;
    margin-top:22px;
  }

  .course-actions-right {
    display:flex;
    justify-content:flex-end;
    gap:12px;
    flex-wrap:wrap;
    margin-top:22px;
  }

  .course-eyebrow {
    font-size:10px;
    font-weight:900;
    color:rgba(160,210,170,0.45);
    letter-spacing:2px;
    text-transform:uppercase;
    margin-bottom:12px;
  }

  .course-divider {
    font-size:10px;
    font-weight:900;
    color:rgba(160,210,170,0.45);
    letter-spacing:2px;
    text-transform:uppercase;
    margin:24px 0 16px;
    padding-top:18px;
    border-top:1px solid rgba(120,200,145,0.18);
  }

  .course-stepbar {
    display:flex;
    align-items:center;
    margin-bottom:26px;
    overflow-x:auto;
    padding-bottom:4px;
  }

  .course-step-item {
    display:flex;
    align-items:center;
    flex:1;
    min-width:110px;
  }

  .course-step-dot {
    width:34px;
    height:34px;
    border-radius:50%;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:14px;
    font-weight:900;
  }

  .course-step-label {
    font-size:12px;
    font-weight:800;
    margin-left:8px;
    white-space:nowrap;
  }

  .course-step-line {
    flex:1;
    height:2px;
    margin:0 10px;
    min-width:18px;
  }

  .subject-grid {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:10px;
  }

  .subject-option {
    border:1px solid rgba(120,200,145,0.22);
    border-radius:14px;
    padding:14px 10px;
    text-align:center;
    cursor:pointer;
    background:rgba(245,197,24,0.04);
    transition:all .15s;
  }

  .subject-option:hover,
  .subject-option.selected {
    background:rgba(245,197,24,0.16);
    border-color:#F5C518;
  }

  .subject-option input {
    display:none;
  }

  .subject-icon {
    font-size:22px;
    margin-bottom:5px;
  }

  .subject-name {
    font-size:12px;
    font-weight:900;
    color:rgba(180,230,180,0.7);
    line-height:1.3;
  }

  .subject-option.selected .subject-name {
    color:#F5C518;
  }

  .section-card {
    background:rgba(245,197,24,0.06);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:16px;
    padding:15px;
    margin-bottom:10px;
    cursor:pointer;
    transition:all .15s;
  }

  .section-card:hover,
  .section-card.selected {
    background:rgba(245,197,24,0.14);
    border-color:#F5C518;
  }

  .section-card-title {
    font-size:14px;
    font-weight:900;
    color:#e8f0e2;
    margin-bottom:4px;
  }

  .section-card-sub {
    font-size:11px;
    color:rgba(180,230,180,0.55);
  }

  .content-list {
    display:grid;
    gap:10px;
    margin-top:18px;
  }

  .content-item {
    background:rgba(245,197,24,0.06);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:16px;
    padding:15px;
  }

  .content-badge {
    display:inline-flex;
    font-size:10px;
    font-weight:900;
    letter-spacing:1px;
    text-transform:uppercase;
    background:#F5C518;
    color:#1a3010;
    padding:5px 10px;
    border-radius:999px;
    margin-bottom:9px;
  }

  .content-title {
    font-size:15px;
    font-weight:900;
    color:#e8f0e2;
    margin-bottom:5px;
  }

  .content-meta {
    font-size:12px;
    color:rgba(180,230,180,0.6);
  }

  .empty-box {
    border:1px dashed rgba(120,200,145,0.28);
    border-radius:16px;
    padding:20px;
    color:rgba(180,230,180,0.55);
    text-align:center;
    background:rgba(245,197,24,0.03);
    font-size:13px;
  }

  .summary-row {
    padding-bottom:13px;
    margin-bottom:13px;
    border-bottom:1px solid rgba(120,200,145,0.14);
  }

  .summary-row:last-child {
    border-bottom:none;
    margin-bottom:0;
    padding-bottom:0;
  }

  .summary-label {
    font-size:10px;
    font-weight:900;
    color:rgba(160,210,170,0.45);
    letter-spacing:1px;
    text-transform:uppercase;
    margin-bottom:5px;
  }

  .summary-value {
    font-size:13px;
    font-weight:800;
    color:#e8f0e2;
    word-break:break-word;
  }

  .tip-list {
    margin:0;
    padding-left:18px;
    color:rgba(180,230,180,0.66);
    font-size:13px;
    line-height:1.8;
  }

  .thumbnail-preview {
    width:100%;
    max-height:190px;
    object-fit:cover;
    border-radius:16px;
    border:1px solid rgba(120,200,145,0.22);
    margin-top:12px;
  }

  .review-box {
    background:rgba(245,197,24,0.1);
    border:1px solid rgba(245,197,24,0.28);
    border-radius:16px;
    padding:18px;
    margin-top:18px;
  }

  .success-logo-wrap {
    width:112px;
    height:112px;
    border-radius:50%;
    margin:0 auto 20px;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#F5C518;
    box-shadow:0 14px 34px rgba(245,197,24,0.25);
  }

  .success-logo {
    width:82px;
    height:82px;
    object-fit:contain;
    border-radius:50%;
  }

  .course-success-card {
    text-align:center;
    padding:46px 28px;
  }

  .course-success-title {
    font-size:26px;
    font-weight:900;
    color:#F5C518;
    margin:0 0 10px;
  }

  .course-success-text {
    color:rgba(180,230,180,0.7);
    line-height:1.8;
    font-size:14px;
    margin-bottom:22px;
  }

  @media(max-width:1050px) {
    .course-main-grid {
      grid-template-columns:1fr;
    }

    .course-side-card {
      position:static;
    }
  }

  @media(max-width:860px) {
    .course-create-layout {
      grid-template-columns:1fr;
      padding:100px 16px 40px;
    }

    .subject-grid {
      grid-template-columns:repeat(2,1fr);
    }
  }

  @media(max-width:560px) {
    .course-card,
    .course-side-card,
    .course-success-card {
      padding:22px;
    }

    .course-two-grid {
      grid-template-columns:1fr;
    }

    .subject-grid {
      grid-template-columns:1fr;
    }

    .course-actions {
      flex-direction:column;
    }

    .course-btn-primary,
    .course-btn-outline {
      width:100%;
    }
  }
`;

const getSubjectIcon = (label = "") => {
  const value = label.toLowerCase();
  if (value.includes("math")) return "📐";
  if (value.includes("physics")) return "⚡";
  if (value.includes("chem")) return "🧪";
  if (value.includes("bio")) return "🌿";
  if (value.includes("english") || value.includes("language")) return "📖";
  if (value.includes("history")) return "🏛";
  if (value.includes("geo")) return "🌍";
  if (value.includes("computer") || value.includes("data") || value.includes("cs") || value.includes("it")) return "💻";
  if (value.includes("commerce") || value.includes("economic")) return "📊";
  if (value.includes("social")) return "👥";
  return "📚";
};

export default function CourseCreate() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [ddOpen, setDdOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const [course, setCourse] = useState({
    title: "",
    description: "",
    subject: "",
    thumbnail: null,
    is_paid: false,
    price: 0,
    level: "beginner",
  });

  const [sectionTitle, setSectionTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [videoForm, setVideoForm] = useState({
    title: "",
    video_file: null,
  });

  const [noteForm, setNoteForm] = useState({
    title: "",
    attachment: null,
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    attachment: null,
  });

  const [videosBySection, setVideosBySection] = useState({});
  const [notesBySection, setNotesBySection] = useState({});
  const [assignmentsBySection, setAssignmentsBySection] = useState({});

  useEffect(() => {
    const styleId = "saha-course-create-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = COURSE_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const subRes = await API.get("subjects/?my_subjects=true");
        setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      } catch (err) {
        console.error("Subject dropdown load error:", err?.response?.data || err);
        setSubjects([]);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (courseId) {
      loadSections();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedSectionId && courseId) {
      loadSectionContent(selectedSectionId);
    }
  }, [selectedSectionId, courseId]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const selectedSubjectName = useMemo(() => {
    const found = subjects.find((s) => String(s.id) === String(course.subject));
    return found ? found.subject_name || found.name : "Not selected";
  }, [subjects, course.subject]);

  const selectedSection = useMemo(() => {
    return sections.find((s) => String(s.id) === String(selectedSectionId));
  }, [sections, selectedSectionId]);

  const totalVideos = useMemo(() => {
    return Object.values(videosBySection).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  }, [videosBySection]);

  const totalNotes = useMemo(() => {
    return Object.values(notesBySection).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  }, [notesBySection]);

  const totalAssignments = useMemo(() => {
    return Object.values(assignmentsBySection).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  }, [assignmentsBySection]);

  const getErrorMessage = (err, fallback = "Something went wrong") => {
    const data = err?.response?.data;
    if (typeof data === "string") return data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data && typeof data === "object") {
      return Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n");
    }
    return fallback;
  };

  const submitCourse = async (formData) => {
    return await API.post("teacher/courses/", formData);
  };

  const validateCourseDetails = () => {
    if (!course.title.trim()) {
      alert("Please enter a course title");
      return false;
    }
    if (!course.description.trim()) {
      alert("Please enter a course description");
      return false;
    }
    if (!course.subject) {
      alert("Please select a subject");
      return false;
    }
    if (course.is_paid && Number(course.price) <= 0) {
      alert("Please enter a valid price for paid course");
      return false;
    }
    return true;
  };

  const createCourse = async () => {
    if (!validateCourseDetails()) return;

    if (courseId) {
      setStep(2);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", course.title);
      formData.append("description", course.description);
      formData.append("subject", course.subject);
      formData.append("is_paid", course.is_paid ? "true" : "false");
      formData.append("price", course.is_paid ? course.price : 0);
      formData.append("level", course.level);
      formData.append("duration_hours", 1);
      formData.append("is_active", "false");

      if (course.thumbnail) {
        formData.append("thumbnail", course.thumbnail);
      }

      const res = await submitCourse(formData);
      const id = res.data?.id;

      if (!id) {
        alert("Course created but ID missing");
        return;
      }

      setCourseId(id);
      setStep(2);
    } catch (err) {
      console.error("Course create error:", err?.response?.data || err);
      alert("Failed to create course:\n" + getErrorMessage(err));
    }
  };

  const publishCourse = async () => {
    if (!courseId) {
      alert("Course not created yet");
      return;
    }

    if (!sections.length) {
      alert("Please add at least one section before publishing");
      return;
    }

    try {
      setPublishing(true);

      await API.put(`teacher/courses/${courseId}/`, {
        is_active: true,
      });

      setStep(6);

      setTimeout(() => {
        navigate("/teacher/courses");
      }, 5000);
    } catch (err) {
      console.error("Publish error:", err?.response?.data || err);
      alert("Failed to publish course:\n" + getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  const loadSections = async () => {
    if (!courseId) return;

    try {
      const res = await API.get("teacher/sections/");
      const allSections = Array.isArray(res.data) ? res.data : [];
      const filtered = allSections.filter(
        (item) => String(item.course) === String(courseId)
      );

      setSections(filtered);

      if (!selectedSectionId && filtered.length > 0) {
        setSelectedSectionId(filtered[0].id);
      }
    } catch (err) {
      console.error("Load sections error:", err?.response?.data || err);
    }
  };

  const addSection = async () => {
    if (!courseId) {
      alert("Please save the course draft first");
      return;
    }
    if (!sectionTitle.trim()) {
      alert("Please enter a section title");
      return;
    }

    try {
      const res = await API.post("teacher/sections/", {
        course: courseId,
        title: sectionTitle,
        sort_order: sections.length + 1,
      });

      const newSection = res.data;
      const updated = [...sections, newSection];

      setSections(updated);
      setSelectedSectionId(newSection.id);
      setSectionTitle("");
    } catch (err) {
      console.error("Section error:", err?.response?.data || err);
      alert("Section error:\n" + getErrorMessage(err));
    }
  };

  const loadSectionContent = async (sectionId) => {
    if (!courseId || !sectionId) return;

    try {
      const [videosRes, notesRes, assignmentsRes] = await Promise.all([
        API.get("teacher/videos/"),
        API.get("teacher/notes/"),
        API.get("teacher/assignments/"),
      ]);

      const allVideos = Array.isArray(videosRes.data) ? videosRes.data : [];
      const filteredVideos = allVideos.filter(
        (v) =>
          String(v.course) === String(courseId) &&
          String(v.section) === String(sectionId)
      );

      setVideosBySection((prev) => ({
        ...prev,
        [sectionId]: filteredVideos,
      }));

      const allNotes = Array.isArray(notesRes.data) ? notesRes.data : [];
      const filteredNotes = allNotes.filter(
        (n) =>
          String(n.course) === String(courseId) &&
          String(n.section) === String(sectionId)
      );

      setNotesBySection((prev) => ({
        ...prev,
        [sectionId]: filteredNotes,
      }));

      const allAssignments = Array.isArray(assignmentsRes.data)
        ? assignmentsRes.data
        : [];

      const filteredAssignments = allAssignments.filter(
        (a) =>
          String(a.course) === String(courseId) &&
          String(a.section) === String(sectionId)
      );

      setAssignmentsBySection((prev) => ({
        ...prev,
        [sectionId]: filteredAssignments,
      }));
    } catch (err) {
      console.error("Load section content error:", err?.response?.data || err);
    }
  };

  const isVideoFile = (file) => file?.type?.startsWith("video/");

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    setCourse({ ...course, thumbnail: file });
    setThumbnailPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && !isVideoFile(file)) {
      alert("Please upload only a video file.");
      e.target.value = "";
      setVideoForm({ ...videoForm, video_file: null });
      return;
    }

    setVideoForm({ ...videoForm, video_file: file });
  };

  const handleNoteFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && isVideoFile(file)) {
      alert("Video files are not allowed for notes.");
      e.target.value = "";
      setNoteForm({ ...noteForm, attachment: null });
      return;
    }

    setNoteForm({ ...noteForm, attachment: file });
  };

  const handleAssignmentFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && isVideoFile(file)) {
      alert("Video files are not allowed for assignments.");
      e.target.value = "";
      setAssignmentForm({ ...assignmentForm, attachment: null });
      return;
    }

    setAssignmentForm({ ...assignmentForm, attachment: file });
  };

  const uploadVideo = async () => {
    if (!courseId) {
      alert("Please save the course draft first");
      return;
    }
    if (!selectedSectionId) {
      alert("Please select a section");
      return;
    }
    if (!videoForm.title.trim()) {
      alert("Please enter a video title");
      return;
    }
    if (!videoForm.video_file) {
      alert("Please choose a video file");
      return;
    }
    if (!isVideoFile(videoForm.video_file)) {
      alert("Please upload only a video file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("course", courseId);
      formData.append("section", selectedSectionId);
      formData.append("title", videoForm.title);
      formData.append("media_file", videoForm.video_file);

      await API.post("teacher/videos/", formData);

      setVideoForm({
        title: "",
        video_file: null,
      });

      await loadSectionContent(selectedSectionId);
      alert("Video uploaded");
    } catch (err) {
      console.error("Video error:", err?.response?.data || err);
      alert("Video error:\n" + getErrorMessage(err));
    }
  };

  const uploadNote = async () => {
    if (!courseId) {
      alert("Please save the course draft first");
      return;
    }
    if (!selectedSectionId) {
      alert("Please select a section");
      return;
    }
    if (!noteForm.title.trim()) {
      alert("Please enter a note title");
      return;
    }
    if (!noteForm.attachment) {
      alert("Please choose a note file");
      return;
    }
    if (isVideoFile(noteForm.attachment)) {
      alert("Video files are not allowed for notes.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("course", courseId);
      formData.append("section", selectedSectionId);
      formData.append("title", noteForm.title);
      formData.append("content", "");
      formData.append("attachment", noteForm.attachment);

      await API.post("teacher/notes/", formData);

      setNoteForm({
        title: "",
        attachment: null,
      });

      await loadSectionContent(selectedSectionId);
      alert("Note uploaded");
    } catch (err) {
      console.error("Note error:", err?.response?.data || err);
      alert("Note error:\n" + getErrorMessage(err));
    }
  };

  const uploadAssignment = async () => {
    if (!courseId) {
      alert("Please save the course draft first");
      return;
    }
    if (!selectedSectionId) {
      alert("Please select a section");
      return;
    }
    if (!assignmentForm.title.trim()) {
      alert("Please enter an assignment title");
      return;
    }
    if (!assignmentForm.attachment) {
      alert("Please choose an assignment file");
      return;
    }
    if (isVideoFile(assignmentForm.attachment)) {
      alert("Video files are not allowed for assignments.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("course", courseId);
      formData.append("section", selectedSectionId);
      formData.append("title", assignmentForm.title);
      formData.append("description", "");
      formData.append("attachment", assignmentForm.attachment);

      await API.post("teacher/assignments/", formData);

      setAssignmentForm({
        title: "",
        attachment: null,
      });

      await loadSectionContent(selectedSectionId);
      alert("Assignment uploaded");
    } catch (err) {
      console.error("Assignment error:", err?.response?.data || err);
      alert("Assignment error:\n" + getErrorMessage(err));
    }
  };

  const resetForm = () => {
    setStep(1);
    setCourseId(null);
    setCourse({
      title: "",
      description: "",
      subject: "",
      thumbnail: null,
      is_paid: false,
      price: 0,
      level: "beginner",
    });
    setSectionTitle("");
    setSections([]);
    setSelectedSectionId("");
    setVideoForm({ title: "", video_file: null });
    setNoteForm({ title: "", attachment: null });
    setAssignmentForm({ title: "", attachment: null });
    setVideosBySection({});
    setNotesBySection({});
    setAssignmentsBySection({});

    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview("");
    }
  };

  const StepBar = () => (
    <div className="course-stepbar">
      {STEP_LABELS.map((label, index) => {
        const number = index + 1;
        const done = step > number;
        const active = step === number;

        return (
          <div key={label} className="course-step-item">
            <div
              className="course-step-dot"
              style={{
                border: done
                  ? "2.5px solid #5eead4"
                  : active
                  ? "2.5px solid #F5C518"
                  : "2.5px solid rgba(120,200,145,0.22)",
                background: done
                  ? "#5eead4"
                  : active
                  ? "#F5C518"
                  : "rgba(245,197,24,0.06)",
                color: done || active ? "#1a3010" : "rgba(160,210,170,0.4)",
              }}
            >
              {done ? "✓" : number}
            </div>

            <span
              className="course-step-label"
              style={{
                color: active
                  ? "#F5C518"
                  : done
                  ? "#5eead4"
                  : "rgba(160,210,170,0.4)",
              }}
            >
              {label}
            </span>

            {index < STEP_LABELS.length - 1 && (
              <div
                className="course-step-line"
                style={{
                  background: done ? "#5eead4" : "rgba(120,200,145,0.18)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="course-card">
          <div className="course-eyebrow">Step 1</div>
          <h2 className="course-title">📚 Course Details</h2>
          <p className="course-subtitle">
            Add the main information for your recorded course. This will be saved as a private draft first.
          </p>

          <div className="course-group">
            <label className="course-label">Choose Subject</label>

            {subjects.length === 0 ? (
              <div className="empty-box">No subjects found. Add subjects from admin first.</div>
            ) : (
              <div className="subject-grid">
                {subjects.map((subject) => {
                  const label = subject.subject_name || subject.name || `Subject ${subject.id}`;
                  const value = String(subject.id);
                  const selected = String(course.subject) === value;

                  return (
                    <label
                      key={subject.id}
                      className={`subject-option ${selected ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="subject"
                        value={value}
                        checked={selected}
                        onChange={() => setCourse({ ...course, subject: value })}
                      />
                      <div className="subject-icon">{getSubjectIcon(label)}</div>
                      <div className="subject-name">{label}</div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="course-group">
            <label className="course-label">Course Title</label>
            <input
              className="course-input"
              placeholder="e.g. Data Structures Complete Course"
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </div>

          <div className="course-group">
            <label className="course-label">Description</label>
            <textarea
              className="course-textarea"
              placeholder="What will students learn in this course?"
              value={course.description}
              onChange={(e) =>
                setCourse({ ...course, description: e.target.value })
              }
            />
          </div>

          <div className="course-two-grid">
            <div className="course-group">
              <label className="course-label">Level</label>
              <select
                className="course-select"
                value={course.level}
                onChange={(e) =>
                  setCourse({ ...course, level: e.target.value })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="course-group">
              <label className="course-label">Pricing Type</label>
              <select
                className="course-select"
                value={course.is_paid.toString()}
                onChange={(e) =>
                  setCourse({ ...course, is_paid: e.target.value === "true" })
                }
              >
                <option value="false">Free</option>
                <option value="true">Paid</option>
              </select>
            </div>
          </div>

          <div className="course-two-grid">
            <div className="course-group">
              <label className="course-label">Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                className="course-input"
                onChange={handleThumbnailChange}
              />

              {thumbnailPreview && (
                <img
                  src={thumbnailPreview}
                  alt="Course thumbnail preview"
                  className="thumbnail-preview"
                />
              )}
            </div>

            <div className="course-group">
              <label className="course-label">Price</label>
              <input
                type="number"
                className="course-input"
                placeholder="Enter course price"
                value={course.price}
                disabled={!course.is_paid}
                onChange={(e) =>
                  setCourse({
                    ...course,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="course-actions-right">
            <button className="course-btn-primary" onClick={createCourse}>
              Save Draft & Continue →
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="course-card">
          <div className="course-eyebrow">Step 2</div>
          <h2 className="course-title">📂 Add Course Sections</h2>
          <p className="course-subtitle">
            Create chapters or modules for your course. Videos, notes, and assignments will be added under sections.
          </p>

          <div className="course-group">
            <label className="course-label">Section Title</label>
            <input
              className="course-input"
              placeholder="e.g. Chapter 1 - Introduction"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
          </div>

          <div className="course-actions-right">
            <button className="course-btn-primary" onClick={addSection}>
              Add Section
            </button>
          </div>

          <div className="course-divider">Added Sections</div>

          {sections.length === 0 ? (
            <div className="empty-box">No sections added yet.</div>
          ) : (
            sections.map((section, index) => (
              <div
                key={section.id}
                className={`section-card ${
                  String(selectedSectionId) === String(section.id) ? "selected" : ""
                }`}
                onClick={() => setSelectedSectionId(section.id)}
              >
                <div className="section-card-title">
                  Section {index + 1}: {section.title}
                </div>
                <div className="section-card-sub">
                  {String(selectedSectionId) === String(section.id)
                    ? "Selected for next uploads"
                    : "Click to select this section"}
                </div>
              </div>
            ))
          )}

          <div className="course-actions">
            <button className="course-btn-outline" onClick={() => setStep(1)}>
              ← Back
            </button>

            <button
              className="course-btn-primary"
              onClick={() => {
                if (!sections.length) {
                  alert("Please add at least one section");
                  return;
                }
                if (!selectedSectionId) {
                  alert("Please select a section");
                  return;
                }
                setStep(3);
              }}
            >
              Continue to Videos →
            </button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="course-card">
          <div className="course-eyebrow">Step 3</div>
          <h2 className="course-title">🎥 Upload Videos</h2>
          <p className="course-subtitle">
            Upload video lessons under the selected section. Only video files are allowed here.
          </p>

          <div className="course-group">
            <label className="course-label">Choose Section</label>
            <select
              className="course-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="course-group">
            <label className="course-label">Video Title</label>
            <input
              className="course-input"
              placeholder="e.g. Introduction to the Course"
              value={videoForm.title}
              onChange={(e) =>
                setVideoForm({ ...videoForm, title: e.target.value })
              }
            />
          </div>

          <div className="course-group">
            <label className="course-label">Video File</label>
            <input
              type="file"
              accept="video/*"
              className="course-input"
              onChange={handleVideoFileChange}
            />
          </div>

          <div className="course-actions-right">
            <button className="course-btn-primary" onClick={uploadVideo}>
              Upload Video
            </button>
          </div>

          <div className="course-divider">Videos in Selected Section</div>

          <div className="content-list">
            {(videosBySection[selectedSectionId] || []).length === 0 ? (
              <div className="empty-box">No videos uploaded yet.</div>
            ) : (
              (videosBySection[selectedSectionId] || []).map((item, index) => (
                <div key={item.id} className="content-item">
                  <div className="content-badge">Video {index + 1}</div>
                  <div className="content-title">{item.title}</div>
                  <div className="content-meta">
                    Section: {selectedSection ? selectedSection.title : "Not selected"}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="course-actions">
            <button className="course-btn-outline" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button className="course-btn-primary" onClick={() => setStep(4)}>
              Continue to Notes →
            </button>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="course-card">
          <div className="course-eyebrow">Step 4</div>
          <h2 className="course-title">📝 Upload Notes</h2>
          <p className="course-subtitle">
            Upload PDFs, documents, images, or slides under the selected section. Video files are blocked here.
          </p>

          <div className="course-group">
            <label className="course-label">Choose Section</label>
            <select
              className="course-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="course-group">
            <label className="course-label">Note Title</label>
            <input
              className="course-input"
              placeholder="e.g. Chapter 1 Notes"
              value={noteForm.title}
              onChange={(e) =>
                setNoteForm({ ...noteForm, title: e.target.value })
              }
            />
          </div>

          <div className="course-group">
            <label className="course-label">Note File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
              className="course-input"
              onChange={handleNoteFileChange}
            />
          </div>

          <div className="course-actions-right">
            <button className="course-btn-primary" onClick={uploadNote}>
              Upload Note
            </button>
          </div>

          <div className="course-divider">Notes in Selected Section</div>

          <div className="content-list">
            {(notesBySection[selectedSectionId] || []).length === 0 ? (
              <div className="empty-box">No note files uploaded yet.</div>
            ) : (
              (notesBySection[selectedSectionId] || []).map((item, index) => (
                <div key={item.id} className="content-item">
                  <div className="content-badge">Note {index + 1}</div>
                  <div className="content-title">{item.title}</div>
                  <div className="content-meta">
                    Section: {selectedSection ? selectedSection.title : "Not selected"}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="course-actions">
            <button className="course-btn-outline" onClick={() => setStep(3)}>
              ← Back
            </button>
            <button className="course-btn-primary" onClick={() => setStep(5)}>
              Continue to Assignments →
            </button>
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="course-card">
          <div className="course-eyebrow">Step 5</div>
          <h2 className="course-title">📚 Upload Assignments</h2>
          <p className="course-subtitle">
            Add assignment files under the selected section. Students will see them with the correct chapter.
          </p>

          <div className="course-group">
            <label className="course-label">Choose Section</label>
            <select
              className="course-select"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="course-group">
            <label className="course-label">Assignment Title</label>
            <input
              className="course-input"
              placeholder="e.g. Chapter 1 Assignment"
              value={assignmentForm.title}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  title: e.target.value,
                })
              }
            />
          </div>

          <div className="course-group">
            <label className="course-label">Assignment File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg"
              className="course-input"
              onChange={handleAssignmentFileChange}
            />
          </div>

          <div className="course-actions-right">
            <button className="course-btn-primary" onClick={uploadAssignment}>
              Upload Assignment
            </button>
          </div>

          <div className="course-divider">Assignments in Selected Section</div>

          <div className="content-list">
            {(assignmentsBySection[selectedSectionId] || []).length === 0 ? (
              <div className="empty-box">No assignment files uploaded yet.</div>
            ) : (
              (assignmentsBySection[selectedSectionId] || []).map((item, index) => (
                <div key={item.id} className="content-item">
                  <div className="content-badge">Assignment {index + 1}</div>
                  <div className="content-title">{item.title}</div>
                  <div className="content-meta">
                    Section: {selectedSection ? selectedSection.title : "Not selected"}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="course-actions">
            <button className="course-btn-outline" onClick={() => setStep(4)}>
              ← Back
            </button>
            <button className="course-btn-primary" onClick={() => setStep(6)}>
              Review Course →
            </button>
          </div>
        </div>
      );
    }

    if (step === 6 && !publishing) {
      return (
        <div className="course-card">
          <div className="course-eyebrow">Final Step</div>
          <h2 className="course-title">🚀 Review & Publish</h2>
          <p className="course-subtitle">
            Check your course details before making it visible to students.
          </p>

          <div className="review-box">
            <div className="summary-row">
              <div className="summary-label">Course Title</div>
              <div className="summary-value">{course.title || "Not added"}</div>
            </div>

            <div className="summary-row">
              <div className="summary-label">Subject</div>
              <div className="summary-value">{selectedSubjectName}</div>
            </div>

            <div className="summary-row">
              <div className="summary-label">Level</div>
              <div className="summary-value">{course.level}</div>
            </div>

            <div className="summary-row">
              <div className="summary-label">Pricing</div>
              <div className="summary-value">
                {course.is_paid ? `Paid - ₹${course.price}` : "Free"}
              </div>
            </div>

            <div className="summary-row">
              <div className="summary-label">Curriculum</div>
              <div className="summary-value">
                {sections.length} sections · {totalVideos} videos · {totalNotes} notes · {totalAssignments} assignments
              </div>
            </div>
          </div>

          <div className="course-actions">
            <button className="course-btn-outline" onClick={() => setStep(5)}>
              ← Back
            </button>

            <button
              className="course-btn-primary"
              onClick={publishCourse}
              disabled={publishing}
            >
              {publishing ? "Publishing..." : "Finish & Publish"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="course-success-card">
        <div className="success-logo-wrap">
          <img src={logo} alt="Saha LMS" className="success-logo" />
        </div>

        <h2 className="course-success-title">Course Published Successfully 🚀</h2>

        <p className="course-success-text">
          Your course is now live on <strong>Saha LMS</strong>.
          <br />
          Redirecting to your courses...
        </p>

        <div className="course-actions-right" style={{ justifyContent: "center" }}>
          <button
            className="course-btn-primary"
            onClick={() => navigate("/teacher/courses")}
          >
            View My Courses
          </button>
          <button className="course-btn-outline" onClick={resetForm}>
            Create Another Course
          </button>
        </div>
      </div>
    );
  };

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="course-create-layout">
        <aside>
          <div className="side-menu">
            <Link to="/teacher/home" className="sm-item">
              <span className="sm-ic">🏠</span>Home Feed
            </Link>

            <Link to="/teacher/courses" className="sm-item">
              <span className="sm-ic">🎓</span>My Courses
            </Link>

            <Link to="/teacher/courses/create" className="sm-item active">
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
          <StepBar />

          <div className="course-main-grid">
            <div>{renderStepContent()}</div>

            <aside>
              <div className="course-side-card">
                <div className="course-eyebrow">Summary</div>
                <h3 className="course-title" style={{ fontSize: "20px" }}>
                  Course Preview
                </h3>

                <div className="summary-row">
                  <div className="summary-label">Title</div>
                  <div className="summary-value">
                    {course.title || "Not added yet"}
                  </div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Subject</div>
                  <div className="summary-value">{selectedSubjectName}</div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Status</div>
                  <div className="summary-value">
                    {courseId ? "Draft saved" : "Not created"}
                  </div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Sections</div>
                  <div className="summary-value">{sections.length}</div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Selected Section</div>
                  <div className="summary-value">
                    {selectedSection ? selectedSection.title : "None"}
                  </div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Videos</div>
                  <div className="summary-value">{totalVideos}</div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Notes</div>
                  <div className="summary-value">{totalNotes}</div>
                </div>

                <div className="summary-row">
                  <div className="summary-label">Assignments</div>
                  <div className="summary-value">{totalAssignments}</div>
                </div>
              </div>

              <div className="course-side-card">
                <div className="course-eyebrow">Tips</div>
                <h3 className="course-title" style={{ fontSize: "20px" }}>
                  Before Publishing
                </h3>

                <ul className="tip-list">
                  <li>Step 1 saves a private draft.</li>
                  <li>Students see the course only after publishing.</li>
                  <li>Select the correct section before uploading files.</li>
                  <li>Notes and assignments are blocked from video upload.</li>
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </TeacherLayout>
  );
}