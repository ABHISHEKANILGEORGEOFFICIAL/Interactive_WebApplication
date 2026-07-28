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

const EDIT_TABS = [
  { key: "details", label: "Course Details", icon: "📚" },
  { key: "sections", label: "Sections", icon: "📂" },
  { key: "videos", label: "Videos", icon: "🎥" },
  { key: "notes", label: "Notes", icon: "📝" },
  { key: "assignments", label: "Assignments", icon: "📌" },
];

const EDIT_STYLES = `
  .course-edit-layout {
    display:grid;
    grid-template-columns:220px minmax(0, 1fr);
    gap:22px;
    max-width:1180px;
    margin:0 auto;
    padding:108px 28px 60px;
  }

  .edit-shell {
    min-width:0;
  }

  .edit-card,
  .edit-hero,
  .edit-side-summary {
    background:rgba(10,28,16,0.92);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:24px;
    padding:32px;
    backdrop-filter:blur(12px);
    color:#e8f0e2;
  }

  .edit-hero {
    margin-bottom:16px;
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:18px;
    flex-wrap:wrap;
    background:linear-gradient(135deg, rgba(10,28,16,0.96), rgba(23,55,31,0.94));
  }

  .edit-card {
    margin-bottom:18px;
  }

  .edit-title {
    font-size:26px;
    font-weight:900;
    color:#F5C518;
    margin:0 0 6px;
  }

  .edit-sub {
    font-size:13px;
    color:rgba(180,230,180,0.65);
    margin:0;
    line-height:1.6;
  }

  .edit-hero-actions {
    display:flex;
    gap:10px;
    flex-wrap:wrap;
  }

  .edit-tabs {
    display:flex;
    gap:5px;
    background:rgba(10,28,16,0.92);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:16px;
    padding:6px;
    overflow:auto;
    margin-bottom:16px;
  }

  .edit-tab {
    border:none;
    background:transparent;
    color:rgba(180,230,180,0.62);
    border-radius:12px;
    padding:11px 16px;
    font-size:13px;
    font-weight:800;
    cursor:pointer;
    white-space:nowrap;
    font-family:inherit;
  }

  .edit-tab.active {
    background:#F5C518;
    color:#1a3010;
  }

  .edit-main-grid {
    display:grid;
    grid-template-columns:minmax(0, 1fr) 280px;
    gap:18px;
    align-items:start;
  }

  .edit-side-summary {
    padding:22px;
    position:sticky;
    top:100px;
  }

  .edit-section-title {
    font-size:22px;
    font-weight:900;
    color:#F5C518;
    margin:0 0 8px;
  }

  .edit-small {
    color:rgba(180,230,180,0.62);
    font-size:13px;
    margin:4px 0 18px;
    line-height:1.6;
  }

  .edit-label {
    display:block;
    font-size:13px;
    font-weight:800;
    margin:14px 0 8px;
    color:#e8f0e2;
  }

  .edit-input,
  .edit-textarea,
  .edit-select,
  .edit-file {
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

  .edit-textarea {
    min-height:120px;
    resize:vertical;
  }

  .edit-small-textarea {
    min-height:82px;
    resize:vertical;
  }

  .edit-input:focus,
  .edit-textarea:focus,
  .edit-select:focus,
  .edit-file:focus {
    border-color:rgba(245,197,24,0.7);
    box-shadow:0 0 0 3px rgba(245,197,24,0.08);
  }

  .edit-row {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
    margin-top:8px;
  }

  .edit-check-grid {
    display:flex;
    gap:12px;
    flex-wrap:wrap;
    margin:16px 0;
  }

  .edit-check-card {
    display:flex;
    align-items:center;
    gap:10px;
    background:rgba(245,197,24,0.06);
    border:1px solid rgba(120,200,145,0.22);
    padding:12px 14px;
    border-radius:14px;
    font-weight:900;
    color:#e8f0e2;
    cursor:pointer;
  }

  .edit-btn-row {
    display:flex;
    justify-content:flex-end;
    gap:10px;
    margin-top:18px;
    flex-wrap:wrap;
  }

  .edit-action-row {
    display:flex;
    gap:10px;
    flex-wrap:wrap;
  }

  .edit-btn-primary {
    background:#F5C518;
    color:#1a3010;
    border:none;
    border-radius:14px;
    padding:12px 20px;
    font-weight:900;
    cursor:pointer;
    font-family:inherit;
    white-space:nowrap;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }

  .edit-btn-primary:hover {
    opacity:.9;
  }

  .edit-btn-primary:disabled {
    opacity:.55;
    cursor:not-allowed;
  }

  .edit-btn-outline {
    background:transparent;
    color:rgba(180,230,180,0.78);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:14px;
    padding:12px 18px;
    font-weight:900;
    cursor:pointer;
    text-decoration:none;
    font-family:inherit;
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }

  .edit-btn-outline:hover {
    background:rgba(245,197,24,0.08);
    color:#F5C518;
  }

  .edit-btn-danger {
    background:rgba(220,38,38,0.13);
    color:#fca5a5;
    border:1px solid rgba(220,38,38,0.28);
    border-radius:14px;
    padding:10px 16px;
    font-weight:900;
    cursor:pointer;
    font-family:inherit;
  }

  .edit-btn-danger:hover {
    background:rgba(220,38,38,0.22);
  }

  .edit-add-bar {
    display:grid;
    grid-template-columns:1fr auto;
    gap:10px;
    margin-top:18px;
    margin-bottom:20px;
  }

  .edit-section-list {
    display:grid;
    gap:14px;
  }

  .edit-section-card {
    background:rgba(245,197,24,0.05);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:20px;
    padding:18px;
  }

  .edit-section-card.selected {
    border-color:#F5C518;
    background:rgba(245,197,24,0.1);
  }

  .edit-section-top {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    flex-wrap:wrap;
  }

  .edit-number-badge,
  .edit-content-badge {
    display:inline-flex;
    background:#F5C518;
    color:#1a3010;
    padding:5px 10px;
    border-radius:999px;
    font-size:10px;
    font-weight:900;
    letter-spacing:.5px;
    text-transform:uppercase;
    margin-bottom:8px;
  }

  .edit-section-name {
    color:#e8f0e2;
    font-size:19px;
    font-weight:900;
    margin:0;
  }

  .edit-content-list {
    display:grid;
    gap:12px;
    margin-top:16px;
  }

  .edit-content-item {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    background:rgba(245,197,24,0.05);
    border:1px solid rgba(120,200,145,0.18);
    border-radius:16px;
    padding:15px;
  }

  .edit-content-title {
    margin:0;
    color:#e8f0e2;
    font-size:15px;
    font-weight:900;
  }

  .edit-content-meta {
    margin:4px 0 0;
    color:rgba(180,230,180,0.58);
    font-size:12px;
    line-height:1.5;
  }

  .edit-upload-box {
    background:rgba(245,197,24,0.06);
    border:1px dashed rgba(120,200,145,0.28);
    border-radius:18px;
    padding:16px;
    margin-top:18px;
  }

  .edit-upload-title {
    margin:0 0 12px;
    color:#F5C518;
    font-weight:900;
  }

  .edit-empty {
    color:rgba(180,230,180,0.58);
    font-size:14px;
    margin:8px 0;
    border:1px dashed rgba(120,200,145,0.28);
    border-radius:16px;
    padding:18px;
    background:rgba(245,197,24,0.03);
    text-align:center;
  }

  .edit-or {
    text-align:center;
    color:rgba(180,230,180,0.55);
    font-size:12px;
    font-weight:900;
    margin:12px 0;
    text-transform:uppercase;
    letter-spacing:1px;
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

  .edit-loading {
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#F5C518;
    font-weight:900;
    padding-top:100px;
  }

  @media(max-width:1050px) {
    .edit-main-grid {
      grid-template-columns:1fr;
    }

    .edit-side-summary {
      position:static;
    }
  }

  @media(max-width:900px) {
    .course-edit-layout {
      grid-template-columns:1fr;
      padding:100px 16px 40px;
    }
  }

  @media(max-width:650px) {
    .edit-card,
    .edit-hero {
      padding:22px;
    }

    .edit-row,
    .edit-add-bar {
      grid-template-columns:1fr;
    }

    .edit-content-item {
      flex-direction:column;
      align-items:flex-start;
    }

    .edit-btn-row {
      justify-content:flex-start;
    }
  }
`;

