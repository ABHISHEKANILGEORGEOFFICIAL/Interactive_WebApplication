import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import TeacherLayout from "../../components/teacher/TeacherLayout";

const pageUser = {
  firstName: "Teacher",
  username: "teacher",
  fullName: "Your Name",
  role: "Teacher",
  avatarDisplay: "T",
  avatarUrl: null,
  posts: 0,
  followers: 0,
  following: 0,
};

export default function CommunityEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [status, setStatus] = useState({ success: "", error: "" });
  const [loading, setLoading] = useState(true);
  const [ddOpen, setDdOpen] = useState(false);

  useEffect(() => {
    API.get(`communities/${id}/`)
      .then((res) => {
        setCommunity(res.data);
        setForm({ name: res.data.name || "", description: res.data.description || "" });
      })
      .catch(() => setStatus({ success: "", error: "Failed to load community." }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const close = () => setDdOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ success: "", error: "" });
    try {
      await API.patch(`communities/${id}/`, form);
      setStatus({ success: "Community updated successfully.", error: "" });
      setTimeout(() => navigate(`/teacher/community/${id}`), 700);
    } catch (err) {
      const message = err.response?.data?.detail || "Unable to save changes.";
      setStatus({ success: "", error: typeof message === "string" ? message : JSON.stringify(message) });
    }
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(160,210,170,0.7)", fontSize: "14px" }}>Loading community settings…</div>;
  }

  if (!community) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5", fontSize: "14px" }}>Community not found.</div>;
  }

  return (
    <TeacherLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "108px 24px 60px" }}>

          {/* Card */}
          <div style={{ background: "rgba(10,28,16,0.92)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "24px", padding: "32px", backdropFilter: "blur(12px)" }}>

            {/* Title */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "rgba(160,210,170,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Edit Community</div>
              <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: "#e8f0e2" }}>{community.name}</h1>
            </div>

            {/* Alerts */}
            {status.error && (
              <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", background: "rgba(220,38,38,0.12)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.22)" }}>
                {status.error}
              </div>
            )}
            {status.success && (
              <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "12px", fontSize: "13px", background: "rgba(16,185,129,0.12)", color: "#5eead4", border: "1px solid rgba(16,185,129,0.22)" }}>
                {status.success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "#e8f0e2", textTransform: "uppercase", letterSpacing: "0.5px" }}>Community Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: "100%", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "14px", padding: "12px 14px", fontSize: "14px", background: "rgba(245,197,24,0.06)", color: "#e8f0e2", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "26px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "#e8f0e2", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  style={{ width: "100%", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "14px", padding: "12px 14px", fontSize: "14px", background: "rgba(245,197,24,0.06)", color: "#e8f0e2", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", minHeight: "110px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  style={{ background: "#F5C518", color: "#1a3010", border: "none", borderRadius: "14px", padding: "13px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/community/${id}`)}
                  style={{ background: "transparent", color: "rgba(180,230,180,0.7)", border: "1px solid rgba(120,200,145,0.22)", borderRadius: "14px", padding: "13px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "background .12s" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(245,197,24,0.08)"; e.currentTarget.style.color = "#F5C518"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(180,230,180,0.7)"; }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
