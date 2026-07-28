export default function AdminStatCard({ title, value }) {
  return (
    <div
      style={{
        background: "rgba(10,28,16,0.92)",
        border: "1px solid rgba(245,197,24,0.2)",
        borderRadius: 16,
        padding: 20,
        flex: 1,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#F5C518", marginTop: 6 }}>{value}</div>
    </div>
  );
}
