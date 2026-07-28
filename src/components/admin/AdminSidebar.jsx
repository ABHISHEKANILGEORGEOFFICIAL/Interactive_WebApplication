import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar({ showCreateMenu, onToggleCreate }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const baseItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Teachers", path: "/admin/teachers" },
    { name: "Students", path: "/admin/students" },
    { name: "Reported Posts", path: "/admin/reported-posts" },
  ];

  const createItems = [
    { name: "Classes", path: "/admin/classes" },
    { name: "States", path: "/admin/states" },
    { name: "Districts", path: "/admin/districts" },
    { name: "Schools", path: "/admin/schools" },
    { name: "Colleges", path: "/admin/colleges" },
    { name: "Streams", path: "/admin/departments" },
    { name: "Departments", path: "/admin/college-departments" },
    { name: "Subjects", path: "/admin/subjects" },
    { name: "Courses", path: "/admin/courses" },
  ];

  return (
    <aside
      style={{
        width: "260px",
        flexShrink: 0,
        background: "linear-gradient(180deg, #021b12 0%, #03150f 100%)",
        borderRight: "1px solid rgba(245, 197, 24, 0.14)",
        padding: "12px 0",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px 20px", borderBottom: "1px solid rgba(245, 197, 24, 0.12)" }}>
        <img src="/logo.png" alt="Saha" style={{ width: 54, height: 54, objectFit: "contain" }} />
        <div>
          <p style={{ margin: 0, color: "#f5c518", fontSize: "18px", fontWeight: "800" }}>Saha Admin</p>
          <p style={{ margin: "4px 0 0", color: "#d5ddd8", fontSize: "14px" }}>Control Center</p>
        </div>
      </div>

      <div style={{ padding: "18px 12px" }}>
        {baseItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "block",
              textDecoration: "none",
              color: isActive(item.path) ? "#f5c518" : "#f4f7f5",
              padding: "16px 18px",
              marginBottom: "8px",
              fontSize: "16px",
              fontWeight: "700",
              background: isActive(item.path) ? "rgba(245, 197, 24, 0.10)" : "transparent",
              borderLeft: isActive(item.path) ? "4px solid #f5c518" : "4px solid transparent",
            }}
          >
            {item.name}
          </Link>
        ))}

        <button
          onClick={onToggleCreate}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            color: "#f4f7f5",
            border: "none",
            padding: "16px 18px",
            marginBottom: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "700",
          }}
        >
          Create Data <span>{showCreateMenu ? "▾" : "▸"}</span>
        </button>

        {showCreateMenu && (
          <div style={{ marginTop: "2px", marginBottom: "8px", paddingLeft: "14px" }}>
            {createItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: isActive(item.path) ? "#f5c518" : "#c8d1cb",
                  padding: "11px 16px",
                  marginBottom: "6px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  background: isActive(item.path) ? "rgba(245, 197, 24, 0.10)" : "transparent",
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
