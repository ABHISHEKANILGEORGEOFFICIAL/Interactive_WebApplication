import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";

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

const roleBadgeStyle = {
  creator:  { background: "#FFF3CD", color: "#1a1a1a" },
  owner:    { background: "#FFF3CD", color: "#1a1a1a" },
  collab:   { background: "#E8F5E9", color: "#2E7D32" },
  moderator:{ background: "#E8F5E9", color: "#2E7D32" },
  member:   { background: "#E3F2FD", color: "#1565C0" },
};

export default function TeacherCommunities() {
  const [communities, setCommunities] = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [teacherSubject, setTeacherSubject] = useState("");
  const [query, setQuery]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [ddOpen, setDdOpen]           = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [commRes, usersRes, profileRes] = await Promise.allSettled([
          API.get("communities/"),
          API.get("users/"),
          API.get("profile/"),
        ]);
        if (commRes.status === "fulfilled")  setCommunities(commRes.value.data);
        if (usersRes.status === "fulfilled") setAllUsers(usersRes.value.data);
        if (profileRes.status === "fulfilled") {
          const p = profileRes.value.data;
          const subj = p.subject || p.subject_name || p.subjects || "";
          setTeacherSubject(typeof subj === "string" ? subj : (subj?.name || ""));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const close = () => setDdOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const isSubjectMatch = (c) => {
    if (!teacherSubject) return false;
    const subj = teacherSubject.toLowerCase();
    return (
      c.name?.toLowerCase().includes(subj) ||
      c.description?.toLowerCase().includes(subj) ||
      c.tags?.some?.((t) => t.toLowerCase().includes(subj))
    );
  };

  const filtered = communities
    .filter((c) => {
      const s = query.toLowerCase();
      return c.name?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      // Subject-matched communities always come first
      const aMatch = isSubjectMatch(a) ? 1 : 0;
      const bMatch = isSubjectMatch(b) ? 1 : 0;
      return bMatch - aMatch;
    });

  const myCommunities = communities.filter((c) => c.is_member || c.current_user_role);

  const joinCommunity = async (communityId) => {
    try {
      await API.post(`communities/${communityId}/join/`);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId ? { ...c, is_member: true, current_user_role: "member" } : c
        )
      );
    } catch {
      alert("Unable to join community.");
    }
  };

  const myCommunityIds = new Set(myCommunities.map((c) => c.id));

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      {/* Light overlay sits on top of dark video background */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: "24px", maxWidth: "1280px", margin: "0 auto", padding: "110px 40px 40px" }}>

          {/* ── LEFT SIDEBAR ── */}
          <aside>
            {/* My Communities */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", overflow: "hidden", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 18px 8px" }}>
                My Communities
              </div>
              {myCommunities.length === 0 ? (
                <div style={{ padding: "12px 18px", fontSize: "12px", color: "#999" }}>No communities yet</div>
              ) : (
                myCommunities.map((c) => (
                  <Link
                    key={c.id}
                    to={`/teacher/community/${c.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", fontSize: "13.5px", color: "#444", borderBottom: "1px solid #FAF5E0", textDecoration: "none" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#FFFBE0"; e.currentTarget.style.fontWeight = "700"; e.currentTarget.style.color = "#1a1a1a"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.fontWeight = ""; e.currentTarget.style.color = "#047857"; }}
                  >
                    <img src={`https://picsum.photos/seed/comm${c.id}/24/24`} alt="" style={{ width: 24, height: 24, borderRadius: "6px", objectFit: "cover" }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    {c.current_user_role && (
                      <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "99px", textTransform: "uppercase", marginLeft: "auto", ...(roleBadgeStyle[c.current_user_role] || roleBadgeStyle.member) }}>
                        {c.current_user_role}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>

            {/* Teacher Tools */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", overflow: "hidden", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 18px 8px" }}>
                Teacher Tools
              </div>
              {[
                { to: "/teacher/home",        icon: "🎓", label: "Dashboard" },
                { to: "/teacher/tasks",        icon: "📋", label: "Tasks" },
                { to: "/teacher/tuition",      icon: "📚", label: "Tuition" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", fontSize: "13.5px", color: "#444", borderBottom: "1px solid #FAF5E0", textDecoration: "none" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#FFFBE0"; e.currentTarget.style.fontWeight = "700"; e.currentTarget.style.color = "#1a1a1a"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.fontWeight = ""; e.currentTarget.style.color = "#047857"; }}
                >
                  <span>{item.icon}</span>{item.label}
                </Link>
              ))}
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main>
            {/* Hero */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "24px", marginBottom: "16px" }}>
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&h=280&fit=crop&q=80"
                alt="Community"
                style={{ width: "100%", height: "220px", objectFit: "cover", display: "block", borderRadius: "24px" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(245,197,24,0.75) 0%,rgba(0,0,0,0.25) 100%)", borderRadius: "24px" }} />
              <div style={{ position: "absolute", inset: 0, padding: "32px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "rgba(255,255,255,0.85)", marginBottom: "8px" }}>COMMUNITY HUB</div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.2)", marginBottom: "6px" }}>Connect &amp; Collaborate 🌍</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", marginBottom: "20px", maxWidth: "440px", lineHeight: 1.55 }}>
                  Join communities, share knowledge, and grow together as educators and learners.
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <Link to="/teacher/community/create">
                    <button style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "99px", padding: "10px 22px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
                      + Create Community
                    </button>
                  </Link>
                  {teacherSubject && (
                    <div style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "99px", padding: "7px 14px", fontSize: "12px", color: "#fff", fontWeight: 700, backdropFilter: "blur(6px)" }}>
                      📚 Your subject: {teacherSubject}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <form
              onSubmit={(e) => e.preventDefault()}
              style={{ display: "flex", gap: "10px", marginBottom: "16px" }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search communities…"
                style={{ flex: 1, border: "1.5px solid #e5e4e7", borderRadius: "12px", padding: "12px 18px", fontSize: "13px", outline: "none", background: "#fff", color: "#1a3010" }}
              />
              <button
                type="submit"
                style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "12px", padding: "12px 22px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
              >
                Search
              </button>
            </form>

            {/* Community cards */}
            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#666" }}>Loading communities…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#666" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🌐</div>
                <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>No communities yet</div>
                <div style={{ marginBottom: "16px" }}>Be the first to create one!</div>
                <Link to="/teacher/community/create">
                  <button style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "99px", padding: "10px 22px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
                    Create Community →
                  </button>
                </Link>
              </div>
            ) : (
              filtered.map((c) => {
                const isMember = c.is_member || Boolean(c.current_user_role);
                const role = c.current_user_role;
                return (
                  <div
                    key={c.id}
                    style={{ background: isSubjectMatch(c) ? "#FFFDF0" : "#fff", border: isSubjectMatch(c) ? "1.5px solid #F5C518" : "1.5px solid #e5e4e7", borderRadius: "18px", padding: "20px", marginBottom: "12px", display: "flex", alignItems: "flex-start", gap: "16px", transition: "box-shadow 0.15s" }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,24,0.18)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = ""; }}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", overflow: "hidden", flexShrink: 0 }}>
                      <img src={`https://picsum.photos/seed/comm${c.id}/104/104`} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a3010" }}>{c.name}</div>
                        {isSubjectMatch(c) && (
                          <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 10px", borderRadius: "99px", background: "#FFF3CD", color: "#B8860B", border: "1px solid #F5C518", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            ⭐ Recommended for you
                          </span>
                        )}
                        {role && (
                          <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "99px", textTransform: "uppercase", ...(roleBadgeStyle[role] || roleBadgeStyle.member) }}>
                            {role}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "10px" }}>
                        {c.description?.length > 120 ? c.description.slice(0, 120) + "…" : c.description}
                      </div>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#666", fontWeight: 600 }}>👥 {c.member_count ?? 0} members</span>
                        {c.created_by_display && (
                          <span style={{ fontSize: "11px", color: "#666", fontWeight: 600 }}>
                            🏫 by {c.created_by_display}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                      <button
                        onClick={() => navigate(`/teacher/community/${c.id}/feed`)}
                        style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "99px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#047857" }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; }}
                      >
                        View
                      </button>
                      {!myCommunityIds.has(c.id) && (
                        <button
                          onClick={() => joinCommunity(c.id)}
                          style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "99px", padding: "8px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "#e0af00"; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "#F5C518"; }}
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside>
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", padding: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                Active Members
              </div>
              {allUsers.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#999" }}>No users to display.</div>
              ) : (
                allUsers.slice(0, 8).map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#F5C518", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>{(u.full_name || u.username || "U")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a3010" }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: "11px", color: "#999" }}>{u.role || "Member"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Stats widget */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", padding: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                Overview
              </div>
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "8px" }}>
                🌐 <strong>{communities.length}</strong> communities available
              </div>
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "8px" }}>
                ✅ <strong>{myCommunities.length}</strong> joined by you
              </div>
            </div>
          </aside>

        </div>
      </div>
    </TeacherLayout>
  );
}
