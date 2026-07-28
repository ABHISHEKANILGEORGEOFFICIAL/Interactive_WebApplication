import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import API from "../../api";

import {
  acceptFollowRequest,
  loadAllUsers,
  loadFollowerUsers,
  loadFollowingUsers,
  setFollowUser,
} from "../../components/teacher/followUtils";

const mockUser = { firstName: "Teacher", fullName: "Your Name", role: "Teacher", avatarDisplay: "T", posts: 0, followers: 0, following: 0 };

const FOLLOW_STYLES = `
  .tf-layout { display:grid; grid-template-columns:240px minmax(0,1fr); gap:24px; max-width:1160px; margin:0 auto; padding:108px 24px 56px; }
  .tf-left, .tf-main { display:flex; flex-direction:column; gap:16px; min-width:0; }
  .tf-card { background:#fff; border:1.5px solid #e7d7a5; border-radius:20px; padding:20px; box-shadow:0 12px 30px rgba(0,0,0,0.12); }
  .tf-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:16px; }
  .tf-title { font-size:24px; font-weight:900; color:#2b2308; }
  .tf-sub { font-size:13px; color:#7f7555; margin-top:6px; }
  .tf-tabs { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .tf-tab { border:1.5px solid #e7d7a5; background:#fff; border-radius:999px; padding:8px 14px; font-size:12px; font-weight:800; color:#6e6546; cursor:pointer; }
  .tf-tab.active { background:#f5c518; border-color:#f5c518; color:#1a3010; }
  .tf-row { display:flex; align-items:center; gap:12px; border:1px solid #efe4be; border-radius:14px; background:#fffdf7; padding:12px 14px; margin-bottom:10px; }
  .tf-av { width:38px; height:38px; border-radius:50%; background:#f5c518; color:#1a3010; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; }
  .tf-name { font-size:14px; font-weight:800; color:#2b2308; }
  .tf-role { font-size:11px; color:#8f8767; }
  .tf-badge { font-size:10px; font-weight:800; color:#1a3010; background:#f5c518; border-radius:999px; padding:2px 8px; margin-left:8px; }
  .tf-btn { margin-left:auto; border-radius:999px; border:1.5px solid #e7d7a5; background:#fff; color:#6e6546; font-size:12px; font-weight:700; padding:7px 12px; cursor:pointer; }
  .tf-btn.following { background:#f5c518; border-color:#f5c518; color:#1a3010; }
  .tf-empty { border:1.5px dashed #ecd787; border-radius:14px; background:#fffdf1; color:#7f7555; padding:16px; font-size:13px; }
  .tf-suggest-title { font-size:11px; font-weight:800; color:#a59a78; text-transform:uppercase; letter-spacing:2px; margin:4px 0 12px; }
  @media(max-width:860px) { .tf-layout { grid-template-columns:1fr; padding:100px 16px 40px; } }
`;

