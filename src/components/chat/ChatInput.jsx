import { useState, useRef, useEffect } from "react";

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ChatInput({ disabled, onSend }) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 110) + "px";
  }, [draft]);

  const handleSend = () => {
    if (!draft.trim() || disabled) return;
    onSend(draft.trim());
    setDraft("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-bar">
      <div className="chat-input-wrap">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Select a conversation…" : "Type a message…"}
          disabled={disabled}
          rows={1}
        />
      </div>

      <button
        type="button"
        className="chat-send-btn"
        onClick={handleSend}
        disabled={disabled || !draft.trim()}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  );
}