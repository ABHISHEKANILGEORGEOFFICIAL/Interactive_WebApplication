import { useRef, useState } from "react";
import sahabg2 from "../../assets/sahabg2.mp4";
import TeacherHeader from "./teacherheader";
import TeacherFooter from "./teacherfooter";

export const SAHA_STYLES = `
  @keyframes logoBob {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-4px) scale(1.04); }
  }
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --y: #F5C518;
    --yd: #E0AF00;
    --yb: rgba(245,197,24,0.16);
    --em: #10b981;
    --emb: rgba(16,185,129,0.18);
    --dark: #06261C;
    --card: rgba(6,38,28,0.84);
    --border: rgba(25,158,115,0.24);
    --text: #F6F7EC;
    --muted: rgba(225,236,217,0.68);
    --font: 'Playfair Display', Georgia, serif;
    --body: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  .saha-root {
    position: relative;
    z-index: 2;
    font-family: var(--body);
    background: transparent;
    color: var(--text);
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* ── VIDEO BG ── */
  .site-video-wrap {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    background: #06261C;
    width: 100vw;
    height: 100vh;
    min-width: 100vw;
    min-height: 100vh;
  }
  .site-video-wrap video {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 100vw;
    min-height: 100vh;
    width: auto;
    height: auto;
    object-fit: cover;
    pointer-events: none;
    filter: saturate(1.18) brightness(0.82) contrast(1.05);
    transition: opacity 1.2s ease;
    will-change: opacity;
  }
  .site-video-wrap video.visible { opacity: 1; }
  .site-video-wrap video.hidden  { opacity: 0; }

  .hero-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(4,18,13,0.15) 0%, rgba(4,18,13,0.28) 42%, rgba(4,18,13,0.60) 100%),
      radial-gradient(circle at 50% 0%, rgba(245,197,24,0.10), transparent 36%),
      radial-gradient(circle at 80% 8%, rgba(16,185,129,0.16), transparent 28%);
  }

  /* ── TOPBAR ── */
  .topbar {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 220;
    width: calc(100% - 32px); max-width: 1120px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px 0 18px; height: 76px;
    background: transparent;
    border: none;
    border-radius: 28px;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
  }
  .tb-logo {
    display: flex;
    align-items: center;
    gap: 16px;
    text-decoration: none;
    color: inherit;
    animation: logoBob 2.8s infinite cubic-bezier(.77,.2,.22,.8);
    will-change: transform;
  }
  .tb-logo-mark {
    width: 72px;
    height: 72px;
    border-radius: 22px;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 4px;
    flex-shrink: 0;
    overflow: hidden;
    transition: transform .2s;
    animation: logoBob 2.8s infinite cubic-bezier(.77,.2,.22,.8);
    will-change: transform;
  }
  .tb-logo-mark:hover { transform: scale(1.06); }
  .tb-logo-mark img { width:100%; height:100%; object-fit:contain; border-radius:18px; display:block; background:transparent; }
  .tb-logo-placeholder {
    width:100%; height:100%; border-radius:15px;
    background: var(--y);
    display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:20px; color:#1a3010;
  }
  .tb-logo-name { font-family:var(--font); font-size:32px; font-style:italic; font-weight:700; color:var(--y); letter-spacing:-0.03em; line-height:1; text-shadow: 0 0 18px rgba(245,197,24,0.4); }
  .tb-logo-tag { font-size:12px; color:rgba(231,222,196,0.65); line-height:1.3; letter-spacing:0.2px; }
  .tb-right { display:flex; align-items:center; gap:10px; }
  .notif-wrap { position: relative; }
  .notif-btn {
    width:40px; height:40px; border-radius:14px;
    background: rgba(245,197,24,0.10); border: 1px solid var(--border);
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    color:var(--text); transition: background .15s, color .15s, transform .15s; padding:0;
  }
  .notif-btn:hover { background:rgba(245,197,24,0.22); color:var(--y); transform:translateY(-1px); }
  .notif-badge {
    position: absolute;
    top: -5px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    border-radius: 99px;
    background: #ff6b6b;
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    padding: 0 5px;
    line-height: 1;
  }
  .notif-panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 320px;
    max-height: 380px;
    overflow: hidden;
    background: rgba(8,23,15,0.98);
    border: 1px solid rgba(25,158,115,0.24);
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.45);
  }
  .notif-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }
  .notif-title { font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--text); }
  .notif-clear {
    border: 1px solid var(--border);
    background: rgba(245,197,24,0.08);
    color: var(--y);
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    cursor: pointer;
    font-family: var(--body);
  }
  .notif-list {
    max-height: 320px;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .notif-item {
    padding: 10px 11px;
    border-radius: 10px;
    border: 1px solid rgba(25,158,115,0.18);
    background: rgba(245,197,24,0.06);
  }
  .notif-item.is-unread {
    background: rgba(245,197,24,0.15);
    border-color: rgba(245,197,24,0.35);
  }
  .notif-text { font-size: 12px; line-height: 1.4; color: var(--text); }
  .notif-time { margin-top: 5px; font-size: 10px; color: var(--muted); }
  .notif-empty {
    padding: 16px 14px;
    font-size: 12px;
    color: var(--muted);
    text-align: center;
  }

  /* ── AVATAR / DROPDOWN ── */
  .av-btn {
    width:44px; height:44px; border-radius:16px;
    background:var(--y); display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:13px; color:#1a3010; cursor:pointer;
    border: 2px solid rgba(245,197,24,0.32); overflow:hidden; padding:0;
    font-family: var(--body);
  }
  .dropdown {
    position:absolute; top:calc(100% + 10px); right:0;
    background: rgba(8,23,15,0.98);
    border: 1px solid rgba(25,158,115,0.24);
    border-radius:16px; min-width:210px; overflow:hidden;
    transform-origin: top right;
    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
  }
  .dd-header { padding:16px 16px 12px; border-bottom:1px solid var(--border); }
  .dd-av {
    width:44px; height:44px; border-radius:50%;
    background:var(--y); display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:16px; color:#1a3010; margin-bottom:10px; overflow:hidden;
  }
  .dd-name { font-size:15px; font-weight:700; color:var(--text); }
  .dd-role { font-size:11px; color:var(--muted); margin-top:2px; }
  .dd-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; padding:10px 14px; border-bottom:1px solid var(--border); }
  .ds { text-align:center; background:rgba(245,197,24,0.12); border-radius:8px; padding:8px 4px; }
  .ds-n { font-size:18px; font-weight:800; color:var(--y); }
  .ds-l { font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }
  .dd-item {
    display:flex; align-items:center; gap:11px;
    padding:11px 16px; font-size:13px; color:var(--muted);
    cursor:pointer; transition:background .12s; text-decoration:none;
    font-family: var(--body);
  }
  .dd-item:hover { background:rgba(245,197,24,0.12); color:var(--y); }
  .dd-sep { height:1px; background:var(--border); margin:3px 0; }
  .dd-danger { color:rgba(255,130,110,0.75); }
  .dd-danger:hover { background:rgba(255,90,70,0.10); color:#ff9e8a; }

  /* ── GLASS CARD ── */
  .glass-card {
    background: rgba(10,28,16,0.88);
    border: 1px solid var(--border);
    border-radius: 20px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* ── SIDEBAR ── */
  .side-menu {
    background: rgba(8,24,16,0.92);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }
  .sm-item {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 18px; font-size: 13.5px; color: var(--muted);
    border-bottom: 1px solid rgba(25,158,115,0.12); text-decoration: none;
    background: transparent; border-left: none; border-right: none; border-top: none;
    width: 100%; text-align: left; cursor: pointer;
    transition: background .12s, color .12s; font-family: var(--body);
  }
  .sm-item:last-child { border-bottom: none; }
  .sm-item.active, .sm-item:hover { background: rgba(245,197,24,0.12); color: var(--y); font-weight: 700; }
  .sm-ic { font-size: 16px; width: 20px; text-align: center; }

  /* ── FOOTER ── */
  .saha-footer {
    position: relative; z-index: 10;
    margin-top: 32px; padding: 18px 24px; text-align: center;
    color: rgba(240,238,230,0.55);
    background: rgba(4,18,13,0.90);
    border-top: 1px solid rgba(215,178,93,0.18);
    font-size: 13px;
  }
`;

let stylesInjected = false;

export default function TeacherLayout({ user, ddOpen, onToggle, children }) {
  // Inject styles once
  if (typeof document !== "undefined" && !stylesInjected) {
    const id = "saha-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = SAHA_STYLES;
      document.head.appendChild(el);
    }
    stylesInjected = true;
  }

  const [videoSrcs] = useState([sahabg2]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fadeState, setFadeState] = useState("visible");
  const videoRef = useRef();

  const switchVideo = (idx) => {
    if (idx === currentIdx || idx >= videoSrcs.length) return;
    setFadeState("hidden");
    setTimeout(() => {
      setCurrentIdx(idx);
      setFadeState("visible");
    }, 1200);
  };

  return (
    <div className="saha-root">
      {/* Fixed video background */}
      <div className="site-video-wrap">
        <video
          ref={videoRef}
          className={fadeState === "visible" ? "visible" : "hidden"}
          autoPlay
          muted
          loop
          playsInline
          key={videoSrcs[currentIdx]}
        >
          <source src={videoSrcs[currentIdx]} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
      </div>

      <TeacherHeader user={user} ddOpen={ddOpen} onToggle={onToggle} />

      {/* Page content sits above the video */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>

      <TeacherFooter />
    </div>
  );
}