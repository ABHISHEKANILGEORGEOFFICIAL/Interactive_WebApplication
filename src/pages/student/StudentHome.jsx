import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../../components/student/StudentLayout";
import Feed from "../../components/teacher/Feed";
import API from "../../api";
import LogoutPopup from "../LogoutPopup";
/* 🔥 SAME STYLE AS TEACHER */
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
    line-height:1.1; margin-bottom:12px;
  }
  .hero-sub { font-size:15px; color:rgba(210,240,215,0.7); margin-bottom:44px; max-width:440px; line-height:1.6; }

  .hero-cards {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:16px;
    width:100%;
    max-width:860px;
    margin-bottom:40px;
  }

  .hero-card {
    background:rgba(8,30,18,0.82);
    border:1px solid rgba(120,200,145,0.22);
    border-radius:22px;
    padding:28px 22px 24px;
    display:flex;
    flex-direction:column;
    align-items:center;
    cursor:pointer;
    text-decoration:none;
    transition:all .2s;
    position:relative;
  }

  .hero-card:hover {
    transform:translateY(-5px);
    border-color:rgba(245,197,24,0.42);
  }

  .hc-num {
    width:28px;
    height:28px;
    border-radius:50%;
    border:1px solid rgba(180,220,170,0.35);
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:12px;
    margin-bottom:14px;
  }

  .hc-title {
    font-size:20px;
    font-style:italic;
    margin-bottom:14px;
    color:#eaf0e2;
  }

  .hc-icon {
    width:80px;
    height:80px;
    border-radius:18px;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-bottom:14px;
  }

  .hc-desc {
    font-size:12px;
    color:var(--muted);
    text-align:center;
  }

  @media(max-width:800px){
    .hero-cards { grid-template-columns:1fr; }
  }
`;

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function StudentHome() {
  const [ddOpen, setDdOpen] = useState(false);
  const [user, setUser] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get("profile/");
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const avatarDisplay = user?.fullName?.charAt(0).toUpperCase() || "S";

  /* inject teacher style */
  useEffect(() => {
    const id = "hero-style";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = HERO_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const scrollToFeed = (e) => {
    e.preventDefault();
    feedRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!user) return <div style={{ color: "white" }}>Loading...</div>;

  return (
    <StudentLayout
      user={{ ...user, avatarDisplay }}
      ddOpen={ddOpen}
      onToggle={setDdOpen}
    >
      <section className="hero-section">
        <div className="hero-ui">

          {/* SAME HEADER STYLE */}
          <div style={{
            display: "flex",
            gap: 6,
            background: "rgba(245,197,24,0.22)",
            border: "1.5px solid rgba(245,197,24,0.5)",
            borderRadius: 99,
            padding: "7px 18px",
            fontSize: 12,
            fontWeight: 800,
            color: "#059669",
            marginBottom: 22
          }}>
            <StarIcon />
            <span>Welcome back, {user.fullName}</span>
          </div>

          <p className="hero-sub">
            Explore posts, notes, and stay connected with your learning journey.
          </p>

          {/* SAME CARDS */}
          <div className="hero-cards">

            <a href="#" className="hero-card" onClick={scrollToFeed}>
              <div className="hc-num">1</div>
              <div className="hc-title">My World</div>
              <div className="hc-icon" style={{ background: "#a8d8b0" }}>🌍</div>
              <p className="hc-desc">
                Your personal feed, posts, and everything you follow.
              </p>
            </a>

            <Link to="/student/tuition" className="hero-card">
              <div className="hc-num">2</div>
              <div className="hc-title">Tuition</div>
              <div className="hc-icon" style={{ background: "#d6e89a" }}>📚</div>
              <p className="hc-desc">
                View and join tuition classes assigned to you.
              </p>
            </Link>

            <Link to="/student/communities" className="hero-card">
              <div className="hc-num">3</div>
              <div className="hc-title">Community</div>
              <div className="hc-icon" style={{ background: "#b8d4a8" }}>👥</div>
              <p className="hc-desc">
                Connect, share, and learn with your community.
              </p>
            </Link>

          </div>
        </div>
      </section>

      {/* SAME FEED */}
      <div ref={feedRef}>
        <Feed user={user} navigatePrefix="/student" />
      </div>

    </StudentLayout>
  );
}