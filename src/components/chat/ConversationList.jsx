function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  const isThisWeek = now - date < 7 * 24 * 60 * 60 * 1000;
  if (isThisWeek) {
    return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default function ConversationList({
  conversations,
  currentUser,
  selectedConversationId,
  onSelect,
}) {
  if (!conversations.length) {
    return (
      <div className="chat-sidebar__list">
        <div className="chat-empty">
          <div className="chat-empty__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 12h8M8 8h5" stroke="rgba(237,234,224,0.4)" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M5.5 17C4 15.8 3 14 3 12C3 7.6 7 4 12 4C17 4 21 7.6 21 12C21 16.4 17 20 12 20C10.4 20 8.9 19.6 7.6 18.9L4 20.5L5.5 17Z"
                stroke="rgba(237,234,224,0.4)" strokeWidth="1.7" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="chat-empty__title">No conversations yet</p>
          <p className="chat-empty__body">
            Use "New conversation" below to start chatting with a mutual.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar__list">
      {conversations.map((conv) => {
        const role = conv.otherParticipant?.role?.toLowerCase() || "student";
        const initials =
          conv.otherParticipant?.shortName ||
          conv.otherParticipant?.name?.charAt(0)?.toUpperCase() ||
          "?";

        return (
          <button
            key={conv.id}
            type="button"
            className={`chat-conv-item${conv.id === selectedConversationId ? " is-active" : ""}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className={`chat-conv-item__avatar chat-conv-item__avatar--${role}`}>
              {initials}
            </div>

            <div className="chat-conv-item__body">
              <div className="chat-conv-item__top">
                <span className="chat-conv-item__name">
                  {conv.otherParticipant?.name || "Unknown"}
                </span>
                <span className="chat-conv-item__time">
                  {formatTime(conv.lastMessage?.timestamp)}
                </span>
              </div>
              <div className="chat-conv-item__bottom">
                <span className="chat-conv-item__preview">
                  {conv.lastMessage
                    ? (conv.lastMessage.senderId === currentUser?.id ? "You: " : "") +
                      conv.lastMessage.text
                    : "No messages yet"}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="chat-conv-item__unread">{conv.unreadCount}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}