import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";

import StudentLayout from "../../components/student/StudentLayout";
import { readFollowingIds, loadFollowerUsers } from "../../components/teacher/followUtils";
import { emitActivityNotification } from "../../components/common/activityNotificationsBus";

const pageUser = {
  firstName: "Student",
  username: "student",
  fullName: "Your Name",
  role: "Student",
  avatarDisplay: "S",
};

export default function StudentCommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [ddOpen, setDdOpen] = useState(false);

  useEffect(() => {
    const close = () => setDdOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [communityRes, membersRes, postsRes] = await Promise.all([
        API.get(`communities/${id}/`),
        API.get(`communities/${id}/members/`),
        API.get(`communities/${id}/posts/`),
      ]);

      setCommunity(communityRes.data);
      setMembers(membersRes.data);
      setPosts(postsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setFollowingIds(readFollowingIds());
    loadFollowerUsers().then(users =>
      setFollowerIds(users.map(u => String(u.id)))
    );
  }, [id]);

  const joinCommunity = async () => {
    await API.post(`communities/${id}/join/`);
    loadData();
  };

  const leaveCommunity = async () => {
    await API.post(`communities/${id}/leave/`);
    loadData();
  };

  const createPost = async () => {
    if (!content.trim()) return;

    await API.post(`communities/${id}/posts/`, {
      content,
      title: "Community Post",
      post_type: "post",
    });

    emitActivityNotification({
      id: `student-community-post-${Date.now()}`,
      kind: "post",
      text: "You shared a community post.",
    });

    setContent("");
    loadData();
  };

  const toggleLike = async (postId) => {
    await API.post(`posts/${postId}/like/`);
    emitActivityNotification({
      id: `student-community-like-${postId}-${Date.now()}`,
      kind: "like",
      text: "You reacted to a post.",
      postId,
    });
    loadData();
  };

  const canPost = Boolean(community?.is_member);

  if (loading || !community) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading community…
      </div>
    );
  }

  const role = community.current_user_role || community.user_role;

  const filteredMembers = members.filter(m => {
    const uid = String(m.user?.id || m.id);
    return followingIds.includes(uid) || followerIds.includes(uid);
  });

  return (
    <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div style={{ background: "#f7f6f2", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "110px 40px 40px" }}>

          {/* HERO (same as teacher) */}
          <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", marginBottom: "20px" }}>
            <img
              src={`https://picsum.photos/seed/comm${id}/1200/280`}
              style={{ width: "100%", height: "220px", objectFit: "cover" }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(120deg,rgba(245,197,24,0.70),rgba(0,0,0,0.30))"
            }} />

            <div style={{ position: "absolute", inset: 0, padding: "32px" }}>
              <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 900 }}>
                {community.name}
              </h1>

              <p style={{ color: "#fff" }}>{community.description}</p>

              {community.is_member ? (
                <button onClick={leaveCommunity}>Leave</button>
              ) : (
                <button onClick={joinCommunity}>Join</button>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px" }}>

            {/* POSTS */}
            <div>

              {canPost && (
                <div style={{ background: "#fff", padding: "20px", borderRadius: "18px", marginBottom: "16px" }}>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something..."
                    style={{ width: "100%" }}
                  />
                  <button onClick={createPost}>Post</button>
                </div>
              )}

              {posts.map(post => (
                <div key={post.id} style={{ background: "#fff", padding: "20px", borderRadius: "18px", marginBottom: "12px" }}>
                  <p>{post.content}</p>
                  <button onClick={() => toggleLike(post.id)}>
                    ❤️ {post.like_count ?? 0}
                  </button>
                </div>
              ))}

            </div>

            {/* MEMBERS */}
            <aside>
              <div style={{ background: "#fff", padding: "18px", borderRadius: "20px" }}>
                <div>Members ({filteredMembers.length})</div>

                {filteredMembers.map(m => (
                  <div key={m.id}>
                    {m.user?.username || m.username}
                  </div>
                ))}
              </div>
            </aside>

          </div>

        </div>
      </div>
    </StudentLayout>
  );
}