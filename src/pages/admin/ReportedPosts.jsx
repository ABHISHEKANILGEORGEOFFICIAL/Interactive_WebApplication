import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSectionTitle from "../../components/admin/AdminSectionTitle";
import API from "../../api";

/* ─── Spinner keyframes injected once ─── */
const spinStyle = `
  @keyframes rp-spin { to { transform: rotate(360deg); } }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
`;

function reasonColor(reason = "") {
  const r = reason.toLowerCase();
  if (r.includes("spam"))
    return { bg: "rgba(245,197,24,0.12)", text: "#fde68a", border: "rgba(245,197,24,0.25)" };
  if (r.includes("harass") || r.includes("abuse"))
    return { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", border: "rgba(239,68,68,0.25)" };
  if (r.includes("inappro"))
    return { bg: "rgba(251,146,60,0.12)", text: "#fed7aa", border: "rgba(251,146,60,0.25)" };
  if (r.includes("misinfo"))
    return { bg: "rgba(139,92,246,0.12)", text: "#c4b5fd", border: "rgba(139,92,246,0.25)" };
  return { bg: "rgba(255,255,255,0.06)", text: "rgba(237,234,224,0.6)", border: "rgba(255,255,255,0.1)" };
}

/* ─── inline styles ─── */
const S = {
  page: {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    minHeight: "100vh",
    background: "#080f0a",
    color: "#edeae0",
    padding: "32px 28px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 12,
  },
  titleWrap: { display: "flex", alignItems: "center", gap: 14 },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg,rgba(239,68,68,0.22),rgba(239,68,68,0.1))",
    border: "1px solid rgba(239,68,68,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#edeae0", letterSpacing: "-0.3px" },
  subtitle: { margin: "3px 0 0", fontSize: 12, color: "rgba(237,234,224,0.42)" },
  countBadge: {
    padding: "4px 12px",
    borderRadius: 999,
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.28)",
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: 600,
  },
  stateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "64px 32px",
    color: "rgba(237,234,224,0.35)",
    textAlign: "center",
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stateTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "rgba(237,234,224,0.55)" },
  stateBody: { margin: 0, fontSize: 13 },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid rgba(255,255,255,0.08)",
    borderTop: "2px solid #f5c518",
    borderRadius: "50%",
    animation: "rp-spin 0.7s linear infinite",
  },
  grid: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "18px 20px",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 16,
    transition: "border-color 0.18s, background 0.18s",
  },
  cardHovered: {
    background: "rgba(255,255,255,0.055)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardLeft: { minWidth: 0 },
  cardTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" },
  reasonBadge: (reason) => ({
    padding: "2px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: reasonColor(reason).bg,
    color: reasonColor(reason).text,
    border: `1px solid ${reasonColor(reason).border}`,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  }),
  postContent: {
    fontSize: 14,
    color: "#edeae0",
    fontWeight: 500,
    lineHeight: 1.5,
    marginBottom: 6,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  postAuthor: { fontSize: 12, color: "rgba(237,234,224,0.42)", marginBottom: 6 },
  reportMessage: {
    fontSize: 12.5,
    color: "rgba(237,234,224,0.6)",
    fontStyle: "italic",
    background: "rgba(255,255,255,0.03)",
    borderLeft: "2px solid rgba(255,255,255,0.1)",
    padding: "6px 10px",
    borderRadius: "0 6px 6px 0",
    marginTop: 4,
  },
  reporterRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 10 },
  reporterAvatar: {
    width: 22,
    height: 22,
    borderRadius: 7,
    background: "linear-gradient(135deg,#f5c518,#e8960a)",
    color: "#1a1100",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reporterName: { fontSize: 12, color: "rgba(237,234,224,0.5)" },
  timestamp: { fontSize: 11, color: "rgba(237,234,224,0.28)", marginTop: 6 },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    justifyContent: "center",
    alignSelf: "start",
    flexShrink: 0,
  },
};

const btnBase = {
  padding: "7px 14px",
  borderRadius: 9,
  border: "1px solid",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
  transition: "opacity 0.12s",
};

