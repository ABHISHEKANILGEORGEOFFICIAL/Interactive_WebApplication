import { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSectionTitle from "../../components/admin/AdminSectionTitle";
import AdminEmptyState from "../../components/admin/AdminEmptyState";

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.teachers)) return data.teachers;
  return [];
};

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await API.get("teachers/");
        setTeachers(normalizeList(res.data));
        setError("");
      } catch {
        setTeachers([]);
        setError("Teacher endpoint is not available yet.");
      }
    };

    fetchTeachers();
  }, []);

  return (
    <AdminLayout>
      <AdminSectionTitle title="Teachers" />
      {error && <div style={{ color: "#fca5a5", marginBottom: 12 }}>{error}</div>}
      {teachers.length === 0 ? (
        <AdminEmptyState message="No teachers found" />
      ) : (
        <div style={{ background: "rgba(10,28,16,0.9)", border: "1px solid rgba(25,158,115,0.24)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Department</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={tdStyle}>{t.name || "-"}</td>
                  <td style={tdStyle}>{t.email || "-"}</td>
                  <td style={tdStyle}>{t.department_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

const thStyle = { textAlign: "left", padding: "16px 18px", color: "#F5C518", fontSize: 14 };
const tdStyle = { padding: "14px 18px", fontSize: 14, color: "#f3f4f6" };
