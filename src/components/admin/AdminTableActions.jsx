export default function AdminTableActions({ onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={onEdit}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "none",
          background: "#F5C518",
          color: "#111",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "none",
          background: "#ef4444",
          color: "white",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Delete
      </button>
    </div>
  );
}
