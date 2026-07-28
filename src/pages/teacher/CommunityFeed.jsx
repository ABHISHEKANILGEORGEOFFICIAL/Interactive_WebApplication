import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import { CommunityConfirmModal, CommunityFeedbackStyles, CommunityToast } from "../../components/teacher/CommunityFeedback";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import StudentLayout from "../../components/student/StudentLayout";
import { emitActivityNotification } from "../../components/common/activityNotificationsBus";

const teacherPageUser = {
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

const studentPageUser = {
  firstName: "Student",
  username: "student",
  fullName: "Your Name",
  role: "Student",
  avatarDisplay: "S",
  avatarUrl: null,
};

const avatarColors = ["#d7b25d", "#c09a4a", "#9ea66d", "#7da27f"];
const COMMUNITY_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const getCommunityEndpoint = (communityId) => {
  const base = COMMUNITY_API_BASE.endsWith("/") ? COMMUNITY_API_BASE : `${COMMUNITY_API_BASE}/`;
  return `${base}communities/${communityId}/`;
};

const readFetchErrorMessage = async (response, fallback) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    try {
      const text = await response.text();
      if (text?.trim()) return text.trim();
    } catch {
      return fallback;
    }
  }

  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (payload?.detail) return String(payload.detail);
  if (payload?.message) return String(payload.message);
  if (payload && typeof payload === "object") {
    const fieldMessages = Object.entries(payload)
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) {
          return value.filter(Boolean).map((item) => `${field}: ${item}`);
        }
        if (typeof value === "string" && value.trim()) {
          return [`${field}: ${value}`];
        }
        return [];
      });

    if (fieldMessages.length) return fieldMessages.join(" ");
  }

  return fallback;
};

