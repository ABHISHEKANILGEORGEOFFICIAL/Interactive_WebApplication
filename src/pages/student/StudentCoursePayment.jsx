import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";

const pageUser = {
  firstName: "Student",
  username: "student",
  fullName: "Student",
  role: "Student",
  avatarDisplay: "S",
  avatarUrl: null,
};

export default function StudentCoursePayment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ddOpen, setDdOpen] = useState(false);
  const [method, setMethod] = useState("upi");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const res = await API.get(`teacher/courses/${id}/`);
      setCourse(res.data);
    } catch (err) {
      console.error("Course load error:", err?.response?.data || err);
      alert("Could not load payment page.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);

    try {
      const res = await API.post("teacher/payments/", {
        course: id,
        payment_method: method,
      });

      localStorage.setItem(
        `payment_receipt_${id}`,
        JSON.stringify({
          ...res.data,
          course: course,
        })
      );

      navigate(`/student/courses/${id}/payment-success`);
    } catch (err) {
      console.error("Payment error:", err?.response?.data || err);
      alert(err?.response?.data?.error || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
        <div style={page}>
          <div style={loadingBox}>Loading secure checkout...</div>
        </div>
      </StudentLayout>
    );
  }

  const amount = course?.is_paid ? Number(course?.price || 0) : 0;

  return (
    <StudentLayout user={pageUser} ddOpen={ddOpen} onToggle={setDdOpen}>
      <div style={page}>
        <div style={container}>
          <button style={backBtn} onClick={() => navigate(`/student/courses/${id}`)}>
            ← Back to Course
          </button>

          <div style={header}>
            <span style={eyebrow}>Saha LMS Checkout</span>
            <h1 style={title}>Complete Your Enrollment</h1>
            <p style={sub}>
              Choose a payment method and unlock full access to lessons, notes,
              assignments, and certificates.
            </p>
          </div>

          <div style={grid}>
            <section style={mainCard}>
              <h2 style={sectionTitle}>Payment Method</h2>

              <div style={methodGrid}>
                {[
                  { key: "upi", label: "UPI", desc: "Google Pay / PhonePe" },
                  { key: "card", label: "Card", desc: "Debit / Credit card" },
                  { key: "bank", label: "Bank", desc: "Bank transfer" },
                  { key: "cash", label: "Cash", desc: "Offline payment" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMethod(item.key)}
                    style={{
                      ...methodCard,
                      border:
                        method === item.key
                          ? "2px solid #F5C518"
                          : "1px solid #e6e1d2",
                      background: method === item.key ? "#fff8d6" : "#fff",
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>

              <div style={detailsBox}>
                {method === "upi" && (
                  <>
                    <h3>UPI Payment Details</h3>
                    <p>
                      UPI ID: <strong>saha@upi</strong>
                    </p>
                    <p>After payment, click “Pay Now & Enroll”.</p>
                  </>
                )}

                {method === "card" && (
                  <>
                    <h3>Card Payment Demo</h3>
                    <p>This is a demo checkout. No real card will be charged.</p>
                  </>
                )}

                {method === "bank" && (
                  <>
                    <h3>Bank Transfer Details</h3>
                    <p>
                      Account No: <strong>123456</strong>
                    </p>
                    <p>
                      IFSC: <strong>SAHA0001</strong>
                    </p>
                  </>
                )}

                {method === "cash" && (
                  <>
                    <h3>Cash Payment</h3>
                    <p>Pay at office. For demo, this will mark payment successful.</p>
                  </>
                )}
              </div>

              <div style={noticeBox}>
                🔐 Demo LMS payment flow. Payment success automatically creates
                course enrollment.
              </div>
            </section>

            <aside style={summaryCard}>
              <h2 style={sectionTitle}>Order Summary</h2>

              <div style={courseBox}>
                <span style={courseBadge}>{course?.level || "Beginner"}</span>
                <h3>{course?.title}</h3>
                <p>{course?.description || "Recorded LMS course"}</p>
              </div>

              <div style={summaryRow}>
                <span>Course Price</span>
                <strong>₹{amount}</strong>
              </div>

              <div style={summaryRow}>
                <span>Platform Fee</span>
                <strong>₹0</strong>
              </div>

              <div style={totalRow}>
                <span>Total</span>
                <strong>₹{amount}</strong>
              </div>

              <button style={payBtn} onClick={handlePayment} disabled={paying}>
                {paying ? "Processing..." : "Pay Now & Enroll"}
              </button>

              <p style={smallText}>
                After success, this course will be unlocked for your student account.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f7f6f2 0%, #fffaf0 100%)",
};

const container = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "125px 30px 60px",
};

const loadingBox = {
  maxWidth: 560,
  margin: "160px auto",
  background: "#fff",
  padding: 30,
  borderRadius: 24,
  textAlign: "center",
  fontWeight: 950,
  color: "#1a1a1a",
};

const backBtn = {
  border: "none",
  background: "#fff",
  color: "#1a1a1a",
  padding: "11px 17px",
  borderRadius: "999px",
  fontWeight: 900,
  cursor: "pointer",
  marginBottom: 20,
};

const header = {
  background: "linear-gradient(135deg, #102419, #1f3b2b)",
  color: "#fff",
  padding: 32,
  borderRadius: 30,
  marginBottom: 24,
  boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
};

const eyebrow = {
  color: "#F5C518",
  fontWeight: 950,
  fontSize: 13,
};

const title = {
  margin: "10px 0",
  fontSize: 40,
  fontWeight: 950,
};

const sub = {
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  maxWidth: 700,
  lineHeight: 1.6,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: 24,
};

const mainCard = {
  background: "#fff",
  borderRadius: 28,
  padding: 26,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
};

const summaryCard = {
  background: "#fff",
  borderRadius: 28,
  padding: 24,
  border: "1px solid #eee",
  boxShadow: "0 14px 34px rgba(0,0,0,0.08)",
  height: "fit-content",
};

const sectionTitle = {
  margin: "0 0 18px",
  fontSize: 23,
  fontWeight: 950,
  color: "#1a1a1a",
};

const methodGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 14,
};

const methodCard = {
  textAlign: "left",
  padding: 18,
  borderRadius: 20,
  cursor: "pointer",
  color: "#1a1a1a",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const detailsBox = {
  marginTop: 24,
  background: "#f7f6f2",
  borderRadius: 22,
  padding: 22,
  color: "#1a1a1a",
};

const noticeBox = {
  marginTop: 18,
  background: "#fff8d6",
  border: "1px solid #F5C518",
  borderRadius: 18,
  padding: 14,
  color: "#5b4600",
  fontWeight: 800,
};

const courseBox = {
  background: "#102419",
  color: "#fff",
  padding: 20,
  borderRadius: 22,
  marginBottom: 18,
};

const courseBadge = {
  display: "inline-block",
  color: "#F5C518",
  fontSize: 12,
  fontWeight: 950,
  textTransform: "capitalize",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "14px 0",
  borderBottom: "1px solid #eee",
  color: "#555",
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "18px 0",
  fontSize: 20,
  color: "#1a1a1a",
};

const payBtn = {
  width: "100%",
  border: "none",
  background: "#F5C518",
  color: "#1a1a1a",
  padding: "15px 20px",
  borderRadius: "999px",
  fontWeight: 950,
  cursor: "pointer",
};

const smallText = {
  color: "#777",
  fontSize: 13,
  lineHeight: 1.5,
  textAlign: "center",
};