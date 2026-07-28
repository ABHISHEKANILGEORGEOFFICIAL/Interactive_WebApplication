import sahabg2 from "../assets/sahabg2.mp4";

export default function LogoutPopup({ onClose }) {

  const handleLogout = () => {
    localStorage.clear();

    // 🔥 guaranteed redirect
    window.location.href = "/login";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >

      {/* OVERLAY */}
      <div
        onClick={onClose}   // 👈 click outside closes popup
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)"
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            minWidth: "100%",
            minHeight: "100%",
            objectFit: "cover",
            opacity: 0.3
          }}
        >
          <source src={sahabg2} type="video/mp4" />
        </video>
      </div>

      {/* MODAL */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "min(350px, 90vw)",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 28,
          padding: "30px",
          color: "white",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)"
        }}
      >
        <h2 style={{ marginBottom: 10 }}>Logout</h2>

        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Are you sure you want to logout?
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 25 }}>

          {/* NO BUTTON */}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.3)",
              background: "transparent",
              color: "white",
              cursor: "pointer"
            }}
          >
            No
          </button>

          {/* YES LOGOUT */}
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 999,
              border: "none",
              background: "#F5C518",
              color: "#1a1a1a",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Yes, Logout
          </button>

        </div>
      </div>
    </div>
  );
}