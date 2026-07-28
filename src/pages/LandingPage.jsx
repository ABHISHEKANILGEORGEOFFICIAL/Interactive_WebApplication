import { Link } from "react-router-dom";
import { useRef, useEffect } from "react";
import sahabg2 from "../assets/sahabg2.mp4";
import logo from "../assets/logo.png"; // ← make sure your logo is imported here

export default function LandingPage() {
  const cardRef = useRef(null);

  /* 3D TILT */
  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = -(y - rect.height / 2) / 30;
    const rotateY = (x - rect.width / 2) / 30;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  };

  const resetTilt = () => {
    cardRef.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  useEffect(() => {
    const card = cardRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.style.opacity = "1";
          card.style.transform =
            "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(20px)";
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);



  return (
    <div className="relative overflow-x-hidden font-sans">

      {/* FULL PAGE VIDEO */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none", overflow: "hidden",
        background: "#06261C"
      }}>
        <video autoPlay muted loop playsInline style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          minWidth: "100%", minHeight: "100%",
          width: "auto", height: "auto", objectFit: "cover",
          filter: "saturate(1.18) brightness(0.75) contrast(1.05)",
          pointerEvents: "none"
        }}>
          <source src={sahabg2} type="video/mp4" />
        </video>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(13,117,87,0.45))"
        }} />
      </div>

      {/* HERO SECTION */}
      <section style={{
        position: "relative", zIndex: 10, height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          className="p-10 rounded-[28px] border border-white/20 text-center"
          style={{
            opacity: 1,
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            transition: "transform 0.3s ease",
            willChange: "transform",
            width: "min(480px, 88vw)",
            color: "white",
          }}
        >
          {/* Badge */}
          <div className="inline-block mb-4 px-4 py-1 rounded-full text-sm border border-white/30 bg-white/10" style={{ color: "white" }}>
            🔒 Trusted Learning Space
          </div>

          {/* Logo + SAHA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
            <img
              src={logo}
              alt="SAHA logo"
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                animation: "logoBob 4s ease-in-out infinite",
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 4 }}>
              {["S","A","H","A"].map((letter, i) => (
                <span key={i} style={{
                  display: "inline-block",
                  fontFamily: "'Arial Black','Arial Bold',sans-serif",
                  fontSize: "clamp(20px, 18vw, 32px)",
                  fontWeight: 900,
                  background: "linear-gradient(145deg,#fffbe0 0%,#ffe566 10%,#f5c518 22%,#e8a000 38%,#f5c518 52%,#ffe566 65%,#f5d020 78%,#c88000 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "logoBob 4s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}>
                  {letter}
                </span>
              ))}
            </div>
          </div>


          <p style={{ color: "white", fontSize: 18, marginBottom: 24 }}>
            A safe space to learn, teach &amp; grow together.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center mb-6">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105"
              style={{ background: "#F5C518", color: "#444" }}
            >
              Get Started →
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-full font-semibold border border-white text-white transition-transform hover:scale-105 hover:bg-white/10"
            >
              Login
            </Link>
          </div>

          {/* Trust Row */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            <span>🔒 Verified</span>
            <span>🛡 Safe</span>
            <span>🎓 Learning</span>
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section
        className="relative z-10 py-28 px-5 text-white rounded-t-[30px]"
        style={{
          marginTop: "-40px",
          background: "linear-gradient(180deg, #0f2820, #0d7557)",
          animation: "feedFloat 4s ease-in-out infinite",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="absolute pointer-events-none"
          style={{
            top: "-40px", left: "50%", transform: "translateX(-50%)",
            width: "60%", height: "80px",
            background: "radial-gradient(ellipse, rgba(245,197,24,0.25), transparent 70%)",
            filter: "blur(40px)", zIndex: -1,
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-30 rounded-sm"
          style={{ background: "linear-gradient(90deg, #F5C518, #fff)" }}
        />
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>Why Saha?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, maxWidth: 560, margin: "0 auto", textAlign: "center", lineHeight: 1.7 }}>
          We built Saha to create a trustworthy learning space where students and
          teachers connect safely and meaningfully.
        </p>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-10" style={{ background: "#0d7557" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {[
            { icon: "👥", title: "Closed Community", desc: "Only verified users allowed." },
            { icon: "🔒", title: "Safe & Private",   desc: "Your identity is protected." },
            { icon: "🎓", title: "Learn Together",   desc: "Collaborate and grow." },
            { icon: "✨", title: "Built for Education", desc: "Made for real learning." },
          ].map(({ icon, title, desc }) => (
            <div key={title}
              className="rounded-[20px] p-6 text-white transition-transform duration-300 hover:-translate-y-2.5 cursor-default"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <span className="text-3xl block mb-3">{icon}</span>
              <h3 className="text-lg font-semibold mb-1">{title}</h3>
              <p className="text-white/70 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS SECTION */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 py-10 px-10 text-center text-white"
        style={{ background: "#062d22" }}
      >
        {["✨ 100% Verified","👥 Community","🔒 Secure","💛 Trusted"].map((stat) => (
          <div key={stat} className="py-4 text-lg font-medium">{stat}</div>
        ))}
      </section>

      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes feedFloat {
          0%, 100% { transform: translateY(0);      box-shadow: 0 -10px 40px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.25); }
          50%       { transform: translateY(-10px); box-shadow: 0 -20px 60px rgba(0,0,0,0.4), 0 30px 80px rgba(0,0,0,0.35), 0 0 40px rgba(245,197,24,0.12); }
        }
        @keyframes logoBob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-6px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}