const FEED_STYLES = `
  .cf-feed-wrap { max-width:1240px; margin:0 auto; display:grid; grid-template-columns:minmax(0,1fr) 250px; gap:22px; align-items:start; padding:110px 24px 80px; }
  .cf-compose-card { background:rgba(10,28,16,0.92); border:1px solid rgba(120,200,145,0.22); border-radius:18px; padding:18px; margin-bottom:12px; backdrop-filter:blur(10px); }
  .cf-compose-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
  .cf-c-av { width:38px; height:38px; border-radius:50%; background:#F5C518; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:#1a3010; flex-shrink:0; }
  .cf-compose-in { flex:1; background:rgba(245,197,24,0.08); border:1px solid rgba(120,200,145,0.22); border-radius:10px; padding:10px 14px; font-size:13px; color:rgba(200,240,205,0.55); outline:none; font-family:inherit; cursor:pointer; }
  .cf-compose-in:focus { border-color:rgba(245,197,24,0.42); color:#e8f0e2; }
  .cf-post-types { display:flex; gap:8px; flex-wrap:wrap; }
  .cf-pt { padding:8px 14px; border-radius:9px; border:1px solid rgba(100,200,130,0.22); background:rgba(245,197,24,0.08); font-size:12px; font-weight:600; cursor:pointer; color:rgba(180,230,180,0.7); transition:background .12s; font-family:inherit; }
  .cf-pt:hover, .cf-pt.act { background:#F5C518; border-color:#F5C518; color:#1a3010; }
  .cf-feed-label { font-size:10px; font-weight:800; color:rgba(160,210,170,0.40); letter-spacing:2.5px; text-transform:uppercase; padding:4px 0 10px; }
  .cf-empty-feed { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.16); border-radius:16px; padding:22px 20px; color:rgba(225,236,217,0.85); font-size:14px; text-align:center; line-height:1.6; }
  .cf-spinner { text-align:center; padding:40px 0; color:rgba(160,210,170,0.5); font-size:13px; }
  .cf-spinner-ring { width:32px; height:32px; border:2px solid rgba(120,200,145,0.22); border-top-color:#F5C518; border-radius:50%; animation:cf-spin .75s linear infinite; margin:0 auto 12px; }
  @keyframes cf-spin { to { transform:rotate(360deg); } }
  .cf-post-card { background:rgba(10,28,16,0.92); border:1px solid rgba(120,200,145,0.22); border-radius:20px; padding:20px 22px; margin-bottom:14px; transition:border-color .2s; backdrop-filter:blur(10px); position:relative; }
  .cf-post-card.visible { opacity:1; transform:none; }
  .cf-post-card:hover { border-color:rgba(245,197,24,0.38); }
  .cf-post-head { display:flex; align-items:center; gap:11px; margin-bottom:14px; }
  .cf-p-av { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:#1a3010; flex-shrink:0; }
  .cf-post-author-name { font-size:14px; font-weight:700; color:#e8f0e2; }
  .cf-post-author-meta { font-size:11px; color:rgba(160,210,170,0.5); margin-top:2px; }
  .cf-chip { display:inline-block; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:700; margin-left:auto; flex-shrink:0; letter-spacing:0.4px; text-transform:uppercase; }
  .cf-chip-post  { background:rgba(245,197,24,0.16); color:#F5C518; }
  .cf-chip-photo { background:rgba(100,180,255,0.16); color:#80c4f8; }
  .cf-chip-note  { background:rgba(16,185,129,0.16); color:#5eead4; }
  .cf-post-title { font-size:17px; font-weight:700; font-style:italic; color:#e8f0e2; margin-bottom:8px; line-height:1.4; display:block; }
  .cf-post-copy { font-size:13px; color:rgba(160,210,170,0.75); line-height:1.75; margin-bottom:14px; }
  .cf-photo-card { margin:0 auto 10px; border-radius:10px; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid rgba(120,200,145,0.22); width:220px; height:220px; }
  .cf-photo-card img { display:block; width:100%; height:100%; object-fit:cover; }
  .cf-note-card { background:rgba(245,197,24,0.08); border:1px solid rgba(245,197,24,0.16); border-radius:12px; padding:14px 16px; margin-bottom:14px; font-size:13px; line-height:1.75; color:rgba(210,240,215,0.82); }
  .cf-post-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  .cf-act-btn { padding:6px 13px; border-radius:8px; border:1px solid rgba(100,200,130,0.18); background:rgba(245,197,24,0.08); font-size:12px; color:rgba(180,230,180,0.68); cursor:pointer; font-family:inherit; transition:background .12s; }
  .cf-act-btn:hover { background:rgba(245,197,24,0.18); color:#F5C518; }
  .cf-act-btn.liked { color:#ff6b6b; border-color:rgba(255,100,100,0.25); }
  .cf-act-sep { width:1px; height:14px; background:rgba(120,200,145,0.22); }
  .cf-pin-btn { padding:6px 13px; border-radius:8px; border:1px solid rgba(245,197,24,0.28); background:rgba(245,197,24,0.08); font-size:12px; color:rgba(245,197,24,0.7); cursor:pointer; font-family:inherit; transition:background .12s; }
  .cf-pin-btn:hover { background:rgba(245,197,24,0.18); color:#F5C518; }
  .cf-widget { background:rgba(10,28,16,0.92); border:1px solid rgba(120,200,145,0.22); border-radius:18px; padding:16px; backdrop-filter:blur(10px); margin-bottom:14px; }
  .cf-wt { font-size:9px; font-weight:800; color:rgba(160,210,170,0.45); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
  .cf-banner { position:relative; overflow:hidden; border-radius:24px; margin-bottom:14px; }
  .cf-nav-btn { background:rgba(255,255,255,0.18); color:#fff; border:1px solid rgba(255,255,255,0.35); border-radius:99px; padding:7px 16px; font-weight:700; font-size:12px; cursor:pointer; backdrop-filter:blur(6px); transition:background .15s; font-family:inherit; }
  .cf-nav-btn:hover { background:rgba(255,255,255,0.32); }
  .cf-nav-btn-back { background:#F5C518; color:#1a3010; border:none; border-radius:99px; padding:7px 16px; font-weight:800; font-size:12px; cursor:pointer; font-family:inherit; transition:opacity .15s; }
  .cf-nav-btn-back:hover { opacity:0.88; }
  .cf-rich-toolbar { display:flex; align-items:center; gap:4px; flex-wrap:wrap; background:rgba(245,197,24,0.07); border:1px solid rgba(120,200,145,0.22); border-bottom:none; border-radius:10px 10px 0 0; padding:6px 10px; }
  .cf-rich-lbl { font-size:10px; font-weight:800; color:rgba(160,210,170,0.45); letter-spacing:1.5px; text-transform:uppercase; margin-right:4px; }
  .cf-rich-btn { background:transparent; border:1px solid rgba(120,200,145,0.22); border-radius:6px; padding:4px 9px; font-size:12px; font-weight:700; color:rgba(180,230,180,0.75); cursor:pointer; font-family:inherit; transition:background .1s; line-height:1; }
  .cf-rich-btn:hover { background:rgba(245,197,24,0.18); color:#F5C518; border-color:rgba(245,197,24,0.35); }
  .cf-rich-surface { min-height:130px; background:rgba(245,197,24,0.08); border:1px solid rgba(245,197,24,0.28); border-radius:0 0 10px 10px; padding:12px 14px; font-size:13px; color:#e8f0e2; line-height:1.75; outline:none; font-family:inherit; }
  .cf-rich-surface:empty:before { content:attr(data-placeholder); color:rgba(160,210,170,0.4); pointer-events:none; }
  .cf-rich-surface ul,.cf-rich-surface ol { padding-left:20px; margin:4px 0; }
  .cf-rich-surface a { color:#F5C518; }

  /* 3-dots menu */
  .cf-dots-btn { position:absolute; top:14px; right:14px; background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:8px; font-size:20px; color:rgba(160,210,170,0.5); line-height:1; transition:background .12s, color .12s; z-index:5; }
  .cf-dots-btn:hover { background:rgba(245,197,24,0.10); color:#F5C518; }
  .cf-dots-menu { position:absolute; top:40px; right:14px; background:#111e15; border:1px solid rgba(120,200,145,0.22); border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.28); min-width:150px; z-index:50; overflow:hidden; }
  .cf-dots-item { display:block; width:100%; padding:10px 16px; background:none; border:none; text-align:left; font-size:13px; font-family:inherit; cursor:pointer; transition:background .12s; }
  .cf-dots-item:hover { background:rgba(245,197,24,0.09); }
  .cf-dots-item--danger { color:#fca5a5; }
  .cf-dots-item--warn  { color:#fde68a; }

  /* Report modal */
  .cf-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.62); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
  .cf-modal { background:linear-gradient(180deg,rgba(15,34,20,0.98) 0%,rgba(9,24,14,0.98) 100%); border:1px solid rgba(120,200,145,0.24); border-radius:24px; padding:24px; max-width:480px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,0.4); backdrop-filter:blur(14px); }
  .cf-modal-title { font-size:20px; font-weight:800; color:#e8f0e2; margin:0 0 6px; letter-spacing:-0.01em; }
  .cf-modal-sub { font-size:12px; color:rgba(160,210,170,0.62); margin:0 0 18px; line-height:1.6; }
  .cf-reason-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:14px; }
  .cf-reason-btn { padding:8px 10px; border-radius:9px; border:1px solid rgba(120,200,145,0.22); background:rgba(245,197,24,0.06); font-size:12px; font-weight:600; color:rgba(180,230,180,0.7); cursor:pointer; font-family:inherit; transition:background .12s; text-align:center; }
  .cf-reason-btn:hover, .cf-reason-btn.sel { background:#F5C518; border-color:#F5C518; color:#1a3010; }
  .cf-modal-actions { display:flex; gap:10px; justify-content:flex-end; align-items:center; margin-top:18px; padding-top:16px; border-top:1px solid rgba(120,200,145,0.16); }
  .cf-community-pill { display:inline-flex; align-items:center; justify-content:center; border-radius:99px; padding:3px 10px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; }
  .cf-community-pill--feed { background:rgba(245,197,24,0.25); color:#F5C518; border:1px solid rgba(245,197,24,0.4); }
  .cf-community-pill--privacy { background:rgba(255,255,255,0.12); color:#fff; border:1px solid rgba(255,255,255,0.24); }
  .cf-community-actions { position:relative; z-index:12; overflow:visible; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; margin:-8px 0 24px 0; background:linear-gradient(180deg,rgba(12,31,18,0.96) 0%,rgba(8,24,14,0.92) 100%); border:1px solid rgba(120,200,145,0.18); border-radius:18px; padding:14px 16px; box-shadow:0 14px 28px rgba(0,0,0,0.12); backdrop-filter:blur(10px); }
  .cf-community-actions-main { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .cf-community-creator-section { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .cf-community-actions-note { font-size:10px; font-weight:800; color:rgba(160,210,170,0.4); letter-spacing:1.8px; text-transform:uppercase; }
  .cf-community-action { height:42px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:0 18px; border-radius:999px; border:1px solid rgba(120,200,145,0.24); background:rgba(255,255,255,0.06); color:#e8f0e2; font-size:13px; font-weight:800; cursor:pointer; font-family:inherit; transition:transform .12s, background .12s, border-color .12s, color .12s, box-shadow .12s; }
  .cf-community-action:hover, .cf-community-action:focus-visible { background:rgba(245,197,24,0.14); border-color:rgba(245,197,24,0.34); color:#F5C518; transform:translateY(-1px); outline:none; }
  .cf-community-action--primary { background:#F5C518; color:#1a3010; border-color:#F5C518; box-shadow:0 10px 18px rgba(245,197,24,0.18); }
  .cf-community-action--primary:hover, .cf-community-action--primary:focus-visible { background:#f2c61c; color:#1a3010; }
  .cf-community-action--secondary { background:rgba(37,99,235,0.18); color:#dbeafe; border-color:rgba(96,165,250,0.34); }
  .cf-community-action--secondary:hover, .cf-community-action--secondary:focus-visible { background:rgba(37,99,235,0.26); color:#fff; border-color:rgba(147,197,253,0.5); }
  .cf-community-action--ghost { background:rgba(255,255,255,0.04); color:#e8f0e2; }
  .cf-community-menu-wrap { position:relative; display:inline-flex; }
  .cf-community-menu-btn { width:42px; min-width:42px; padding:0; font-size:22px; line-height:1; }
  .cf-community-menu-panel { position:absolute; top:calc(100% + 10px); right:0; background:linear-gradient(180deg,rgba(14,33,19,0.98) 0%,rgba(8,24,14,0.98) 100%); border:1px solid rgba(120,200,145,0.22); border-radius:18px; box-shadow:0 16px 32px rgba(0,0,0,0.28); min-width:220px; padding:8px; z-index:80; }
  .cf-community-menu-handle { display:none; width:42px; height:4px; border-radius:99px; background:rgba(160,210,170,0.34); margin:2px auto 10px; }
  .cf-community-menu-title { padding:2px 10px 8px; font-size:10px; font-weight:800; color:rgba(160,210,170,0.48); letter-spacing:1.8px; text-transform:uppercase; }
  .cf-community-menu-item { display:flex; align-items:center; gap:10px; width:100%; padding:12px 12px; background:none; border:none; border-radius:12px; color:#e8f0e2; text-align:left; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; transition:background .12s, color .12s; }
  .cf-community-menu-item:hover { background:rgba(245,197,24,0.10); color:#F5C518; }
  .cf-community-menu-item--danger { color:#fca5a5; }
  .cf-community-menu-item--danger:hover { background:rgba(220,38,38,0.16); color:#fecaca; }
  .cf-modal-form { display:grid; gap:14px; }
  .cf-modal-field { display:grid; gap:7px; }
  .cf-modal-label { font-size:10px; font-weight:800; color:rgba(160,210,170,0.55); letter-spacing:1.6px; text-transform:uppercase; }
  .cf-modal-input, .cf-modal-textarea { width:100%; box-sizing:border-box; border:1px solid rgba(120,200,145,0.22); border-radius:12px; background:rgba(245,197,24,0.06); color:#e8f0e2; padding:11px 13px; font-size:14px; font-family:inherit; outline:none; }
  .cf-modal-input:focus, .cf-modal-textarea:focus { border-color:rgba(245,197,24,0.42); }
  .cf-modal-textarea { min-height:110px; resize:vertical; }
  .cf-privacy-card { border:1px solid rgba(120,200,145,0.22); border-radius:16px; background:linear-gradient(180deg,rgba(245,197,24,0.07) 0%,rgba(245,197,24,0.03) 100%); padding:15px 16px; }
  .cf-privacy-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:12px; }
  .cf-privacy-title { font-size:14px; font-weight:800; color:#e8f0e2; margin-bottom:4px; }
  .cf-privacy-copy { font-size:12px; color:rgba(160,210,170,0.72); line-height:1.5; }
  .cf-privacy-toggle-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .cf-privacy-state { display:inline-flex; align-items:center; justify-content:center; padding:6px 12px; border-radius:999px; border:1px solid rgba(120,200,145,0.2); background:rgba(255,255,255,0.04); font-size:12px; font-weight:700; color:rgba(160,210,170,0.58); transition:color .12s, background .12s, border-color .12s; }
  .cf-privacy-state.active { color:#1a3010; background:#F5C518; border-color:#F5C518; }
  .cf-privacy-switch { position:relative; width:58px; height:32px; border-radius:999px; border:1px solid rgba(120,200,145,0.24); background:rgba(120,200,145,0.18); cursor:pointer; padding:0; transition:background .12s, border-color .12s; }
  .cf-privacy-switch input { display:none; }
  .cf-privacy-switch-thumb { position:absolute; top:3px; left:3px; width:24px; height:24px; border-radius:50%; background:#fff; transition:transform .16s ease, background .16s ease; }
  .cf-privacy-switch.on { background:rgba(245,197,24,0.28); border-color:rgba(245,197,24,0.42); }
  .cf-privacy-switch.on .cf-privacy-switch-thumb { transform:translateX(26px); background:#F5C518; }
  .cf-modal-error { font-size:12px; color:#fca5a5; }
  .cf-danger-note { border:1px solid rgba(220,38,38,0.22); border-radius:14px; padding:12px 14px; background:rgba(220,38,38,0.10); color:#fecaca; font-size:12px; line-height:1.6; }
  .cf-danger-btn { background:#dc2626; color:#fff; border:none; border-radius:10px; padding:9px 20px; font-weight:800; font-size:13px; cursor:pointer; font-family:inherit; transition:opacity .12s; }
  .cf-danger-btn:hover { opacity:0.9; }
  .cf-danger-btn:disabled { opacity:0.65; cursor:not-allowed; }

  @media(max-width:1100px) { .cf-feed-wrap { grid-template-columns:1fr; } }
  @media(max-width:600px) { .cf-feed-wrap { padding:90px 12px 40px; } .cf-post-card { padding:14px; } .cf-community-actions { padding:14px; } .cf-community-actions-main { width:100%; } .cf-community-action { flex:1 1 calc(50% - 5px); } .cf-community-menu-wrap { margin-left:auto; } .cf-community-menu-btn { flex:0 0 42px; } .cf-community-menu-panel { position:fixed; left:12px; right:12px; bottom:12px; top:auto; min-width:0; border-radius:22px; padding:10px; } .cf-community-menu-handle { display:block; } .cf-modal-overlay { align-items:flex-end; padding:12px; } .cf-modal { max-width:none; padding:22px 18px; border-radius:24px; } .cf-modal-actions { flex-direction:column-reverse; align-items:stretch; } .cf-modal-actions > button { width:100%; justify-content:center; } .cf-privacy-head { flex-direction:column; } }
`;

