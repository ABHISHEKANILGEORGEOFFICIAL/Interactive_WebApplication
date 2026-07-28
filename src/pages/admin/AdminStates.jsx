import { useEffect, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTableActions from "../../components/admin/AdminTableActions";

const card = { background: "rgba(7, 25, 18, 0.96)", border: "1px solid rgba(245, 197, 24, 0.14)", borderRadius: 20, padding: 24, marginBottom: 24 };
const input = { padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "#0b1f18", color: "#fff", fontSize: 15 };
const btn = { padding: "12px 16px", border: "none", borderRadius: 12, background: "#f5c518", color: "#111", fontWeight: 700, cursor: "pointer" };

export default function AdminStates() {
  const [states, setStates] = useState([]);
  const [statename, setStatename] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStates = async () => {
    try {
      const res = await API.get("states/");
      setStates(toList(res.data));
    } catch (error) {
      setStates([]);
      setError(getApiErrorMessage(error, "Failed to load states."));
    }
  };

  useEffect(() => { fetchStates(); }, []);

  const resetForm = () => { setStatename(""); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!statename.trim()) return setError("State name is required.");

    try {
      if (editingId) {
        await API.put(`states/${editingId}/`, { statename });
        setSuccess("State updated.");
      } else {
        await API.post("states/", { statename });
        setSuccess("State added.");
      }
      resetForm();
      fetchStates();
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to save state."));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this state?")) return;
    try {
      await API.delete(`states/${id}/`);
      setSuccess("State deleted.");
      fetchStates();
    } catch (error) {
      setError(getApiErrorMessage(error, "Delete failed."));
    }
  };

  return (
    <AdminLayout title="States">
      <div style={card}>
        <h2 style={{ marginTop: 0, color: "#f5c518" }}>{editingId ? "Edit State" : "Add State"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 500 }}>
          <input id="state_name" name="state_name" value={statename} onChange={(e) => setStatename(e.target.value)} placeholder="Enter state name" style={input} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={btn}>{editingId ? "Update State" : "Add State"}</button>
            {editingId && <button type="button" onClick={resetForm} style={{ ...btn, background: "transparent", color: "#fff", border: "1px solid #fff" }}>Cancel</button>}
          </div>
        </form>
        {error && <p style={{ color: "#ff8a8a" }}>{error}</p>}
        {success && <p style={{ color: "#7CFC98" }}>{success}</p>}
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, color: "#f5c518" }}>All States</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>ID</th><th style={th}>State Name</th><th style={th}>Actions</th></tr></thead>
          <tbody>
            {states.length ? states.map((s) => (
              <tr key={s.id}>
                <td style={td}>{s.id}</td>
                <td style={td}>{s.statename || s.state_name || s.name}</td>
                <td style={td}><AdminTableActions onEdit={() => { setEditingId(s.id); setStatename(s.statename || s.state_name || s.name || ""); }} onDelete={() => handleDelete(s.id)} /></td>
              </tr>
            )) : <tr><td style={td} colSpan="3">No states found</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const th = { textAlign: "left", padding: 12, color: "#f5c518", borderBottom: "1px solid rgba(255,255,255,0.12)" };
const td = { padding: 12, color: "#e8ece9", borderBottom: "1px solid rgba(255,255,255,0.08)" };
