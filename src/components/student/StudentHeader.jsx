import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";
import { useCallback, useEffect } from "react";
import useActivityNotifications from "../common/useActivityNotifications";

/* ICONS */
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
  </svg>
);
const CourseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
  </svg>
);

const CollectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" />
  </svg>
);

const MyCoursesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, opacity: 0.65 }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function StudentHeader({ user, ddOpen, onToggle }) {
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

  const handleLogout = useCallback((e) => {
    e.preventDefault();

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/";
  }, []);

  return (
    <nav className="topbar">
      {/* LOGO */}
      <Link to="/student/home" className="tb-logo" style={{ textDecoration: "none" }}>
        <div className="tb-logo-mark">
          <img src={logo} alt="SAHA logo" />
        </div>

        <div>
          <div style={{ display: "flex", gap: 3, marginBottom: 2 }}>
            {["S", "A", "H", "A"].map((letter, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: "'Arial Black','Arial Bold',sans-serif",
                  fontSize: 28,
                  fontWeight: 900,
                  background:
                    "linear-gradient(145deg,#fffbe0 0%,#ffe566 10%,#f5c518 22%,#e8a000 38%,#f5c518 52%,#ffe566 65%,#f5d020 78%,#c88000 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "logoBob 4s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="tb-logo-tag">learn together in a calmer space</div>
        </div>
      </Link>

      {/* RIGHT SIDE */}
      <div className="tb-right">
        <div className="notif-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            className="notif-btn"
            title="Notifications"
            onClick={toggleNotifications}
          >
            <BellIcon />
          </button>

          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {notificationsOpen && (
            <div className="notif-panel">
              <div className="notif-head">
                <div className="notif-title">Notifications</div>

                <button className="notif-clear" onClick={markAllRead}>
                  Mark all read
                </button>
              </div>

              {notifications.length > 0 ? (
                <div className="notif-list">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notif-item${item.read ? "" : " is-unread"}`}
                    >
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

        <button className="notif-btn" title="Messages">
          <MsgIcon />
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="av-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggle((open) => !open);
            }}
          >
            {user?.avatarDisplay || "S"}
          </button>

          {ddOpen && (
            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="dd-header">
                <div className="dd-av">{user?.avatarDisplay || "S"}</div>
                <div className="dd-name">{user?.fullName || "Student"}</div>
                <div className="dd-role">{user?.role || "student"}</div>
              </div>

              <div className="dd-stats">
                <div className="ds">
                  <div className="ds-n">{user?.posts || 0}</div>
                  <div className="ds-l">Posts</div>
                </div>

                <div className="ds">
                  <div className="ds-n">{user?.followers || 0}</div>
                  <div className="ds-l">Followers</div>
                </div>

                <div className="ds">
                  <div className="ds-n">{user?.following || 0}</div>
                  <div className="ds-l">Following</div>
                </div>
              </div>

              <Link to="/student/profile" className="dd-item">
                <UserIcon /> My Profile
              </Link>

              <Link to="/student/desk" className="dd-item">
                <DeskIcon /> My Desk
              </Link>

              <Link to="/student/following" className="dd-item">
                <PeopleIcon /> Following
              </Link>

              <Link to="/student/courses" className="dd-item">
                <CourseIcon /> Explore Courses
              </Link>

              <Link to="/student/collections" className="dd-item">
                <CollectionIcon /> My Collections
              </Link>

              <Link to="/student/my-courses" className="dd-item">
                <MyCoursesIcon /> My Courses
              </Link>

              <div className="dd-sep" />

              <a href="/" className="dd-item dd-danger" onClick={handleLogout}>
                <LogoutIcon /> Logout
              </a>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .dd-item {
          display: flex;
          align-items: center;
        }
      `}</style>
    </nav>
  );
}
