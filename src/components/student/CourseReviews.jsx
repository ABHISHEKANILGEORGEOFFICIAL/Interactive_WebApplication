import { useEffect, useMemo, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";

export default function CourseReviews({ courseId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadReviews();
  }, [courseId]);

  const loadReviews = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError("");
      const res = await API.get(`teacher/courses/${courseId}/reviews/`);
      setReviews(toList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load course reviews."));
    } finally {
      setLoading(false);
    }
  };

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await API.post(`teacher/courses/${courseId}/reviews/`, {
        rating,
        comment,
      });

      setComment("");
      setRating(5);
      setSuccess("Review added successfully.");
      await loadReviews();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not add review."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={card}>
      <div style={header}>
        <div>
          <span style={eyebrow}>Student Feedback</span>
          <h2 style={title}>Course Reviews</h2>
          <p style={subText}>Share your rating after learning from this course.</p>
        </div>

        <div style={ratingBox}>
          <strong>{averageRating}</strong>
          <span>★</span>
          <small>{reviews.length} review(s)</small>
        </div>
      </div>

      <form style={form} onSubmit={submitReview}>
        <label style={label}>Your rating</label>
        <div style={stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              style={star <= rating ? starActive : starBtn}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
        </div>

        <label style={label}>Your review</label>
        <textarea
          style={textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your feedback about this course..."
          rows={4}
        />

        {error && <p style={errorText}>{error}</p>}
        {success && <p style={successText}>{success}</p>}

        <button style={submitBtn} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      <div style={list}>
        {loading ? (
          <div style={empty}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={empty}>No reviews yet. Be the first to review this course.</div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} style={reviewItem}>
              <div style={reviewTop}>
                <div>
                  <strong style={reviewName}>{review.student_name || "Student"}</strong>
                  <div style={reviewStars}>{"★".repeat(Number(review.rating || 0))}</div>
                </div>
                <span style={dateText}>{formatDate(review.created_at)}</span>
              </div>

              <p style={reviewText}>{review.comment || "No written feedback."}</p>

              {review.teacher_reply && (
                <div style={replyBox}>
                  <span style={instructorBadge}>Instructor Reply</span>
                  <p>{review.teacher_reply.reply}</p>
                  <small>— {review.teacher_reply.teacher_name || "Instructor"}</small>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "";
  }
}

const card = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 26,
  padding: 24,
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 18,
};

const eyebrow = {
  display: "inline-block",
  background: "#fff3bc",
  color: "#7a5a00",
  padding: "7px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  marginBottom: 8,
};

const title = {
  margin: 0,
  fontSize: 23,
  fontWeight: 950,
  color: "#1a1a1a",
};

const subText = {
  margin: "6px 0 0",
  color: "#777",
  fontSize: 13,
  lineHeight: 1.6,
};

const ratingBox = {
  minWidth: 92,
  background: "#102419",
  color: "#F5C518",
  borderRadius: 20,
  padding: 14,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const form = {
  background: "#f7f6f2",
  border: "1px solid #e7e2d4",
  borderRadius: 22,
  padding: 18,
  marginBottom: 18,
};

const label = {
  display: "block",
  fontWeight: 950,
  color: "#102419",
  marginBottom: 8,
};

const stars = {
  display: "flex",
  gap: 6,
  marginBottom: 14,
};

const starBtn = {
  border: "1px solid #e7e2d4",
  background: "#fff",
  color: "#aaa",
  width: 38,
  height: 38,
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: 20,
};

const starActive = {
  ...starBtn,
  background: "#F5C518",
  border: "1px solid #F5C518",
  color: "#1a1a1a",
};

const textarea = {
  width: "100%",
  resize: "vertical",
  border: "1px solid #e7e2d4",
  borderRadius: 16,
  padding: 13,
  outline: "none",
  fontFamily: "inherit",
  fontSize: 14,
  boxSizing: "border-box",
};

const submitBtn = {
  marginTop: 12,
  border: "none",
  background: "#102419",
  color: "#fff",
  padding: "12px 17px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 950,
};

const list = {
  display: "grid",
  gap: 12,
};

const reviewItem = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 16,
  color: "#1a1a1a",
};

const reviewTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const reviewName = {
  color: "#102419",
};

const reviewStars = {
  color: "#F5C518",
  marginTop: 4,
};

const dateText = {
  color: "#999",
  fontSize: 12,
};

const reviewText = {
  color: "#555",
  lineHeight: 1.6,
  margin: "12px 0 0",
};

const replyBox = {
  marginTop: 14,
  background: "#fff8d6",
  border: "1px solid #F5C518",
  borderRadius: 16,
  padding: 14,
  color: "#1a1a1a",
};

const instructorBadge = {
  display: "inline-block",
  background: "#102419",
  color: "#F5C518",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
};

const empty = {
  background: "#f7f6f2",
  border: "1px solid #e7e2d4",
  borderRadius: 18,
  padding: 18,
  color: "#777",
  textAlign: "center",
};

const errorText = {
  color: "#b42318",
  fontWeight: 800,
  fontSize: 13,
};

const successText = {
  color: "#0d6b36",
  fontWeight: 800,
  fontSize: 13,
};
