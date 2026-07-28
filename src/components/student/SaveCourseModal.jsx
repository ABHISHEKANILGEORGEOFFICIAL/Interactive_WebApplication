import { useEffect, useState } from "react";
import API, { getApiErrorMessage } from "../../api";

export default function SaveCourseModal({
  open,
  course,
  onClose,
  onSaved,
}) {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");

  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    try {
      setLoading(true);

      const res = await API.get("teacher/collections/");
      const data = Array.isArray(res.data) ? res.data : [];

      setCollections(data);

      if (data.length > 0) {
        setSelectedCollectionId(String(data[0].id));
      } else {
        setSelectedCollectionId("");
      }
    } catch (err) {
      console.error("Load collections error:", err?.response?.data || err);
      alert(getApiErrorMessage(err, "Could not load collections."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToExisting = async () => {
    if (!selectedCollectionId) {
      alert("Please select a collection.");
      return;
    }

    if (!course?.id) {
      alert("Course not found.");
      return;
    }

    try {
      setSaving(true);

      const saveRes = await API.post(
        `teacher/collections/${selectedCollectionId}/items/`,
        {
          course_id: course.id,
        }
      );

      if (onSaved) {
        onSaved();
      }

      onClose();

      if (saveRes.data?.already_saved) {
        alert("This course is already saved in this collection.");
      } else {
        alert("Course saved to collection.");
      }
    } catch (err) {
      console.error("Save to collection error:", err?.response?.data || err);

      const message = getApiErrorMessage(
        err,
        "Could not save course to collection."
      );

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    const name = newCollectionName.trim();

    if (!name) {
      alert("Please enter a collection name.");
      return;
    }

    if (!course?.id) {
      alert("Course not found.");
      return;
    }

    try {
      setSaving(true);

      const createRes = await API.post("teacher/collections/", {
        name,
        description: newCollectionDescription.trim(),
      });

      const newCollection = createRes.data;

      await API.post(`teacher/collections/${newCollection.id}/items/`, {
        course_id: course.id,
      });

      setNewCollectionName("");
      setNewCollectionDescription("");

      if (onSaved) {
        onSaved();
      }

      onClose();

      alert("New collection created and course saved.");
    } catch (err) {
      console.error("Create collection and save error:", err?.response?.data || err);

      const message = getApiErrorMessage(
        err,
        "Could not create collection and save course."
      );

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHead}>
          <div>
            <h2 style={title}>Save Course</h2>
            <p style={subtitle}>
              {course?.title
                ? `Add "${course.title}" to a collection.`
                : "Add this course to a collection."}
            </p>
          </div>

          <button style={closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={divider} />

        <section style={section}>
          <h3 style={sectionTitle}>Choose Existing Collection</h3>

          {loading ? (
            <div style={mutedBox}>Loading collections...</div>
          ) : collections.length === 0 ? (
            <div style={mutedBox}>
              No collections yet. Create one below.
            </div>
          ) : (
            <>
              <select
                style={select}
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({collection.items_count || 0})
                  </option>
                ))}
              </select>

              <button
                style={primaryBtn}
                onClick={handleSaveToExisting}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save to Selected Collection"}
              </button>
            </>
          )}
        </section>

        <div style={orLine}>
          <span>or</span>
        </div>

        <section style={section}>
          <h3 style={sectionTitle}>Create New Collection</h3>

          <input
            style={input}
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Example: Data Structure Courses"
          />

          <textarea
            style={textarea}
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
            placeholder="Optional description..."
          />

          <button
            style={secondaryBtn}
            onClick={handleCreateAndSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Collection & Save"}
          </button>
        </section>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modal = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  borderRadius: 26,
  padding: 24,
  boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
  border: "1px solid rgba(0,0,0,0.08)",
};

const modalHead = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
};

const title = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
  color: "#102419",
};

const subtitle = {
  margin: "8px 0 0",
  color: "#666",
  lineHeight: 1.5,
};

const closeBtn = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid #eee",
  background: "#fff",
  fontSize: 26,
  fontWeight: 700,
  cursor: "pointer",
  color: "#333",
};

const divider = {
  height: 1,
  background: "#eee",
  margin: "20px 0",
};

const section = {
  display: "grid",
  gap: 12,
};

const sectionTitle = {
  margin: 0,
  color: "#1a1a1a",
  fontSize: 17,
  fontWeight: 950,
};

const select = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 15,
  padding: "14px 15px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  fontWeight: 800,
};

const input = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 15,
  padding: "14px 15px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textarea = {
  width: "100%",
  minHeight: 90,
  border: "1px solid #ddd",
  borderRadius: 15,
  padding: "14px 15px",
  fontSize: 14,
  outline: "none",
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const primaryBtn = {
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "14px 18px",
  borderRadius: 15,
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryBtn = {
  border: "none",
  background: "#F5C518",
  color: "#111",
  padding: "14px 18px",
  borderRadius: 15,
  fontWeight: 950,
  cursor: "pointer",
};

const mutedBox = {
  border: "1px dashed #ddd",
  background: "#fafafa",
  borderRadius: 16,
  padding: 16,
  color: "#777",
  fontWeight: 800,
};

const orLine = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#777",
  fontWeight: 900,
  margin: "18px 0",
};