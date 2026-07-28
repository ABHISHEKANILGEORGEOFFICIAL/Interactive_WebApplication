import { useEffect, useMemo, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [collegeName, setCollegeName] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter districts based on selected state
  const filteredDistricts = useMemo(() => {
    if (!stateId) return [];
    return districts.filter(d => String(d.state) === String(stateId));
  }, [districts, stateId]);

  // Fetch all data
  const fetchData = async () => {
    try {
      const [colRes, stateRes, distRes] = await Promise.all([
        API.get("colleges/"),
        API.get("states/"),
        API.get("districts/")
      ]);
      setColleges(colRes.data);
      setStates(stateRes.data);
      setDistricts(distRes.data);
    } catch {
      setError("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setCollegeName("");
    setStateId("");
    setDistrictId("");
    setEditingId(null);
  };

  // Submit (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!collegeName || !stateId || !districtId) {
      setError("All fields are required");
      return;
    }

    const payload = {
      college_name: collegeName,
      state: stateId,
      district: districtId
    };

    try {
      if (editingId) {
        await API.put(`colleges/${editingId}/`, payload);
        setSuccess("College updated successfully");
      } else {
        await API.post("colleges/", payload);
        setSuccess("College added successfully");
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError("Error saving college");
    }
  };

  // Edit
  const handleEdit = (college) => {
    setEditingId(college.id);
    setCollegeName(college.college_name);
    setStateId(String(college.state));
    setDistrictId(String(college.district));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this college?")) return;
    try {
      await API.delete(`colleges/${id}/`);
      setSuccess("Deleted successfully");
      fetchData();
    } catch {
      setError("Delete failed");
    }
  };

  return (
    <AdminLayout title="Colleges">

      {/* FORM */}
      <div style={card}>
        <h2 style={title}>{editingId ? "Edit College" : "Add College"}</h2>

        <form onSubmit={handleSubmit} style={form}>
          <input
            type="text"
            placeholder="Enter college name"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            style={input}
          />

          <select
            value={stateId}
            onChange={(e) => {
              setStateId(e.target.value);
              setDistrictId("");
            }}
            style={input}
          >
            <option value="">Select State</option>
            {states.map(s => (
              <option key={s.id} value={s.id}>
                {s.statename}
              </option>
            ))}
          </select>

          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            style={input}
            disabled={!stateId}
          >
            <option value="">
              {stateId ? "Select District" : "Choose state first"}
            </option>
            {filteredDistricts.map(d => (
              <option key={d.id} value={d.id}>
                {d.district_name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={button}>
              {editingId ? "Update College" : "Add College"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={cancelBtn}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}
      </div>

      {/* TABLE */}
      <div style={card}>
        <h2 style={title}>All Colleges</h2>

        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>College</th>
              <th style={th}>State</th>
              <th style={th}>District</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {colleges.map(c => (
              <tr key={c.id}>
                <td style={td}>{c.id}</td>
                <td style={td}>{c.college_name}</td>
                <td style={td}>{c.state_name}</td>
                <td style={td}>{c.district_name}</td>
                <td style={td}>
                  <button style={editBtn} onClick={() => handleEdit(c)}>Edit</button>
                  <button style={deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

/* 🎨 STYLES */

const card = {
  background: "#071912",
  padding: 24,
  borderRadius: 18,
  marginBottom: 24,
  border: "1px solid rgba(255,255,255,0.1)"
};

const title = {
  color: "#f5c518",
  marginBottom: 16
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  maxWidth: 500
};

const input = {
  padding: 14,
  borderRadius: 10,
  border: "none",
  background: "#eee"
};

const button = {
  background: "#f5c518",
  color: "#111",
  padding: "12px 16px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const cancelBtn = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #fff",
  padding: "12px 16px",
  borderRadius: 10
};

const editBtn = {
  background: "#f5c518",
  color: "#111",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
  marginRight: 8
};

const deleteBtn = {
  background: "#ff5c5c",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8
};

const th = {
  color: "#f5c518",
  textAlign: "left",
  padding: 10
};

const td = {
  color: "#fff",
  padding: 10
};

const errorText = { color: "red" };
const successText = { color: "lightgreen" };
