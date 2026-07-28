import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api";
import TeacherLayout from "../components/teacher/TeacherLayout";
import StudentLayout from "../components/student/StudentLayout";
import { emitActivityNotification } from "../components/common/activityNotificationsBus";

const mockUser = { firstName:"Teacher", fullName:"Your Name", role:"User", avatarDisplay:"T", posts:0, followers:0, following:0 };
const validTypes = ["post","photo","note","resource"];
const visibilityOptions = ["everyone","following","school","private"];

const CREATE_STYLES = `
  .create-layout { display:grid; grid-template-columns:220px 1fr; gap:22px; max-width:1000px; margin:0 auto; padding:108px 28px 60px; }
  .create-card-wrap { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:24px; overflow:hidden; backdrop-filter:blur(12px); }
  .breadcrumb { font-size:13px; color:var(--muted); margin-bottom:18px; }
  .breadcrumb a { color:var(--muted); text-decoration:none; transition:color .12s; }
  .breadcrumb a:hover { color:var(--y); }
  .page-title { font-size:28px; font-weight:900; margin-bottom:6px; color:var(--text); font-family:var(--font); font-style:italic; }
  .page-sub { font-size:14px; color:var(--muted); margin-bottom:24px; line-height:1.6; }
  .type-row { display:flex; border-bottom:1px solid var(--border); }
  .type-btn { flex:1; padding:16px 8px; text-align:center; cursor:pointer; border-right:1px solid var(--border); transition:background .15s; background:transparent; color:var(--muted); border-top:none; border-bottom:none; border-left:none; font-family:var(--body); }
  .type-btn:last-child { border-right:none; }
  .type-btn.active { background:rgba(245,197,24,0.12); color:var(--y); }
  .type-btn .t-ic { font-size:22px; display:block; margin-bottom:4px; }
  .type-btn .t-lb { font-size:12px; font-weight:700; }
  .form-body { padding:24px 28px; }
  .form-group { margin-bottom:18px; }
  .form-label { display:block; font-size:13px; font-weight:700; margin-bottom:8px; color:var(--text); }
  .form-input, .form-textarea { width:100%; border:1px solid var(--border); border-radius:14px; padding:12px 14px; font-size:14px; background:rgba(245,197,24,0.06); color:var(--text); font-family:var(--body); outline:none; }
  .form-input::placeholder, .form-textarea::placeholder { color:var(--muted); }
  .form-input:focus, .form-textarea:focus { border-color:rgba(245,197,24,0.4); }
  .form-textarea { min-height:130px; resize:vertical; }
  .tag-row { display:flex; flex-wrap:wrap; gap:8px; }
  .sel-tag { padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; border:1px solid var(--border); cursor:pointer; background:rgba(245,197,24,0.06); color:var(--muted); transition:background .12s; }
  .sel-tag:hover, .sel-tag.on { background:rgba(245,197,24,0.18); color:var(--y); border-color:rgba(245,197,24,0.3); }
  .aud-row { display:flex; gap:10px; flex-wrap:wrap; }
  .aud-btn { flex:1; padding:10px; border-radius:12px; font-size:12px; font-weight:700; border:1px solid var(--border); cursor:pointer; background:rgba(245,197,24,0.06); color:var(--muted); text-align:center; font-family:var(--body); transition:background .12s; }
  .aud-btn.on { background:rgba(245,197,24,0.18); color:var(--y); border-color:rgba(245,197,24,0.3); }
  .drop-zone { border:2px dashed var(--border); border-radius:14px; padding:32px; text-align:center; cursor:pointer; background:rgba(245,197,24,0.04); transition:border-color .15s; }
  .drop-zone:hover { border-color:rgba(245,197,24,0.4); }
  .photo-preview { margin-bottom:18px; border-radius:16px; overflow:hidden; border:1px solid var(--border); background:rgba(255,255,255,0.04); }
  .photo-preview img { width:100%; height:auto; display:block; object-fit:cover; }
  .photo-preview-meta { padding:10px 14px; font-size:12px; color:var(--muted); display:flex; justify-content:space-between; gap:12px; }
  .note-sub { background:rgba(245,197,24,0.08); border:1px solid rgba(245,197,24,0.18); border-radius:12px; padding:12px 14px; font-size:13px; color:rgba(210,240,215,0.75); line-height:1.6; margin-bottom:16px; }
  .cp-rich-toolbar { display:flex; align-items:center; gap:4px; flex-wrap:wrap; background:rgba(245,197,24,0.07); border:1px solid rgba(120,200,145,0.22); border-bottom:none; border-radius:10px 10px 0 0; padding:6px 10px; }
  .cp-rich-lbl { font-size:10px; font-weight:800; color:rgba(160,210,170,0.45); letter-spacing:1.5px; text-transform:uppercase; margin-right:4px; }
  .cp-rich-btn { background:transparent; border:1px solid rgba(120,200,145,0.22); border-radius:6px; padding:4px 9px; font-size:12px; font-weight:700; color:rgba(180,230,180,0.75); cursor:pointer; font-family:inherit; transition:background .1s; line-height:1; }
  .cp-rich-btn:hover { background:rgba(245,197,24,0.18); color:#F5C518; border-color:rgba(245,197,24,0.35); }
  .cp-rich-surface { min-height:160px; background:rgba(245,197,24,0.08); border:1px solid rgba(245,197,24,0.28); border-radius:0 0 10px 10px; padding:12px 14px; font-size:13px; color:#e8f0e2; line-height:1.75; outline:none; font-family:inherit; }
  .cp-rich-surface:empty:before { content:attr(data-placeholder); color:rgba(160,210,170,0.4); pointer-events:none; }
  .cp-rich-surface ul,.cp-rich-surface ol { padding-left:20px; margin:4px 0; }
  .cp-rich-surface a { color:#F5C518; }
  .form-foot { display:flex; align-items:center; justify-content:space-between; padding:16px 28px; border-top:1px solid var(--border); background:rgba(6,20,12,0.6); }
  .btn-submit { background:var(--y); color:#1a3010; border:none; border-radius:12px; padding:11px 22px; font-weight:700; font-size:14px; cursor:pointer; font-family:var(--body); transition:opacity .15s; }
  .btn-submit:hover { opacity:0.88; }
  .btn-cancel { background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:12px; padding:11px 18px; font-weight:700; font-size:14px; cursor:pointer; font-family:var(--body); transition:background .12s; }
  .btn-cancel:hover { background:rgba(245,197,24,0.08); color:var(--y); }
  .alert { margin-bottom:16px; padding:12px 14px; border-radius:12px; font-size:13px; }
  .alert-success { background:rgba(16,185,129,0.12); color:#5eead4; border:1px solid rgba(16,185,129,0.22); }
  .alert-error   { background:rgba(220,38,38,0.12);  color:#fca5a5; border:1px solid rgba(220,38,38,0.22); }
  @media(max-width:860px) { .create-layout { grid-template-columns:1fr; padding:100px 16px 40px; } .form-foot { flex-direction:column; align-items:flex-start; gap:12px; } }
`;

