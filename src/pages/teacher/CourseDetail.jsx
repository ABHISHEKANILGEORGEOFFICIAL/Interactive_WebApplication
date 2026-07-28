import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api";
import CourseVideoPlayer from "./CourseVideoPlayer";

export default function CourseDetail() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Section state
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");

  // Video state
  const [activeSection, setActiveSection] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await API.get(`courses/${id}/`);
      setCourse(res.data);
    } catch (err) {
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  // ➕ Add Section
  const addSection = async () => {
    if (!sectionTitle) return;

    try {
      await API.post("sections/", {
        course: id,
        title: sectionTitle,
      });

      setSectionTitle("");
      setShowSectionForm(false);
      fetchCourse();
    } catch (err) {
      console.error(err);
    }
  };

  // ➕ Add Video
  const addVideo = async (sectionId) => {
    if (!videoTitle || !videoUrl) return;

    try {
      await API.post("videos/", {
        title: videoTitle,
        video_url: videoUrl,
        section: sectionId,
        course: id, // remove later if backend cleaned
      });

      setVideoTitle("");
      setVideoUrl("");
      setActiveSection(null);
      fetchCourse();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!course) return null;

  return (
    <div className="p-4">
      {/* Course Info */}
      <h1 className="text-2xl font-bold">{course.title}</h1>
      <p className="text-gray-600">{course.description}</p>

      {/* ➕ Add Section Button */}
      <button
        className="bg-green-600 text-white px-3 py-1 rounded mt-4"
        onClick={() => setShowSectionForm(!showSectionForm)}
      >
        + Add Section
      </button>

      {/* Section Form */}
      {showSectionForm && (
        <div className="mt-3">
          <input
            placeholder="Section Title"
            className="border p-2 mr-2"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
          />

          <button
            className="bg-blue-500 text-white px-3 py-1"
            onClick={addSection}
          >
            Save
          </button>
        </div>
      )}

      {/* Sections */}
      <h2 className="mt-6 font-semibold">Sections</h2>

      {course.sections?.map((sec) => (
        <div key={sec.id} className="border p-3 my-3 rounded">
          <h3 className="font-semibold">{sec.title}</h3>

          {/* ➕ Add Video Button */}
          <button
            className="text-sm text-blue-600 mt-2"
            onClick={() =>
              setActiveSection(activeSection === sec.id ? null : sec.id)
            }
          >
            + Add Video
          </button>

          {/* Video Form */}
          {activeSection === sec.id && (
            <div className="mt-2">
              <input
                placeholder="Video Title"
                className="border p-1 mr-2"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />

              <input
                placeholder="Video URL"
                className="border p-1 mr-2"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />

              <button
                className="bg-green-500 text-white px-2"
                onClick={() => addVideo(sec.id)}
              >
                Save
              </button>
            </div>
          )}

          {/* Videos */}
          {sec.videos?.map((video) => (
            <CourseVideoPlayer key={video.id} video={video} />
          ))}
        </div>
      ))}
    </div>
  );
}