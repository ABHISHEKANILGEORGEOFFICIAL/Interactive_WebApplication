import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api";
import { CommunityFeedbackStyles, CommunityToast } from "../../components/teacher/CommunityFeedback";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import { readFollowingIds, loadFollowerUsers } from "../../components/teacher/followUtils";

const pageUser = {
  firstName: "Teacher", username: "teacher", fullName: "Your Name",
  role: "Teacher", avatarDisplay: "T", avatarUrl: null, posts: 0, followers: 0, following: 0,
};

const EMOJIS = ["🏫","📚","🔬","🎨","⚽","🎵","💻","🌍","🧮","📖","🎭","🏆","🔭","🧪","🎯","💡","🌱","🦋","🎓","📝","🏅","🌟","🤝","💬","🖼️","🎪","🧩","🚀","🎤","🌈"];
const STEP_LABELS = ["Details", "Image", "Collaborators", "Members"];

const COMM_STYLES = `
  .comm-wrap { max-width:700px; margin:0 auto; padding:108px 24px 60px; }
  .comm-card { background:rgba(10,28,16,0.92); border:1px solid rgba(120,200,145,0.22); border-radius:24px; padding:32px; backdrop-filter:blur(12px); }
  .comm-label { display:block; font-size:12px; font-weight:700; margin-bottom:8px; color:#e8f0e2; text-transform:uppercase; letter-spacing:0.5px; }
  .comm-input, .comm-textarea { width:100%; border:1px solid rgba(120,200,145,0.22); border-radius:14px; padding:12px 14px; font-size:14px; background:rgba(245,197,24,0.06); color:#e8f0e2; font-family:inherit; outline:none; box-sizing:border-box; }
  .comm-input::placeholder, .comm-textarea::placeholder { color:rgba(160,210,170,0.4); }
  .comm-input:focus, .comm-textarea:focus { border-color:rgba(245,197,24,0.4); }
  .comm-textarea { min-height:110px; resize:vertical; }
  .comm-group { margin-bottom:18px; }
  .comm-btn-primary { background:#F5C518; color:#1a3010; border:none; border-radius:14px; padding:13px 24px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; transition:opacity .15s; }
  .comm-btn-primary:hover { opacity:0.88; }
  .comm-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .comm-btn-outline { background:transparent; color:rgba(180,230,180,0.7); border:1px solid rgba(120,200,145,0.22); border-radius:14px; padding:13px 24px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; transition:background .12s; }
  .comm-btn-outline:hover { background:rgba(245,197,24,0.08); color:#F5C518; }
  .comm-divider { font-size:10px; font-weight:800; color:rgba(160,210,170,0.45); letter-spacing:2px; text-transform:uppercase; margin:20px 0 14px; padding-top:16px; border-top:1px solid rgba(120,200,145,0.18); }
  .comm-msg-success { margin-bottom:16px; padding:12px 14px; border-radius:12px; font-size:13px; background:rgba(16,185,129,0.12); color:#5eead4; border:1px solid rgba(16,185,129,0.22); }
  .comm-msg-error   { margin-bottom:16px; padding:12px 14px; border-radius:12px; font-size:13px; background:rgba(220,38,38,0.12); color:#fca5a5; border:1px solid rgba(220,38,38,0.22); }
  .comm-user-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:12px; margin-bottom:8px; border:1px solid rgba(120,200,145,0.22); background:rgba(245,197,24,0.04); cursor:pointer; transition:background .12s; }
  .comm-user-row.sel { background:rgba(245,197,24,0.12); border-color:rgba(245,197,24,0.4); }
  .comm-user-row:hover { background:rgba(245,197,24,0.08); }
  .comm-step-dot { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; }
  .comm-review { background:rgba(245,197,24,0.1); border:1px solid rgba(245,197,24,0.28); border-radius:12px; padding:14px 18px; margin-bottom:22px; font-size:13px; color:#e8f0e2; }
  .comm-emoji-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin-bottom:24px; }
  .comm-emoji-opt { width:48px; height:48px; border-radius:12px; cursor:pointer; border:1px solid rgba(120,200,145,0.22); background:rgba(245,197,24,0.04); display:flex; align-items:center; justify-content:center; font-size:22px; transition:all .12s; }
  .comm-emoji-opt:hover, .comm-emoji-opt.sel { background:rgba(245,197,24,0.18); border-color:rgba(245,197,24,0.5); transform:scale(1.1); }
  .comm-upload-zone { border:2px dashed rgba(120,200,145,0.28); border-radius:16px; padding:28px; text-align:center; cursor:pointer; background:rgba(245,197,24,0.04); margin-bottom:24px; transition:border-color .12s; }
  .comm-upload-zone:hover { border-color:rgba(245,197,24,0.4); }
  .comm-perm-row { background:rgba(10,28,16,0.92); border:1px solid rgba(120,200,145,0.22); border-radius:16px; padding:18px; margin-bottom:12px; }
  .comm-perm-check-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .comm-perm-label { display:flex; align-items:center; gap:10px; border:1px solid rgba(120,200,145,0.22); border-radius:10px; padding:10px 12px; cursor:pointer; background:rgba(245,197,24,0.04); transition:background .12s; }
  .comm-perm-label.checked { background:rgba(245,197,24,0.14); border-color:rgba(245,197,24,0.4); }
  .comm-perm-label span { font-size:12px; font-weight:700; color:rgba(180,230,180,0.8); }
  @media(max-width:600px) { .comm-emoji-grid { grid-template-columns:repeat(4,1fr); } .comm-perm-check-row { grid-template-columns:1fr 1fr; } }
`;