export default function CreatePost({ onPostCreated }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  // ✅ 🔥 ROLE DETECTION
  const isStudent = location.pathname.startsWith("/student");
  const base = isStudent ? "/student" : "/teacher";
  const Layout = isStudent ? StudentLayout : TeacherLayout;
  const layoutUser = {
    ...mockUser,
    firstName: isStudent ? "Student" : "Teacher",
    role: isStudent ? "Student" : "Teacher",
    avatarDisplay: isStudent ? "S" : "T",
  };
  const fileInputRef = useRef(null);
  const noteEditorRef = useRef(null);
  const [ddOpen, setDdOpen]         = useState(false);
  const [currentType, setCurrentType] = useState("post");
  const [communityId, setCommunityId] = useState(null);
  const [audience, setAudience]     = useState("everyone");
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [imageFile, setImageFile]   = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [noteCharCount, setNoteCharCount] = useState(0);
  const [status, setStatus]         = useState({ success:"", error:"" });
  const feedPath = communityId
    ? (isStudent ? `/student/communities/${communityId}` : `/teacher/community/${communityId}/feed`)
    : `${base}/home`;

  useEffect(() => {
    const id = "saha-create-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id; el.textContent = CREATE_STYLES; document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const t = p.get("type"); const c = p.get("community"); const a = p.get("audience");
    setCurrentType(validTypes.includes(t) ? t : "post");
    setCommunityId(c || null);
    if (a && visibilityOptions.includes(a)) setAudience(a); else setAudience("everyone");
  }, [location.search]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    if (currentType === "note" && noteEditorRef.current) {
      noteEditorRef.current.innerHTML = content || "";
      setNoteCharCount((noteEditorRef.current.innerText || "").trim().length);
    }
  }, [currentType]);

  const execRich = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    noteEditorRef.current?.focus();
    setContent(noteEditorRef.current?.innerHTML || "");
    setNoteCharCount((noteEditorRef.current?.innerText || "").trim().length);
  };

  const handleTypeChange = (t) => {
    const params = new URLSearchParams(location.search);
    params.set("type", validTypes.includes(t) ? t : "post");
    if (communityId) params.set("community", communityId);
    navigate(`${base}/create-post?${params.toString()}`);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f); setPreviewUrl(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ success:"", error:"" });
    if (currentType==="photo" && !imageFile) { setStatus({ success:"", error:"Please choose a photo before sharing." }); return; }
    if (currentType==="note" && !noteEditorRef.current?.innerText?.trim()) { setStatus({ success:"", error:"Please write something in the note." }); return; }
    try {
      const finalContent = currentType === "note" ? (noteEditorRef.current?.innerHTML || "") : content;
      const fd = new FormData();
      fd.append("title", title); fd.append("content", finalContent);
      fd.append("post_type", currentType==="resource" ? "post" : currentType);
      fd.append("audience", communityId ? "community" : audience);
      if (communityId) fd.append("community_id", communityId);
      if (imageFile) fd.append("image", imageFile);
      await API.post("posts/create/", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setStatus({ success:"Shared successfully.", error:"" });
      emitActivityNotification({
        id: `create-post-${Date.now()}`,
        kind: "post",
        text: `You shared a ${currentType}.`,
      });
      setTitle(""); setContent(""); setImageFile(null); setPreviewUrl("");
      setNoteCharCount(0);
      if (noteEditorRef.current) noteEditorRef.current.innerHTML = "";
      if (onPostCreated) onPostCreated();
    } catch (err) {
      const m = err.response?.data?.detail || "Failed to share. Please try again.";
      setStatus({ success:"", error: typeof m==="string" ? m : JSON.stringify(m) });
    }
  };

  const pageTitle = currentType==="note" ? "Create a Note" : currentType==="photo" ? "Add Photo" : "Create a Post";

  return (
    <Layout user={user} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div className="create-layout">
        <aside>
          <div className="side-menu">
            <Link to={`${base}/home`}    className="sm-item"><span className="sm-ic">🏠</span>Home Feed</Link>
            <Link to={`${base}/tuition`} className="sm-item"><span className="sm-ic">📚</span>Tuition</Link>
            <Link to={`${base}/tasks`}   className="sm-item"><span className="sm-ic">📋</span>Tasks</Link>
            <a href="/logout"           className="sm-item"><span className="sm-ic">🚪</span>Logout</a>
          </div>
        </aside>
        <main>
          <div className="breadcrumb"><Link to={`${base}/home`}>← Back to Feed</Link></div>
          <div className="page-title">{pageTitle}</div>
          <div className="page-sub">
            {communityId ? "Only active members of this community can see and interact with this post."
              : currentType==="note" ? "Write styled notes and publish them into the feed."
              : "Share ideas, resources or conversations with your Saha community."}
          </div>
          {status.error   && <div className="alert alert-error">{status.error}</div>}
          {status.success && <div className="alert alert-success">{status.success} <Link to={communityId ? (isStudent ? `${base}/community/${communityId}` : `${base}/community/${communityId}/feed`) : `${base}/home`} style={{color:"var(--y)",fontWeight:700}}>View feed →</Link></div>}
          <div className="create-card-wrap">
            <div className="type-row">
              {[{t:"post",ic:"📝",lb:"Post"},{t:"photo",ic:"📸",lb:"Photo"},{t:"note",ic:"🗒️",lb:"Note"},{t:"resource",ic:"📎",lb:"Resource"}].map(({t,ic,lb})=>(
                <button key={t} type="button" className={`type-btn ${currentType===t?"active":""}`} onClick={()=>handleTypeChange(t)}>
                  <span className="t-ic">{ic}</span>
                  <span className="t-lb">{lb}</span>
                </button>
              ))}
            </div>
            <form onSubmit={submit}>
              <div className="form-body">
                {communityId && <div className="note-sub">🌐 You are posting inside this community. Replies and likes stay limited to active members.</div>}
                {!communityId && currentType==="note" && <div className="note-sub">✏ Notes publish as full feed posts. Formatting you apply here stays visible when people open the note.</div>}

                {/* Title — real input, label matches correctly */}
                <div className="form-group">
                  <label className="form-label" htmlFor="post-title">Title</label>
                  <input
                    id="post-title"
                    name="title"
                    className="form-input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Give your post a clear, descriptive title…"
                    required
                  />
                </div>

                {currentType === "photo" ? (
                  <>
                    {/*
                      FIX 1: Hidden file input has id + name so the browser can
                      autofill / associate it properly. The visible drop-zone
                      acts as a proxy click target — no label needed for it.
                    */}
                    <input
                      id="post-image"
                      name="image"
                      type="file"
                      hidden
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <div
                      className="drop-zone"
                      role="button"
                      aria-label="Choose a photo to upload"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                    >
                      <div style={{fontSize:44,marginBottom:10}}>📷</div>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:5,color:"var(--text)"}}>Click to choose a photo</div>
                      <div style={{fontSize:13,color:"var(--muted)"}}>JPG, PNG, GIF, WEBP — up to 20MB</div>
                    </div>
                    {previewUrl && (
                      <div className="photo-preview" style={{marginTop:14}}>
                        <img src={previewUrl} alt="Preview of selected photo" />
                        <div className="photo-preview-meta">
                          <span>{imageFile?.name}</span>
                          <span>{imageFile ? `${Math.max(1,Math.round(imageFile.size/1024))} KB` : ""}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : currentType === "note" ? (
                  <div className="form-group">
                    {/*
                      FIX 2: contentEditable div is not a labelable element,
                      so htmlFor would never match. Use aria-labelledby instead
                      to associate the visible label with the rich-text region.
                    */}
                    <span id="note-body-label" className="form-label">Note Body</span>
                    <div className="cp-rich-toolbar">
                      <span className="cp-rich-lbl">✏ Notes</span>
                      <button type="button" className="cp-rich-btn" onMouseDown={(e)=>{e.preventDefault();execRich("bold");}}><strong>B</strong></button>
                      <button type="button" className="cp-rich-btn" onMouseDown={(e)=>{e.preventDefault();execRich("italic");}}><em>I</em></button>
                      <button type="button" className="cp-rich-btn" onMouseDown={(e)=>{e.preventDefault();execRich("underline");}}><u>U</u></button>
                      <button type="button" className="cp-rich-btn" onMouseDown={(e)=>{e.preventDefault();execRich("insertUnorderedList");}}>• List</button>
                      <button type="button" className="cp-rich-btn" onMouseDown={(e)=>{e.preventDefault();execRich("insertOrderedList");}}>1. List</button>
                      <button type="button" className="cp-rich-btn" onMouseDown={(e)=>{e.preventDefault(); const url = prompt("URL:"); if (url) execRich("createLink", url);}}>🔗 Link</button>
                    </div>
                    <div
                      role="textbox"
                      aria-multiline="true"
                      aria-labelledby="note-body-label"
                      ref={noteEditorRef}
                      className="cp-rich-surface"
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder="Write your note here…"
                      onInput={() => {
                        setContent(noteEditorRef.current?.innerHTML || "");
                        setNoteCharCount((noteEditorRef.current?.innerText || "").trim().length);
                      }}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-content">Content</label>
                    <textarea
                      id="post-content"
                      name="content"
                      className="form-textarea"
                      rows={currentType==="note" ? 8 : 5}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="What would you like to share?"
                      required
                    />
                  </div>
                )}

                {/*
                  FIX 3: Tags is a group of buttons, not a form field.
                  Use <span> for the label (not <label htmlFor>) to avoid
                  the mismatched-for warning. Use aria-label on the group
                  for screen-reader context.
                */}
                <div className="form-group">
                  <span className="form-label">Tags</span>
                  <div className="tag-row" role="group" aria-label="Select tags">
                    {["📚 Curriculum","🧪 Science","📐 Math","🎨 Arts","💡 Ideas","🌍 Geography"].map(tag => (
                      <div key={tag} className="sel-tag" role="button" tabIndex={0}>{tag}</div>
                    ))}
                  </div>
                </div>

                {/*
                  FIX 4: Audience is a group of buttons, not a form field.
                  Same pattern — <span> label + role="group" on the container.
                */}
                {!communityId && (
                  <div className="form-group">
                    <span className="form-label">Audience</span>
                    <div className="aud-row" role="group" aria-label="Select audience">
                      {visibilityOptions.map(op => (
                        <button
                          key={op}
                          type="button"
                          className={`aud-btn ${audience===op ? "on" : ""}`}
                          aria-pressed={audience === op}
                          onClick={() => setAudience(op)}
                        >
                          {op==="everyone" ? "🌐 Everyone" : op==="following" ? "👥 Following" : op==="school" ? "🏫 My School" : "🔒 Private"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-foot">
                <div style={{fontSize:12,color:"var(--muted)"}}>
                  {currentType==="note" ? noteCharCount : content.length} / 2000
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => navigate(communityId ? (isStudent ? `${base}/community/${communityId}` : `${base}/community/${communityId}/feed`) : `${base}/home`)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    {currentType==="note" ? "Publish Note →" : currentType==="photo" ? "Share Photo →" : "Publish Post →"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </Layout>
  );
}