import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { getApiErrorMessage } from "../../api";
import StudentLayout from "../../components/student/StudentLayout";

const pageUser = {
  firstName: "Student",
  username: "student",
  fullName: "Student",
  role: "Student",
  avatarDisplay: "S",
  avatarUrl: null,
  posts: 0,
  followers: 0,
  following: 0,
};

export default function StudentCollections() {
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deletingCollectionId, setDeletingCollectionId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const getThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return null;
    if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
      return thumbnail;
    }
    return `http://127.0.0.1:8000${thumbnail}`;
  };

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await API.get("teacher/collections/");
      setCollections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Collections load error:", err?.response?.data || err);
      alert(getApiErrorMessage(err, "Could not load collections."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const totalSavedCourses = useMemo(() => {
    return collections.reduce(
      (total, collection) => total + Number(collection.items_count || 0),
      0
    );
  }, [collections]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a collection name.");
      return;
    }

    try {
      setCreating(true);

      await API.post("teacher/collections/", {
        name: name.trim(),
        description: description.trim(),
      });

      setName("");
      setDescription("");
      await loadCollections();
    } catch (err) {
      console.error("Create collection error:", err?.response?.data || err);
      alert(getApiErrorMessage(err, "Could not create collection."));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    const confirmDelete = window.confirm(
      "Delete this collection? Saved courses inside it will also be removed from this collection."
    );

    if (!confirmDelete) return;

    const oldCollections = collections;

    try {
      setDeletingCollectionId(collectionId);

      // Remove from page immediately
      setCollections((prevCollections) =>
        prevCollections.filter(
          (collection) => String(collection.id) !== String(collectionId)
        )
      );

      // Then delete from backend
      await API.delete(`teacher/collections/${collectionId}/`);
    } catch (err) {
      console.error("Delete collection error:", err?.response?.data || err);

      if (err?.response?.status === 404) {
        return;
      }

      // Restore old list if real error
      setCollections(oldCollections);

      alert(getApiErrorMessage(err, "Could not delete collection."));
    } finally {
      setDeletingCollectionId(null);
    }
  };

  const handleRemoveCourse = async (itemId) => {
    const oldCollections = collections;

    try {
      setRemovingItemId(itemId);

      // Remove from page immediately
      setCollections((prevCollections) =>
        prevCollections.map((collection) => {
          const oldItems = collection.items || [];

          const newItems = oldItems.filter(
            (item) => String(item.id) !== String(itemId)
          );

          return {
            ...collection,
            items: newItems,
            items_count: newItems.length,
          };
        })
      );

      // Then delete from backend
      await API.delete(`teacher/collection-items/${itemId}/`);
    } catch (err) {
      console.error("Remove saved course error:", err?.response?.data || err);

      if (err?.response?.status === 404) {
        await loadCollections();
        return;
      }

      // Restore old list if real error
      setCollections(oldCollections);

      alert(getApiErrorMessage(err, "Could not remove course."));
    } finally {
      setRemovingItemId(null);
    }
  };

  if (loading) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={center}>Loading your collections...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div style={page}>
        <div style={container}>
          <section style={hero}>
            <div>
              <span style={heroBadge}>Saved Learning</span>
              <h1 style={title}>My Collections</h1>
              <p style={sub}>
                Save courses you want to learn later. Collections can include
                active courses even before you enroll.
              </p>

              <div style={heroStats}>
                <div style={statCard}>
                  <strong>{collections.length}</strong>
                  <span>Collections</span>
                </div>

                <div style={statCard}>
                  <strong>{totalSavedCourses}</strong>
                  <span>Saved Courses</span>
                </div>

                <div style={statCard}>
                  <strong>Active</strong>
                  <span>Course Saves</span>
                </div>
              </div>
            </div>

            <div style={heroPanel}>
              <div style={heroPanelIcon}>📁</div>
              <h3 style={heroPanelTitle}>Organize your learning</h3>
              <p style={heroPanelText}>
                Keep interesting courses in collections and come back anytime.
              </p>
            </div>
          </section>

          <section style={createBox}>
            <form onSubmit={handleCreateCollection} style={formGrid}>
              <div>
                <label style={label}>Collection Name</label>
                <input
                  style={input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Python Courses"
                />
              </div>

              <div>
                <label style={label}>Description</label>
                <input
                  style={input}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional short note"
                />
              </div>

              <button style={createBtn} disabled={creating}>
                {creating ? "Creating..." : "Create Collection"}
              </button>
            </form>
          </section>

          <div style={sectionHeader}>
            <div>
              <h2 style={sectionTitle}>Your Saved Collections</h2>
              <p style={sectionSub}>
                Showing {collections.length} collection
                {collections.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              style={exploreBtn}
              onClick={() => navigate("/student/courses")}
            >
              Explore Courses
            </button>
          </div>

          {collections.length === 0 ? (
            <div style={emptyBox}>
              <h2 style={emptyTitle}>No Collections Yet</h2>
              <p style={emptyText}>
                Create your first collection, then save courses from the Explore
                Courses page.
              </p>

              <button
                style={viewBtn}
                onClick={() => navigate("/student/courses")}
              >
                Explore Courses
              </button>
            </div>
          ) : (
            <div style={collectionList}>
              {collections.map((collection) => (
                <section key={collection.id} style={collectionCard}>
                  <div style={collectionHead}>
                    <div>
                      <h3 style={collectionTitle}>{collection.name}</h3>
                      <p style={collectionDesc}>
                        {collection.description || "No description added."}
                      </p>
                      <span style={smallMeta}>
                        {collection.items_count || 0} saved course
                        {Number(collection.items_count || 0) === 1 ? "" : "s"}
                      </span>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...deleteBtn,
                        opacity:
                          deletingCollectionId === collection.id ? 0.6 : 1,
                        pointerEvents:
                          deletingCollectionId === collection.id
                            ? "none"
                            : "auto",
                      }}
                      disabled={deletingCollectionId === collection.id}
                      onClick={() => handleDeleteCollection(collection.id)}
                    >
                      {deletingCollectionId === collection.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>

                  {!collection.items || collection.items.length === 0 ? (
                    <div style={emptyMini}>
                      No courses saved in this collection yet.
                    </div>
                  ) : (
                    <div style={courseGrid}>
                      {collection.items.map((item) => {
                        const course = item.course || {};
                        const thumbnailUrl = getThumbnailUrl(course.thumbnail);

                        return (
                          <article key={item.id} style={courseCard}>
                            <div style={thumbWrap}>
                              {thumbnailUrl ? (
                                <img
                                  src={thumbnailUrl}
                                  alt={course.title}
                                  style={thumb}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div style={noThumb}>Saha Course</div>
                              )}

                              <div style={pricePill}>
                                {course.is_paid
                                  ? `₹${course.price || 0}`
                                  : "Free"}
                              </div>
                            </div>

                            <div style={courseBody}>
                              <span style={badge}>
                                {course.level || "beginner"}
                              </span>

                              <h4 style={courseTitle}>
                                {course.title || item.course_title}
                              </h4>

                              <p style={desc}>
                                {course.description
                                  ? course.description.slice(0, 90)
                                  : "No description available."}
                                {course.description?.length > 90 ? "..." : ""}
                              </p>

                              <div style={actions}>
                                <button
                                  type="button"
                                  style={openBtn}
                                  onClick={() =>
                                    navigate(`/student/courses/${course.id}`)
                                  }
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  style={{
                                    ...removeBtn,
                                    opacity:
                                      removingItemId === item.id ? 0.6 : 1,
                                    pointerEvents:
                                      removingItemId === item.id
                                        ? "none"
                                        : "auto",
                                  }}
                                  disabled={removingItemId === item.id}
                                  onClick={() => handleRemoveCourse(item.id)}
                                >
                                  {removingItemId === item.id
                                    ? "Removing..."
                                    : "Remove"}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

const page = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f7f6f2 0%, #fffaf0 45%, #f7f6f2 100%)",
};

const container = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "150px 30px 60px",
};

const center = {
  padding: "160px 30px",
  textAlign: "center",
  fontWeight: 900,
  color: "#1a1a1a",
};

const hero = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  gap: 22,
  alignItems: "stretch",
  background: "linear-gradient(135deg, #102419, #1f3b2b)",
  borderRadius: 28,
  padding: 30,
  color: "#fff",
  boxShadow: "0 18px 40px rgba(0,0,0,0.16)",
  marginBottom: 24,
};

const heroBadge = {
  display: "inline-block",
  background: "rgba(245,197,24,0.16)",
  border: "1px solid rgba(245,197,24,0.4)",
  color: "#F5C518",
  padding: "8px 13px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 900,
};

const title = {
  margin: "16px 0 8px",
  fontSize: 42,
  lineHeight: 1.1,
  fontWeight: 950,
  color: "#fff",
};

const sub = {
  color: "rgba(255,255,255,0.78)",
  margin: 0,
  fontSize: 15,
  lineHeight: 1.7,
  maxWidth: 680,
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginTop: 24,
};

const statCard = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const heroPanel = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 24,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const heroPanelIcon = {
  fontSize: 42,
  marginBottom: 14,
};

const heroPanelTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 21,
  fontWeight: 900,
};

const heroPanelText = {
  color: "rgba(255,255,255,0.74)",
  lineHeight: 1.6,
};

const createBox = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 22,
  padding: 18,
  boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
  marginBottom: 24,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 190px",
  gap: 14,
  alignItems: "end",
};

const label = {
  display: "block",
  marginBottom: 7,
  color: "#333",
  fontSize: 13,
  fontWeight: 900,
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

const createBtn = {
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "14px 16px",
  borderRadius: 15,
  fontWeight: 950,
  cursor: "pointer",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  margin: "34px 0 18px",
};

const sectionTitle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 950,
  color: "#1f1f1f",
};

const sectionSub = {
  margin: "6px 0 0",
  color: "#777",
  fontWeight: 700,
};

const exploreBtn = {
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "13px 18px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
};

const collectionList = {
  display: "grid",
  gap: 22,
};

const collectionCard = {
  background: "#fff",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 18px 35px rgba(0,0,0,0.08)",
  border: "1px solid rgba(0,0,0,0.06)",
};

const collectionHead = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
  marginBottom: 18,
};

const collectionTitle = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
  color: "#1f1f1f",
};

const collectionDesc = {
  color: "#666",
  margin: "7px 0",
  lineHeight: 1.5,
};

const smallMeta = {
  display: "inline-block",
  background: "#fff3bc",
  color: "#7a5a00",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
};

const deleteBtn = {
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
  padding: "10px 14px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
};

const courseGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
};

const courseCard = {
  border: "1px solid #ece7d8",
  borderRadius: 22,
  overflow: "hidden",
  background: "#fff",
};

const thumbWrap = {
  position: "relative",
  height: 145,
  background: "#13251b",
};

const thumb = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const noThumb = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#F5C518",
  fontWeight: 900,
};

const pricePill = {
  position: "absolute",
  top: 12,
  right: 12,
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
};

const courseBody = {
  padding: 16,
};

const badge = {
  display: "inline-block",
  background: "#ecfdf5",
  color: "#047857",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: 12,
  fontWeight: 950,
  textTransform: "capitalize",
};

const courseTitle = {
  margin: "12px 0 8px",
  color: "#1f1f1f",
  fontSize: 18,
  fontWeight: 950,
};

const desc = {
  color: "#666",
  lineHeight: 1.5,
  fontSize: 13,
  minHeight: 44,
};

const actions = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 14,
};

const openBtn = {
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "11px 13px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer",
};

const removeBtn = {
  border: "1px solid #eee",
  background: "#fff",
  color: "#b91c1c",
  padding: "11px 13px",
  borderRadius: 14,
  fontWeight: 950,
  cursor: "pointer",
};

const emptyMini = {
  border: "1px dashed #ddd",
  borderRadius: 18,
  padding: 18,
  color: "#777",
  fontWeight: 800,
};

const emptyBox = {
  background: "#fff",
  borderRadius: 28,
  padding: 40,
  textAlign: "center",
  boxShadow: "0 18px 35px rgba(0,0,0,0.08)",
};

const emptyTitle = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
};

const emptyText = {
  color: "#777",
  margin: "10px 0 22px",
};

const viewBtn = {
  border: "none",
  background: "#F5C518",
  color: "#111",
  padding: "14px 18px",
  borderRadius: 16,
  fontWeight: 950,
  cursor: "pointer",
};