export default function CourseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    is_paid: false,
    price: "",
    duration_hours: "",
    level: "beginner",
    is_active: true,
  });

  const [thumbnail, setThumbnail] = useState(null);

  const [sections, setSections] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [newSection, setNewSection] = useState("");

  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const [newVideo, setNewVideo] = useState({});
  const [newNote, setNewNote] = useState({});
  const [newAssignment, setNewAssignment] = useState({});

  const [editingVideo, setEditingVideo] = useState(null);
  const [editVideoForm, setEditVideoForm] = useState({
    title: "",
    description: "",
    duration_minutes: "",
    video_url: "",
    file: null,
  });

  const [editingNote, setEditingNote] = useState(null);
  const [editNoteForm, setEditNoteForm] = useState({
    title: "",
    content: "",
    file: null,
  });

  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editAssignmentForm, setEditAssignmentForm] = useState({
    title: "",
    description: "",
    file: null,
  });

  useEffect(() => {
    const styleId = "saha-course-edit-tab-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = EDIT_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const totalSeconds = videos.reduce(
      (sum, video) => sum + Number(video.duration_minutes || 0),
      0
    );

    const totalHours = totalSeconds > 0 ? (totalSeconds / 3600).toFixed(2) : "";

    setForm((prev) => ({
      ...prev,
      duration_hours: totalHours,
    }));
  }, [videos]);

  useEffect(() => {
    if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(String(sections[0].id));
    }
  }, [sections, selectedSectionId]);

  const selectedSection = useMemo(() => {
    return sections.find(
      (section) => String(section.id) === String(selectedSectionId)
    );
  }, [sections, selectedSectionId]);

  const selectedVideos = useMemo(() => {
    return videos.filter(
      (video) => String(video.section) === String(selectedSectionId)
    );
  }, [videos, selectedSectionId]);

  const selectedNotes = useMemo(() => {
    return notes.filter(
      (note) => String(note.section) === String(selectedSectionId)
    );
  }, [notes, selectedSectionId]);

  const selectedAssignments = useMemo(() => {
    return assignments.filter(
      (assignment) => String(assignment.section) === String(selectedSectionId)
    );
  }, [assignments, selectedSectionId]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [courseRes, sectionRes, videoRes, noteRes, assignmentRes] =
        await Promise.all([
          API.get(`teacher/courses/${id}/`),
          API.get("teacher/sections/"),
          API.get("teacher/videos/"),
          API.get("teacher/notes/"),
          API.get("teacher/assignments/"),
        ]);

      setForm({
        title: courseRes.data.title || "",
        description: courseRes.data.description || "",
        is_paid: Boolean(courseRes.data.is_paid),
        price: courseRes.data.price || "",
        duration_hours: courseRes.data.duration_hours || "",
        level: courseRes.data.level || "beginner",
        is_active: Boolean(courseRes.data.is_active),
      });

      const filteredSections = Array.isArray(sectionRes.data)
        ? sectionRes.data.filter((s) => String(s.course) === String(id))
        : [];

      setSections(filteredSections);

      if (filteredSections.length > 0) {
        setSelectedSectionId((current) => current || String(filteredSections[0].id));
      }

      setVideos(
        Array.isArray(videoRes.data)
          ? videoRes.data.filter((v) => String(v.course) === String(id))
          : []
      );

      setNotes(
        Array.isArray(noteRes.data)
          ? noteRes.data.filter((n) => String(n.course) === String(id))
          : []
      );

      setAssignments(
        Array.isArray(assignmentRes.data)
          ? assignmentRes.data.filter((a) => String(a.course) === String(id))
          : []
      );
    } catch (err) {
      console.error("Load error:", err?.response?.data || err);
      alert("Error loading course editor data.");
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (e) => {
    e.preventDefault();
    setSavingCourse(true);

    try {
      const data = new FormData();

      data.append("title", form.title);
      data.append("description", form.description);
      data.append("is_paid", form.is_paid);
      data.append("price", form.is_paid ? form.price || 0 : 0);
      data.append("duration_hours", form.duration_hours || 0);
      data.append("level", form.level);
      data.append("is_active", form.is_active);

      if (thumbnail) {
        data.append("thumbnail", thumbnail);
      }

      await API.put(`teacher/courses/${id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Course updated successfully.");
    } catch (err) {
      console.error("Course update error:", err?.response?.data || err);
      alert("Course update failed.");
    } finally {
      setSavingCourse(false);
    }
  };

  const addSection = async () => {
    if (!newSection.trim()) return alert("Enter section title.");

    try {
      const res = await API.post("teacher/sections/", {
        title: newSection,
        course: id,
        sort_order: sections.length + 1,
      });

      setSections((prev) => [...prev, res.data]);
      setSelectedSectionId(String(res.data.id));
      setNewSection("");
    } catch (err) {
      console.error("Add section error:", err?.response?.data || err);
      alert("Section could not be added.");
    }
  };

  const startEditSection = (section) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title || "");
  };

  const cancelEditSection = () => {
    setEditingSectionId(null);
    setEditingSectionTitle("");
  };

  const updateSection = async (section) => {
    if (!editingSectionTitle.trim()) {
      alert("Enter section title.");
      return;
    }

    try {
      const res = await API.put(`teacher/sections/${section.id}/`, {
        title: editingSectionTitle.trim(),
        course: section.course || id,
        sort_order: section.sort_order || 1,
      });

      setSections((prev) =>
        prev.map((item) => (item.id === section.id ? res.data : item))
      );

      cancelEditSection();
      alert("Section updated successfully.");
    } catch (err) {
      console.error("Update section error:", err?.response?.data || err);
      alert("Section could not be updated.");
    }
  };

  const deleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section?")) return;

    try {
      await API.delete(`teacher/sections/${sectionId}/`);

      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      setVideos((prev) =>
        prev.filter((v) => String(v.section) !== String(sectionId))
      );
      setNotes((prev) =>
        prev.filter((n) => String(n.section) !== String(sectionId))
      );
      setAssignments((prev) =>
        prev.filter((a) => String(a.section) !== String(sectionId))
      );

      setSelectedSectionId("");
    } catch (err) {
      console.error("Delete section error:", err?.response?.data || err);
      alert("Section delete failed.");
    }
  };

  const updateVideoDraft = (sectionId, field, value) => {
    setNewVideo((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }));
  };

  const isVideoFile = (file) => file?.type?.startsWith("video/");

  const getVideoDurationSeconds = (file) => {
    return new Promise((resolve) => {
      if (!file || !isVideoFile(file)) {
        resolve(0);
        return;
      }

      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };

      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (secondsValue) => {
    const seconds = Number(secondsValue || 0);
    if (!seconds) return "Duration not set";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleNewVideoFileChange = async (sectionId, e) => {
    const file = e.target.files?.[0] || null;

    if (file && !isVideoFile(file)) {
      alert("Please upload only a video file.");
      e.target.value = "";
      updateVideoDraft(sectionId, "file", null);
      return;
    }

    const seconds = file ? await getVideoDurationSeconds(file) : "";

    updateVideoDraft(sectionId, "file", file);
    updateVideoDraft(sectionId, "duration_minutes", seconds);
  };

  const handleEditVideoFileChange = async (e) => {
    const file = e.target.files?.[0] || null;

    if (file && !isVideoFile(file)) {
      alert("Please upload only a video file.");
      e.target.value = "";
      setEditVideoForm((prev) => ({ ...prev, file: null }));
      return;
    }

    const seconds = file
      ? await getVideoDurationSeconds(file)
      : editVideoForm.duration_minutes;

    setEditVideoForm((prev) => ({
      ...prev,
      file,
      duration_minutes: seconds,
    }));
  };

  const handleNewNoteFileChange = (sectionId, e) => {
    const file = e.target.files?.[0] || null;

    if (file && isVideoFile(file)) {
      alert("Video files are not allowed for notes.");
      e.target.value = "";
      updateNoteDraft(sectionId, "file", null);
      return;
    }

    updateNoteDraft(sectionId, "file", file);
  };

  const handleEditNoteFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && isVideoFile(file)) {
      alert("Video files are not allowed for notes.");
      e.target.value = "";
      setEditNoteForm((prev) => ({ ...prev, file: null }));
      return;
    }

    setEditNoteForm((prev) => ({ ...prev, file }));
  };

  const handleNewAssignmentFileChange = (sectionId, e) => {
    const file = e.target.files?.[0] || null;

    if (file && isVideoFile(file)) {
      alert("Video files are not allowed for assignments.");
      e.target.value = "";
      updateAssignmentDraft(sectionId, "file", null);
      return;
    }

    updateAssignmentDraft(sectionId, "file", file);
  };

  const handleEditAssignmentFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && isVideoFile(file)) {
      alert("Video files are not allowed for assignments.");
      e.target.value = "";
      setEditAssignmentForm((prev) => ({ ...prev, file: null }));
      return;
    }

    setEditAssignmentForm((prev) => ({ ...prev, file }));
  };

  const addVideo = async (sectionId) => {
    const videoData = newVideo[sectionId] || {};

    if (!sectionId) return alert("Please select a section.");
    if (!videoData.title?.trim()) return alert("Enter video title.");
    if (!videoData.url && !videoData.file)
      return alert("Add video URL or upload file.");

    try {
      const data = new FormData();

      data.append("title", videoData.title);
      data.append("description", videoData.description || "");
      data.append("course", id);
      data.append("section", sectionId);
      data.append("duration_minutes", videoData.duration_minutes || 0);
      data.append(
        "sort_order",
        videos.filter((v) => String(v.section) === String(sectionId)).length + 1
      );

      if (videoData.file) data.append("media_file", videoData.file);
      if (videoData.url) data.append("video_url", videoData.url);

      const res = await API.post("teacher/videos/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setVideos((prev) => [...prev, res.data]);
      setNewVideo((prev) => ({ ...prev, [sectionId]: {} }));
    } catch (err) {
      console.error("Add video error:", err?.response?.data || err);
      alert("Video could not be added.");
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm("Delete this video?")) return;

    try {
      await API.delete(`teacher/videos/${videoId}/`);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error("Delete video error:", err?.response?.data || err);
      alert("Video delete failed.");
    }
  };

  const startEditVideo = (video) => {
    setEditingVideo(video.id);
    setEditVideoForm({
      title: video.title || "",
      description: video.description || "",
      duration_minutes: video.duration_minutes || "",
      video_url: video.video_url || "",
      file: null,
    });
  };

  const cancelEditVideo = () => {
    setEditingVideo(null);
    setEditVideoForm({
      title: "",
      description: "",
      duration_minutes: "",
      video_url: "",
      file: null,
    });
  };

  const updateVideo = async (video) => {
    if (!editVideoForm.title.trim()) return alert("Video title is required.");

    try {
      const data = new FormData();

      data.append("title", editVideoForm.title);
      data.append("description", editVideoForm.description || "");
      data.append("duration_minutes", editVideoForm.duration_minutes || 0);
      data.append("course", video.course || id);
      data.append("section", video.section);
      data.append("sort_order", video.sort_order || 1);

      if (editVideoForm.video_url) {
        data.append("video_url", editVideoForm.video_url);
      }

      if (editVideoForm.file) {
        data.append("media_file", editVideoForm.file);
      }

      const res = await API.put(`teacher/videos/${video.id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setVideos((prev) => prev.map((v) => (v.id === video.id ? res.data : v)));

      cancelEditVideo();
      alert("Video updated successfully.");
    } catch (err) {
      console.error("Update video error:", err?.response?.data || err);
      alert("Video update failed.");
    }
  };

  const updateNoteDraft = (sectionId, field, value) => {
    setNewNote((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }));
  };

  const addNote = async (sectionId) => {
    const noteData = newNote[sectionId] || {};

    if (!sectionId) return alert("Please select a section.");
    if (!noteData.title?.trim()) return alert("Enter note title.");

    try {
      const data = new FormData();

      data.append("title", noteData.title);
      data.append("content", noteData.content || "");
      data.append("course", id);
      data.append("section", sectionId);

      if (noteData.file) data.append("attachment", noteData.file);

      const res = await API.post("teacher/notes/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNotes((prev) => [...prev, res.data]);
      setNewNote((prev) => ({ ...prev, [sectionId]: {} }));
    } catch (err) {
      console.error("Add note error:", err?.response?.data || err);
      alert("Note could not be added.");
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      await API.delete(`teacher/notes/${noteId}/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Delete note error:", err?.response?.data || err);
      alert("Note delete failed.");
    }
  };

  const startEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteForm({
      title: note.title || "",
      content: note.content || "",
      file: null,
    });
  };

  const cancelEditNote = () => {
    setEditingNote(null);
    setEditNoteForm({
      title: "",
      content: "",
      file: null,
    });
  };

  const updateNote = async (note) => {
    if (!editNoteForm.title.trim()) return alert("Note title is required.");

    try {
      const data = new FormData();

      data.append("title", editNoteForm.title);
      data.append("content", editNoteForm.content || "");
      data.append("course", note.course || id);
      data.append("section", note.section);

      if (editNoteForm.file) {
        data.append("attachment", editNoteForm.file);
      }

      const res = await API.put(`teacher/notes/${note.id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)));

      cancelEditNote();
      alert("Note updated successfully.");
    } catch (err) {
      console.error("Update note error:", err?.response?.data || err);
      alert("Note update failed.");
    }
  };

  const updateAssignmentDraft = (sectionId, field, value) => {
    setNewAssignment((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }));
  };

  const addAssignment = async (sectionId) => {
    const assignmentData = newAssignment[sectionId] || {};

    if (!sectionId) return alert("Please select a section.");
    if (!assignmentData.title?.trim()) return alert("Enter assignment title.");

    try {
      const data = new FormData();

      data.append("title", assignmentData.title);
      data.append("description", assignmentData.description || "");
      data.append("course", id);
      data.append("section", sectionId);

      if (assignmentData.file) data.append("attachment", assignmentData.file);

      const res = await API.post("teacher/assignments/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAssignments((prev) => [...prev, res.data]);
      setNewAssignment((prev) => ({ ...prev, [sectionId]: {} }));
    } catch (err) {
      console.error("Add assignment error:", err?.response?.data || err);
      alert("Assignment could not be added.");
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment?")) return;

    try {
      await API.delete(`teacher/assignments/${assignmentId}/`);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error("Delete assignment error:", err?.response?.data || err);
      alert("Assignment delete failed.");
    }
  };

  const startEditAssignment = (assignment) => {
    setEditingAssignment(assignment.id);
    setEditAssignmentForm({
      title: assignment.title || "",
      description: assignment.description || "",
      file: null,
    });
  };

  const cancelEditAssignment = () => {
    setEditingAssignment(null);
    setEditAssignmentForm({
      title: "",
      description: "",
      file: null,
    });
  };

  const updateAssignment = async (assignment) => {
    if (!editAssignmentForm.title.trim()) {
      return alert("Assignment title is required.");
    }

    try {
      const data = new FormData();

      data.append("title", editAssignmentForm.title);
      data.append("description", editAssignmentForm.description || "");
      data.append("course", assignment.course || id);
      data.append("section", assignment.section);

      if (editAssignmentForm.file) {
        data.append("attachment", editAssignmentForm.file);
      }

      const res = await API.put(`teacher/assignments/${assignment.id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAssignments((prev) =>
        prev.map((a) => (a.id === assignment.id ? res.data : a))
      );

      cancelEditAssignment();
      alert("Assignment updated successfully.");
    } catch (err) {
      console.error("Update assignment error:", err?.response?.data || err);
      alert("Assignment update failed.");
    }
  };

  const renderSectionPicker = () => (
    <div className="edit-card" style={{ padding: 20 }}>
      <h3 className="edit-section-title" style={{ fontSize: 18 }}>
        Select Section
      </h3>

      <p className="edit-small">
        Choose the section where you want to manage content.
      </p>

      {sections.length === 0 ? (
        <div className="edit-empty">
          No sections available. Add a section first from the Sections tab.
        </div>
      ) : (
        <select
          className="edit-select"
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
        >
          {sections.map((section, index) => (
            <option key={section.id} value={section.id}>
              Section {index + 1}: {section.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  const renderDetailsTab = () => (
    <form onSubmit={updateCourse} className="edit-card">
      <h2 className="edit-section-title">📚 Course Details</h2>
      <p className="edit-small">
        Change title, description, thumbnail, pricing, level, duration, and publish status.
      </p>

      <label className="edit-label">Course Title</label>
      <input
        className="edit-input"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />

      <label className="edit-label">Description</label>
      <textarea
        className="edit-textarea"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <label className="edit-label">Thumbnail</label>
      <input
        className="edit-file"
        type="file"
        accept="image/*"
        onChange={(e) => setThumbnail(e.target.files[0])}
      />

      <div className="edit-row">
        <div>
          <label className="edit-label">Level</label>
          <select
            className="edit-select"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="edit-label">Duration Hours</label>
          <input
            className="edit-input"
            type="number"
            value={form.duration_hours}
            readOnly
          />
        </div>
      </div>

      <div className="edit-check-grid">
        <label className="edit-check-card">
          <input
            type="checkbox"
            checked={form.is_paid}
            onChange={(e) =>
              setForm({ ...form, is_paid: e.target.checked })
            }
          />
          <span>Paid Course</span>
        </label>

        <label className="edit-check-card">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm({ ...form, is_active: e.target.checked })
            }
          />
          <span>Active Course</span>
        </label>
      </div>

      {form.is_paid && (
        <>
          <label className="edit-label">Price</label>
          <input
            className="edit-input"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </>
      )}

      <div className="edit-btn-row">
        <button
          type="submit"
          className="edit-btn-primary"
          disabled={savingCourse}
        >
          {savingCourse ? "Saving..." : "Save Course"}
        </button>
      </div>
    </form>
  );

  const renderSectionsTab = () => (
    <div className="edit-card">
      <h2 className="edit-section-title">📂 Sections</h2>
      <p className="edit-small">
        Add, rename, and delete course sections. Videos, notes, and assignments are connected to these sections.
      </p>

      <div className="edit-add-bar">
        <input
          className="edit-input"
          placeholder="New section title"
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
        />

        <button
          className="edit-btn-primary"
          type="button"
          onClick={addSection}
        >
          + Add Section
        </button>
      </div>

      <div className="edit-section-list">
        {sections.length === 0 ? (
          <div className="edit-empty">No sections added yet.</div>
        ) : (
          sections.map((section, index) => {
            const sectionVideos = videos.filter(
              (v) => String(v.section) === String(section.id)
            );

            const sectionNotes = notes.filter(
              (n) => String(n.section) === String(section.id)
            );

            const sectionAssignments = assignments.filter(
              (a) => String(a.section) === String(section.id)
            );

            const isEditing = String(editingSectionId) === String(section.id);

            return (
              <div
                key={section.id}
                className={`edit-section-card ${
                  String(selectedSectionId) === String(section.id) ? "selected" : ""
                }`}
              >
                <div className="edit-section-top">
                  <div style={{ flex: 1 }}>
                    <span className="edit-number-badge">Section {index + 1}</span>

                    {isEditing ? (
                      <>
                        <input
                          className="edit-input"
                          value={editingSectionTitle}
                          onChange={(e) => setEditingSectionTitle(e.target.value)}
                          placeholder="Enter section title"
                          style={{ marginTop: 8, maxWidth: 420 }}
                        />

                        <p className="edit-small">
                          {sectionVideos.length} video(s), {sectionNotes.length} note(s),{" "}
                          {sectionAssignments.length} assignment(s)
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="edit-section-name">{section.title}</h3>
                        <p className="edit-small">
                          {sectionVideos.length} video(s), {sectionNotes.length} note(s),{" "}
                          {sectionAssignments.length} assignment(s)
                        </p>
                      </>
                    )}
                  </div>

                  <div className="edit-action-row">
                    {isEditing ? (
                      <>
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={cancelEditSection}
                        >
                          Cancel
                        </button>

                        <button
                          className="edit-btn-primary"
                          type="button"
                          onClick={() => updateSection(section)}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={() => startEditSection(section)}
                        >
                          Edit
                        </button>

                        <button
                          className="edit-btn-danger"
                          type="button"
                          onClick={() => deleteSection(section.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderVideosTab = () => {
    const sectionId = selectedSectionId;
    const draft = newVideo[sectionId] || {};

    return (
      <>
        {renderSectionPicker()}

        <div className="edit-card">
          <h2 className="edit-section-title">🎥 Videos</h2>
          <p className="edit-small">
            Manage videos for: <strong>{selectedSection?.title || "No section selected"}</strong>
          </p>

          <div className="edit-content-list">
            {!sectionId ? (
              <div className="edit-empty">Select a section to manage videos.</div>
            ) : selectedVideos.length === 0 ? (
              <div className="edit-empty">No videos uploaded in this section.</div>
            ) : (
              selectedVideos.map((video, videoIndex) => (
                <div key={video.id} className="edit-content-item">
                  {editingVideo === video.id ? (
                    <div style={{ width: "100%" }}>
                      <span className="edit-content-badge">
                        Editing Video {videoIndex + 1}
                      </span>

                      <label className="edit-label">Video Title</label>
                      <input
                        className="edit-input"
                        value={editVideoForm.title}
                        onChange={(e) =>
                          setEditVideoForm({
                            ...editVideoForm,
                            title: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Description</label>
                      <textarea
                        className="edit-input edit-small-textarea"
                        value={editVideoForm.description}
                        onChange={(e) =>
                          setEditVideoForm({
                            ...editVideoForm,
                            description: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Duration Seconds</label>
                      <input
                        className="edit-input"
                        type="number"
                        value={editVideoForm.duration_minutes}
                        onChange={(e) =>
                          setEditVideoForm({
                            ...editVideoForm,
                            duration_minutes: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Video URL</label>
                      <input
                        className="edit-input"
                        placeholder="Optional video URL"
                        value={editVideoForm.video_url}
                        onChange={(e) =>
                          setEditVideoForm({
                            ...editVideoForm,
                            video_url: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Replace Video File</label>
                      <input
                        className="edit-file"
                        type="file"
                        accept="video/*"
                        onChange={handleEditVideoFileChange}
                      />

                      <div className="edit-btn-row">
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={cancelEditVideo}
                        >
                          Cancel
                        </button>

                        <button
                          className="edit-btn-primary"
                          type="button"
                          onClick={() => updateVideo(video)}
                        >
                          Save Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="edit-content-badge">
                          Video {videoIndex + 1}
                        </span>

                        <h4 className="edit-content-title">{video.title}</h4>

                        <p className="edit-content-meta">
                          {video.video_url ? "URL video" : "Uploaded file"} •{" "}
                          {formatDuration(video.duration_minutes)}
                        </p>
                      </div>

                      <div className="edit-action-row">
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={() => startEditVideo(video)}
                        >
                          Edit
                        </button>

                        <button
                          className="edit-btn-danger"
                          type="button"
                          onClick={() => deleteVideo(video.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="edit-upload-box">
            <h4 className="edit-upload-title">Add Video</h4>

            <label className="edit-label">Video Title</label>
            <input
              className="edit-input"
              value={draft.title || ""}
              onChange={(e) =>
                updateVideoDraft(sectionId, "title", e.target.value)
              }
              disabled={!sectionId}
            />

            <label className="edit-label">Video URL</label>
            <input
              className="edit-input"
              value={draft.url || ""}
              onChange={(e) =>
                updateVideoDraft(sectionId, "url", e.target.value)
              }
              disabled={!sectionId}
            />

            <div className="edit-or">or upload video file</div>

            <input
              className="edit-file"
              type="file"
              accept="video/*"
              onChange={(e) => handleNewVideoFileChange(sectionId, e)}
              disabled={!sectionId}
            />

            <label className="edit-label">Detected Duration Seconds</label>
            <input
              className="edit-input"
              type="number"
              value={draft.duration_minutes || ""}
              readOnly
            />

            <div className="edit-btn-row">
              <button
                className="edit-btn-primary"
                type="button"
                onClick={() => addVideo(sectionId)}
              >
                + Add Video
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderNotesTab = () => {
    const sectionId = selectedSectionId;
    const draft = newNote[sectionId] || {};

    return (
      <>
        {renderSectionPicker()}

        <div className="edit-card">
          <h2 className="edit-section-title">📝 Notes</h2>
          <p className="edit-small">
            Manage notes for: <strong>{selectedSection?.title || "No section selected"}</strong>
          </p>

          <div className="edit-content-list">
            {!sectionId ? (
              <div className="edit-empty">Select a section to manage notes.</div>
            ) : selectedNotes.length === 0 ? (
              <div className="edit-empty">No notes added in this section.</div>
            ) : (
              selectedNotes.map((note) => (
                <div key={note.id} className="edit-content-item">
                  {editingNote === note.id ? (
                    <div style={{ width: "100%" }}>
                      <span className="edit-content-badge">Editing Note</span>

                      <label className="edit-label">Note Title</label>
                      <input
                        className="edit-input"
                        value={editNoteForm.title}
                        onChange={(e) =>
                          setEditNoteForm({
                            ...editNoteForm,
                            title: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Content</label>
                      <textarea
                        className="edit-input edit-small-textarea"
                        value={editNoteForm.content}
                        onChange={(e) =>
                          setEditNoteForm({
                            ...editNoteForm,
                            content: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Replace Attachment</label>
                      <input
                        className="edit-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                        onChange={handleEditNoteFileChange}
                      />

                      <div className="edit-btn-row">
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={cancelEditNote}
                        >
                          Cancel
                        </button>

                        <button
                          className="edit-btn-primary"
                          type="button"
                          onClick={() => updateNote(note)}
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="edit-content-badge">Note</span>

                        <h4 className="edit-content-title">{note.title}</h4>

                        {note.content && (
                          <p className="edit-content-meta">{note.content}</p>
                        )}

                        {note.attachment && (
                          <p className="edit-content-meta">Attachment available</p>
                        )}
                      </div>

                      <div className="edit-action-row">
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={() => startEditNote(note)}
                        >
                          Edit
                        </button>

                        <button
                          className="edit-btn-danger"
                          type="button"
                          onClick={() => deleteNote(note.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="edit-upload-box">
            <h4 className="edit-upload-title">Add Note</h4>

            <label className="edit-label">Note Title</label>
            <input
              className="edit-input"
              value={draft.title || ""}
              onChange={(e) =>
                updateNoteDraft(sectionId, "title", e.target.value)
              }
              disabled={!sectionId}
            />

            <label className="edit-label">Content</label>
            <textarea
              className="edit-input edit-small-textarea"
              value={draft.content || ""}
              onChange={(e) =>
                updateNoteDraft(sectionId, "content", e.target.value)
              }
              disabled={!sectionId}
            />

            <label className="edit-label">Attachment</label>
            <input
              className="edit-file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
              onChange={(e) => handleNewNoteFileChange(sectionId, e)}
              disabled={!sectionId}
            />

            <div className="edit-btn-row">
              <button
                className="edit-btn-primary"
                type="button"
                onClick={() => addNote(sectionId)}
              >
                + Add Note
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderAssignmentsTab = () => {
    const sectionId = selectedSectionId;
    const draft = newAssignment[sectionId] || {};

    return (
      <>
        {renderSectionPicker()}

        <div className="edit-card">
          <h2 className="edit-section-title">📌 Assignments</h2>
          <p className="edit-small">
            Manage assignments for: <strong>{selectedSection?.title || "No section selected"}</strong>
          </p>

          <div className="edit-content-list">
            {!sectionId ? (
              <div className="edit-empty">Select a section to manage assignments.</div>
            ) : selectedAssignments.length === 0 ? (
              <div className="edit-empty">No assignments added in this section.</div>
            ) : (
              selectedAssignments.map((assignment) => (
                <div key={assignment.id} className="edit-content-item">
                  {editingAssignment === assignment.id ? (
                    <div style={{ width: "100%" }}>
                      <span className="edit-content-badge">Editing Assignment</span>

                      <label className="edit-label">Assignment Title</label>
                      <input
                        className="edit-input"
                        value={editAssignmentForm.title}
                        onChange={(e) =>
                          setEditAssignmentForm({
                            ...editAssignmentForm,
                            title: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Description</label>
                      <textarea
                        className="edit-input edit-small-textarea"
                        value={editAssignmentForm.description}
                        onChange={(e) =>
                          setEditAssignmentForm({
                            ...editAssignmentForm,
                            description: e.target.value,
                          })
                        }
                      />

                      <label className="edit-label">Replace Attachment</label>
                      <input
                        className="edit-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg"
                        onChange={handleEditAssignmentFileChange}
                      />

                      <div className="edit-btn-row">
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={cancelEditAssignment}
                        >
                          Cancel
                        </button>

                        <button
                          className="edit-btn-primary"
                          type="button"
                          onClick={() => updateAssignment(assignment)}
                        >
                          Save Assignment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="edit-content-badge">Assignment</span>

                        <h4 className="edit-content-title">{assignment.title}</h4>

                        {assignment.description && (
                          <p className="edit-content-meta">
                            {assignment.description}
                          </p>
                        )}

                        {assignment.attachment && (
                          <p className="edit-content-meta">Attachment available</p>
                        )}
                      </div>

                      <div className="edit-action-row">
                        <button
                          className="edit-btn-outline"
                          type="button"
                          onClick={() => startEditAssignment(assignment)}
                        >
                          Edit
                        </button>

                        <button
                          className="edit-btn-danger"
                          type="button"
                          onClick={() => deleteAssignment(assignment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="edit-upload-box">
            <h4 className="edit-upload-title">Add Assignment</h4>

            <label className="edit-label">Assignment Title</label>
            <input
              className="edit-input"
              value={draft.title || ""}
              onChange={(e) =>
                updateAssignmentDraft(sectionId, "title", e.target.value)
              }
              disabled={!sectionId}
            />

            <label className="edit-label">Description</label>
            <textarea
              className="edit-input edit-small-textarea"
              value={draft.description || ""}
              onChange={(e) =>
                updateAssignmentDraft(sectionId, "description", e.target.value)
              }
              disabled={!sectionId}
            />

            <label className="edit-label">Attachment</label>
            <input
              className="edit-file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg"
              onChange={(e) => handleNewAssignmentFileChange(sectionId, e)}
              disabled={!sectionId}
            />

            <div className="edit-btn-row">
              <button
                className="edit-btn-primary"
                type="button"
                onClick={() => addAssignment(sectionId)}
              >
                + Add Assignment
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderTabContent = () => {
    if (activeTab === "details") return renderDetailsTab();
    if (activeTab === "sections") return renderSectionsTab();
    if (activeTab === "videos") return renderVideosTab();
    if (activeTab === "notes") return renderNotesTab();
    if (activeTab === "assignments") return renderAssignmentsTab();
    return renderDetailsTab();
  };

  if (loading) {
    return (
      <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div className="edit-loading">Loading course editor...</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="course-edit-layout">
        <aside>
          <div className="side-menu">
            <Link to="/teacher/home" className="sm-item">
              <span className="sm-ic">🏠</span>Home Feed
            </Link>

            <Link to="/teacher/courses" className="sm-item">
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

        <main className="edit-shell">
          <section className="edit-hero">
            <div>
              <h1 className="edit-title">✏️ Edit Course</h1>
              <p className="edit-sub">
                Manage course details, sections, videos, notes, and assignments using separate tabs.
              </p>
            </div>

            <div className="edit-hero-actions">
              <button
                className="edit-btn-outline"
                type="button"
                onClick={() => navigate(`/teacher/courses/${id}`)}
              >
                ← Back to Course
              </button>

              <button
                className="edit-btn-primary"
                type="button"
                onClick={() => navigate("/teacher/courses")}
              >
                My Courses
              </button>
            </div>
          </section>

          <div className="edit-tabs">
            {EDIT_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`edit-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="edit-main-grid">
            <div>{renderTabContent()}</div>

            <aside className="edit-side-summary">
              <h3 className="edit-section-title" style={{ fontSize: 20 }}>
                Course Summary
              </h3>

              <div className="summary-row">
                <div className="summary-label">Title</div>
                <div className="summary-value">{form.title || "Not added"}</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Status</div>
                <div className="summary-value">
                  {form.is_active ? "Active" : "Inactive / Draft"}
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Level</div>
                <div className="summary-value">{form.level}</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Pricing</div>
                <div className="summary-value">
                  {form.is_paid ? `Paid - ₹${form.price || 0}` : "Free"}
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Duration</div>
                <div className="summary-value">
                  {form.duration_hours ? `${form.duration_hours} hours` : "Not calculated"}
                </div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Sections</div>
                <div className="summary-value">{sections.length}</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Videos</div>
                <div className="summary-value">{videos.length}</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Notes</div>
                <div className="summary-value">{notes.length}</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Assignments</div>
                <div className="summary-value">{assignments.length}</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Selected Section</div>
                <div className="summary-value">
                  {selectedSection?.title || "None selected"}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </TeacherLayout>
  );
}