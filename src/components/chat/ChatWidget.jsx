import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWebSocketChat } from "../../context/WebSocketChatContext";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import ChatInput from "./ChatInput";
import RequestsTab from "./RequestsTab";
import ChatSearch from "./ChatSearch";
import "./ChatWidget.css";

function ChatBubbleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7.5 18C8.9 18.72 10.5 19.1 12.2 19.1C17.6 19.1 22 15.6 22 11.2C22 6.8 17.6 3.3 12.2 3.3C6.8 3.3 2.4 6.8 2.4 11.2C2.4 13.4 3.5 15.3 5.3 16.7L4.5 20.5L7.5 18Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
      <path d="M8 11.2H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M8 8H13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

export { SendIcon };

function getRoomName(userId, contactId) {
  return `${Math.min(userId, contactId)}_${Math.max(userId, contactId)}`;
}

export default function ChatWidget() {
  const location = useLocation();
  const {
    conversations,
    currentUser,
    isOpen,
    selectedConversation,
    selectedConversationId,
    selectConversation,
    sendMessage,
    toggleWidget,
    closeWidget,
    unreadCount,
    requestFeatureEnabled,
    studyRequests,
    studyRequestLoading,
    studyRequestError,
    contacts,
    setContacts,
    refreshChatContext,
    wsStatus,
  } = useWebSocketChat();

  const [activeTab, setActiveTab] = useState("messages"); // "messages" | "requests"
  const [showSearch, setShowSearch] = useState(false);
  const [mobilePanelView, setMobilePanelView] = useState("sidebar"); // "sidebar" | "thread"

  useEffect(() => {
    if (isOpen || showSearch) {
      refreshChatContext();
    }
  }, [isOpen, refreshChatContext, showSearch]);

  const isChatRoute =
    location.pathname.startsWith("/teacher") ||
    location.pathname.startsWith("/student");

  if (!isChatRoute || !currentUser) return null;

  const handleSelectMutual = (userId) => {
    if (!currentUser) return;
    let contact = contacts?.find((c) => String(c.id) === String(userId));
    if (!contact) {
      contact = {
        id: userId,
        fullName: "User",
        username: "",
        role: "member",
        avatarDisplay: "U",
        shortName: "U",
        name: "User",
      };
      setContacts?.((prev) => [...prev, contact]);
    }
    const roomName = getRoomName(currentUser.id, userId);
    selectConversation(roomName);
    setShowSearch(false);
    setActiveTab("messages");
    setMobilePanelView("thread");
  };

  const handleBack = () => {
    setMobilePanelView("sidebar");
  };

  const widgetTone = currentUser?.role?.toLowerCase() === "teacher" ? "teacher" : "student";
  const panelMobileClass = mobilePanelView === "thread" ? "show-thread" : "show-sidebar";

  return (
    <div className="chat-widget" aria-live="polite">
      {/* ── Panel ── */}
      <section
        className={`chat-widget__panel ${isOpen ? "is-open" : "is-closed"} ${panelMobileClass}`}
        aria-hidden={!isOpen}
      >
        {/* SIDEBAR */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar__header">
            {/* User identity row */}
            <div className="chat-sidebar__user">
              <div className={`chat-sidebar__user-avatar chat-sidebar__user-avatar--${widgetTone}`}>
                {currentUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="chat-sidebar__user-info">
                <div className="chat-sidebar__user-name">{currentUser.name}</div>
                <div className="chat-sidebar__user-role">{currentUser.role}</div>
              </div>
              <button
                className="chat-sidebar__close"
                onClick={closeWidget}
                aria-label="Close chat"
              >×</button>
            </div>

            {/* Search */}
            <div className="chat-sidebar__search-wrap">
              <span className="chat-sidebar__search-icon">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                className="chat-sidebar__search"
                type="text"
                placeholder="Search conversations…"
                onFocus={() => setShowSearch(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.value) setShowSearch(false);
                }}
                onChange={(e) => {
                  setShowSearch(!!e.target.value);
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="chat-sidebar__tabs">
            <button
              className={`chat-sidebar__tab ${activeTab === "messages" ? "is-active" : ""}`}
              onClick={() => { setActiveTab("messages"); setShowSearch(false); }}
            >
              Messages
              {unreadCount > 0 && <span style={{ marginLeft: 5, color: "var(--gold)" }}>·{unreadCount}</span>}
            </button>
            {requestFeatureEnabled && (
              <button
                className={`chat-sidebar__tab ${activeTab === "requests" ? "is-active" : ""}`}
                onClick={() => { setActiveTab("requests"); setShowSearch(false); }}
              >
                Requests
              </button>
            )}
          </div>

          {/* List / Search / Requests */}
          {activeTab === "messages" && showSearch ? (
            <ChatSearch
              currentUser={currentUser}
              onSelect={handleSelectMutual}
            />
          ) : activeTab === "messages" ? (
            <ConversationList
              conversations={conversations}
              currentUser={currentUser}
              selectedConversationId={selectedConversationId}
              onSelect={(id) => {
                selectConversation(id);
                setMobilePanelView("thread");
              }}
            />
          ) : (
            <RequestsTab
              currentUser={currentUser}
              requests={studyRequests}
              loading={studyRequestLoading}
              error={studyRequestError}
            />
          )}

          {/* New chat button */}
          {activeTab === "messages" && !showSearch && (
            <button
              className="chat-sidebar__new-btn"
              onClick={() => setShowSearch(true)}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New conversation
            </button>
          )}
        </aside>

        {/* MAIN THREAD AREA */}
        <div className="chat-main">
          {selectedConversation ? (
            <>
              <MessageThread
                conversation={selectedConversation}
                currentUser={currentUser}
                onBack={handleBack}
                wsStatus={wsStatus}
              />
              <ChatInput
                disabled={false}
                onSend={sendMessage}
              />
            </>
          ) : (
            <div className="chat-welcome">
              <div className="chat-welcome__icon">
                <ChatBubbleIcon />
              </div>
              <h3 className="chat-welcome__title">Your messages</h3>
              <p className="chat-welcome__sub">
                Select a conversation from the left, or start a new one by clicking "New conversation".
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Toggle button ── */}
      <button
        type="button"
        className={`chat-widget__toggle chat-widget__toggle--${widgetTone}`}
        onClick={toggleWidget}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Collapse chat" : "Open chat"}
      >
        <ChatBubbleIcon />
        {unreadCount > 0 && (
          <span className="chat-widget__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>
    </div>
  );
}