import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import { CommunityFeedbackStyles, CommunityToast } from "../../components/teacher/CommunityFeedback";
import { readFollowingIds, loadFollowingUsers } from "../../components/teacher/followUtils";
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


export default function AddMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [followingUsers, setFollowingUsers] = useState([]);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Load following users and community members
  useEffect(() => {
    loadFollowingUsers().then(setFollowingUsers);
    API.get(`communities/${id}/members/`).then(res => {
      setCommunityMembers(res.data.map(m => String(m.user?.id || m.id)));
    });
  }, [id]);

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
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  const toggleUser = (uid) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(uid) ? n.delete(uid) : n.add(uid);
      return n;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      // Log payload for debugging
      console.log("Sending members:", Array.from(selected));
      const response = await API.post(`communities/${id}/add-members/`, { members: Array.from(selected) });
      // Log response for debugging
      console.log("Add members response:", response.data);
      if (response.data && response.data.added) {
        // Map member IDs to names
        const memberNames = response.data.added.map(id => {
          const user = followingUsers.find(u => u.id === id);
          return user ? (user.fullName || user.username) : `Member ${id}`;
        });
        showToast(`Members added: ${memberNames.join(", ")}`, "success");
      } else {
        showToast("Members added!", "success");
      }
      // Fetch updated members to verify and update state
      const updated = await API.get(`communities/${id}/members/`);
      setCommunityMembers(updated.data.map(m => String(m.user?.id || m.id)));
      console.log("Updated members after add:", updated.data);
      // Optionally, you can force a reload or navigate after a short delay
      setTimeout(() => navigate(`/teacher/community/${id}/feed`), 500);
    } catch (err) {
      console.error("Failed to add members:", err);
      showToast("Failed to add members.", "error");
      // Print error in the terminal (backend) if possible
      try {
        await API.post("debug/log-error/", {
          location: "AddMembers.jsx handleAdd",
          error: err?.response?.data || err?.message || String(err)
        });
      } catch (logErr) {
        // If backend debug endpoint is not available, just log to console
        console.error("Failed to log error to backend:", logErr);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out users who are already members
  const addableUsers = followingUsers.filter(u => !communityMembers.includes(String(u.id)));

  return (
    <TeacherLayout user={pageUser}>
      <CommunityFeedbackStyles />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "110px 24px 60px" }}>
        <h2 style={{ color: "#e8f0e2", fontWeight: 900, marginBottom: 18 }}>Add Members to Community</h2>
        <div style={{ marginBottom: 18, color: "#b5e6b5" }}>Select members you follow to add to this community.</div>
        <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 18 }}>
          {addableUsers.length === 0 ? (
            <div style={{ color: "#aaa", textAlign: "center", padding: 40 }}>No followed users available to add.</div>
          ) : (
            addableUsers.map(u => (
              <div key={u.id} onClick={() => toggleUser(u.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, marginBottom: 8, border: selected.has(u.id) ? "2px solid #F5C518" : "1px solid rgba(120,200,145,0.22)", background: selected.has(u.id) ? "rgba(245,197,24,0.12)" : "rgba(245,197,24,0.04)", cursor: "pointer", transition: "background .12s" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F5C518", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#1a3010", flexShrink: 0, overflow: "hidden" }}>
                  {(u.fullName || u.username || "U")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e8f0e2" }}>{u.fullName || u.username}</div>
                  <div style={{ fontSize: 11, color: "rgba(160,210,170,0.5)" }}>{u.role || "Member"}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: selected.has(u.id) ? "2px solid #F5C518" : "2px solid rgba(120,200,145,0.22)", background: selected.has(u.id) ? "#F5C518" : "rgba(245,197,24,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#1a3010" }}>
                  {selected.has(u.id) ? "✓" : ""}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate(`/teacher/community/${id}/feed`)} className="cf-nav-btn-back" style={{ background: "#fff", color: "#1a3010", border: "none", borderRadius: "99px", padding: "10px 22px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleAdd} disabled={selected.size === 0 || submitting} className="cf-nav-btn-back" style={{ background: "#F5C518", color: "#1a3010", border: "none", borderRadius: "99px", padding: "10px 22px", fontWeight: 800, fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>Add Selected</button>
        </div>
      </div>

      <CommunityToast toast={toast} />
    </TeacherLayout>
  );
}