const btnVariants = {
  reviewed: {
    ...btnBase,
    background: "rgba(16,185,129,0.12)",
    borderColor: "rgba(16,185,129,0.28)",
    color: "#6ee7b7",
  },
  dismissed: {
    ...btnBase,
    background: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    color: "rgba(237,234,224,0.7)",
  },
  deleteReport: {
    ...btnBase,
    background: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.2)",
    color: "#fca5a5",
  },
  deletePost: {
    ...btnBase,
    background: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.4)",
    color: "#fca5a5",
    fontWeight: 700,
  },
};

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 21V4M4 4L20 4L16 9.5L20 15H4" stroke="#ef4444" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 6V12C4 16.4 7.6 20.4 12 21C16.4 20.4 20 16.4 20 12V6L12 3Z"
        stroke="rgba(237,234,224,0.2)" strokeWidth="1.6" fill="rgba(255,255,255,0.02)" />
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function ReportedPosts() {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [hoveredId, setHovered]   = useState(null);
  const [actioning, setActioning] = useState(null); // reportId currently being actioned

  useEffect(() => {
    if (!document.getElementById("rp-keyframes")) {
      const el = document.createElement("style");
      el.id = "rp-keyframes";
      el.textContent = spinStyle;
      document.head.appendChild(el);
    }
    fetchReports();
  }, []);

  function fetchReports() {
    setLoading(true);
    API.get("admin/reports/?status=pending")
      .then((res) => setReports(res.data.results || res.data || []))
      .catch(() => setError("Failed to load reported posts."))
      .finally(() => setLoading(false));
  }

  const handleAction = async (reportId, action) => {
    // Confirm destructive actions
    if (action === "delete_post") {
      const ok = window.confirm(
        "This will permanently remove the reported post AND delete this report. Continue?"
      );
      if (!ok) return;
    }
    if (action === "delete_report") {
      const ok = window.confirm("Delete this report record? The post will NOT be removed.");
      if (!ok) return;
    }

    setActioning(reportId);
    try {
      if (action === "delete_post") {
        // Find the report to get the post_id
        const report = reports.find((r) => r.id === reportId);
        if (report && report.post_id) {
          // Use the admin-only endpoint for all posts (including community posts)
          await API.delete(`admin/posts/${report.post_id}/delete/`);
        } else {
          alert("Post ID not found for this report.");
          setActioning(null);
          return;
        }
        // Optionally, delete the report record as well
        await API.delete(`admin/reports/${reportId}/`, { data: { delete_post: false } });

      } else if (action === "delete_report") {
        // Just delete the report record, leave the post intact
        await API.delete(`admin/reports/${reportId}/`, { data: { delete_post: false } });

      } else {
        // "reviewed" | "dismissed" — PATCH status
        await API.patch(`admin/reports/${reportId}/`, { status: action });
      }

      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      const msg = err?.response?.data?.detail || "Action failed. Please try again.";
      alert(msg);
    } finally {
      setActioning(null);
    }
  };

  const getInitial = (name = "") => (name.charAt(0) || "?").toUpperCase();

  return (
    <AdminLayout>
      <div style={S.page}>

        {/* ── Header ── */}
        <div style={S.headerRow}>
          <div style={S.titleWrap}>
            <div style={S.titleIcon}><FlagIcon /></div>
            <div>
              <h1 style={S.title}>Reported Posts</h1>
              <p style={S.subtitle}>Review and moderate flagged community content</p>
            </div>
          </div>
          {!loading && !error && (
            <span style={S.countBadge}>
              {reports.length} pending {reports.length === 1 ? "report" : "reports"}
            </span>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={S.stateBox}>
            <div style={S.spinner} />
            <p style={S.stateBody}>Loading reports…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={S.stateBox}>
            <div style={S.stateIcon}><FlagIcon /></div>
            <p style={{ ...S.stateTitle, color: "#fca5a5" }}>Something went wrong</p>
            <p style={{ ...S.stateBody, color: "#fca5a5" }}>{error}</p>
            <button
              onClick={fetchReports}
              style={{ ...btnVariants.dismissed, marginTop: 8 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && reports.length === 0 && (
          <div style={S.stateBox}>
            <div style={S.stateIcon}><ShieldIcon /></div>
            <p style={S.stateTitle}>All clear</p>
            <p style={S.stateBody}>No pending reports to review right now.</p>
          </div>
        )}

        {/* ── Cards ── */}
        {!loading && !error && reports.length > 0 && (
          <div style={S.grid}>
            {reports.map((report) => {
              const isHovered   = hoveredId === report.id;
              const isActioning = actioning === report.id;
              const reporterName =
                report.reported_by_username ||
                report.user_name ||
                report.user?.username ||
                `User #${report.reported_by}`;

              return (
                <div
                  key={report.id}
                  style={{ ...S.card, ...(isHovered ? S.cardHovered : {}) }}
                  onMouseEnter={() => setHovered(report.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* ── Left: content ── */}
                  <div style={S.cardLeft}>
                    <div style={S.cardTop}>
                      <span style={S.reasonBadge(report.reason)}>
                        {report.reason || "other"}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(237,234,224,0.28)" }}>
                        Report #{report.id}
                      </span>
                    </div>

                    <div style={S.postContent}>
                      {report.post_content || `Post #${report.post_id}`}
                    </div>
                    <div style={S.postAuthor}>
                      by{" "}
                      <span style={{ color: "rgba(237,234,224,0.6)", fontWeight: 500 }}>
                        {report.post_author_username || "Unknown"}
                      </span>
                    </div>

                    {report.message && (
                      <div style={S.reportMessage}>"{report.message}"</div>
                    )}

                    <div style={S.reporterRow}>
                      <div style={S.reporterAvatar}>{getInitial(reporterName)}</div>
                      <span style={S.reporterName}>
                        Reported by{" "}
                        <strong style={{ color: "rgba(237,234,224,0.65)" }}>
                          {reporterName}
                        </strong>
                      </span>
                    </div>

                    {report.created_at && (
                      <div style={S.timestamp}>{formatDate(report.created_at)}</div>
                    )}
                  </div>

                  {/* ── Right: actions ── */}
                  <div style={S.actions}>
                    <button
                      style={{ ...btnVariants.reviewed, opacity: isActioning ? 0.45 : 1 }}
                      onClick={() => handleAction(report.id, "reviewed")}
                      disabled={isActioning}
                      title="Mark report as reviewed — post stays up"
                    >
                      ✓ Reviewed
                    </button>

                    <button
                      style={{ ...btnVariants.dismissed, opacity: isActioning ? 0.45 : 1 }}
                      onClick={() => handleAction(report.id, "dismissed")}
                      disabled={isActioning}
                      title="Dismiss this report — no action needed"
                    >
                      Dismiss
                    </button>

                    <button
                      style={{ ...btnVariants.deleteReport, opacity: isActioning ? 0.45 : 1 }}
                      onClick={() => handleAction(report.id, "delete_report")}
                      disabled={isActioning}
                      title="Delete only the report record"
                    >
                      Delete Report
                    </button>

                    <button
                      style={{ ...btnVariants.deletePost, opacity: isActioning ? 0.45 : 1 }}
                      onClick={() => handleAction(report.id, "delete_post")}
                      disabled={isActioning}
                      title="Remove the post and delete this report"
                    >
                      🗑 Remove Post
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}