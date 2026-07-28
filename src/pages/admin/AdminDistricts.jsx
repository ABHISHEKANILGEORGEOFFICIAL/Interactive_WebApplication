import { useEffect, useMemo, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTableActions from "../../components/admin/AdminTableActions";

const card = { background: "rgba(7, 25, 18, 0.96)", border: "1px solid rgba(245, 197, 24, 0.14)", borderRadius: 20, padding: 24, marginBottom: 24 };
const input = { padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "#0b1f18", color: "#fff", fontSize: 15 };

export default function AdminDistricts() {
  const [districts, setDistricts] = useState([]);
  const [states, setStates] = useState([]);
  const [districtName, setDistrictName] = useState("");
  const [stateId, setStateId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [dRes, sRes] = await Promise.all([API.get("districts/"), API.get("states/")]);
      setDistricts(toList(dRes.data));
      setStates(toList(sRes.data));
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load districts/states."));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stateMap = useMemo(() => new Map(states.map((s) => [String(s.id), s.statename || s.state_name || s.name])), [states]);

  const resetForm = () => { setDistrictName(""); setStateId(""); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!districtName.trim() || !stateId) return setError("District name and state are required.");

    const payload = { district_name: districtName, state: Number(stateId) };
    try {
      if (editingId) {
        await API.put(`districts/${editingId}/`, payload);
        setSuccess("District updated.");
      } else {
        await API.post("districts/", payload);
        setSuccess("District added.");
      }
      resetForm();
      fetchData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to save district."));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this district?")) return;
    try {
      await API.delete(`districts/${id}/`);
      setSuccess("District deleted.");
      fetchData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Delete failed."));
    }
  };

  return (
    <AdminLayout title="Districts">
      <div style={card}>
        <h2 style={{ marginTop: 0, color: "#f5c518" }}>{editingId ? "Edit District" : "Add District"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 500 }}>
          <input id="district_name" name="district_name" value={districtName} onChange={(e) => setDistrictName(e.target.value)} placeholder="Enter district name" style={input} />
          <select id="state" name="state" value={stateId} onChange={(e) => setStateId(e.target.value)} style={input}>
            <option value="">Select state</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.statename || s.state_name || s.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={btn}>{editingId ? "Update District" : "Add District"}</button>
            {editingId && <button type="button" onClick={resetForm} style={{ ...btn, background: "transparent", color: "#fff", border: "1px solid #fff" }}>Cancel</button>}
          </div>
        </form>
        {error && <p style={{ color: "#ff8a8a" }}>{error}</p>}
        {success && <p style={{ color: "#7CFC98" }}>{success}</p>}
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, color: "#f5c518" }}>All Districts</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>ID</th><th style={th}>District</th><th style={th}>State</th><th style={th}>Actions</th></tr></thead>
          <tbody>
            {districts.length ? districts.map((d) => (
              <tr key={d.id}>
                <td style={td}>{d.id}</td>
                <td style={td}>{d.district_name || d.districtname || d.name}</td>
                <td style={td}>{d.state_name || stateMap.get(String(d.state)) || "-"}</td>
                <td style={td}><AdminTableActions onEdit={() => { setEditingId(d.id); setDistrictName(d.district_name || d.districtname || ""); setStateId(String(d.state || "")); }} onDelete={() => handleDelete(d.id)} /></td>
              </tr>
            )) : <tr><td style={td} colSpan="4">No districts found</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const btn = { padding: "12px 16px", border: "none", borderRadius: 12, background: "#f5c518", color: "#111", fontWeight: 700, cursor: "pointer" };
const th = { textAlign: "left", padding: 12, color: "#f5c518", borderBottom: "1px solid rgba(255,255,255,0.12)" };
const td = { padding: 12, color: "#e8ece9", borderBottom: "1px solid rgba(255,255,255,0.08)" };
