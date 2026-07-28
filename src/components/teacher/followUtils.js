import API, { toList } from "../../api";

const FOLLOWING_STORAGE_KEY = "saha_following_ids";
export const FOLLOW_STATE_CHANGED_EVENT = "saha:follow-state-changed";

const normalizeUser = (user) => {
  if (!user) return null;
  const id = String(user.id ?? user.pk ?? user.user_id ?? "");
  if (!id) return null;
  return {
    id,
    fullName: user.full_name || user.name || user.username || `User ${id}`,
    username: user.username || "",
    role: user.role || user.user_role || "Member",
    avatarDisplay:
      user.avatar_display ||
      (user.full_name || user.username || "U")
        .split(" ")
        .map((item) => item[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
  };
};

const uniqueById = (list) => {
  const map = new Map();
  list.forEach((item) => {
    if (item?.id) map.set(String(item.id), item);
  });
  return [...map.values()];
};

const parseUsers = (payload) => {
  const list = toList(payload);
  return uniqueById(list.map(normalizeUser).filter(Boolean));
};

const notifyFollowStateChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FOLLOW_STATE_CHANGED_EVENT));
};

export const syncFollowingIds = async () => {
  const users = await getFollowList(["follow/following/"]);
  if (users !== null) {
    writeFollowingIds(users.map((item) => item.id));
  }
  return users;
};

export const readFollowingIds = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOWING_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String);
  } catch {
    return [];
  }
};

export const writeFollowingIds = (ids) => {
  if (typeof window === "undefined") return;
  const unique = [...new Set((ids || []).map(String).filter(Boolean))];
  window.localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(unique));
};

export const loadAllUsers = async () => {
  try {
    const response = await API.get("users/");
    return parseUsers(response.data);
  } catch {
    return [];
  }
};

const getFollowList = async (paths) => {
  for (const path of paths) {
    try {
      const response = await API.get(path);
      return parseUsers(response.data);
    } catch {
      continue;
    }
  }
  return null;
};

export const loadFollowingUsers = async () => {
  const users = await getFollowList(["follow/following/"]);

  if (users !== null) {
    writeFollowingIds(users.map((item) => item.id));
    return users;
  }

  return [];
};

export const loadFollowerUsers = async () =>
  (await getFollowList(["follow/followers/"])) || [];

export const setFollowUser = async (targetUserId, shouldFollow) => {
  const id = String(targetUserId);
  if (!id) return false;

  try {
    if (shouldFollow) {
      // 🔥 send follow request
      await API.post(`follow/${id}/`);
    } else {
      // 🔥 unfollow / cancel request
      await API.delete(`follow/${id}/`);
    }
    await syncFollowingIds();
    notifyFollowStateChanged();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const acceptFollowRequest = async (targetUserId) => {
  const id = String(targetUserId);
  if (!id) return false;

  try {
    await API.post("follow/requests/accept/", { user_id: id });
    await syncFollowingIds();
    notifyFollowStateChanged();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/* ✅ FINAL FIX: fetch SENT requests (for "Requested" button state) */
export const loadFollowRequests = async () => {
  try {
    const response = await API.get("follow/requests/sent/");
    return parseUsers(response.data);
  } catch (err) {
    console.error(err);
    return [];
  }
};