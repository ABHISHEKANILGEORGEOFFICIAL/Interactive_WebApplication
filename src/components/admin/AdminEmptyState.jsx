export default function AdminEmptyState({ message }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 36,
        color: "rgba(255,255,255,0.65)",
        border: "1px dashed rgba(245,197,24,0.22)",
        borderRadius: 14,
      }}
    >
      {message}
    </div>
  );
}
