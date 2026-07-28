import { useEffect, useRef } from "react";

function formatMessageTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getDate() === db.getDate() &&
    da.getMonth() === db.getMonth() &&
    da.getFullYear() === db.getFullYear()
  );
}

/** Group consecutive messages from the same sender */
function groupMessages(messages) {
  const groups = [];
  let currentGroup = null;

  messages.forEach((msg, i) => {
    const newDay = i === 0 || !isSameDay(messages[i - 1]?.timestamp, msg.timestamp);
    if (newDay) {
      groups.push({ type: "date", label: formatDateLabel(msg.timestamp), key: `date-${i}` });
      currentGroup = null;
    }

    if (!currentGroup || currentGroup.senderId !== msg.senderId) {
      currentGroup = { type: "group", senderId: msg.senderId, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return groups;
}

export default function MessageThread({ conversation, currentUser, onBack, wsStatus }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  if (!conversation) {
    return (
      <div className="chat-welcome">
        <div className="chat-welcome__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 12h8M8 8h5" stroke="rgba(237,234,224,0.4)" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M5.5 17C4 15.8 3 14 3 12C3 7.6 7 4 12 4C17 4 21 7.6 21 12C21 16.4 17 20 12 20C10.4 20 8.9 19.6 7.6 18.9L4 20.5L5.5 17Z"
              stroke="rgba(237,234,224,0.4)" strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="chat-welcome__title">Select a conversation</h3>
        <p className="chat-welcome__sub">Choose someone from the left to start messaging.</p>
      </div>
    );
  }

  const otherRole = conversation.otherParticipant?.role?.toLowerCase() || "student";
  const otherInitials =
    conversation.otherParticipant?.shortName ||
    conversation.otherParticipant?.name?.charAt(0)?.toUpperCase() ||
    "?";

  const groups = groupMessages(conversation.messages || []);

  return (
    <>
      {/* Header */}
      <div className="chat-thread-header">
        {/* Back button (mobile only via CSS) */}
        <button className="chat-thread-header__back" onClick={onBack} aria-label="Back">
          ←
        </button>

        <div className={`chat-thread-header__avatar chat-thread-header__avatar--${otherRole}`}>
          {otherInitials}
        </div>

        <div className="chat-thread-header__info">
          <h2 className="chat-thread-header__name">
            {conversation.otherParticipant?.name || "Unknown"}
          </h2>
          <p className="chat-thread-header__role">
            {conversation.otherParticipant?.title ||
              conversation.otherParticipant?.role ||
              ""}
          </p>
        </div>

        {/* Live WS indicator */}
        <div
          className="chat-thread-header__ws-dot"
          title="Real-time connected"
          style={wsStatus === false ? { background: "#ef4444" } : {}}
        />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {conversation.messages.length === 0 && (
          <div className="chat-empty" style={{ margin: "auto" }}>
            <p className="chat-empty__body">
              No messages yet — say hello! 👋
            </p>
          </div>
        )}

        {groups.map((group) => {
          if (group.type === "date") {
            return (
              <div key={group.key} className="chat-date-divider">
                {group.label}
              </div>
            );
          }

          const isOwn = group.senderId === currentUser?.id;
          const count = group.messages.length;

          return (
            <div
              key={`group-${group.senderId}-${group.messages[0]?.id}`}
              className={`chat-msg-group chat-msg-group--${isOwn ? "own" : "other"}`}
            >
              {!isOwn && (
                <div className="chat-msg-group__sender">
                  {conversation.otherParticipant?.name}
                </div>
              )}

              {group.messages.map((msg, idx) => {
                const posClass =
                  count === 1 ? "" :
                  idx === 0 ? "first" :
                  idx === count - 1 ? "last" : "mid";

                const isRead =
                  isOwn &&
                  msg.readBy?.includes(conversation.otherParticipant?.id);

                return (
                  <div
                    key={msg.id}
                    className={`chat-bubble chat-bubble--${isOwn ? "own" : "other"} ${posClass}`}
                  >
                    {msg.text}
                    <div className="chat-bubble__meta">
                      <span className="chat-bubble__time">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                      {isOwn && (
                        <span
                          className={`chat-bubble__status${isRead ? " chat-bubble__status--read" : ""}`}
                        >
                          {isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </>
  );
}