const sInput = {};   // kept for compatibility — styles via CSS classes now
const sBtnPrimary = {};
const sBtnOutline = {};
const sCard = {};

export default function CreateCommunity() {
  const navigate = useNavigate();
  const fileRef  = useRef();
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({ name: "", description: "", image_emoji: "🏫", community_image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [collaborators, setCollaborators] = useState(new Set());
  const [members, setMembers]   = useState(new Set());
  // Store following and follower IDs for quick access
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
    // Load following IDs on mount
    useEffect(() => {
      setFollowingIds(readFollowingIds());
      loadFollowerUsers().then(users => setFollowerIds(users.map(u => String(u.id))));
    }, []);
  const [submitting, setSubmitting] = useState(false);
  const [ddOpen, setDdOpen]     = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const styleId = "saha-comm-form-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style"); el.id = styleId; el.textContent = COMM_STYLES; document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    API.get("users/").then(r => setAllUsers(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const close = () => setDdOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
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

  const toggleSet = (setter, id) =>
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, community_image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (form.community_image) {
        // multipart — let axios set the boundary automatically
        const data = new FormData();
        data.append("name", form.name);
        data.append("description", form.description);
        data.append("image_emoji", form.image_emoji);
        data.append("community_image", form.community_image);
        collaborators.forEach(id => data.append("collaborators", id));
        members.forEach(id => data.append("members", id));
        await API.post("communities/", data);
      } else {
        // plain JSON — simpler and always works
        await API.post("communities/", {
          name: form.name,
          description: form.description,
          image_emoji: form.image_emoji,
          collaborators: [...collaborators],
          members: [...members],
        });
      }
      navigate("/teacher/communities");
    } catch (err) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      showToast(`Unable to create community. ${msg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Progress bar ── */
  const StepBar = () => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
      {STEP_LABELS.map((lbl, i) => {
        const n = i + 1;
        const done   = step > n;
        const active = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="comm-step-dot" style={{
                border: done ? "2.5px solid #5eead4" : active ? "2.5px solid #F5C518" : "2.5px solid rgba(120,200,145,0.22)",
                background: done ? "#5eead4" : active ? "#F5C518" : "rgba(245,197,24,0.06)",
                color: (done || active) ? "#1a3010" : "rgba(160,210,170,0.4)",
              }}>
                {done ? "✓" : n}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: active ? "#F5C518" : done ? "#5eead4" : "rgba(160,210,170,0.4)", whiteSpace: "nowrap" }}>
                {lbl}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: "2px", background: done ? "#5eead4" : "rgba(120,200,145,0.18)", margin: "0 10px", minWidth: "12px" }} />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── User selection row ── */
  const UserRow = ({ user, selected, onToggle }) => (
    <div onClick={onToggle} className={`comm-user-row${selected ? " sel" : ""}`}>
      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F5C518", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", color: "#1a3010", flexShrink: 0, overflow: "hidden" }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (user.full_name || user.username || "U")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8f0e2" }}>{user.full_name || user.username}</div>
        <div style={{ fontSize: "11px", color: "rgba(160,210,170,0.5)" }}>{user.role || "Member"}</div>
      </div>
      <div style={{
        width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
        border: selected ? "2px solid #F5C518" : "2px solid rgba(120,200,145,0.22)",
        background: selected ? "#F5C518" : "rgba(245,197,24,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 800, color: "#1a3010",
      }}>
        {selected ? "✓" : ""}
      </div>
    </div>
  );

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <CommunityFeedbackStyles />
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        <div className="comm-wrap">

          <StepBar />

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className="comm-card">
              <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "6px", color: "#e8f0e2" }}>🏫 Name your Community</div>
              <div style={{ fontSize: "13px", color: "rgba(160,210,170,0.65)", marginBottom: "28px", lineHeight: 1.6 }}>Give your community a clear, memorable name and describe what it's about.</div>
              <div className="comm-group">
                <label className="comm-label" htmlFor="community-name">Community Name *</label>
                <input id="community-name" name="name" className="comm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Science Explorers Club" />
              </div>
              <div className="comm-group">
                <label className="comm-label" htmlFor="community-description">Description</label>
                <textarea id="community-description" name="description" className="comm-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this community about?" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <Link to="/teacher/communities"><button type="button" className="comm-btn-outline">← Cancel</button></Link>
                <button onClick={() => { if (!form.name.trim()) { showToast("Please enter a community name.", "error"); return; } setStep(2); }} className="comm-btn-primary">Next: Choose Image →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Image ── */}
          {step === 2 && (
            <div className="comm-card">
              <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "6px", color: "#e8f0e2" }}>🖼️ Community Image</div>
              <div style={{ fontSize: "13px", color: "rgba(160,210,170,0.65)", marginBottom: "28px", lineHeight: 1.6 }}>Pick an emoji icon or upload a custom image for your community.</div>
              <label className="comm-label">Choose an Emoji Icon</label>
              <div className="comm-emoji-grid">
                {EMOJIS.map(em => (
                  <div key={em} onClick={() => setForm(f => ({ ...f, image_emoji: em }))}
                    className={`comm-emoji-opt${form.image_emoji === em ? " sel" : ""}`}
                  >{em}</div>
                ))}
              </div>
              <label className="comm-label">Or Upload a Custom Image (optional)</label>
              <div className="comm-upload-zone" id="community-image-upload" onClick={() => fileRef.current.click()}>
                {imagePreview
                  ? <img src={imagePreview} alt="preview" style={{ maxHeight: "120px", borderRadius: "12px", objectFit: "cover" }} />
                  : (<><div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div><div style={{ fontSize: "14px", fontWeight: 700, color: "#e8f0e2" }}>Click to upload image</div><div style={{ fontSize: "12px", color: "rgba(160,210,170,0.5)", marginTop: "4px" }}>PNG, JPG up to 5MB</div></>)}
              </div>
              <input id="community-image" name="image" ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <button type="button" onClick={() => setStep(1)} className="comm-btn-outline">← Back</button>
                <button onClick={() => setStep(3)} className="comm-btn-primary">Next: Add Collaborators →</button>
              </div>
            </div>
          )}

          /* ── Step 3: Collaborators ── */
          {step === 3 && (
            <div className="comm-card">
              <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "6px", color: "#e8f0e2" }}>🤝 Add Collaborators</div>
              <div style={{ fontSize: "13px", color: "rgba(160,210,170,0.65)", marginBottom: "24px", lineHeight: 1.6 }}>Collaborators help manage the community. You can set their exact permissions later. <em>(Optional)</em></div>
              <div style={{ maxHeight: "380px", overflowY: "auto", marginBottom: "16px" }}>
                {allUsers.length === 0
                  ? <div style={{ textAlign: "center", padding: "24px", color: "rgba(160,210,170,0.5)" }}>No users found.</div>
                  : allUsers
                      .filter(u => followingIds.includes(String(u.id)) || followerIds.includes(String(u.id)))
                      .map(u => <UserRow key={u.id} user={u} selected={collaborators.has(u.id)} onToggle={() => toggleSet(setCollaborators, u.id)} />)}
              </div>
              {collaborators.size > 0 && (
                <div className="comm-msg-success">✅ {collaborators.size} collaborator{collaborators.size > 1 ? "s" : ""} selected</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <button type="button" onClick={() => setStep(2)} className="comm-btn-outline">← Back</button>
                <button onClick={() => setStep(4)} className="comm-btn-primary">Next: Add Members →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Members + Review ── */}
          {step === 4 && (
            <div className="comm-card">
              <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "6px", color: "#e8f0e2" }}>👥 Add Members</div>
              <div style={{ fontSize: "13px", color: "rgba(160,210,170,0.65)", marginBottom: "18px", lineHeight: 1.6 }}>Invite people to join your community. Everyone can also join later. <em>(Optional)</em></div>
              {/* Add All I Follow button */}
              {followingIds.length > 0 && (
                <button
                  type="button"
                  className="comm-btn-outline"
                  style={{ marginBottom: 12, fontSize: 13, padding: "8px 18px" }}
                  onClick={() => {
                    // Add all following users (who are not collaborators) to members
                    setMembers(prev => {
                      const newSet = new Set(prev);
                      followingIds.forEach(fid => {
                        // Only add if not a collaborator and user exists in allUsers
                        if (!collaborators.has(fid) && allUsers.some(u => String(u.id) === String(fid))) {
                          newSet.add(fid);
                        }
                      });
                      return newSet;
                    });
                  }}
                >
                  ➕ Add All I Follow
                </button>
              )}
              <div style={{ maxHeight: "320px", overflowY: "auto", marginBottom: "16px" }}>
                {allUsers.filter(u => (followingIds.includes(String(u.id)) || followerIds.includes(String(u.id))) && !collaborators.has(u.id)).length === 0
                  ? <div style={{ textAlign: "center", padding: "24px", color: "rgba(160,210,170,0.5)" }}>No additional users available.</div>
                  : allUsers
                      .filter(u => (followingIds.includes(String(u.id)) || followerIds.includes(String(u.id))) && !collaborators.has(u.id))
                      .map(u => <UserRow key={u.id} user={u} selected={members.has(u.id)} onToggle={() => toggleSet(setMembers, u.id)} />)}
              </div>
              <div className="comm-review">
                <div style={{ fontWeight: 800, marginBottom: "6px", color: "#F5C518" }}>📋 Review your community</div>
                <div>Name: <strong>{form.name}</strong></div>
                {form.description && <div style={{ marginTop: "4px", color: "rgba(160,210,170,0.7)" }}>{form.description.slice(0, 80)}{form.description.length > 80 ? "…" : ""}</div>}
                <div style={{ marginTop: "6px" }}>Icon: <span style={{ fontSize: "18px" }}>{form.image_emoji}</span>{imagePreview && " + custom image"}</div>
                <div style={{ marginTop: "4px", color: "rgba(160,210,170,0.7)" }}>{collaborators.size} collaborator{collaborators.size !== 1 ? "s" : ""} · {members.size} member{members.size !== 1 ? "s" : ""} added</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <button type="button" onClick={() => setStep(3)} className="comm-btn-outline">← Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="comm-btn-primary">
                  {submitting ? "Creating…" : "🎉 Create Community"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <CommunityToast toast={toast} />
    </TeacherLayout>
  );
}
