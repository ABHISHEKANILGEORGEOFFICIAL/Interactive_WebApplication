  // This file has been removed. All permissions logic is now handled in CommunityAllMembers.jsx
  import { useEffect, useState } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import API from "../../api";
  import TeacherLayout from "../../components/teacher/TeacherLayout";
  import { readFollowingIds, loadFollowerUsers } from "../../components/teacher/followUtils";

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

  const PERM_KEYS = [
    { key: "can_edit_community", label: "Edit" },
    { key: "can_add_members", label: "Add Members" },
    { key: "can_remove_members", label: "Remove Members" },
    { key: "can_post", label: "Post" },
    { key: "can_delete_posts", label: "Delete Posts" },
  ];

export default function CommunityPermissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState({ success: "", error: "" });
  const [loading, setLoading] = useState(true);
  const [ddOpen, setDdOpen] = useState(false);
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get(`communities/${id}/`),
      API.get(`communities/${id}/members/`),
    ])
      .then(async ([communityRes, membersRes]) => {
        setCommunity(communityRes.data);
        // Load following/follower IDs
        const following = readFollowingIds();
        setFollowingIds(following);
        const followers = await loadFollowerUsers();
        const followerIdList = followers.map(u => String(u.id));
        setFollowerIds(followerIdList);
        // Only show members you follow or who follow you
        const filtered = membersRes.data.filter((m) => {
          const uid = String(m.user?.id || m.id);
          return (m.role !== "creator" && m.role !== "owner") && (following.includes(uid) || followerIdList.includes(uid));
        });
        setMembers(
          filtered.map((member) => ({
            ...member,
            permissions: PERM_KEYS.reduce((acc, perm) => {
              acc[perm.key] = Boolean(member[perm.key]);
              return acc;
            }, {}),
          }))
        );
      })
      .catch(() => setStatus({ success: "", error: "Unable to load permissions." }))
      .finally(() => setLoading(false));
  }, [id]);

    useEffect(() => {
      const close = () => setDdOpen(false);
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }, []);

    const togglePerm = (memberId, key) => {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? { ...member, permissions: { ...member.permissions, [key]: !member.permissions[key] } }
            : member
        )
      );
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      setStatus({ success: "", error: "" });

      const payload = members.map((member) => ({
        user: member.id,
        ...member.permissions,
      }));

      try {
        await API.post(`communities/${id}/permissions/`, { permissions: payload });
        setStatus({ success: "Permissions saved successfully.", error: "" });
        setTimeout(() => navigate(`/teacher/community/${id}`), 700);
      } catch (err) {
        const message = err.response?.data?.detail || "Unable to save permissions.";
        setStatus({ success: "", error: typeof message === "string" ? message : JSON.stringify(message) });
      }
    };

    if (loading) {
      return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(160,210,170,0.7)", fontSize: "14px" }}>Loading permissions…</div>;
    }

    if (!community) {
      return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5", fontSize: "14px" }}>Community not found.</div>;
    }

    const inputStyle = { border: "1px solid rgba(120,200,145,0.22)", borderRadius: "14px", padding: "12px 14px", fontSize: "14px", background: "rgba(245,197,24,0.06)", color: "#e8f0e2", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
    const btnPrimary = { background: "#F5C518", color: "#1a3010", border: "none", borderRadius: "14px", padding: "13px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" };
    const btnOutline = { background: "transparent", color: "rgba(180,230,180,0.7)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "14px", padding: "13px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" };


    return (
      <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "108px 24px 60px" }}>

            {/* Card header + Edit button */}
            <div style={{ background: "rgba(10,28,16,0.92)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "24px", padding: "24px 28px", marginBottom: "16px", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "rgba(160,210,170,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Manage Permissions & Settings</div>
                <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: "#e8f0e2" }}>{community.name}</h1>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/community/${id}/edit`)}
                  style={{ background: "#F5C518", color: "#1a3010", border: "none", borderRadius: "99px", padding: "8px 18px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
                >
                  ✏️ Edit Community
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/community/${id}`)}
                  style={{ background: "rgba(245,197,24,0.12)", color: "#F5C518", border: "1px solid rgba(245,197,24,0.3)", borderRadius: "99px", padding: "8px 18px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
                >
                  ← Back
                </button>
              </div>
            </div>

            {/* Alerts */}
            {status.error && (
              <div style={{ marginBottom: "12px", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", background: "rgba(220,38,38,0.12)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.22)" }}>
                {status.error}
              </div>
            )}
            {status.success && (
              <div style={{ marginBottom: "12px", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", background: "rgba(16,185,129,0.12)", color: "#5eead4", border: "1px solid rgba(16,185,129,0.22)" }}>
                {status.success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {members.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", background: "rgba(10,28,16,0.92)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "18px", color: "rgba(160,210,170,0.6)", backdropFilter: "blur(12px)" }}>
                  No other members to manage. Invite members to the community first.
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} style={{ background: "rgba(10,28,16,0.92)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "18px", padding: "20px", marginBottom: "12px", backdropFilter: "blur(12px)" }}>
                    {/* Member info */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#F5C518", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", color: "#1a3010", flexShrink: 0 }}>
                          {(member.user?.full_name || member.user?.username || member.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 800, color: "#e8f0e2" }}>{member.user?.full_name || member.user?.username || member.username}</div>
                          <div style={{ fontSize: "12px", color: "rgba(160,210,170,0.5)" }}>{member.user?.username || member.username}</div>
                        </div>
                      </div>
                      <span style={{ background: "rgba(245,197,24,0.14)", color: "#F5C518", border: "1px solid rgba(245,197,24,0.3)", fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "99px", textTransform: "uppercase" }}>
                        {member.role || "member"}
                      </span>
                    </div>

                    {/* Permission toggles */}
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "rgba(160,210,170,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Permissions</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                      {PERM_KEYS.map((perm) => (
                        <label
                          key={perm.key}
                          style={{ display: "flex", alignItems: "center", gap: "10px", border: member.permissions[perm.key] ? "1px solid rgba(245,197,24,0.4)" : "1px solid rgba(120,200,145,0.22)", borderRadius: "10px", padding: "10px 12px", cursor: "pointer", background: member.permissions[perm.key] ? "rgba(245,197,24,0.12)" : "rgba(245,197,24,0.04)", transition: "background .12s" }}
                        >
                          <input
                            type="checkbox"
                            checked={member.permissions[perm.key]}
                            onChange={() => togglePerm(member.id, perm.key)}
                            style={{ accentColor: "#F5C518", width: "16px", height: "16px" }}
                          />
                          <span style={{ fontSize: "12px", fontWeight: 700, color: member.permissions[perm.key] ? "#F5C518" : "rgba(180,230,180,0.7)" }}>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={btnPrimary}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  Save Permissions
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/community/${id}`)}
                  style={btnOutline}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(245,197,24,0.08)"; e.currentTarget.style.color = "#F5C518"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(180,230,180,0.7)"; }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </TeacherLayout>
    );
  }
