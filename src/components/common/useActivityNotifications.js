import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API, { toList } from "../../api";
import { ACTIVITY_NOTIFICATION_EVENT } from "./activityNotificationsBus";

function toInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toUserId(user) {
  const fromUser = user?.id ?? user?.user?.id;
  const fromStorage = localStorage.getItem("user_id");
  const candidate = fromUser ?? fromStorage;
  if (candidate === undefined || candidate === null || candidate === "") return null;
  return String(candidate);
}

function toPostSnapshot(post) {
  return {
    id: post.id,
    title: post.title || "Untitled",
    authorId: String(post.author_id ?? post.author?.id ?? post.user_id ?? ""),
    authorName: post.author_name || post.author?.full_name || post.author?.name || "Someone",
    likeCount: toInt(post.like_count),
    replyCount: toInt(post.reply_count),
    createdAt: post.created_at || null,
    updatedAt: post.updated_at || post.created_at || null,
  };
}

function toTimeLabel(iso) {
  if (!iso) return "Just now";
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Just now";
  const deltaSec = Math.max(0, Math.floor((now - then) / 1000));
  if (deltaSec < 60) return "Just now";
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
}

function buildNotification(id, kind, text, meta = {}) {
  return {
    id,
    kind,
    text,
    at: meta.at || new Date().toISOString(),
    postId: meta.postId || null,
    read: false,
  };
}

export default function useActivityNotifications(user, options = {}) {
  const pollMs = options.pollMs ?? 20000;
  const maxItems = options.maxItems ?? 7;

  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const knownPostsRef = useRef(new Map());
  const hydratedRef = useRef(false);

  const unreadCount = useMemo(
    () => items.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [items]
  );

  const appendNotifications = useCallback((nextItems) => {
    if (!nextItems.length) return;
    setItems((prev) => {
      const dedup = new Map(prev.map((item) => [item.id, item]));
      nextItems.forEach((item) => dedup.set(item.id, item));
      return [...dedup.values()]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, maxItems);
    });
  }, [maxItems]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!prev && next) {
        setItems((current) => current.map((item) => ({ ...item, read: true })));
      }
      return next;
    });
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const poll = async () => {
      try {
        const res = await API.get("posts/");
        if (cancelled) return;

        const list = toList(res.data)
          .map(toPostSnapshot)
          .filter((post) => post?.id !== undefined && post?.id !== null);

        const nextMap = new Map(list.map((post) => [String(post.id), post]));

        if (!hydratedRef.current) {
          // Show a small baseline of recent activity so the bell is useful immediately.
          const seed = list
            .slice()
            .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
            .slice(0, 5)
            .map((post) =>
              buildNotification(
                `seed-${post.id}-${post.updatedAt || Date.now()}`,
                "post",
                `${post.authorName} shared: ${post.title}`,
                { at: post.updatedAt || post.createdAt, postId: post.id }
              )
            )
            .map((item) => ({ ...item, read: true }));

          setItems(seed);
          knownPostsRef.current = nextMap;
          hydratedRef.current = true;
          return;
        }

        const currentUserId = toUserId(user);
        const pending = [];

        list.forEach((post) => {
          const key = String(post.id);
          const previous = knownPostsRef.current.get(key);

          if (!previous) {
            if (currentUserId === null || String(post.authorId) !== String(currentUserId)) {
              pending.push(
                buildNotification(
                  `post-${post.id}-${post.createdAt || post.updatedAt || Date.now()}`,
                  "post",
                  `${post.authorName} shared: ${post.title}`,
                  { at: post.createdAt || post.updatedAt, postId: post.id }
                )
              );
            }
            return;
          }

          if (currentUserId !== null && String(previous.authorId) === String(currentUserId)) {
            if (post.likeCount > previous.likeCount) {
              const delta = post.likeCount - previous.likeCount;
              pending.push(
                buildNotification(
                  `like-${post.id}-${post.likeCount}`,
                  "like",
                  `${delta} new like${delta > 1 ? "s" : ""} on your post: ${post.title}`,
                  { at: post.updatedAt, postId: post.id }
                )
              );
            }

            if (post.replyCount > previous.replyCount) {
              const delta = post.replyCount - previous.replyCount;
              pending.push(
                buildNotification(
                  `reply-${post.id}-${post.replyCount}`,
                  "reply",
                  `${delta} new repl${delta > 1 ? "ies" : "y"} on your post: ${post.title}`,
                  { at: post.updatedAt, postId: post.id }
                )
              );
            }
          }
        });

        knownPostsRef.current = nextMap;
        appendNotifications(pending);
      } catch {
        // Keep the bell non-blocking if notifications endpoint/data is temporarily unavailable.
      }
    };

    poll();
    timer = window.setInterval(poll, pollMs);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [appendNotifications, pollMs, user]);

  useEffect(() => {
    const handleActivity = (event) => {
      const detail = event?.detail;
      if (!detail?.text) return;
      appendNotifications([
        {
          id: detail.id || `local-${detail.kind || "activity"}-${Date.now()}`,
          kind: detail.kind || "activity",
          text: detail.text,
          at: detail.at || new Date().toISOString(),
          postId: detail.postId ?? null,
          read: false,
        },
      ]);
    };

    window.addEventListener(ACTIVITY_NOTIFICATION_EVENT, handleActivity);
    return () => {
      window.removeEventListener(ACTIVITY_NOTIFICATION_EVENT, handleActivity);
    };
  }, [appendNotifications]);

  const renderedItems = useMemo(
    () => items.map((item) => ({ ...item, timeLabel: toTimeLabel(item.at) })),
    [items]
  );

  return {
    notifications: renderedItems,
    unreadCount,
    isOpen,
    toggleOpen,
    closePanel,
    markAllRead,
  };
}
