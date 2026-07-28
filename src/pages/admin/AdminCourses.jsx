import { useEffect, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courseYears, setCourseYears] = useState([]);

  const [courseName, setCourseName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [year, setYear] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setError("");
    const [courseRes, departmentRes, courseYearRes] = await Promise.allSettled([
      API.get("courses/"),
      API.get("departments/"),
      API.get("course-years/"),
    ]);

    if (courseRes.status === "fulfilled") {
      setCourses(toList(courseRes.value.data));
    } else {
      setCourses([]);
      setError(getApiErrorMessage(courseRes.reason, "Failed to load courses."));
    }

    if (departmentRes.status === "fulfilled") {
      setDepartments(toList(departmentRes.value.data));
    } else {
      setDepartments([]);
    }

    if (courseYearRes.status === "fulfilled") {
      setCourseYears(toList(courseYearRes.value.data));
    } else {
      setCourseYears([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setCourseName("");
    setDepartmentId("");
    setYear("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!courseName.trim() || !departmentId || !year) {
      setError("All fields are required");
      return;
    }

    const payload = {
      course_name: courseName.trim(),
      department: Number(departmentId),
      year: Number(year),
    };

    try {
      if (editingId) {
        await API.put(`courses/${editingId}/`, payload);
        setSuccess("Course updated successfully");
      } else {
        await API.post("courses/", payload);
        setSuccess("Course added successfully");
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error saving course:", err);
      setError(getApiErrorMessage(err, "Error saving course"));
    }
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setCourseName(course.course_name || "");
    setDepartmentId(String(course.department || course.department_id || ""));
    setYear(String(course.year || ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await API.delete(`courses/${id}/`);
      setSuccess("Deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Delete failed");
    }
  };

  const getYearLabel = (value) => {
    const found = courseYears.find((item) => Number(item.id ?? item.year ?? item.value) === Number(value));
    return found ? (found.year_name || found.class_name || found.name || found.label) : value;
  };

  return (
    <AdminLayout title="Courses">
      {/* FORM */}
      <div style={card}>
        <h2 style={title}>{editingId ? "Edit Course" : "Add Course"}</h2>

        <form onSubmit={handleSubmit} style={form}>
          <input
            type="text"
            placeholder="Enter course name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            style={input}
          />

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            style={input}
          >
            <option value="">Select Department</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.department_name || item.departmentname || item.name || "Unnamed Department"}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={input}
          >
            <option value="">Select Year</option>
            {courseYears.map((item) => {
              const optionValue = String(item.id ?? item.year ?? item.value ?? "");
              const optionLabel = item.year_name || item.class_name || item.name || item.label || `Year ${optionValue}`;
              return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
              );
            })}
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={button}>
              {editingId ? "Update Course" : "Add Course"}
            </button>

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

      {/* TABLE */}
      <div style={card}>
        <h2 style={title}>All Courses</h2>

        {courses.length === 0 ? (
          <p style={{ color: "#fff" }}>No courses found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Course Name</th>
                <th style={th}>Department</th>
                <th style={th}>Year</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td style={td}>{course.id}</td>
                  <td style={td}>{course.course_name}</td>
                  <td style={td}>{course.department_name || "-"}</td>
                  <td style={td}>{getYearLabel(course.year)}</td>
                  <td style={td}>
                    <button
                      style={editBtn}
                      onClick={() => handleEdit(course)}
                    >
                      Edit
                    </button>
                    <button
                      style={deleteBtn}
                      onClick={() => handleDelete(course.id)}
                    >
                      Delete
                    </button>
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

/* STYLES */

const card = {
  background: "#071912",
  padding: 24,
  borderRadius: 18,
  marginBottom: 24,
  border: "1px solid rgba(255,255,255,0.1)",
};

const title = {
  color: "#f5c518",
  marginBottom: 16,
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  maxWidth: 500,
};

const input = {
  padding: 14,
  borderRadius: 10,
  border: "none",
  background: "#eee",
};

const button = {
  background: "#f5c518",
  color: "#111",
  padding: "12px 16px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const cancelBtn = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #fff",
  padding: "12px 16px",
  borderRadius: 10,
  cursor: "pointer",
};

const editBtn = {
  background: "#f5c518",
  color: "#111",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
  marginRight: 8,
  cursor: "pointer",
};

const deleteBtn = {
  background: "#ff5c5c",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
};

const th = {
  color: "#f5c518",
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const td = {
  color: "#fff",
  padding: 10,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const errorText = {
  color: "red",
  marginTop: 12,
};

const successText = {
  color: "lightgreen",
  marginTop: 12,
};
