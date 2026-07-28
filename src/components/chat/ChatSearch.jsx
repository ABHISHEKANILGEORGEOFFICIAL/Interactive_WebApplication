import { useMemo, useState } from "react";
import { useWebSocketChat } from "../../context/WebSocketChatContext";

export default function ChatSearch({ currentUser, onSelect }) {
  const { contacts } = useWebSocketChat();
  const [search, setSearch] = useState("");
  const availableContacts = useMemo(
    () => (contacts || []).filter((u) => String(u.id) !== String(currentUser?.id)),
    [contacts, currentUser?.id]
  );

  const filtered = availableContacts.filter((u) => {
    const q = search.toLowerCase();
    const name = (u.fullName || u.name || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  const roleClass = (role) =>
    role?.toLowerCase() === "teacher" ? "teacher" : "student";

  const getInitial = (u) =>
    u.avatarDisplay ||
    u.shortName ||
    (u.fullName || u.name || "?").charAt(0).toUpperCase();

  const getDisplayName = (u) => u.fullName || u.name || "Unknown";
  const getUsername = (u) => u.username || "";
  const getRole = (u) => u.role || "";

  return (
    <div className="chat-sidebar__list">
      <div style={{ padding: "0 2px 8px" }}>
        <input
          autoFocus
          className="chat-sidebar__search"
          style={{ width: "100%" }}
          type="text"
          placeholder="Search by name or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="chat-empty">
          <p className="chat-empty__body">
            {search ? "No results found." : "No contacts found."}
          </p>
        </div>
      )}

      {filtered.map((u) => (
        <button
          key={u.id}
          type="button"
          className="chat-search-result"
          onClick={() => onSelect(u.id)}
        >
          <div
            className={`chat-conv-item__avatar chat-conv-item__avatar--${roleClass(getRole(u))}`}
            style={{ width: 36, height: 36, borderRadius: 11, fontSize: 13 }}
          >
            {getInitial(u)}
          </div>
          <div>
            <span className="chat-search-result__name">{getDisplayName(u)}</span>
            <span className="chat-search-result__sub">
              {getUsername(u) ? `@${getUsername(u)} · ` : ""}
              {getRole(u)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}