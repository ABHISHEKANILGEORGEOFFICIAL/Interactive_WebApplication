import { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminClasses() {
  const [classesList, setClassesList] = useState([]);
  const [className, setClassName] = useState("");
  const [type, setType] = useState("school");

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchClasses = async () => {
    try {
      const res = await API.get("classes/");
      setClassesList(res.data);
    } catch {
      setError("Failed to load classes");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const resetForm = () => {
    setClassName("");
    setType("school");
    setEditingId(null);
  };

  // CREATE + UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!className.trim()) {
      setError("Class name is required");
      return;
    }

    try {
      if (editingId) {
        await API.put(`classes/${editingId}/`, {
          class_name: className,
          type: type,
        });
        setSuccess("Class updated successfully");
      } else {
        await API.post("classes/", {
          class_name: className,
          type: type,
        });
        setSuccess("Class added successfully");
      }

      resetForm();
      fetchClasses();
    } catch {
      setError("Error saving class");
    }
  };

  // EDIT
  const handleEdit = (item) => {
    setEditingId(item.id);
    setClassName(item.class_name);
    setType(item.type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DELETE
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this class?");

    if (!confirmDelete) return;

    setError("");
    setSuccess("");

    try {
      await API.delete(`classes/${id}/`);
      setSuccess("Class deleted successfully");
      fetchClasses();
    } catch {
      setError("Error deleting class");
    }

  };

  return (
    <AdminLayout title="Classes">
      {/* FORM */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>
          {editingId ? "Edit Class" : "Add Class"}
        </h2>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="text"
            placeholder="Enter class name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            style={inputStyle}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
          >
            <option value="school">School</option>
            <option value="college">College</option>
          </select>

          <div style={btnRow}>
            <button type="submit" style={buttonStyle}>
              {editingId ? "Update Class" : "Add Class"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}
      </div>

      {/* TABLE */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>All Classes</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Class Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {classesList.length > 0 ? (
              classesList.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.id}</td>
                  <td style={tdStyle}>{item.class_name}</td>
                  <td style={tdStyle}>{item.type}</td>
                  <td style={tdStyle}>
                    <div style={actionWrapStyle}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={editButtonStyle}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        style={deleteButtonStyle}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={tdStyle} colSpan="4">
                  No classes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

/* 🎨 STYLES */

const cardStyle = {
  background: "rgba(7, 25, 18, 0.96)",
  border: "1px solid rgba(245, 197, 24, 0.14)",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "24px",
};

const sectionTitle = {
  marginTop: 0,
  color: "#f5c518",
};

const formStyle = {
  display: "grid",
  gap: "14px",
  maxWidth: "500px",
};

const inputStyle = {
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "#0b1f18",
  color: "#fff",
};

const btnRow = {
  display: "flex",
  gap: "12px",
};

const buttonStyle = {
  padding: "14px",
  border: "none",
  borderRadius: "12px",
  background: "#f5c518",
  color: "#111",
  fontWeight: "700",
  cursor: "pointer",
};

const cancelButtonStyle = {
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #fff",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
};

const actionWrapStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const editButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#f5c518",
  color: "#111",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  minWidth: "70px",
};

const deleteButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#ff5a5f",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  minWidth: "80px",
};

const errorStyle = { color: "#ff8a8a" };
const successStyle = { color: "#7CFC98" };

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const thStyle = {
  textAlign: "left",
  padding: "16px",
  color: "#f5c518",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const tdStyle = {
  padding: "16px",
  color: "#e8ece9",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};
