export default function CourseVideoPlayer({ video }) {
  return (
    <div className="mt-2 border p-2 rounded">
      <h4 className="font-medium">{video.title}</h4>

      {video.video_url ? (
        <a
          href={video.video_url}
          target="_blank"
          className="text-blue-600"
        >
          Watch Video
        </a>
      ) : video.media_file ? (
        <video controls className="w-full mt-2">
          <source src={video.media_file} />
        </video>
      ) : (
        <p>No video available</p>
      )}
    </div>
  );
}