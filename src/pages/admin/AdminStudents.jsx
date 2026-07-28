import { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSectionTitle from "../../components/admin/AdminSectionTitle";
import AdminEmptyState from "../../components/admin/AdminEmptyState";

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.students)) return data.students;
  return [];
};

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get("students/");
        setStudents(normalizeList(res.data));
        setError("");
      } catch {
        setStudents([]);
        setError("Student endpoint is not available yet.");
      }
    };
    fetchStudents();
  }, []);

  return (
    <AdminLayout>
      <AdminSectionTitle title="Students" />
      {error && <div style={{ color: "#fca5a5", marginBottom: 12 }}>{error}</div>}
      {students.length === 0 ? (
        <AdminEmptyState message="No students found" />
      ) : (
        <div style={{ background: "rgba(10,28,16,0.9)", border: "1px solid rgba(25,158,115,0.24)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Class</th>
                <th style={thStyle}>School/College</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={tdStyle}>{s.email || "-"}</td>
                  <td style={tdStyle}>{s.gender || "-"}</td>
                  <td style={tdStyle}>{s.class_name || "-"}</td>
                  <td style={tdStyle}>{s.school_name || s.college_name || "-"}</td>
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
