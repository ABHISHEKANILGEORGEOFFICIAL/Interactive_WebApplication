import { useEffect, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTableActions from "../../components/admin/AdminTableActions";

export default function AdminCollegeDepartments() {
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [name, setName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [dRes, cRes] = await Promise.all([API.get("departments/"), API.get("colleges/")]);
      setDepartments(toList(dRes.data));
      setColleges(toList(cRes.data));
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load data."));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setName(""); setCollegeId(""); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) return setError("Department name is required.");

    const payload = {
      department_name: name,
      ...(collegeId ? { college: Number(collegeId) } : {}),
    };

    try {
      if (editingId) {
        await API.put(`departments/${editingId}/`, payload);
        setSuccess("Department updated.");
      } else {
        await API.post("departments/", payload);
        setSuccess("Department added.");
      }
      resetForm();
      fetchData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Save failed. Please check the details."));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await API.delete(`departments/${id}/`);
      setSuccess("Department deleted.");
      fetchData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Delete failed."));
    }
  };

  const getCollegeName = (dept) => {
    const id = dept.college || dept.college_id;
    if (!id) return "-";
    const found = colleges.find((c) => c.id === id);
    return found ? found.college_name || found.name : id;
  };

  return (
    <AdminLayout title="College Departments">
      <div style={card}>
        <h2 style={title}>{editingId ? "Edit Department" : "Add Department"}</h2>
        <form onSubmit={handleSubmit} style={form}>
          <input
            type="text"
            id="department_name"
            name="department_name"
            placeholder="Enter department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />
          <select id="college" name="college" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} style={input}>
            <option value="">Select College (optional)</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.college_name || c.name}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={button}>{editingId ? "Update Department" : "Add Department"}</button>
            {editingId && (
              <button type="button" onClick={resetForm} style={cancelBtn}>Cancel</button>
            )}
          </div>
        </form>
        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}
      </div>

      <div style={card}>
        <h2 style={title}>All Departments</h2>
        {departments.length === 0 ? (
          <p style={{ color: "#aaa" }}>No departments added yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Department Name</th>
                <th style={th}>College</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td style={td}>{dept.id}</td>
                  <td style={td}>{dept.department_name || dept.departmentname || dept.name}</td>
                  <td style={td}>{getCollegeName(dept)}</td>
                  <td style={td}>
                    <AdminTableActions
                      onEdit={() => {
                        setEditingId(dept.id);
                        setName(dept.department_name || dept.departmentname || dept.name || "");
                        setCollegeId(String(dept.college || dept.college_id || ""));
                      }}
                      onDelete={() => handleDelete(dept.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

const card = { background: "#071912", padding: 24, borderRadius: 18, marginBottom: 24, border: "1px solid rgba(255,255,255,0.1)" };
const title = { color: "#f5c518", marginBottom: 16 };
const form = { display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 };
const input = { padding: 14, borderRadius: 10, border: "none", background: "#eee" };
const button = { background: "#f5c518", color: "#111", padding: "12px 16px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
const cancelBtn = { background: "transparent", color: "#fff", border: "1px solid #fff", padding: "12px 16px", borderRadius: 10, cursor: "pointer" };
const th = { color: "#f5c518", textAlign: "left", padding: 10 };
const td = { color: "#fff", padding: 10 };
const errorText = { color: "red", marginTop: 12 };
const successText = { color: "lightgreen", marginTop: 12 };
