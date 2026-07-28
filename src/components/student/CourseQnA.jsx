import { useEffect, useState } from "react";
import API, { getApiErrorMessage, toList } from "../../api";

export default function CourseQnA({ courseId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [replyText, setReplyText] = useState({});
  const [openReply, setOpenReply] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadComments();
  }, [courseId]);

  const loadComments = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError("");
      const res = await API.get(`teacher/courses/${courseId}/comments/`);
      setComments(toList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Q&A."));
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      await API.post(`teacher/courses/${courseId}/comments/`, {
        content: content.trim(),
      });

      setContent("");
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not post question."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId) => {
    const text = replyText[parentId]?.trim();
    if (!text) return;

    try {
      setSubmitting(true);
      setError("");

      await API.post(`teacher/courses/${courseId}/comments/`, {
        content: text,
        parent: parentId,
      });

      setReplyText((prev) => ({ ...prev, [parentId]: "" }));
      setOpenReply(null);
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not post reply."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={card}>
      <div style={header}>
        <div>
          <span style={eyebrow}>Course Discussion</span>
          <h2 style={title}>Q&A</h2>
          <p style={subText}>
            Ask doubts, discuss lessons, and view instructor answers.
          </p>
        </div>

        <div style={countPill}>{comments.length} question(s)</div>
      </div>

      <form style={form} onSubmit={submitQuestion}>
        <label style={label}>Ask a question</label>

        <textarea
          style={textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Example: Sir, can you explain this lesson again?"
          rows={4}
        />

        {error && <p style={errorText}>{error}</p>}

        <button style={submitBtn} disabled={submitting}>
          {submitting ? "Posting..." : "Post Question"}
        </button>
      </form>

      <div style={threadList}>
        {loading ? (
          <div style={empty}>Loading Q&A...</div>
        ) : comments.length === 0 ? (
          <div style={empty}>No questions yet. Start the first discussion.</div>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              openReply={openReply}
              setOpenReply={setOpenReply}
              replyText={replyText}
              setReplyText={setReplyText}
              submitReply={submitReply}
              submitting={submitting}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CommentThread({
  comment,
  openReply,
  setOpenReply,
  replyText,
  setReplyText,
  submitReply,
  submitting,
  depth = 0,
}) {
  const replies = Array.isArray(comment.replies) ? comment.replies : [];

  const studentReplies = replies.filter((reply) => !reply.is_instructor_reply);
  const instructorReplies = replies.filter((reply) => reply.is_instructor_reply);
  const hasInstructorAnswer = instructorReplies.length > 0;

  const isInstructor = Boolean(comment.is_instructor_reply);

  return (
    <article
      style={{
        ...commentItem,
        ...(isInstructor ? instructorCommentItem : {}),
        marginLeft: depth ? 18 : 0,
      }}
    >
      <div style={commentTop}>
        <div>
          <strong style={name}>{comment.username || "User"}</strong>

          <div style={metaRow}>
            <span style={rolePill(comment.role)}>{comment.role || "user"}</span>

            {isInstructor && (
              <span style={instructorBadge}>✔ Instructor</span>
            )}

            {!comment.parent && hasInstructorAnswer && (
              <span style={answeredBadge}>Answered</span>
            )}
          </div>
        </div>

        <span style={dateText}>{formatDate(comment.created_at)}</span>
      </div>

      <p style={commentText}>{comment.content}</p>

      <div style={actions}>
        <span style={helpful}>👍 {comment.likes_count || 0} helpful</span>

        <button
          style={replyBtn}
          onClick={() =>
            setOpenReply(openReply === comment.id ? null : comment.id)
          }
        >
          Reply
        </button>
      </div>

      {openReply === comment.id && (
        <div style={replyForm}>
          <textarea
            style={replyTextarea}
            value={replyText[comment.id] || ""}
            onChange={(e) =>
              setReplyText((prev) => ({
                ...prev,
                [comment.id]: e.target.value,
              }))
            }
            placeholder="Write a reply..."
            rows={3}
          />

          <button
            style={smallSubmitBtn}
            disabled={submitting}
            onClick={() => submitReply(comment.id)}
          >
            Post Reply
          </button>
        </div>
      )}

      {studentReplies.length > 0 && (
        <div style={repliesWrap}>
          {studentReplies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              openReply={openReply}
              setOpenReply={setOpenReply}
              replyText={replyText}
              setReplyText={setReplyText}
              submitReply={submitReply}
              submitting={submitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {instructorReplies.length > 0 && (
        <div style={instructorAnswerWrap}>
          <div style={instructorAnswerTitle}>Instructor answer</div>

          {instructorReplies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              openReply={openReply}
              setOpenReply={setOpenReply}
              replyText={replyText}
              setReplyText={setReplyText}
              submitReply={submitReply}
              submitting={submitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </article>
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

const countPill = {
  background: "#102419",
  color: "#F5C518",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 950,
  fontSize: 13,
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

const threadList = {
  display: "grid",
  gap: 12,
};

const commentItem = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 16,
  background: "#fff",
  color: "#1a1a1a",
};

const instructorCommentItem = {
  background: "#f0fff4",
  border: "1px solid #b7efc5",
};

const commentTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const name = {
  color: "#102419",
};

const metaRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  marginTop: 7,
};

const rolePill = (role) => ({
  display: "inline-block",
  background: role === "teacher" ? "#102419" : "#fff3bc",
  color: role === "teacher" ? "#F5C518" : "#7a5a00",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  textTransform: "capitalize",
});

const instructorBadge = {
  display: "inline-block",
  background: "#102419",
  color: "#F5C518",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
};

const answeredBadge = {
  display: "inline-block",
  background: "#0d6b36",
  color: "#fff",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
};

const dateText = {
  color: "#999",
  fontSize: 12,
};

const commentText = {
  color: "#555",
  lineHeight: 1.6,
  margin: "12px 0",
};

const actions = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const helpful = {
  color: "#777",
  fontSize: 13,
  fontWeight: 800,
};

const replyBtn = {
  border: "1px solid #e7e2d4",
  background: "#fff",
  color: "#102419",
  padding: "8px 12px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 900,
};

const replyForm = {
  marginTop: 12,
  background: "#f7f6f2",
  border: "1px solid #e7e2d4",
  borderRadius: 16,
  padding: 12,
};

const replyTextarea = {
  ...textarea,
  background: "#fff",
};

const smallSubmitBtn = {
  marginTop: 9,
  border: "none",
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "9px 13px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 950,
};

const repliesWrap = {
  display: "grid",
  gap: 10,
  marginTop: 12,
  borderLeft: "3px solid #fff3bc",
  paddingLeft: 12,
};

const instructorAnswerWrap = {
  display: "grid",
  gap: 10,
  marginTop: 12,
  borderLeft: "4px solid #0d6b36",
  padding: "12px 0 12px 12px",
  background: "#f0fff4",
  borderRadius: 16,
};

const instructorAnswerTitle = {
  color: "#0d6b36",
  fontWeight: 950,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1,
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