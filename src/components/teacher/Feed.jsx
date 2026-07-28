  // Module-level fetch cache for posts


  // Robust module-level cache for posts
  if (!window.__postsCache) {
    window.__postsCache = { promise: null, data: null };
  }
  const _postsCache = window.__postsCache;
  const FEED_LIKES_STORAGE_KEY = "saha_feed_like_state_v1";
  function fetchPostsCached() {
    if (!_postsCache.promise) {
      _postsCache.promise = API.get("posts/")
        .then(res => {
          _postsCache.data = res.data;
          return res.data;
        })
        .catch(err => {
          _postsCache.promise = null; // allow retry on error
          return Promise.reject(err);
        });
    }
    return _postsCache.promise;
  }

  const readPersistedFeedLikes = () => {
    try {
      const raw = localStorage.getItem(FEED_LIKES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writePersistedFeedLikes = (value) => {
    try {
      localStorage.setItem(FEED_LIKES_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore storage write failures.
    }
  };

  const getPersistedFeedLike = (userId, postId) => {
    if (!userId || postId == null) return undefined;
    const map = readPersistedFeedLikes();
    const value = map?.[String(userId)]?.[String(postId)];
    return typeof value === "boolean" ? value : undefined;
  };

  const setPersistedFeedLike = (userId, postId, liked) => {
    if (!userId || postId == null) return;
    const map = readPersistedFeedLikes();
    map[String(userId)] = {
      ...(map[String(userId)] || {}),
      [String(postId)]: Boolean(liked),
    };
    writePersistedFeedLikes(map);
  };

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const mapLikeToggleOnPost = (post, id) => {
    if (String(post?.id) !== String(id)) return post;
    const wasLiked = Boolean(post.likedByUser ?? post.liked_by_me ?? post.liked_by_user);
    const currentCount = toNumber(post.likeCount ?? post.like_count ?? post.likes_count ?? post.likes ?? 0);
    const nextCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    return {
      ...post,
      likedByUser: !wasLiked,
      liked_by_me: !wasLiked,
      liked_by_user: !wasLiked,
      likeCount: nextCount,
      like_count: nextCount,
      likes_count: nextCount,
      likes: nextCount,
    };
  };

  const updateLikeInCache = (id) => {
    if (!_postsCache.data) return;

    const payload = _postsCache.data;
    if (Array.isArray(payload)) {
      _postsCache.data = payload.map((item) => mapLikeToggleOnPost(item, id));
      return;
    }
    if (Array.isArray(payload?.results)) {
      _postsCache.data = {
        ...payload,
        results: payload.results.map((item) => mapLikeToggleOnPost(item, id)),
      };
      return;
    }
    if (Array.isArray(payload?.data)) {
      _postsCache.data = {
        ...payload,
        data: payload.data.map((item) => mapLikeToggleOnPost(item, id)),
      };
    }
  };

  import { useState, useEffect, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import API from "../../api";
  import { emitActivityNotification } from "../common/activityNotificationsBus";
  import { loadAllUsers, loadFollowingUsers, readFollowingIds, setFollowUser } from "./followUtils";

  const avatarColors = ["#d7b25d", "#c09a4a", "#9ea66d", "#7da27f"];

  const FEED_STYLES = `
    @keyframes feedFloat {
      0%,100% { transform:translateY(0);     box-shadow:0 -10px 40px rgba(0,0,0,0.3),0 20px 60px rgba(0,0,0,0.25); }
      50%      { transform:translateY(-10px); box-shadow:0 -20px 60px rgba(0,0,0,0.4),0 30px 80px rgba(0,0,0,0.35),0 0 40px rgba(245,197,24,0.12); }
    }
    .feed-section {
      position:relative; z-index:10;
      margin-top:-40px;
      padding:60px 24px 80px;
      background:linear-gradient(180deg,#0f2820,#0d7557);
      border-radius:30px 30px 0 0;
      animation:feedFloat 4s ease-in-out infinite;
    }
    .feed-section::before {
      content:'';
      position:absolute;
      top:0; left:50%; transform:translateX(-50%);
      width:120px; height:4px;
      background:linear-gradient(90deg,#F5C518,#fff);
      border-radius:2px;
    }
    .feed-section-label {
      font-size:11px; font-weight:800;
      color:rgba(245,197,24,0.6);
      letter-spacing:3px; text-transform:uppercase;
      text-align:center; margin-bottom:32px;
    }
    .feed-wrap { max-width:1240px; margin:0 auto; display:grid; grid-template-columns:minmax(0,1fr) 250px; gap:22px; align-items:start; }
    .compose-card { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:18px; padding:18px; margin-bottom:8px; backdrop-filter:blur(10px); }
    .compose-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .c-av { width:38px; height:38px; border-radius:50%; background:var(--y); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:#1a3010; flex-shrink:0; }
    .compose-in { flex:1; background:rgba(245,197,24,0.08); border:1px solid var(--border); border-radius:10px; padding:10px 14px; font-size:13px; color:rgba(200,240,205,0.55); outline:none; font-family:var(--body); cursor:pointer; }
    .compose-in:focus { border-color:rgba(245,197,24,0.42); color:var(--text); }
    .post-types { display:flex; gap:8px; flex-wrap:wrap; }
    .pt { padding:8px 14px; border-radius:9px; border:1px solid rgba(100,200,130,0.22); background:rgba(245,197,24,0.08); font-size:12px; font-weight:600; cursor:pointer; color:rgba(180,230,180,0.7); text-decoration:none; transition:background .12s; font-family:var(--body); }
    .pt:hover, .pt.act { background:var(--y); border-color:var(--y); color:#1a3010; }
    .feed-label { font-size:10px; font-weight:800; color:rgba(160,210,170,0.40); letter-spacing:2.5px; text-transform:uppercase; padding:4px 0 10px; }
    .empty-feed { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.16); border-radius:16px; padding:22px 20px; color:rgba(225,236,217,0.85); font-size:14px; text-align:center; line-height:1.6; }
    .feed-spinner { text-align:center; padding:40px 0; color:var(--muted); font-size:13px; }
    .spinner-ring { width:32px; height:32px; border:2px solid var(--border); border-top-color:var(--y); border-radius:50%; animation:spin .75s linear infinite; margin:0 auto 12px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .post-card { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:20px; padding:20px 22px; margin-bottom:14px; opacity:0; transform:scale(0.92) translateY(24px); transition:opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1), border-color .2s; backdrop-filter:blur(10px); }
    .post-card.visible { opacity:1; transform:scale(1) translateY(0); }
    .post-card:hover { border-color:rgba(245,197,24,0.38); }
    .post-head { display:flex; align-items:center; gap:11px; margin-bottom:14px; }
    .p-av { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:#1a3010; flex-shrink:0; }
    .post-author-name { font-size:14px; font-weight:700; color:var(--text); }
    .post-author-meta { font-size:11px; color:var(--muted); margin-top:2px; }
    .community-link { color:var(--y); text-decoration:none; font-weight:700; }
    .chip { display:inline-block; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:700; margin-left:auto; flex-shrink:0; letter-spacing:0.4px; text-transform:uppercase; }
    .chip-post  { background:rgba(245,197,24,0.16); color:var(--y); }
    .chip-photo { background:rgba(100,180,255,0.16); color:#80c4f8; }
    .chip-note  { background:rgba(16,185,129,0.16);  color:#5eead4; }
    .post-title { font-family:var(--font); font-size:17px; font-weight:700; font-style:italic; color:var(--text); margin-bottom:8px; line-height:1.4; display:block; cursor:pointer; text-decoration:none; }
    .post-title:hover { color:var(--y); }
    .post-copy { font-size:13px; color:var(--muted); line-height:1.75; margin-bottom:14px; }
    .photo-card { margin:0 auto 10px; border-radius:10px; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid var(--border); width:220px; height:220px; }
    .photo-card img { display:block; width:100%; height:100%; object-fit:cover; }
    .note-card { background:rgba(245,197,24,0.08); border:1px solid rgba(245,197,24,0.16); border-radius:12px; padding:14px 16px; margin-bottom:14px; font-size:13px; line-height:1.75; color:rgba(210,240,215,0.82); }
    .post-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .act-btn { padding:6px 13px; border-radius:8px; border:1px solid rgba(100,200,130,0.18); background:rgba(245,197,24,0.08); font-size:12px; color:rgba(180,230,180,0.68); cursor:pointer; font-family:var(--body); transition:background .12s; }
    .act-btn:hover { background:rgba(245,197,24,0.18); color:var(--y); }
    .act-btn.liked { color:#ff6b6b; border-color:rgba(255,100,100,0.25); }
    .act-sep { width:1px; height:14px; background:var(--border); }
    .right-col { display:flex; flex-direction:column; gap:14px; position:sticky; top:110px; }
    .widget { background:rgba(10,28,16,0.92); border:1px solid var(--border); border-radius:18px; padding:16px; backdrop-filter:blur(10px); }
    .wt { font-size:9px; font-weight:800; color:rgba(160,210,170,0.45); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
    .topic-tag { display:inline-block; padding:5px 13px; background:rgba(245,197,24,0.12); color:var(--y); border:1px solid rgba(245,197,24,0.22); border-radius:99px; font-size:11px; font-weight:700; margin:0 5px 7px 0; cursor:pointer; transition:background .12s; }
    .topic-tag:hover { background:rgba(245,197,24,0.22); }
    .person { display:flex; align-items:center; gap:9px; margin-bottom:11px; width:100%; }
    .person:last-child { margin-bottom:0; }
    .p-sav { width:34px; height:34px; border-radius:50%; background:var(--y); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px; color:#1a3010; flex-shrink:0; }
    .p-n { font-size:12px; font-weight:700; color:var(--text); }
    .p-r { font-size:10px; color:var(--muted); }
    .follow-btn { font-size:11px; font-weight:700; color:var(--y); border:1px solid rgba(25,158,115,0.3); padding:4px 11px; border-radius:99px; background:transparent; cursor:pointer; margin-left:auto; transition:background .12s; font-family:var(--body); }
    .follow-btn:hover { background:var(--y); color:#1a3010; }
    .safe-card { background:rgba(16,185,129,0.10); border:1px solid rgba(16,185,129,0.20); border-radius:14px; padding:16px; text-align:center; backdrop-filter:blur(10px); }
    @media(max-width:1100px) { .feed-wrap { grid-template-columns:1fr; } .right-col { display:none; } }
    @media(max-width:560px) { .feed-section { padding:0 14px 40px; } .post-card { padding:16px; } }
  `;

  let feedStylesInjected = false;

  /**
   * Reusable Feed section — fetches posts from the API and renders them.
   *
   * @param {object}  user            - Current user object (needs avatarDisplay).
   * @param {string}  navigatePrefix  - Route prefix for compose actions, e.g. "/teacher" or "/student".
   */
  export default function Feed({ user, navigatePrefix = "/teacher", onCreate, refreshToken }) {
    const navigate = useNavigate();

    const [posts, setPosts]         = useState([]);
    const [allUsers, setAllUsers]   = useState([]);
    const [followingIds, setFollowingIds] = useState([]);
    // Track which post's menu is open
    const [menuOpenIdx, setMenuOpenIdx] = useState(null);
        // Handle menu actions

        const handleReport = async (postId) => {
          const reason = prompt("Why are you reporting this post?");
          if (!reason || !reason.trim()) {
            alert("Report cancelled. Please provide a reason.");
            setMenuOpenIdx(null);
            return;
          }
          try {
            await API.post(`posts/${postId}/report/`, { reason });
            alert("Post reported. Admin will review this post.");
          } catch (err) {
            alert("Failed to report post. Please try again.");
          }
          setMenuOpenIdx(null);
        };


        const handleDelete = async (postId) => {
          if (window.confirm("Are you sure you want to delete this post?")) {
            try {
              const res = await API.delete(`posts/${postId}/delete/`);

              // Clear the posts cache so refresh fetches fresh data
              if (window.__postsCache) {
                window.__postsCache.promise = null;
                window.__postsCache.data = null;
              }
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              setMenuOpenIdx(null);
            } catch (err) {

              alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
            }
          }
        };
      // Load following IDs from backend (with fallback to local storage) on mount
      useEffect(() => {
        API.get("following/") // adjust endpoint if needed
          .then(res => {
            const ids = (res.data?.results || res.data || []).map(f => String(f.followed_user_id || f.id));
            setFollowingIds(ids);
          })
          .catch(() => {
            // fallback to local storage
            setFollowingIds(readFollowingIds());
          });
      }, []);
    const [selfIdentity, setSelfIdentity] = useState({
      id: String(user?.id || user?.user?.id || localStorage.getItem("user_id") || ""),
      username: String(user?.username || localStorage.getItem("user_email") || "").toLowerCase(),
      email: String(user?.email || localStorage.getItem("user_email") || "").toLowerCase(),
      fullName: String(user?.fullName || user?.full_name || user?.name || "").toLowerCase(),
      nameTokens: [],
    });
      // Always set selfIdentity on mount (and when user changes)
      useEffect(() => {
        const id = String(user?.id || user?.user?.id || localStorage.getItem("user_id") || "");
        const username = String(user?.username || localStorage.getItem("user_email") || "").toLowerCase();
        const email = String(user?.email || localStorage.getItem("user_email") || "").toLowerCase();
        const fullName = String(user?.fullName || user?.full_name || user?.name || "").toLowerCase();
        const nameTokens = [fullName, username, email, email.split("@")[0], user?.avatarDisplay || ""]
          .map((item) => String(item || "").toLowerCase().trim())
          .filter(Boolean);
        setSelfIdentity({ id, username, email, fullName, nameTokens });
      }, [user]);
    const [loading, setLoading]     = useState(true);
    const [loadError, setLoadError] = useState("");
    const cardRefs = useRef([]);

    // Inject feed styles once
    useEffect(() => {
      if (feedStylesInjected) return;
      const id = "saha-feed-styles";
      if (!document.getElementById(id)) {
        const el = document.createElement("style");
        el.id = id;
        el.textContent = FEED_STYLES;
        document.head.appendChild(el);
      }
      feedStylesInjected = true;
    }, []);

    // Use module-level cache for posts
    useEffect(() => {
      // Invalidate cache if refreshToken changes
      if (refreshToken && window.__postsCache) {
        window.__postsCache.promise = null;
        window.__postsCache.data = null;
      }

      const normalize = (d) => {
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.results)) return d.results;
        if (Array.isArray(d?.data)) return d.data;
        return [];
      };
      const transform = (raw) =>
        raw.map((p) => {
          const serverLiked = p.liked_by_me ?? p.liked_by_user ?? p.is_liked;
          const persistedLiked = getPersistedFeedLike(selfIdentity.id, p.id);

          return {
            id: p.id,
            title: p.title || "Untitled",
            content: p.content || "",
            postType: p.post_type || "post",
            image: p.image
              ? (p.image.startsWith("http")
                  ? p.image
                  : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8000"}${p.image}`)
              : null,
            likeCount: p.like_count ?? p.likes_count ?? p.likes ?? 0,
            replyCount: p.reply_count ?? 0,
            likedByUser: serverLiked ?? persistedLiked ?? false,
            createdAt: p.created_at
              ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              : "Just now",
            authorId: String(p.author_id ?? p.author?.id ?? p.user_id ?? ""),
            authorUsername: String(p.author_username ?? p.author?.username ?? "").toLowerCase(),
            authorEmail: String(p.author_email ?? p.author?.email ?? "").toLowerCase(),
            author: {
              id: String(p.author_id ?? p.author?.id ?? p.user_id ?? ""),
              fullName: p.author_name || "Unknown",
              avatarDisplay: (p.author_name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
            },
            community: p.community || null,
          };
        });

      // If already resolved, use cached data immediately
      if (_postsCache.data) {
        const data = transform(normalize(_postsCache.data));
        setPosts(data);
        setLoading(false);
        return;
      }

      let cancelled = false;

      fetchPostsCached()
        .then(raw => {
          if (cancelled) return;
          setPosts(transform(normalize(raw)));
        })
        .catch(err => {
          if (cancelled) return;
          setLoadError("Could not load feed. Make sure your Django server is running.");

        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => { cancelled = true; };
    }, [refreshToken, selfIdentity.id]);

    // Intersection observer for card entrance animation
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
          });
        },
        { threshold: 0.10, rootMargin: "0px 0px -40px 0px" }
      );
      cardRefs.current.forEach((card, i) => {
        if (card) { card.style.transitionDelay = `${i * 55}ms`; observer.observe(card); }
      });
      return () => observer.disconnect();
    }, [posts]);

    const toggleLike = (id) => {
      let nextLikedState;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                likedByUser: ((nextLikedState = !p.likedByUser), nextLikedState),
                likeCount: p.likedByUser
                  ? Math.max(0, toNumber(p.likeCount) - 1)
                  : toNumber(p.likeCount) + 1,
              }
            : p
        )
      );
      if (typeof nextLikedState === "boolean") {
        setPersistedFeedLike(selfIdentity.id, id, nextLikedState);
      }
      updateLikeInCache(id);
      emitActivityNotification({
        id: `feed-like-${id}-${Date.now()}`,
        kind: "like",
        text: "You reacted to a post.",
        postId: id,
      });
      API.post(`posts/${id}/like/`)
        .then((res) => {
          const apiLiked = res?.data?.liked_by_me ?? res?.data?.liked_by_user ?? res?.data?.is_liked;
          if (typeof apiLiked === "boolean") {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      likedByUser: apiLiked,
                      likeCount: toNumber(res?.data?.like_count ?? res?.data?.likes_count ?? res?.data?.likes ?? p.likeCount),
                    }
                  : p
              )
            );
            setPersistedFeedLike(selfIdentity.id, id, apiLiked);
          }
        })
        .catch(() => {
          let revertedLikedState;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  likedByUser: ((revertedLikedState = !p.likedByUser), revertedLikedState),
                  likeCount: p.likedByUser
                    ? Math.max(0, toNumber(p.likeCount) - 1)
                    : toNumber(p.likeCount) + 1,
                }
              : p
          )
        );
        if (typeof revertedLikedState === "boolean") {
          setPersistedFeedLike(selfIdentity.id, id, revertedLikedState);
        }
        updateLikeInCache(id);
      });
    };

    const handleShare = async (post) => {
      const url = post.community?.id
        ? `${window.location.origin}${navigatePrefix === "/student" ? `/student/communities/${post.community.id}` : `/teacher/community/${post.community.id}/feed`}`
        : `${window.location.origin}${navigatePrefix}/home`;

      const text = `${post.title || "Post"}\n${url}`;

      try {
        const sharePayload = {};
        if (post.community?.id) {
          sharePayload.community_id = post.community.id;
        }

        await API.post(`posts/${post.id}/share/`, sharePayload);

        if (navigator.share) {
          await navigator.share({ title: post.title || "Post", text: post.content || "", url });
        } else {
          await navigator.clipboard.writeText(text);
          alert("Post link copied to clipboard.");
        }

        emitActivityNotification({
          id: `feed-share-${post.id}-${Date.now()}`,
          kind: "share",
          text: `You shared: ${post.title || "Post"}`,
          postId: post.id,
        });
      } catch {
        // Ignore user-cancelled share actions.
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
          id: `feed-reply-${post.id}-${Date.now()}`,
          kind: "reply",
          text: `You replied to: ${post.title || "Post"}`,
          postId: post.id,
        });
      } catch {
        alert("Failed to submit reply. Please try again.");
      }
    };

    const toggleFollow = async (targetUserId) => {
      const id = String(targetUserId);
      const isFollowing = followingIds.includes(id);
      await setFollowUser(id, !isFollowing);
      setFollowingIds(readFollowingIds());
    };

    const currentUserId = selfIdentity.id;
    const followedSet = new Set(followingIds.map(String));
    // ...existing code...
    // Use backend-provided authorId for filtering (with fallback)
    const filteredPosts = posts.filter((post) => {
      const authorId = String(post.authorId || post.author?.id || "");
      const show = authorId === currentUserId || followedSet.has(authorId);
      return show;
    });

    const suggestedPeople = allUsers
      .filter((person) => String(person.id) !== currentUserId)
      .slice(0, 8);

    return (
      <section className="feed-section">
        <div className="feed-section-label">✦ Your Feed ✦</div>

        {loadError && (
          <div style={{ color: "#fca5a5", background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: 12, padding: "12px 16px", maxWidth: 1240, margin: "0 auto 16px", fontSize: 13 }}>
            ⚠ {loadError}
          </div>
        )}

        <div className="feed-wrap">
          {/* ── Main column ── */}
          <main>
            <div className="compose-card">
              <div className="compose-row">
                <div className="c-av">{user?.avatarDisplay || "U"}</div>
                <input
                  className="compose-in"
                  placeholder="Share something with your community…"
                  readOnly
                  onClick={onCreate ? onCreate : () => navigate(`${navigatePrefix}/create-post?type=post`)}
                />
              </div>
              <div className="post-types">
                <button type="button" className="pt act" onClick={() => navigate(`${navigatePrefix}/create-post?type=post`)}>📝 Post</button>
                <button type="button" className="pt"     onClick={() => navigate(`${navigatePrefix}/create-post?type=photo`)}>📸 Photo</button>
                <button type="button" className="pt"     onClick={() => navigate(`${navigatePrefix}/create-post?type=note`)}>🗒 Note</button>
                <button type="button" className="pt"     onClick={() => navigate(`${navigatePrefix}/communities`)}>👥 Communities</button>
                <button type="button" className="pt"     onClick={() => navigate(`${navigatePrefix}/community/create`)}>➕ Create Community</button>
              </div>
            </div>

            <div className="feed-label">Recent Activity</div>

            {/* FIX 4: Better loading handling */}
            {(loading && posts.length === 0) && (
              <div className="feed-spinner">
                <div className="spinner-ring" />
                Loading feed…
              </div>
            )}

            {(!loading && filteredPosts.length === 0 && !loadError) && (
              <div className="empty-feed">
                <div style={{fontSize: 48, marginBottom: 14}}>📭</div>
                <div style={{fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text)'}}>No posts yet!</div>
                <div style={{fontSize: 14}}>Follow some educators or create your first post.</div>
                <button
                  style={{marginTop: 18, background: 'var(--y)', color: '#1a3010', border: 'none', borderRadius: 99, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer'}}
                  onClick={() => navigate(`${navigatePrefix}/create-post?type=post`)}
                >
                  Create Your First Post →
                </button>
              </div>
            )}

            {!loading && filteredPosts.map((post, i) => {
              const pt = post.postType || "post";
              const isOwner = String(post.authorId || post.author?.id || "") === String(currentUserId);

              return (
                <div key={post.id} className="post-card" ref={(el) => (cardRefs.current[i] = el)} style={{position: 'relative', paddingBottom: 56}}>
                  <div className="post-head" style={{position: 'relative'}}>
                    <a href={`/profile/${post.authorUsername}`} style={{textDecoration: 'none'}}>
                      <div className="p-av" style={{ background: avatarColors[i % avatarColors.length] }}>
                        {post.author?.avatarDisplay || "U"}
                      </div>
                    </a>
                    <div>
                      <div className="post-author-name">
                        <a href={`/profile/${post.authorUsername}`} style={{color: 'inherit', textDecoration: 'none'}}>{post.author?.fullName || "Unknown"}</a>
                      </div>
                      <div className="post-author-meta">
                        {post.createdAt}
                        {post.community && (
                          <> · <a href="#" className="community-link">{post.community.name}</a></>
                        )}
                      </div>
                    </div>
                    <span className={`chip chip-${pt}`}>{pt.charAt(0).toUpperCase() + pt.slice(1)}</span>
                  </div>

                  <span className="post-title">{post.title}</span>

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
                    <div className="photo-card">
                      <img src={post.image} alt={post.title} />
                    </div>
                  )}

                  {pt === "note"
                    ? <div className="note-card" style={{ textAlign: "center" }} dangerouslySetInnerHTML={{ __html: post.content }} />
                    : post.content && <div className="post-copy" style={{ textAlign: "center" }} dangerouslySetInnerHTML={{ __html: post.content }} />
                  }
                  <div className="post-actions">
                    <button className={`act-btn${post.likedByUser ? " liked" : ""}`} onClick={() => toggleLike(post.id)}>
                      {post.likedByUser ? "♥" : "♡"} {post.likeCount}
                    </button>
                    <div className="act-sep" />
                    <button className="act-btn" onClick={() => handleReply(post)}>◎ {post.replyCount} Replies</button>
                    <div className="act-sep" />
                    <button className="act-btn" onClick={() => handleShare(post)}>↗ Share</button>
                  </div>

                  {/* 3-dots menu bottom right, outside post-head and after all content */}
                  <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 10 }}>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, fontSize: 22, color: '#b5b5b5' }}
                      aria-label="More options"
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpenIdx(menuOpenIdx === i ? null : i);
                      }}
                    >
                      <span style={{fontSize: 22, color: '#b5b5b5', fontWeight: 700, lineHeight: 1}}>⋯</span>
                    </button>
                    {menuOpenIdx === i && (
                      <div
                        style={{
                          position: 'absolute', right: 0, bottom: 32, background: '#1a2a1a', border: '1px solid #2e3e2e', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', minWidth: 140, zIndex: 20
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          style={{ display: 'block', width: '100%', padding: '10px 18px', background: 'none', border: 'none', color: '#fca5a5', textAlign: 'left', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #2e3e2e' }}
                          onClick={() => handleReport(post.id)}
                        >
                          🚩 Report
                        </button>
                        {isOwner && (
                          <button
                            style={{ display: 'block', width: '100%', padding: '10px 18px', background: 'none', border: 'none', color: '#f87171', textAlign: 'left', fontSize: 14, cursor: 'pointer' }}
                            onClick={() => handleDelete(post.id)}
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </main>

          {/* ── Right sidebar ── */}
          <aside className="right-col">
            <div className="widget">
              <div className="wt">Browse Topics</div>
              {["📚 Curriculum", "🧪 Science", "📐 Math", "🎨 Arts", "💡 Ideas"].map((t) => (
                <span key={t} className="topic-tag">{t}</span>
              ))}
            </div>
            <div className="widget">
              <div className="wt">Suggested People</div>
              {suggestedPeople.map((su) => {
                const isFollowing = followedSet.has(String(su.id));
                return (
                  <div className="person" key={su.id}>
                    <div className="p-sav">{su.avatarDisplay}</div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <div className="p-n">{su.fullName}</div>
                      <div className="p-r">{su.role}</div>
                    </div>
                    <button className="follow-btn" style={{ alignSelf: "center" }} onClick={() => toggleFollow(su.id)}>{isFollowing ? "Unfollow" : "+ Follow"}</button>
                  </div>
                );
              })}
            </div>
            <div className="safe-card">
              <div style={{ fontSize: 22, marginBottom: 6 }}>🛡</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--y)", marginBottom: 5 }}>Safe Community</div>
              <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.55 }}>
                Only verified students & teachers. Your privacy is always protected.
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }
