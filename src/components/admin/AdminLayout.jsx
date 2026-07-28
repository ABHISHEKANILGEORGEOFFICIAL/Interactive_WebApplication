import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const titleMap = {
  "/admin/home": "Admin Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/teachers": "Teachers",
  "/admin/students": "Students",
  "/admin/classes": "Classes",
  "/admin/states": "States",
  "/admin/districts": "Districts",
  "/admin/schools": "Schools",
  "/admin/colleges": "Colleges",
  "/admin/courses": "Courses",
  "/admin/course": "Course Detail",
  "/admin/departments": "Streams",
  "/admin/subjects": "Subjects",
};

export default function AdminLayout({ title, children }) {
  const location = useLocation();
  const [showCreateMenu, setShowCreateMenu] = useState(true);

  const resolvedTitle = useMemo(() => {
    if (title) return title;
    const exact = titleMap[location.pathname];
    if (exact) return exact;
    if (location.pathname.startsWith("/admin/course/")) return "Course Detail";
    return "Admin";
  }, [title, location.pathname]);

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "#071b14", overflowX: "hidden" }}>
      <AdminSidebar showCreateMenu={showCreateMenu} onToggleCreate={() => setShowCreateMenu((p) => !p)} />

      <div style={{ flex: 1, minWidth: 0, minHeight: "100vh", background: "#071b14", display: "flex", flexDirection: "column" }}>
        <AdminHeader title={resolvedTitle} />
        <main style={{ padding: "24px", width: "100%", boxSizing: "border-box", overflowX: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
