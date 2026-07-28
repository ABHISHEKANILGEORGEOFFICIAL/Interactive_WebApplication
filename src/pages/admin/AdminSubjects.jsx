import { useEffect, useMemo, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTableActions from "../../components/admin/AdminTableActions";

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [streams, setStreams] = useState([]);

  const [name, setName] = useState("");
  const [type, setType] = useState("school");
  const [departmentId, setDepartmentId] = useState("");
  const [classId, setClassId] = useState("");
  const [streamId, setStreamId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedClass = classesList.find((c) => String(c.id) === String(classId));
  const classLabel = String(selectedClass?.class_name || "").toLowerCase();
  const needsStream = type === "school" && (classLabel.includes("11") || classLabel.includes("12"));

  const streamOptions = useMemo(() => {
    const scoped = streams.filter((s) => {
      const okClass = !classId || String(s.school_class || s.school_class_id || "") === String(classId);
      return okClass;
    });
    return scoped.length ? scoped : streams;
  }, [streams, classId]);

  const fetchData = async () => {
    try {
      const [subRes, depRes, clsRes, strRes] = await Promise.all([
        API.get("subjects/"),
        API.get("departments/"),
        API.get("classes/"),
        API.get("streams/"),
      ]);
      setSubjects(toList(subRes.data));
      setDepartments(toList(depRes.data));
      setClassesList(toList(clsRes.data).filter((c) => String(c.type || "").toLowerCase() === "school"));
      setStreams(toList(strRes.data));
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load subject data."));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setName("");
    setType("school");
    setDepartmentId("");
    setClassId("");
    setStreamId("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !type) return setError("Subject name and type are required.");
    if (type === "college" && !departmentId) return setError("Select department for college subject.");
    if (type === "school" && needsStream && classId && !streamId) return setError("Select stream for 11th/12th school subject.");

    const payload = {
      subject_name: name,
      type,
      school_class: type === "school" && classId ? Number(classId) : undefined,
      stream: type === "school" && needsStream && streamId ? Number(streamId) : undefined,
      department: type === "college" ? Number(departmentId) : undefined,
    };

    try {
      if (editingId) {
        await API.put(`subjects/${editingId}/`, payload);
        setSuccess("Subject updated.");
      } else {
        await API.post("subjects/", payload);
        setSuccess("Subject added.");
      }
      resetForm();
      fetchData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Error saving subject."));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await API.delete(`subjects/${id}/`);
      setSuccess("Subject deleted.");
      fetchData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Delete failed."));
    }
  };

  return (
    <AdminLayout title="Subjects">
      <div style={card}>
        <h3 style={title}>{editingId ? "Edit Subject" : "Add Subject"}</h3>

        <form onSubmit={handleSubmit} style={form}>
          <input id="subject_name" name="subject_name" type="text" placeholder="Enter subject name" value={name} onChange={(e) => setName(e.target.value)} style={input} />

          <select id="type" name="type" value={type} onChange={(e) => { setType(e.target.value); setDepartmentId(""); setClassId(""); setStreamId(""); }} style={input}>
            <option value="school">School</option>
            <option value="college">College</option>
          </select>

          {type === "school" && (
            <>
              <select id="school_class" name="school_class" value={classId} onChange={(e) => { setClassId(e.target.value); setStreamId(""); }} style={input}>
                <option value="">Select Class (optional)</option>
                {classesList.map((c) => <option key={c.id} value={c.id}>{c.class_name || c.name}</option>)}
              </select>
              {needsStream && (
                <select id="stream" name="stream" value={streamId} onChange={(e) => setStreamId(e.target.value)} style={input}>
                  <option value="">Select Stream</option>
                  {streamOptions.map((s) => <option key={s.id} value={s.id}>{s.stream_name || s.name}</option>)}
                </select>
              )}
            </>
          )}

          {type === "college" && (
            <select id="department" name="department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={input}>
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.department_name || d.name}</option>)}
            </select>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button style={button}>{editingId ? "Update" : "Add"}</button>
            {editingId && <button type="button" onClick={resetForm} style={cancelBtn}>Cancel</button>}
          </div>
        </form>

        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}
      </div>

      <div style={card}>
        <h3 style={title}>All Subjects</h3>

        {subjects.length === 0 ? (
          <p style={{ color: "#aaa" }}>No subjects found</p>
        ) : (
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Subject</th>
                <th style={th}>Type</th>
                <th style={th}>Scope</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td style={td}>{s.id}</td>
                  <td style={td}>{s.subject_name || s.name}</td>
                  <td style={td}>{s.type || "-"}</td>
                  <td style={td}>{s.department_name || s.stream_name || "-"}</td>
                  <td style={td}>
                    <AdminTableActions onEdit={() => { setEditingId(s.id); setName(s.subject_name || s.name || ""); setType(s.type || "school"); setDepartmentId(String(s.department || s.department_id || "")); setClassId(String(s.school_class || s.school_class_id || "")); setStreamId(String(s.stream || s.stream_id || "")); }} onDelete={() => handleDelete(s.id)} />
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
const form = { display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 };
const input = { padding: 14, borderRadius: 10, border: "none", background: "#eee" };
const button = { background: "#f5c518", color: "#111", padding: "12px 16px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
const cancelBtn = { background: "transparent", color: "#fff", border: "1px solid #fff", padding: "12px 16px", borderRadius: 10 };
const th = { color: "#f5c518", textAlign: "left", padding: 10 };
const td = { color: "#fff", padding: 10 };
const errorText = { color: "red" };
const successText = { color: "lightgreen" };
