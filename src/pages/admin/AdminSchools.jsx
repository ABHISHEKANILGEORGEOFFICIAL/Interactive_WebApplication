import { useEffect, useMemo, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTableActions from "../../components/admin/AdminTableActions";

const cardStyle = { background: "rgba(7, 25, 18, 0.96)", border: "1px solid rgba(245, 197, 24, 0.14)", borderRadius: "20px", padding: "24px", marginBottom: "24px" };
const inputStyle = { padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "#0b1f18", color: "#fff", fontSize: "15px" };
const buttonStyle = { padding: "14px 18px", border: "none", borderRadius: "12px", background: "#f5c518", color: "#111", fontWeight: "800", cursor: "pointer" };

export default function AdminSchools() {
  const [schools, setSchools] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredDistricts = useMemo(() => {
    if (!stateId) return districts;
    return districts.filter((d) => String(d.state || d.state_id) === String(stateId));
  }, [districts, stateId]);

  const fetchAll = async () => {
    try {
      const [sRes, stRes, dRes] = await Promise.all([API.get("schools/"), API.get("states/"), API.get("districts/")]);
      setSchools(toList(sRes.data));
      setStates(toList(stRes.data));
      setDistricts(toList(dRes.data));
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Failed to load data."));
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setSchoolName(""); setStateId(""); setDistrictId(""); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPageError("");
    setSuccess("");

    if (!schoolName || !stateId || !districtId) return setPageError("School, state, and district are required.");

    const payload = { school_name: schoolName, state: Number(stateId), district: Number(districtId) };
    try {
      if (editingId) {
        await API.put(`schools/${editingId}/`, payload);
        setSuccess("School updated.");
      } else {
        await API.post("schools/", payload);
        setSuccess("School added.");
      }
      resetForm();
      fetchAll();
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Save failed."));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this school?")) return;
    try {
      await API.delete(`schools/${id}/`);
      setSuccess("School deleted.");
      fetchAll();
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Delete failed."));
    }
  };

  return (
    <AdminLayout title="Schools">
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#f5c518" }}>{editingId ? "Edit School" : "Add School"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px", maxWidth: "620px" }}>
          <input id="school_name" name="school_name" type="text" placeholder="Enter school name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} style={inputStyle} />
          <select id="state" name="state" value={stateId} onChange={(e) => { setStateId(e.target.value); setDistrictId(""); }} style={inputStyle}>
            <option value="">Select State</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.statename || s.state_name || s.name}</option>)}
          </select>
          <select id="district" name="district" value={districtId} onChange={(e) => setDistrictId(e.target.value)} style={inputStyle} disabled={!stateId}>
            <option value="">{stateId ? "Select District" : "Choose state first"}</option>
            {filteredDistricts.map((d) => <option key={d.id} value={d.id}>{d.district_name || d.districtname || d.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button type="submit" style={buttonStyle}>{editingId ? "Update School" : "Add School"}</button>
            {editingId && <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>Cancel</button>}
          </div>
        </form>
        {pageError && <p style={{ color: "#ff8f8f", marginTop: "14px", fontWeight: 600 }}>{pageError}</p>}
        {success && <p style={{ color: "#7CFC98", marginTop: "14px", fontWeight: 600 }}>{success}</p>}
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#f5c518" }}>All Schools</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><th style={thStyle}>ID</th><th style={thStyle}>School</th><th style={thStyle}>State</th><th style={thStyle}>District</th><th style={thStyle}>Actions</th></tr>
          </thead>
          <tbody>
            {schools.length > 0 ? schools.map((school) => (
              <tr key={school.id}>
                <td style={tdStyle}>{school.id}</td>
                <td style={tdStyle}>{school.school_name || school.name}</td>
                <td style={tdStyle}>{school.state_name || "-"}</td>
                <td style={tdStyle}>{school.district_name || "-"}</td>
                <td style={tdStyle}><AdminTableActions onEdit={() => { setEditingId(school.id); setSchoolName(school.school_name || school.name || ""); setStateId(String(school.state || school.state_id || "")); setDistrictId(String(school.district || school.district_id || "")); }} onDelete={() => handleDelete(school.id)} /></td>
              </tr>
            )) : <tr><td style={tdStyle} colSpan="5">No schools found</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const thStyle = { textAlign: "left", padding: "14px 16px", color: "#f5c518", borderBottom: "1px solid rgba(255,255,255,0.10)", fontSize: "16px" };
const tdStyle = { padding: "18px 16px", color: "#f3f4f6", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "15px", verticalAlign: "middle" };
