import { useState, useEffect } from "react";
import sahabg2 from "../../assets/sahabg2.mp4";
import StudentHeader from "./StudentHeader";
import TeacherFooter from "../teacher/teacherfooter";
import { SAHA_STYLES as TEACHER_SAHA_STYLES } from "../teacher/TeacherLayout";
import API from "../../api";


// ── SHARED CSS injected once ────────────────────────────────────────────────
export const SAHA_STYLES = TEACHER_SAHA_STYLES;

let stylesInjected = false;

export default function StudentLayout({ children }) {

  const [ddOpen, setDdOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // ✅ FETCH USER HERE (GLOBAL FIX)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("profile/");
        const u = res.data;

        setUserData({
          ...u,
          avatarDisplay: u.fullName?.charAt(0)?.toUpperCase() || "S"
        });
      } catch (err) {
        console.error("User fetch failed", err);
      }
    };

    fetchUser();
  }, []);

  // ✅ Inject styles once
  if (typeof document !== "undefined" && !stylesInjected) {
    const id = "saha-styles";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    if (el.textContent !== SAHA_STYLES) {
      el.textContent = SAHA_STYLES;
    }
    stylesInjected = true;
  }

  return (
    <div className="saha-root">

      {/* 🎥 Background */}
      <div className="site-video-wrap">
        <video autoPlay muted loop playsInline>
          <source src={sahabg2} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
      </div>

      {/* 🔝 HEADER (SAFE RENDER) */}
      {userData && (
        <StudentHeader
          user={userData}
          ddOpen={ddOpen}
          onToggle={setDdOpen}
        />
      )}

      {/* 📄 CONTENT */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>

      {/* 🔻 FOOTER */}
      <TeacherFooter />

    </div>
  );
}