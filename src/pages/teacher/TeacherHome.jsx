import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import Feed from "../../components/teacher/Feed";
import CreatePost from "../createpost";

const mockUser = {
  firstName: "Teacher",
  username: "teacher",
  fullName: "Your Name",
  role: "Teacher",
  avatarDisplay: "T",
  avatarUrl: null,
  posts: 0, followers: 0, following: 0,
};

const HERO_STYLES = `
  .hero-section { position:relative; width:100%; height:100vh; min-height:600px; overflow:hidden; }
  .hero-ui {
    position:relative; z-index:20;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:100%; padding:100px 24px 60px; text-align:center;
  }
  .hero-title {
    font-family:var(--font); font-size:clamp(32px,5.5vw,62px);
    font-style:italic; font-weight:400; color:#f0ede6;
    line-height:1.1; margin-bottom:12px; text-shadow:0 2px 40px rgba(0,0,0,0.45);
  }
  .hero-sub { font-size:15px; color:rgba(210,240,215,0.7); margin-bottom:44px; max-width:440px; line-height:1.6; }
  .hero-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; width:100%; max-width:860px; margin-bottom:40px; }
  .hero-card {
    background:rgba(8,30,18,0.82); border:1px solid rgba(120,200,145,0.22);
    border-radius:22px; padding:28px 22px 24px;
    display:flex; flex-direction:column; align-items:center;
    cursor:pointer; text-decoration:none;
    transition:transform .22s, border-color .22s; position:relative; overflow:hidden;
    backdrop-filter:blur(10px);
  }
  .hero-card::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(circle at 50% 0%,rgba(245,197,24,0.14) 0%,transparent 70%);
    opacity:0; transition:opacity .22s;
  }
  .hero-card:hover { transform:translateY(-5px); border-color:rgba(245,197,24,0.42); }
  .hero-card:hover::before { opacity:1; }
  .hc-num { width:28px; height:28px; border-radius:50%; border:1px solid rgba(180,220,170,0.35); display:flex; align-items:center; justify-content:center; font-size:12px; color:rgba(200,230,200,0.6); margin-bottom:14px; font-family:var(--font); font-style:italic; }
  .hc-title { font-family:var(--font); font-size:20px; font-style:italic; color:#eaf0e2; margin-bottom:14px; }
  .hc-icon { width:80px; height:80px; border-radius:18px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .hc-desc { font-size:12px; color:var(--muted); text-align:center; line-height:1.6; }
  .scroll-hint {
    position:absolute; bottom:110px; left:50%; transform:translateX(-50%);
    display:flex; flex-direction:column; align-items:center; gap:6px;
    color:rgba(200,230,200,0.4); font-size:11px; letter-spacing:1px;
    text-transform:uppercase; animation:bounce 2s infinite;
  }
  .scroll-arrow { width:20px; height:20px; border-right:1.5px solid currentColor; border-bottom:1.5px solid currentColor; transform:rotate(45deg); }
  @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0);} 50%{transform:translateX(-50%) translateY(6px);} }
  @media(max-width:800px) { .hero-cards { grid-template-columns:1fr; } .hero-card { flex-direction:row; gap:16px; padding:18px 20px; text-align:left; align-items:center; } .hc-icon { width:60px; height:60px; flex-shrink:0; margin:0; } .hero-title { font-size:32px; } }
`;

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function TeacherHome() {
  const [ddOpen, setDdOpen] = useState(false);
  // Removed showCreate and setShowCreate
  const [refreshToken, setRefreshToken] = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    const id = "saha-hero-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = HERO_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const h = () => setDdOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const scrollToFeed = (e) => { e.preventDefault(); feedRef.current?.scrollIntoView({ behavior: "smooth" }); };

  // Removed handleCreate and handlePostCreated

  return (
    <TeacherLayout user={mockUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-ui">
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, background: "rgba(245,197,24,0.22)", border: "1.5px solid rgba(245,197,24,0.5)", borderRadius: 99, padding: "7px 18px", fontSize: 12, fontWeight: 800, color: "#059669", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 22, alignSelf: "center", position: "relative", zIndex: 30, whiteSpace: "nowrap", lineHeight: 1 }}>
            <StarIcon /><span style={{ display: "inline", verticalAlign: "middle" }}>Welcome back, {mockUser.firstName}</span>
          </div>
          <p className="hero-sub">Share posts, notes, and photos. Stay connected with your community.</p>
          <div className="hero-cards">
            <a href="#" className="hero-card" onClick={scrollToFeed}>
              <div className="hc-num">1</div>
              <div className="hc-title">My World</div>
              <div className="hc-icon" style={{ background: "#a8d8b0" }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="13" stroke="#2a5a35" strokeWidth="2" fill="none" /><ellipse cx="20" cy="20" rx="6" ry="13" stroke="#2a5a35" strokeWidth="2" fill="none" /><line x1="7" y1="20" x2="33" y2="20" stroke="#2a5a35" strokeWidth="2" /></svg>
              </div>
              <p className="hc-desc">Your personal feed, posts, and everything that defines your journey here.</p>
            </a>
            <Link to="/teacher/tuition" className="hero-card">
              <div className="hc-num">2</div>
              <div className="hc-title">Tuition</div>
              <div className="hc-icon" style={{ background: "#d6e89a" }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="8" y="11" width="24" height="17" rx="2" stroke="#3a5a10" strokeWidth="2" fill="none" /><line x1="20" y1="11" x2="20" y2="28" stroke="#3a5a10" strokeWidth="1.5" /><path d="M17 6 L20 2 L23 6" stroke="#3a5a10" strokeWidth="1.5" fill="none" /><line x1="20" y1="2" x2="20" y2="11" stroke="#3a5a10" strokeWidth="1.5" /></svg>
              </div>
              <p className="hc-desc">Create and manage tuition classes, schedules, and learning materials.</p>
            </Link>
            <Link to="/teacher/communities" className="hero-card">
              <div className="hc-num">3</div>
              <div className="hc-title">Community</div>
              <div className="hc-icon" style={{ background: "#b8d4a8" }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="13" cy="16" r="5" stroke="#1e4a28" strokeWidth="2" fill="none" /><circle cx="27" cy="16" r="5" stroke="#1e4a28" strokeWidth="2" fill="none" /><circle cx="20" cy="27" r="5" stroke="#1e4a28" strokeWidth="2" fill="none" /><line x1="18" y1="16" x2="22" y2="16" stroke="#1e4a28" strokeWidth="1.5" /><line x1="15" y1="20" x2="18" y2="24" stroke="#1e4a28" strokeWidth="1.5" /><line x1="25" y1="20" x2="22" y2="24" stroke="#1e4a28" strokeWidth="1.5" /></svg>
              </div>
              <p className="hc-desc">Connect with peers and educators. Share, learn, and grow together.</p>
            </Link>
          </div>
        </div>
        <div className="scroll-hint"><span>Scroll</span><div className="scroll-arrow" /></div>
      </section>

      {/* FEED — reusable component */}
      <div ref={feedRef}>
        <Feed
          user={mockUser}
          navigatePrefix="/teacher"
          refreshToken={refreshToken}
        />
      </div>
    </TeacherLayout>
  );
}
