import { useEffect, useState } from "react";
import API, { getApiErrorMessage } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTableActions from "../../components/admin/AdminTableActions";

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const extractChoiceOptions = (payload) => {
  const actions = payload?.actions || {};
  const streamField =
    actions?.POST?.stream_name ||
    actions?.PUT?.stream_name ||
    actions?.PATCH?.stream_name;
  const rawChoices = streamField?.choices;

  if (Array.isArray(rawChoices)) {
    return rawChoices
      .map((choice) => {
        if (typeof choice === "object" && choice !== null) {
          const value = String(choice.value ?? choice.key ?? "").trim();
          const label = String(choice.display_name ?? choice.label ?? value).trim();
          return value ? { value, label } : null;
        }
        const value = String(choice ?? "").trim();
        return value ? { value, label: value } : null;
      })
      .filter(Boolean);
  }

  if (rawChoices && typeof rawChoices === "object") {
    return Object.entries(rawChoices)
      .map(([value, label]) => ({ value: String(value), label: String(label) }))
      .filter((item) => item.value.trim());
  }

  return [];
};

export default function AdminStreams() {
  const [streams, setStreams] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [streamChoices, setStreamChoices] = useState([]);

  const [streamName, setStreamName] = useState("");
  const [classId, setClassId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setError("");
    try {
      const [stRes, clRes, optionsRes] = await Promise.allSettled([
        API.get("streams/"),
        API.get("classes/"),
        API.options("streams/"),
      ]);

      if (stRes.status === "fulfilled") {
        setStreams(normalizeList(stRes.value.data));
      } else {
        setStreams([]);
        setError(getApiErrorMessage(stRes.reason, "Failed to load streams."));
      }

      if (clRes.status === "fulfilled") {
        const classes = normalizeList(clRes.value.data).filter(
          (c) => String(c.type || "").toLowerCase() === "school"
        );
        setClassesList(classes);
      } else {
        setClassesList([]);
      }

      if (optionsRes.status === "fulfilled") {
        const choices = extractChoiceOptions(optionsRes.value.data);
        if (choices.length) setStreamChoices(choices);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load stream data."));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setStreamName("");
    setClassId("");
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!streamName.trim()) return setError("Stream name is required.");
    if (!classId) return setError("Please select a class.");

    // Send stream_name exactly as the backend choice key (e.g. "science", "biology")
    // Never transform it — BIOLOGY error was caused by uppercasing a lowercase choice key
    const payload = {
      stream_name: streamName,
      school_class: Number(classId),
    };

    try {
      if (editingId) {
        const res = await API.put(`streams/${editingId}/`, payload);
        setStreams((prev) =>
          prev.map((x) => (x.id === editingId ? res.data : x))
        );
        setSuccess("Stream updated.");
      } else {
        const res = await API.post("streams/", payload);
        setStreams((prev) => [res.data, ...prev]);
        setSuccess("Stream added.");
      }
      resetForm();
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Save failed."));
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setStreamName(s.stream_name || "");
    setClassId(String(s.school_class || s.school_class_id || ""));
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this stream?")) return;
    try {
      await API.delete(`streams/${id}/`);
      setSuccess("Stream deleted.");
      fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Delete failed."));
    }
  };

  return (
    <AdminLayout title="Streams">
      <div style={card}>
        <h3 style={title}>{editingId ? "Edit Stream" : "Add Stream"}</h3>
        <form onSubmit={handleSubmit} style={form}>

          <div>
            <label htmlFor="stream_name" style={label}>Stream Name *</label>
            {streamChoices.length ? (
              <select
                id="stream_name"
                name="stream_name"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                style={input}
                autoComplete="off"
              >
                <option value="">Select Stream</option>
                {streamChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="stream_name"
                name="stream_name"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="e.g. science"
                style={input}
                autoComplete="off"
              />
            )}
          </div>

          <div>
            <label htmlFor="school_class" style={label}>Class *</label>
            <select
              id="school_class"
              name="school_class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              style={input}
              autoComplete="off"
            >
              <option value="">Select Class</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name || c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={button}>{editingId ? "Update" : "Add"}</button>
            {editingId && (
              <button type="button" onClick={resetForm} style={cancelBtn}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}
      </div>

      <div style={card}>
        <h3 style={title}>All Streams</h3>
        {streams.length === 0 ? (
          <p style={{ color: "#aaa" }}>No streams found</p>
        ) : (
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Stream</th>
                <th style={th}>Class</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {streams.map((s) => {
                const matchedClass = classesList.find(
                  (c) => String(c.id) === String(s.school_class || s.school_class_id)
                );
                return (
                  <tr key={s.id}>
                    <td style={td}>{s.id}</td>
                    <td style={td}>{s.stream_name || s.name}</td>
                    <td style={td}>
                      {s.school_class_name || matchedClass?.class_name || matchedClass?.name || s.school_class || "—"}
                    </td>
                    <td style={td}>
                      <AdminTableActions
                        onEdit={() => handleEdit(s)}
                        onDelete={() => handleDelete(s.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

const card = { background: "#071912", padding: 24, borderRadius: 18, marginBottom: 24, border: "1px solid rgba(255,255,255,0.1)" };
const title = { color: "#f5c518", marginBottom: 16 };
const form = { display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 };
const label = { display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 };
const input = { width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#eee", boxSizing: "border-box" };
const button = { background: "#f5c518", color: "#111", padding: "12px 16px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 };
const cancelBtn = { background: "transparent", color: "#fff", border: "1px solid #fff", padding: "12px 16px", borderRadius: 10, cursor: "pointer" };
const th = { color: "#f5c518", textAlign: "left", padding: 10 };
const td = { color: "#fff", padding: 10 };
const errorText = { color: "red", marginTop: 12 };
const successText = { color: "lightgreen", marginTop: 12 };
