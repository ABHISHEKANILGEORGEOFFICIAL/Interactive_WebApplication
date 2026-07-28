import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AdminHeader({ title = "Admin" }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  return (
    <>
      <div
        style={{
          height: 78,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "rgba(4, 28, 18, 0.96)",
          borderBottom: "1px solid rgba(245, 197, 24, 0.12)",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ margin: 0, color: "#f5c518", fontSize: 22, fontWeight: 800 }}>{title}</h2>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            background: "#f5c518",
            color: "#111",
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: "min(360px, 92vw)",
              background: "rgba(8,24,16,0.98)",
              border: "1px solid rgba(25,158,115,0.24)",
              borderRadius: 18,
              padding: "24px 22px",
              boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
            }}
          >
            <h3 style={{ margin: "0 0 10px", color: "#F5C518", fontSize: 20 }}>Confirm Logout</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.5 }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  background: "transparent",
                  color: "#ddd",
                  border: "1px solid rgba(255,255,255,0.16)",
                  padding: "10px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: "#F5C518",
                  color: "#111",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