export default function TeacherFollowing() {
  const [ddOpen, setDdOpen] = useState(false);
  const [tab, setTab] = useState("following");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [users, setUsers] = useState([]);

  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null); // "follow", "unfollow", "cancel-request"
  const [modalUser, setModalUser] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const currentUserId = String(localStorage.getItem("user_id") || "");

  const reloadConnections = async () => {
    const [nextFollowing, nextFollowers, nextUsers, sentRes, receivedRes] = await Promise.all([
      loadFollowingUsers(),
      loadFollowerUsers(),
      loadAllUsers(),
      API.get("follow/requests/sent/"),
      API.get("follow/requests/received/"),
    ]);

    setFollowing(nextFollowing);
    setFollowers(nextFollowers);
    setUsers(nextUsers);
    setSentRequests(sentRes.data);
    setReceivedRequests(receivedRes.data);
  };

  // ✅ LOAD DATA
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        await reloadConnections();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ STATES
  const followingIds = useMemo(
    () => new Set(following.map((u) => String(u.id))),
    [following]
  );

  const requestedIds = useMemo(
    () => new Set(sentRequests.map((u) => String(u.id))),
    [sentRequests]
  );

  const people = useMemo(
    () => users.filter((u) => String(u.id) !== currentUserId),
    [users, currentUserId]
  );

  const filtered = useMemo(() => {
    const searchTerm = query.toLowerCase();
    const sourceList = tab === "following" ? following : people;
    return sourceList.filter((u) =>
      (u.fullName || u.full_name || "").toLowerCase().includes(searchTerm) ||
      (u.role || "").toLowerCase().includes(searchTerm)
    );
  }, [query, tab, following, people]);

  // ✅ OPEN MODAL FOR ACTION
  const openModal = (action, user) => {
    setModalAction(action);
    setModalUser(user);
    setModalOpen(true);
  };

  // ✅ HANDLE CONFIRM ACTION
  const handleConfirm = async () => {
    if (!modalUser) return;
    setConfirmLoading(true);

    try {
      const target = String(modalUser.id);

      if (modalAction === "follow") {
        const success = await setFollowUser(target, true);
        if (success) {
          await reloadConnections();
        }
      } else if (modalAction === "unfollow") {
        const success = await setFollowUser(target, false);
        if (success) {
          await reloadConnections();
        }
      } else if (modalAction === "cancel-request") {
        // Cancel follow request by unfollowing
        const success = await setFollowUser(target, false);
        if (success) {
          await reloadConnections();
        }
      }
    } finally {
      setConfirmLoading(false);
      setModalOpen(false);
      setModalAction(null);
      setModalUser(null);
    }
  };

  // ✅ FOLLOW HANDLER - OPENS MODAL
  const handleToggleFollow = (userId) => {
    const target = String(userId);
    const user = users.find((u) => String(u.id) === target);
    const isFollowing = followingIds.has(target);
    const isRequested = requestedIds.has(target);

    if (isFollowing) {
      openModal("unfollow", user);
    } else if (isRequested) {
      openModal("cancel-request", user);
    } else {
      openModal("follow", user);
    }
  };
  return (
    <TeacherLayout user={mockUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      {/* Light overlay sits on top of dark video background */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: "24px", maxWidth: "1280px", margin: "0 auto", padding: "110px 40px 40px" }}>

          {/* ── LEFT SIDEBAR ── */}
          <aside>
            {/* Navigation */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", overflow: "hidden", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 18px 8px" }}>
                Navigation
              </div>
              <Link
                to="/teacher/home"
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", fontSize: "13.5px", color: "#444", borderBottom: "1px solid #FAF5E0", textDecoration: "none" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#FFFBE0"; e.currentTarget.style.fontWeight = "700"; e.currentTarget.style.color = "#1a1a1a"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.fontWeight = ""; e.currentTarget.style.color = "#444"; }}
              >
                🏠 Home
              </Link>
              <Link
                to="/teacher/communities"
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", fontSize: "13.5px", color: "#444", borderBottom: "1px solid #FAF5E0", textDecoration: "none" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#FFFBE0"; e.currentTarget.style.fontWeight = "700"; e.currentTarget.style.color = "#1a1a1a"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.fontWeight = ""; e.currentTarget.style.color = "#444"; }}
              >
                👥 Communities
              </Link>
              <Link
                to="/teacher/following"
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", fontSize: "13.5px", color: "#F5C518", borderBottom: "none", textDecoration: "none", fontWeight: 700 }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#FFFBE0"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = ""; }}
              >
                ✨ Following
              </Link>
            </div>

            {/* Quick Stats */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", padding: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                Quick Stats
              </div>
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>✨</span> <strong>{following.length}</strong> following
              </div>
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>👥</span> <strong>{followers.length}</strong> followers
              </div>
              <div style={{ fontSize: "13px", color: "#444", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>📬</span> <strong>{receivedRequests.length}</strong> requests
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main>
            {/* Hero */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "24px", marginBottom: "16px" }}>
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=280&fit=crop&q=80"
                alt="Following"
                style={{ width: "100%", height: "220px", objectFit: "cover", display: "block", borderRadius: "24px" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(245,197,24,0.75) 0%,rgba(0,0,0,0.25) 100%)", borderRadius: "24px" }} />
              <div style={{ position: "absolute", inset: 0, padding: "32px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "rgba(255,255,255,0.85)", marginBottom: "8px" }}>NETWORK</div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.2)", marginBottom: "6px" }}>Explore &amp; Connect 🌐</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", marginBottom: "20px", maxWidth: "440px", lineHeight: 1.55 }}>
                  Find and follow educators, view your connections, and manage follow requests.
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <form
              onSubmit={(e) => e.preventDefault()}
              style={{ display: "flex", gap: "10px", marginBottom: "16px" }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "following" ? "Search following…" : "Search people…"}
                style={{ flex: 1, border: "1.5px solid #e5e4e7", borderRadius: "12px", padding: "12px 18px", fontSize: "13px", outline: "none", background: "#fff", color: "#1a3010" }}
              />
              <button
                type="submit"
                style={{ background: "#F5C518", color: "#1a1a1a", border: "none", borderRadius: "12px", padding: "12px 22px", fontWeight: 800, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#e0af00"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "#F5C518"; }}
              >
                Search
              </button>
            </form>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1.5px solid #e5e4e7", marginBottom: "0px", background: "#fff", borderRadius: "12px 12px 0 0" }}>
              <button
                onClick={() => setTab("following")}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  border: "none",
                  background: "transparent",
                  color: tab === "following" ? "#F5C518" : "#666",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  borderBottom: tab === "following" ? "2px solid #F5C518" : "none",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => { if (tab !== "following") e.currentTarget.style.background = "#fafaf9"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = ""; }}
              >
                Following ({following.length})
              </button>
              <button
                onClick={() => setTab("people")}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  border: "none",
                  background: "transparent",
                  color: tab === "people" ? "#F5C518" : "#666",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  borderBottom: tab === "people" ? "2px solid #F5C518" : "none",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => { if (tab !== "people") e.currentTarget.style.background = "#fafaf9"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = ""; }}
              >
                People ({people.length})
              </button>
            </div>

            {/* Users List */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "48px", textAlign: "center", color: "#666" }}>Loading connections…</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px", color: "#666" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>No {tab} found</div>
                  <div>Try adjusting your search</div>
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isFollowing = followingIds.has(String(item.id));
                  const isRequested = requestedIds.has(String(item.id));

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 18px",
                        borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #f5f5f5",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#fafaf9"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: "#F5C518",
                          color: "#1a3010",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {item.avatarDisplay}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "2px" }}>
                          {item.fullName || item.full_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#999" }}>
                          {item.role}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleFollow(item.id)}
                        style={{
                          padding: "8px 16px",
                          border: isFollowing ? "none" : "1.5px solid #e5e4e7",
                          borderRadius: "8px",
                          background: isFollowing ? "#F5C518" : "#fff",
                          color: isFollowing ? "#1a3010" : "#666",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = "#F5C518";
                          e.currentTarget.style.color = "#F5C518";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = isFollowing ? "none" : "#e5e4e7";
                          e.currentTarget.style.color = isFollowing ? "#1a3010" : "#666";
                        }}
                      >
                        {isFollowing ? "Following" : isRequested ? "Requested" : "+ Follow"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Follow Requests Section */}
            {receivedRequests.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", padding: "16px 18px 12px", borderBottom: "1px solid #f5f5f5" }}>
                    Follow Requests ({receivedRequests.length})
                  </div>

                  <div>
                    {receivedRequests.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "14px 18px",
                          borderBottom: idx === receivedRequests.length - 1 ? "none" : "1px solid #f5f5f5",
                          transition: "background 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#fafaf9"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = ""; }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: "#F5C518",
                            color: "#1a3010",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {item.avatarDisplay}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "2px" }}>
                            {item.fullName || item.full_name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#999" }}>
                            {item.role} • Wants to follow you
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            const success = await acceptFollowRequest(item.id);
                            if (!success) return;
                            await reloadConnections();
                          }}
                          style={{
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#F5C518",
                            color: "#1a3010",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "#e0af00"; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "#F5C518"; }}
                        >
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside>
            {/* Active Educators */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", padding: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                Active Educators
              </div>
              {users.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#999" }}>No users to display.</div>
              ) : (
                users.slice(0, 8).map((u, idx) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: idx === Math.min(7, users.length - 1) ? 0 : "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#F5C518", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", color: "#1a3010", flexShrink: 0, overflow: "hidden" }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>{(u.full_name || u.username || "U")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a3010" }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: "10px", color: "#999" }}>{u.role || "Educator"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Connection Stats */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "20px", padding: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#999", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                Connection Insights
              </div>
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "10px", padding: "8px 12px", background: "#F5F5F5", borderRadius: "8px", textAlign: "center", fontWeight: 700 }}>
                📊 {following.length} following
              </div>
              <div style={{ fontSize: "13px", color: "#444", marginBottom: "10px", padding: "8px 12px", background: "#F5F5F5", borderRadius: "8px", textAlign: "center", fontWeight: 700 }}>
                👥 {followers.length} followers
              </div>
              <div style={{ fontSize: "13px", color: "#444", padding: "8px 12px", background: "#FFF8DC", borderRadius: "8px", textAlign: "center", fontWeight: 700 }}>
                📬 {receivedRequests.length} pending
              </div>
            </div>
          </aside>

        </div>

        {/* ── CONFIRMATION MODAL ── */}
        {modalOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "32px 28px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              animation: "slideIn 0.2s ease-out",
            }}>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a1a", marginBottom: "12px" }}>
                  {modalAction === "follow" && "Send Follow Request?"}
                  {modalAction === "unfollow" && `Unfollow ${modalUser?.fullName || modalUser?.full_name}?`}
                  {modalAction === "cancel-request" && "Cancel Follow Request?"}
                </div>
                <div style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
                  {modalAction === "follow" && `Do you want to send a follow request to ${modalUser?.fullName || modalUser?.full_name}?`}
                  {modalAction === "unfollow" && `You will unfollow ${modalUser?.fullName || modalUser?.full_name}. You can follow again later.`}
                  {modalAction === "cancel-request" && `Do you want to cancel the follow request to ${modalUser?.fullName || modalUser?.full_name}?`}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setModalAction(null);
                    setModalUser(null);
                  }}
                  disabled={confirmLoading}
                  style={{
                    padding: "10px 20px",
                    border: "1.5px solid #e5e4e7",
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#666",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: confirmLoading ? "not-allowed" : "pointer",
                    opacity: confirmLoading ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!confirmLoading) {
                      e.currentTarget.style.background = "#f5f5f5";
                      e.currentTarget.style.borderColor = "#999";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#e5e4e7";
                  }}
                >
                  No
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmLoading}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#F5C518",
                    color: "#1a3010",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: confirmLoading ? "not-allowed" : "pointer",
                    opacity: confirmLoading ? 0.7 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!confirmLoading) {
                      e.currentTarget.style.background = "#e0af00";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#F5C518";
                  }}
                >
                  {confirmLoading ? "Processing..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </TeacherLayout>
  );
}