import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import API from "../../api";
import useActivityNotifications from "../common/useActivityNotifications";

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const MsgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 5h16v10H7l-3 3V5z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const DeskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
);

const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function TeacherHeader({ user = {}, ddOpen, onToggle }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isOpen: notificationsOpen,
    toggleOpen: toggleNotifications,
    closePanel: closeNotifications,
    markAllRead,
  } = useActivityNotifications(user);

  useEffect(() => {
    const handleClose = () => {
      closeNotifications();
    };
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, [closeNotifications]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();

    if (onToggle) {
      onToggle((open) => !open);
    }
  };

  return (
    <nav className="topbar">
      <a href="/teacher/home" className="tb-logo">
        <span className="tb-logo-mark">
          <img src="/logo.png" alt="Saha" />
        </span>

        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="tb-logo-name">Saha</span>
          <span className="tb-logo-tag">Learn together in a calmer space</span>
        </span>
      </a>

      <div className="tb-right">
        <div className="notif-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="notif-btn" title="Notifications" onClick={toggleNotifications}>
            <BellIcon />
          </button>
          {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}

          {notificationsOpen && (
            <div className="notif-panel">
              <div className="notif-head">
                <div className="notif-title">Notifications</div>
                <button className="notif-clear" onClick={markAllRead}>Mark all read</button>
              </div>
              {notifications.length > 0 ? (
                <div className="notif-list">
                  {notifications.map((item) => (
                    <div key={item.id} className={`notif-item${item.read ? "" : " is-unread"}`}>
                      <div className="notif-text">{item.text}</div>
                      <div className="notif-time">{item.timeLabel}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="notif-empty">No recent activity yet.</div>
              )}
            </div>
          )}
        </div>
        <button className="notif-btn" title="Messages"><MsgIcon /></button>
        <div style={{ position: "relative" }}>
          <button
            className="av-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggle((open) => !open);
            }}
          >
            {user.avatarDisplay || "U"}
          </button>

          {ddOpen && (
            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="dd-header">
                <div className="dd-av">{user.avatarDisplay || "U"}</div>
                <div className="dd-name">{user.fullName || "User"}</div>
                <div className="dd-role">{user.role || "Teacher"}</div>
              </div>

              <div className="dd-stats">
                <div className="ds">
                  <div className="ds-n">{user.posts || 0}</div>
                  <div className="ds-l">Posts</div>
                </div>
                <div className="ds">
                  <div className="ds-n">{user.followers || 0}</div>
                  <div className="ds-l">Followers</div>
                </div>
                <div className="ds">
                  <div className="ds-n">{user.following || 0}</div>
                  <div className="ds-l">Following</div>
                </div>
              </div>

              <button className="dd-item" onClick={() => navigate("/teacher/home")}>
                <UserIcon /> My Profile
              </button>

              <button className="dd-item" onClick={() => navigate("/teacher/tasks")}>
                <DeskIcon /> My Desk
              </button>

              <button className="dd-item" onClick={() => navigate("/teacher/communities")}>
                <PeopleIcon /> Following
              </button>

              <button className="dd-item" onClick={() => navigate("/teacher/courses")}>
                <BookIcon /> My Courses
              </button>

              <button className="dd-item" onClick={() => navigate("/teacher/courses/create")}>
                <BookIcon /> Create Course
              </button>

              <div className="dd-sep" />

              <button className="dd-item dd-danger" onClick={logout}>
                <LogoutIcon /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}