import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import { CommunityFeedbackStyles, CommunityToast } from "../../components/teacher/CommunityFeedback";

import TeacherLayout from "../../components/teacher/TeacherLayout";
import StudentLayout from "../../components/student/StudentLayout";
import { readFollowingIds, loadFollowerUsers } from "../../components/teacher/followUtils";

const teacherPageUser = {
  firstName: "Teacher",
  username: "teacher",
  fullName: "Your Name",
  role: "Teacher",
};

const studentPageUser = {
  firstName: "Student",
  username: "student",
  fullName: "Your Name",
  role: "Student",
};

export default function CommunityDetail() {
  const location = useLocation();
  const isStudent = location.pathname.startsWith("/student");
  const base = isStudent ? "/student" : "/teacher";
  const Layout = isStudent ? StudentLayout : TeacherLayout;
  const pageUser = isStudent ? studentPageUser : teacherPageUser;

  const { id } = useParams();

  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [ddOpen, setDdOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    loadData();
    setFollowingIds(readFollowingIds());
    loadFollowerUsers().then(users =>
      setFollowerIds(users.map(u => String(u.id)))
    );
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
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [communityRes, membersRes, postsRes, requestsRes] =
        await Promise.all([
          API.get(`communities/${id}/`),
          API.get(`communities/${id}/members/`),
          API.get(`communities/${id}/posts/`),
          isStudent ? Promise.resolve({ data: [] }) : API.get(`communities/${id}/requests/`)
        ]);

      setCommunity(communityRes.data);
      setMembers(membersRes.data);
      setPosts(postsRes.data);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REQUEST COMMUNITY (VISIBLE NOW)
  const requestCreateCommunity = async () => {
    try {
      await API.post("communities/request-create/", {
        message: "Requesting permission to create a community"
      });
      alert("Request sent to teacher");
    } catch {
      showToast("Unable to update request.", "error");
    }
  };

  const joinCommunity = async () => {
    try {
      await API.post(`communities/${id}/join/`);
      await loadData();
    } catch {
      showToast("Unable to join community.", "error");
    }
  };

  const leaveCommunity = async () => {
    try {
      await API.post(`communities/${id}/leave/`);
      await loadData();
    } catch {
      showToast("Unable to leave community.", "error");
    }
  };

  const createPost = async () => {
    if (!content.trim()) return;

    try {
      await API.post(`communities/${id}/posts/`, {
        content,
        title: "Community Post",
        post_type: "post",
      });
      setContent("");
      await loadData();
    } catch {
      showToast("Unable to post to community.", "error");
    }
  };

  const toggleLike = async (postId) => {
    try {
      await API.post(`posts/${postId}/like/`);
      await loadData();
    } catch {
      showToast("Unable to toggle like.", "error");
    }
  };

  const handleRequest = async (reqId, action) => {
    await API.post(`teacher/handle-request/${reqId}/`, { action });
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  if (loading || !community) {
    return <div>Loading...</div>;
  }

  const canPost = community?.is_member;

  const filteredMembers = members.filter(m => {
    const uid = String(m.user?.id || m.id);
    return followingIds.includes(uid) || followerIds.includes(uid);
  });

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={(state) => setDdOpen(state)}>
      <CommunityFeedbackStyles />
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", background: "#f7f6f2" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "110px 40px 40px" }}>

        {/* HERO */}
        <div style={{ marginBottom: "20px" }}>
          <h1>{community.name}</h1>
          <p>{community.description}</p>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>

              {/* Post list */}
              {posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "18px", color: "#666" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📝</div>
                  <div style={{ fontWeight: 700 }}>No posts yet</div>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} style={{ background: "#fff", border: "1.5px solid #e5e4e7", borderRadius: "18px", padding: "20px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "14px", color: "#1a1a1a", lineHeight: 1.6, margin: "0 0 14px" }}>{post.content}</p>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <button
                        onClick={() => toggleLike(post.id)}
                        style={{ background: (post.liked_by_me ?? post.liked_by_user) ? "#FFFBE0" : "#f5f5f5", border: "1.5px solid #e5e4e7", borderRadius: "99px", padding: "5px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: (post.liked_by_me ?? post.liked_by_user) ? "#B8860B" : "#555" }}
                      >
                        {(post.liked_by_me ?? post.liked_by_user) ? "♥" : "♡"} {post.like_count ?? 0}
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/community/${id}/feed`)}
                        style={{ background: "#f5f5f5", border: "1.5px solid #e5e4e7", borderRadius: "99px", padding: "5px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#1a1a1a" }}
                      >
                        💬 Replies
                      </button>
                      {/* Report Icon */}
                      <button
                        title="Report post"
                        onClick={async () => {
                          try {
                            await API.post(`posts/${post.id}/report/`, { reason: "Inappropriate content" });
                            showToast("Reported to admin for review.", "success");
                          } catch {
                            showToast("Unable to report post.", "error");
                          }
                        }}
                        style={{ background: "#fff0f0", border: "1.5px solid #e5e4e7", borderRadius: "99px", padding: "5px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#c0392b" }}
                      >
                        🚩
                      </button>
                      {post.created_at && (
                        <span style={{ fontSize: "11px", color: "#999", marginLeft: "auto" }}>{post.created_at}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate(`${base}/community/${id}/feed`)}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              🧭 View Feed
            </button>

            {/* 🔥 NOW ALWAYS VISIBLE FOR STUDENTS */}
            {isStudent && (
              <button
                onClick={requestCreateCommunity}
                style={{
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                📩 Request Community
              </button>
            )}

          </div>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>

          {/* POSTS */}
          <div style={{ flex: 1 }}>

            {canPost && (
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <button onClick={createPost}>Post</button>
              </div>
            )}

            {posts.map(post => (
              <div key={post.id}>
                <p>{post.content}</p>
                <button onClick={() => toggleLike(post.id)}>
                  ❤️ {post.like_count}
                </button>
              </div>
            ))}
          </div>

          {/* MEMBERS */}
          <div style={{ width: "250px" }}>
            <h3>Members ({filteredMembers.length})</h3>

            {filteredMembers.map(m => (
              <div key={m.id}>
                {m.user?.username || m.username}
              </div>
            ))}

            {!isStudent && requests.length > 0 && (
              <div>
                <h4>Pending Requests</h4>
                {requests.map(req => (
                  <div key={req.id}>
                    {req.user?.username}
                    <button onClick={() => handleRequest(req.id, "approve")}>
                      Approve
                    </button>
                    <button onClick={() => handleRequest(req.id, "reject")}>
                      Reject
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <CommunityToast toast={toast} />
    </TeacherLayout>
  );
}