const REPORT_REASONS = [
  { value: "spam", label: "🔁 Spam" },
  { value: "harassment", label: "😠 Harassment" },
  { value: "inappropriate", label: "🔞 Inappropriate" },
  { value: "misinformation", label: "❌ Misinformation" },
  { value: "other", label: "💬 Other" },
];

const COMMUNITY_LIKES_STORAGE_KEY = "saha_community_like_state_v1";

const readPersistedCommunityLikes = () => {
  try {
    const raw = localStorage.getItem(COMMUNITY_LIKES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writePersistedCommunityLikes = (value) => {
  try {
    localStorage.setItem(COMMUNITY_LIKES_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
};

const getPersistedCommunityLike = (userId, postId) => {
  if (!userId || postId == null) return undefined;
  const map = readPersistedCommunityLikes();
  const value = map?.[String(userId)]?.[String(postId)];
  return typeof value === "boolean" ? value : undefined;
};

const setPersistedCommunityLike = (userId, postId, liked) => {
  if (!userId || postId == null) return;
  const map = readPersistedCommunityLikes();
  map[String(userId)] = {
    ...(map[String(userId)] || {}),
    [String(postId)]: Boolean(liked),
  };
  writePersistedCommunityLikes(map);
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toggleLikeLocally = (post) => {
  const wasLiked = Boolean(post.likedByUser);
  const currentCount = toNumber(post.likeCount);

  return {
    ...post,
    likedByUser: !wasLiked,
    likeCount: wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
  };
};

const normalizeLikeFromApi = (post, payload) => {
  const likeCount = payload?.like_count ?? payload?.likes_count ?? payload?.likes ?? post.likeCount;
  const likedByUser = payload?.liked_by_me ?? payload?.liked_by_user ?? payload?.is_liked ?? post.likedByUser;

  return {
    ...post,
    likeCount: toNumber(likeCount),
    likedByUser: Boolean(likedByUser),
  };
};

// ── Report Modal ────────────────────────────────────────────
function ReportModal({ postId, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!reason) { setErr("Please select a reason."); return; }
    setBusy(true);
    setErr("");
    try {
      await API.post(`posts/${postId}/report/`, { reason, message });
      onSubmit();
    } catch {
      setErr("Failed to submit report. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cf-modal-title">🚩 Report Post</h3>
        <p className="cf-modal-sub">Select a reason. Our team will review it shortly.</p>

        <div className="cf-reason-grid">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              className={`cf-reason-btn${reason === r.value ? " sel" : ""}`}
              onClick={() => { setReason(r.value); setErr(""); }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          className="cf-compose-in"
          style={{ display: "block", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: "70px" }}
          placeholder="Additional details (optional)…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {err && <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{err}</div>}

        <div className="cf-modal-actions">
          <button
            className="cf-act-btn"
            onClick={onClose}
            style={{ color: "rgba(180,230,180,0.6)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              background: "#F5C518", color: "#1a3010", border: "none",
              borderRadius: 10, padding: "9px 20px", fontWeight: 800,
              fontSize: 13, cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1, fontFamily: "inherit",
            }}
          >
            {busy ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityEditModal({ form, busy, error, onClose, onChange, onSubmit }) {
  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cf-modal-title">Edit Community</h3>
        <p className="cf-modal-sub">Update the community name, description, and visibility.</p>

        <div className="cf-modal-form">
          <div className="cf-modal-field">
            <label className="cf-modal-label" htmlFor="community-edit-name">Name</label>
            <input
              id="community-edit-name"
              className="cf-modal-input"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Community name"
            />
          </div>

          <div className="cf-modal-field">
            <label className="cf-modal-label" htmlFor="community-edit-description">Description</label>
            <textarea
              id="community-edit-description"
              className="cf-modal-textarea"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Describe this community"
            />
          </div>

          <div className="cf-modal-field">
            <span className="cf-modal-label">Privacy</span>
            <div className="cf-privacy-card">
              <div className="cf-privacy-head">
                <div>
                  <div className="cf-privacy-title">
                    {form.isPrivate ? "Private community" : "Public community"}
                  </div>
                  <div className="cf-privacy-copy">
                    Switch on to keep the community private. Switch off to make it public.
                  </div>
                </div>
                <label className={`cf-privacy-switch${form.isPrivate ? " on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.isPrivate}
                    onChange={(e) => onChange("isPrivate", e.target.checked)}
                  />
                  <span className="cf-privacy-switch-thumb" />
                </label>
              </div>

              <div className="cf-privacy-toggle-row">
                <span className={`cf-privacy-state${!form.isPrivate ? " active" : ""}`}>Public</span>
                <span className={`cf-privacy-state${form.isPrivate ? " active" : ""}`}>Private</span>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="cf-modal-error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="cf-modal-actions">
          <button
            type="button"
            className="cf-act-btn"
            onClick={onClose}
            disabled={busy}
            style={{ color: "rgba(180,230,180,0.6)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            style={{
              background: "#F5C518",
              color: "#1a3010",
              border: "none",
              borderRadius: 10,
              padding: "9px 20px",
              fontWeight: 800,
              fontSize: 13,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteCommunityDialog({ communityName, busy, error, onCancel, onConfirm }) {
  return (
    <div className="cf-modal-overlay" onClick={onCancel}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cf-modal-title">Delete Community</h3>
        <p className="cf-modal-sub">
          Delete <strong>{communityName || "this community"}</strong>? This cannot be undone.
        </p>

        <div className="cf-danger-note">
          This removes the community and returns you to the communities list immediately after the request succeeds.
        </div>

        {error && <div className="cf-modal-error">{error}</div>}

        <div className="cf-modal-actions">
          <button
            type="button"
            className="cf-act-btn"
            onClick={onCancel}
            disabled={busy}
            style={{ color: "rgba(180,230,180,0.6)" }}
          >
            Cancel
          </button>
          <button type="button" className="cf-danger-btn" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete Community"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function CommunityFeed() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isStudent = location.pathname.startsWith("/student");
  const base = isStudent ? "/student" : "/teacher";
  const Layout = isStudent ? StudentLayout : TeacherLayout;
  const pageUser = isStudent ? studentPageUser : teacherPageUser;
  const viewerId = String(localStorage.getItem("user_id") || "");

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ddOpen, setDdOpen] = useState(false);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postDeleteTarget, setPostDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", isPrivate: false });
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deletePostBusy, setDeletePostBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState(null);
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);   // post id of open 3-dots menu
  const [reportPostId, setReportPostId] = useState(null); // post id being reported
  const cardRefs = useRef([]);
  const noteEditorRef = useRef(null);
  const communityMenuRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Compose state
  const [composeText, setComposeText] = useState("");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeType, setComposeType] = useState("post");
  const [composeOpen, setComposeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [composeErr, setComposeErr] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const [resourceFile, setResourceFile] = useState(null);
  const resourceFileRef = useRef(null);

  // ── Inject styles ──
  useEffect(() => {
    const styleId = "cf-feed-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = FEED_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // ── Close 3-dots menu on outside click ──
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".cf-dots-btn") && !e.target.closest(".cf-dots-menu")) {
        setMenuOpenIdx(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const closeCommunityMenu = (event) => {
      if (communityMenuRef.current && !communityMenuRef.current.contains(event.target)) {
        setCommunityMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeCommunityMenu);
    return () => document.removeEventListener("mousedown", closeCommunityMenu);
  }, []);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const showToast = (message, tone = "info") => {
    setToast({ message, tone });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  // ── Load community + posts ──
  const transformPosts = (raw) => {
    const list = Array.isArray(raw) ? raw : (raw?.results || []);
    return list.map((p) => {
      const serverLiked = p.liked_by_me ?? p.liked_by_user ?? p.is_liked;
      const persistedLiked = getPersistedCommunityLike(viewerId, p.id);

      return {
        id: p.id,
        title: p.title || "Untitled",
        content: p.content || "",
        postType: p.post_type || "post",
        is_pinned: p.is_pinned || false,
        image: p.image
          ? (p.image.startsWith("http") ? p.image : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8000"}${p.image}`)
          : null,
        likeCount: p.like_count ?? p.likes_count ?? p.likes ?? 0,
        replyCount: p.reply_count ?? 0,
        likedByUser: serverLiked ?? persistedLiked ?? false,
        createdAt: p.created_at
          ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          : "Just now",
        author: {
          fullName: p.author_name || "Unknown",
          avatarDisplay: (p.author_name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        },
      };
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [commRes, postsRes] = await Promise.all([
          API.get(`communities/${id}/`),
          API.get(`communities/${id}/posts/`),
        ]);
        setCommunity(commRes.data);
        setPosts(transformPosts(postsRes.data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, viewerId]);

  // Intersection observer for card animations
  const sortedPosts = [...posts].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, sortedPosts.length);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
        });
      },
      { threshold: 0.05 }
    );
    cardRefs.current.forEach((card, i) => {
      if (card) { card.style.transitionDelay = `${i * 55}ms`; observer.observe(card); }
    });
    return () => observer.disconnect();
  }, [posts]);

  // ── Post actions ──
  const toggleLike = (postId) => {
    let optimisticLiked;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const nextPost = toggleLikeLocally(p);
      optimisticLiked = nextPost.likedByUser;
      return nextPost;
    }));
    if (typeof optimisticLiked === "boolean") {
      setPersistedCommunityLike(viewerId, postId, optimisticLiked);
    }
    emitActivityNotification({
      id: `community-like-${postId}-${Date.now()}`,
      kind: "like",
      text: "You reacted to a community post.",
      postId,
    });
    API.post(`posts/${postId}/like/`)
      .then((res) => {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const nextPost = normalizeLikeFromApi(p, res?.data);
            setPersistedCommunityLike(viewerId, postId, nextPost.likedByUser);
            return nextPost;
          })
        );
      })
      .catch(() => {
        // Revert optimistic update when the request fails.
        let revertedLiked;
        setPosts((prev) => prev.map((p) => {
          if (p.id !== postId) return p;
          const nextPost = toggleLikeLocally(p);
          revertedLiked = nextPost.likedByUser;
          return nextPost;
        }));
        if (typeof revertedLiked === "boolean") {
          setPersistedCommunityLike(viewerId, postId, revertedLiked);
        }
      });
  };

  const handleShare = async (post) => {
    const url = `${window.location.origin}/teacher/community/${id}/feed`;
    const text = `${post.title || "Post"}\n${url}`;

    try {
      await API.post(`posts/${post.id}/share/`, {
        community_id: Number(id),
      });

      if (navigator.share) {
        await navigator.share({ title: post.title || "Post", text: post.content || "", url });
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Post link copied to clipboard.", "success");
      }

      emitActivityNotification({
        id: `community-share-${post.id}-${Date.now()}`,
        kind: "share",
        text: `You shared: ${post.title || "Post"}`,
        postId: post.id,
      });
    } catch {
      // Ignore user-cancelled share.
    }
  };

  const handleReply = async (post) => {
    const replyText = window.prompt("Write your reply:");
    if (!replyText || !replyText.trim()) return;

    try {
      await API.post(`posts/${post.id}/replies/`, {
        content: replyText.trim(),
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, replyCount: (p.replyCount || 0) + 1 }
            : p
        )
      );

      emitActivityNotification({
        id: `community-reply-${post.id}-${Date.now()}`,
        kind: "reply",
        text: `You replied to: ${post.title || "Post"}`,
        postId: post.id,
      });
      showToast("Reply posted.", "success");
    } catch {
      showToast("Failed to post reply.", "error");
    }
  };

  const pinPost = async (postId) => {
    await API.post(`teacher/pin-post/${postId}/`);
    const res = await API.get(`communities/${id}/posts/`);
    setPosts(transformPosts(res.data));
  };

  // ── Report handler (opens modal) ──
  const handleReport = (postId) => {
    setMenuOpenIdx(null);
    setReportPostId(postId);
  };

  const handleReportSubmitted = () => {
    setReportPostId(null);
    showToast("Post reported. Our team will review it shortly.", "success");
  };

  const openEditModal = () => {
    if (!community) return;
    setCommunityMenuOpen(false);
    setEditError("");
    setEditForm({
      name: community.name || "",
      description: community.description || "",
      isPrivate: Boolean(community.is_private),
    });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCommunityEdit = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setEditError("Your session has expired. Please log in again.");
      return;
    }

    if (!editForm.name.trim()) {
      setEditError("Community name is required.");
      return;
    }

    setEditBusy(true);
    setEditError("");

    try {
      const response = await fetch(getCommunityEndpoint(id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          is_private: editForm.isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error(await readFetchErrorMessage(response, "Failed to update community."));
      }

      const contentType = response.headers.get("content-type") || "";
      const updatedCommunity = contentType.includes("application/json") ? await response.json() : null;

      setCommunity((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(updatedCommunity && typeof updatedCommunity === "object" ? updatedCommunity : {}),
          name: updatedCommunity?.name ?? editForm.name.trim(),
          description: updatedCommunity?.description ?? editForm.description.trim(),
          is_private: updatedCommunity?.is_private ?? editForm.isPrivate,
        };
      });
      setEditModalOpen(false);
      showToast("Community updated successfully.", "success");
    } catch (error) {
      setEditError(error.message || "Failed to update community.");
    } finally {
      setEditBusy(false);
    }
  };

  const openDeleteDialog = () => {
    setCommunityMenuOpen(false);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleCommunityDelete = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setDeleteError("Your session has expired. Please log in again.");
      return;
    }

    setDeleteBusy(true);
    setDeleteError("");

    try {
      const response = await fetch(getCommunityEndpoint(id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readFetchErrorMessage(response, "Failed to delete community."));
      }

      setDeleteDialogOpen(false);
      navigate("/teacher/communities");
    } catch (error) {
      setDeleteError(error.message || "Failed to delete community.");
    } finally {
      setDeleteBusy(false);
    }
  };

  // ── Delete handler ──
  // Uses the report-based soft-delete: POST a report with reason "inappropriate",
  // then the admin can action it. For community owners who can delete directly,
  // call the community post delete endpoint instead.
  const openDeletePostDialog = (post) => {
    setMenuOpenIdx(null);
    setPostDeleteTarget(post);
  };

  const handleDelete = async () => {
    if (!postDeleteTarget) return;

    const postId = postDeleteTarget.id;
    setDeletePostBusy(true);
    try {
      // Try the community post delete endpoint first (works if user is owner/admin)
      await API.delete(`communities/${id}/posts/${postId}/`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setPostDeleteTarget(null);
      showToast("Post deleted.", "success");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        showToast("You don't have permission to delete this post.", "error");
      } else if (status === 404) {
        // Fallback: try generic post delete
        try {
          await API.delete(`posts/${postId}/`);
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          setPostDeleteTarget(null);
          showToast("Post deleted.", "success");
        } catch {
          showToast("Could not delete this post.", "error");
        }
      } else {
        showToast("Failed to delete post. Try again.", "error");
      }
    } finally {
      setDeletePostBusy(false);
    }
  };

  // ── Compose ──
  const resetCompose = () => {
    setComposeText(""); setComposeTitle(""); setComposeOpen(false);
    setComposeErr(""); setImageFile(null); setImagePreview(""); setResourceFile(null);
    if (noteEditorRef.current) noteEditorRef.current.innerHTML = "";
  };

  const execRich = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    noteEditorRef.current?.focus();
  };

  const submitPost = async () => {
    if (composeType === "photo" && !imageFile) { setComposeErr("Please choose a photo or video."); return; }
    if (composeType === "resource" && !resourceFile) { setComposeErr("Please attach a resource file."); return; }
    if (composeType === "note" && !noteEditorRef.current?.innerText?.trim()) { setComposeErr("Please write something in the note."); return; }
    if (composeType === "post" && !composeText.trim()) { setComposeErr("Please write something before posting."); return; }

    setSubmitting(true);
    setComposeErr("");
    try {
      const noteHtml = noteEditorRef.current ? noteEditorRef.current.innerHTML : "";
      const finalContent = composeType === "note" ? noteHtml : composeText.trim();
      const fd = new FormData();
      fd.append("title", composeTitle.trim() || composeText.trim().slice(0, 60) || "Post");
      fd.append("content", finalContent);
      fd.append("post_type", composeType === "resource" ? "resource" : composeType);
      if (composeType === "resource" && resourceFile) fd.append("attachment", resourceFile);
      if (imageFile) fd.append("image", imageFile);
      const postRes = await API.post(`communities/${id}/posts/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const newPost = transformPosts([postRes.data])[0];
      setPosts((prev) => [newPost, ...prev]);
      emitActivityNotification({
        id: `community-post-${newPost?.id || Date.now()}`,
        kind: "post",
        text: `You shared a post: ${newPost?.title || "Untitled"}`,
        postId: newPost?.id,
      });
      resetCompose();
    } catch (err) {
      const m = err?.response?.data?.detail || err?.response?.data || "Failed to post. Please try again.";
      setComposeErr(typeof m === "string" ? m : JSON.stringify(m));
    } finally {
      setSubmitting(false);
    }
  };

  const isCommunityCreator = community?.user_role === "creator";
  const communityPrivacyLabel = community?.is_private ? "Private" : "Public";

  // ── Render ──
  return (
    <Layout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>

      <CommunityFeedbackStyles />
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        <div className="cf-feed-wrap">

          {/* ── MAIN ── */}
          <main>


            {/* Banner */}
            {community && (
              <>
                <div className="cf-banner">
                  <img
                    src={`https://picsum.photos/seed/comm${id}/900/200`}
                    alt={community.name}
                    style={{ width: "100%", height: "180px", objectFit: "cover", display: "block", borderRadius: "24px" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(245,197,24,0.70) 0%,rgba(0,0,0,0.30) 100%)", borderRadius: "24px" }} />
                  <div style={{ position: "absolute", inset: 0, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.25)", margin: 0 }}>
                        {community.name}
                      </h1>
                      <span className="cf-community-pill cf-community-pill--feed">
                        Feed
                      </span>
                      <span className="cf-community-pill cf-community-pill--privacy">
                        {communityPrivacyLabel}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: "0 0 12px", maxWidth: "480px" }}>
                      {community.description}
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button className="cf-nav-btn-back" onClick={() => navigate(`${base}/communities`)}>
                        ← Communities
                      </button>
                    </div>
                  </div>
                </div>
                {/* Community actions nav bar - always visible below banner */}
                <div className="cf-community-actions">

                  <div className="cf-community-actions-main">

                    {!isStudent && (
                      <button
                        onClick={() => navigate(`/teacher/community/${id}/add-members`)}
                        className="cf-community-action cf-community-action--primary"
                      >
                        ➕ Add Members
                      </button>
                    )}

                    <button
                      onClick={() =>
                        navigate(
                          isStudent
                            ? `${base}/community/${id}`
                            : `${base}/community/${id}/all-members`
                        )
                      }
                      className="cf-community-action cf-community-action--secondary"
                    >
                      👥 View Members
                    </button>

                  </div>

                  <div className="cf-community-creator-section">

                    {!isCommunityCreator && (
                      <div className="cf-community-actions-note">
                        Members tools
                      </div>
                    )}

                    {isCommunityCreator && (
                      <>
                        <div className="cf-community-actions-note">
                          Creator tools
                        </div>

                        <div
                          className="cf-community-menu-wrap"
                          ref={communityMenuRef}
                        >
                          <button
                            type="button"
                            className="cf-community-action cf-community-action--ghost cf-community-menu-btn"
                            aria-label="Open community actions"
                            aria-expanded={communityMenuOpen}
                            onClick={() =>
                              setCommunityMenuOpen((prev) => !prev)
                            }
                          >
                            ⋯
                          </button>

                          {communityMenuOpen && (
                            <div className="cf-community-menu-panel">
                              <div className="cf-community-menu-handle" />

                              <div className="cf-community-menu-title">
                                Creator Actions
                              </div>

                              <button
                                type="button"
                                className="cf-community-menu-item"
                                onClick={openEditModal}
                              >
                                <span>✏️</span>
                                <span>Edit Community</span>
                              </button>

                              <button
                                type="button"
                                className="cf-community-menu-item cf-community-menu-item--danger"
                                onClick={openDeleteDialog}
                              >
                                <span>🗑</span>
                                <span>Delete Community</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                  </div>

                </div>
                {/* Compose */}
                <div className="cf-compose-card">
                  <div className="cf-compose-row">
                    <div className="cf-c-av">{pageUser.avatarDisplay}</div>
                    <input
                      className="cf-compose-in"
                      placeholder="Share something with this community…"
                      value={composeText}
                      onChange={(e) => { setComposeText(e.target.value); setComposeOpen(true); setComposeErr(""); }}
                      onFocus={() => setComposeOpen(true)}
                    />
                  </div>
                  <div className="cf-post-types">
                    {[
                      { t: "post", label: "📝 Post" },
                      { t: "photo", label: "📸 Photo/Video" },
                      { t: "note", label: "🗒 Note" },
                      { t: "resource", label: "📎 Resource" },
                    ].map(({ t, label }) => (
                      <button key={t} type="button"
                        className={`cf-pt${composeType === t ? " act" : ""}`}
                        onClick={() => { setComposeType(t); setComposeOpen(true); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {composeOpen && (
                    <div style={{ marginTop: "12px" }}>
                      <input
                        className="cf-compose-in"
                        style={{ marginBottom: "8px", display: "block", width: "100%", boxSizing: "border-box" }}
                        placeholder="Title (optional)"
                        value={composeTitle}
                        onChange={(e) => setComposeTitle(e.target.value)}
                      />

                      {composeType === "photo" && (
                        <div
                          onClick={() => fileInputRef.current.click()}
                          style={{ border: "2px dashed rgba(120,200,145,0.35)", borderRadius: "14px", padding: "24px", textAlign: "center", cursor: "pointer", background: "rgba(245,197,24,0.04)", marginBottom: "10px" }}
                        >
                          {imagePreview
                            ? <img src={imagePreview} alt="preview" style={{ maxHeight: "160px", borderRadius: "10px", objectFit: "cover" }} />
                            : (<><div style={{ fontSize: "28px", marginBottom: "6px" }}>📷</div><div style={{ fontSize: "13px", color: "rgba(160,210,170,0.7)" }}>Click to choose photo / video</div></>)
                          }
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }}
                      />

                      {composeType === "note" && (
                        <div style={{ marginBottom: "10px" }}>
                          <div className="cf-rich-toolbar">
                            <span className="cf-rich-lbl">✏ Notes</span>
                            <button type="button" className="cf-rich-btn" onMouseDown={(e) => { e.preventDefault(); execRich("bold"); }}><strong>B</strong></button>
                            <button type="button" className="cf-rich-btn" onMouseDown={(e) => { e.preventDefault(); execRich("italic"); }}><em>I</em></button>
                            <button type="button" className="cf-rich-btn" onMouseDown={(e) => { e.preventDefault(); execRich("underline"); }}><u>U</u></button>
                            <button type="button" className="cf-rich-btn" onMouseDown={(e) => { e.preventDefault(); execRich("insertUnorderedList"); }}>• List</button>
                            <button type="button" className="cf-rich-btn" onMouseDown={(e) => { e.preventDefault(); execRich("insertOrderedList"); }}>1. List</button>
                            <button type="button" className="cf-rich-btn" onMouseDown={(e) => { e.preventDefault(); const url = prompt("URL:"); if (url) execRich("createLink", url); }}>🔗 Link</button>
                          </div>
                          <div
                            ref={noteEditorRef}
                            className="cf-rich-surface"
                            contentEditable
                            data-placeholder="Write your note here…"
                            onInput={() => setComposeErr("")}
                            suppressContentEditableWarning
                          />
                        </div>
                      )}

                      {composeType === "post" && (
                        <textarea
                          className="cf-compose-in"
                          style={{ display: "block", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: "90px" }}
                          placeholder="What's on your mind?"
                          value={composeText}
                          onChange={(e) => { setComposeText(e.target.value); setComposeErr(""); }}
                        />
                      )}

                      {composeType === "photo" && (
                        <textarea
                          className="cf-compose-in"
                          style={{ display: "block", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: "60px", marginTop: "8px" }}
                          placeholder="Add a caption… (optional)"
                          value={composeText}
                          onChange={(e) => { setComposeText(e.target.value); setComposeErr(""); }}
                        />
                      )}

                      {composeType === "resource" && (
                        <div style={{ marginBottom: "10px" }}>
                          <div
                            onClick={() => resourceFileRef.current.click()}
                            style={{ border: "2px dashed rgba(120,200,145,0.35)", borderRadius: "14px", padding: "22px", textAlign: "center", cursor: "pointer", background: "rgba(245,197,24,0.04)", marginBottom: "8px" }}
                          >
                            {resourceFile
                              ? <div style={{ fontSize: "13px", color: "#F5C518", fontWeight: 700 }}>📎 {resourceFile.name}</div>
                              : (<><div style={{ fontSize: "28px", marginBottom: "6px" }}>📎</div><div style={{ fontSize: "13px", color: "rgba(160,210,170,0.7)" }}>Click to attach PDF, doc, or file</div></>)
                            }
                          </div>
                          <input ref={resourceFileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*" style={{ display: "none" }}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) setResourceFile(f); }}
                          />
                          <textarea
                            className="cf-compose-in"
                            style={{ display: "block", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: "60px" }}
                            placeholder="Describe this resource… (optional)"
                            value={composeText}
                            onChange={(e) => { setComposeText(e.target.value); setComposeErr(""); }}
                          />
                        </div>
                      )}

                      {composeErr && (
                        <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "6px" }}>{composeErr}</div>
                      )}
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={submitPost}
                          disabled={submitting}
                          style={{ background: "#F5C518", color: "#1a3010", border: "none", borderRadius: "10px", padding: "9px 20px", fontWeight: 800, fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit" }}
                        >
                          {submitting ? "Posting…" : composeType === "photo" ? "Share Photo" : composeType === "note" ? "Publish Note" : composeType === "resource" ? "Upload Resource" : "Post"}
                        </button>
                        <button
                          type="button"
                          onClick={resetCompose}
                          style={{ background: "transparent", color: "rgba(180,230,180,0.7)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "10px", padding: "9px 16px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="cf-feed-label">✦ Community Posts ✦</div>

                {loading && (
                  <div className="cf-spinner">
                    <div className="cf-spinner-ring" />
                    Loading feed…
                  </div>
                )}

                {!loading && sortedPosts.length === 0 && (
                  <div className="cf-empty-feed">
                    No posts yet — be the first! Click <strong>Post</strong>, <strong>Photo/Video</strong>, <strong>Note</strong>, or <strong>Resource</strong> above.
                  </div>
                )}

                {!loading && sortedPosts.map((post, i) => {
                  const pt = post.postType || "post";
                  return (
                    <div
                      key={post.id}
                      className="cf-post-card"
                      ref={(el) => (cardRefs.current[i] = el)}
                    >

                      {/* 3-dots menu bottom right */}
                      <div style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 10 }}>
                        <button
                          className="cf-dots-btn"
                          aria-label="More options"
                          style={{ position: 'static', top: 'unset', right: 'unset', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, fontSize: 22, color: '#b5b5b5' }}
                          onClick={e => {
                            e.stopPropagation();
                            setMenuOpenIdx(menuOpenIdx === post.id ? null : post.id);
                          }}
                        >
                          <span style={{ fontSize: 22, color: '#b5b5b5', fontWeight: 700, lineHeight: 1 }}>⋯</span>
                        </button>
                        {menuOpenIdx === post.id && (
                          <div
                            style={{
                              position: 'absolute', right: 0, bottom: 32, background: '#1a2a1a', border: '1px solid #2e3e2e', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', minWidth: 140, zIndex: 20
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              style={{ display: 'block', width: '100%', padding: '10px 18px', background: 'none', border: 'none', color: '#fca5a5', textAlign: 'left', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #2e3e2e' }}
                              onClick={() => { setMenuOpenIdx(null); handleReport(post.id); }}
                            >
                              🚩 Report
                            </button>
                            <button
                              style={{ display: 'block', width: '100%', padding: '10px 18px', background: 'none', border: 'none', color: '#f87171', textAlign: 'left', fontSize: 14, cursor: 'pointer' }}
                              onClick={() => openDeletePostDialog(post)}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="cf-post-head">

                        <div
                          className="cf-p-av"
                          style={{ background: avatarColors[i % avatarColors.length] }}
                        >
                          {post.author?.avatarDisplay || "U"}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div className="cf-post-author-name">
                            {post.author?.fullName}
                          </div>

                          <div className="cf-post-author-meta">
                            {post.createdAt}
                          </div>
                        </div>

                        <span
                          className={`cf-chip ${pt === "photo"
                              ? "cf-chip-photo"
                              : pt === "note"
                                ? "cf-chip-note"
                                : "cf-chip-post"
                            }`}
                        >
                          {pt}
                        </span>

                      </div>


                      <span className="cf-post-title">{post.title}</span>

                      {/* Reason grid for reported posts (if any) */}
                      {post.reports && post.reports.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '8px',
                          margin: '10px 0',
                          background: 'rgba(239,68,68,0.07)',
                          borderRadius: 8,
                          padding: '8px 10px',
                        }}>
                          {post.reports.map((r, idx) => (
                            <div key={idx} style={{
                              background: 'rgba(239,68,68,0.13)',
                              border: '1px solid rgba(239,68,68,0.18)',
                              borderRadius: 6,
                              color: '#f87171',
                              fontSize: 12,
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontWeight: 600,
                            }}>
                              {r.reason}
                            </div>
                          ))}
                        </div>
                      )}

                      {post.image && (
                        <div className="cf-photo-card">
                          <img src={post.image} alt={post.title} />
                        </div>
                      )}

                      {pt === "note"
                        ? <div className="cf-note-card" dangerouslySetInnerHTML={{ __html: post.content }} />
                        : post.content && <div className="cf-post-copy">{post.content}</div>
                      }

                      <div className="cf-post-actions">
                        <button className={`cf-act-btn${post.likedByUser ? " liked" : ""}`} onClick={() => toggleLike(post.id)}>
                          {post.likedByUser ? "♥" : "♡"} {post.likeCount}
                        </button>
                        <div className="cf-act-sep" />
                        <button className="cf-act-btn" onClick={() => handleReply(post)}>◎ {post.replyCount} Replies</button>
                        <div className="cf-act-sep" />
                        <button className="cf-act-btn" onClick={() => handleShare(post)}>↗ Share</button>
                        <div className="cf-act-sep" />
                        <button className="cf-pin-btn" onClick={() => pinPost(post.id)}>
                          {post.is_pinned ? "Unpin" : "📌 Pin"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
              </main>

            {/* ── RIGHT SIDEBAR ── */}
            <aside>
              {community && (
                <div className="cf-widget">
                  <div className="cf-wt">About This Community</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <img
                      src={`https://picsum.photos/seed/comm${id}/48/48`}
                      alt={community.name}
                      style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#e8f0e2" }}>{community.name}</div>
                      <div style={{ fontSize: "11px", color: "rgba(160,210,170,0.5)" }}>
                        {community.member_count ?? 0} members · {communityPrivacyLabel}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(160,210,170,0.65)", lineHeight: 1.6, margin: "0 0 12px" }}>
                    {community.description}
                  </p>
                  {community.created_by_display && (
                    <div style={{ fontSize: "11px", color: "rgba(160,210,170,0.45)" }}>
                      🏫 Created by {community.created_by_display}
                    </div>
                  )}
                </div>
              )}
              <div className="cf-widget" style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>🛡</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#F5C518", marginBottom: 5 }}>Safe Community</div>
                <div style={{ fontSize: 11, color: "rgba(160,210,170,0.6)", lineHeight: 1.55 }}>
                  Only verified students &amp; teachers. Your privacy is always protected.
                </div>
              </div>
            </aside>

        </div>
      </div>

      {/* ── Report Modal (portal-like, rendered at root level) ── */}
      {reportPostId && (
        <ReportModal
          postId={reportPostId}
          onClose={() => setReportPostId(null)}
          onSubmit={handleReportSubmitted}
        />
      )}
    </Layout>
  )
}