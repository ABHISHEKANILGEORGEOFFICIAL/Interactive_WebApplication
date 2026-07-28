import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminSectionTitle from "../../components/admin/AdminSectionTitle";

export default function AdminCourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await API.get(`teacher-courses/${id}/`);
      setCourse(res.data);
    } catch {
      console.log("Course detail API not ready");
    }
  };

  if (!course) return <AdminLayout>Loading...</AdminLayout>;

  return (
    <AdminLayout>
      <AdminSectionTitle title={course.title} />

      <p><b>Teacher:</b> {course.teacher_name}</p>
      <p><b>Subject:</b> {course.subject_name}</p>
      <p><b>Level:</b> {course.level}</p>
      <p><b>Price:</b> {course.is_paid ? `₹${course.price}` : "Free"}</p>

      <h3>Sections</h3>
      {course.sections?.map((sec) => (
        <div key={sec.id}>
          <b>{sec.title}</b>
          <ul>
            {sec.videos?.map((v) => (
              <li key={v.id}>{v.title}</li>
            ))}
          </ul>
        </div>
      ))}
    </AdminLayout>
  );
}
