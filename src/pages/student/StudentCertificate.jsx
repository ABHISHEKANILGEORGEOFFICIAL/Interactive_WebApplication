import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "../../api";
import logo from "../../assets/logo.png";

export default function StudentCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef(null);

  const [certificate, setCertificate] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);

      const [certRes, courseRes] = await Promise.all([
        API.get("teacher/certificates/"),
        API.get(`teacher/courses/${id}/`),
      ]);

      const certList = Array.isArray(certRes.data) ? certRes.data : [];
      const cert = certList.find((c) => String(c.course) === String(id));

      setCertificate(cert || null);
      setCourse(courseRes.data);
    } catch (err) {
      console.error("Certificate load error:", err.response?.data || err);
      alert("Failed to load certificate");
    } finally {
      setLoading(false);
    }
  };

  const displayStudentName = useMemo(() => {
    const raw =
      certificate?.student_full_name ||
      certificate?.student_name ||
      localStorage.getItem("user_name") ||
      "Student";

    return raw.includes("@") ? raw.split("@")[0] : raw;
  }, [certificate]);

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const element = certificateRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 18;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    const pageRatio = availableWidth / availableHeight;

    let imgWidth;
    let imgHeight;

    if (imgRatio > pageRatio) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgRatio;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgRatio;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(`saha-${course?.title || "certificate"}.pdf`);
  };

  if (loading) {
    return <div style={center}>Loading certificate...</div>;
  }

  if (!certificate) {
    return (
      <div style={center}>
        <h2>No certificate found</h2>
        <p>Please generate the certificate from the learning page first.</p>
        <button
          style={printBtn}
          onClick={() => navigate(`/student/courses/${id}/learn`)}
        >
          Back to Learning Page
        </button>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: #ffffff !important;
            }

            body * {
              visibility: hidden !important;
            }

            .certificate-print-area,
            .certificate-print-area * {
              visibility: visible !important;
            }

            .certificate-page {
              padding: 0 !important;
              background: #ffffff !important;
            }

            .certificate-container {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .certificate-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              box-sizing: border-box !important;
            }
          }
        `}
      </style>

      <div className="certificate-page" style={page}>
        <div className="certificate-container" style={container}>
          <div className="no-print" style={actions}>
            <button
              style={backBtn}
              onClick={() => navigate(`/student/courses/${id}/learn`)}
            >
              ← Back
            </button>

            <div style={buttonGroup}>
              <button style={printBtn} onClick={handlePrint}>
                🖨 Print
              </button>

              <button style={downloadBtn} onClick={downloadPDF}>
                ⬇ Download PDF
              </button>
            </div>
          </div>

          <div
            ref={certificateRef}
            className="certificate-print-area"
            style={certificateBox}
          >
            <div style={logoWrapper}>
              <img src={logo} alt="Saha Logo" style={logoStyle} />
            </div>

            <p style={eyebrow}>Saha Learning Platform</p>

            <h1 style={title}>Certificate of Completion</h1>

            <p style={subtitle}>This is proudly presented to</p>

            <h2 style={studentName}>{displayStudentName}</h2>

            <p style={subtitle}>for successfully completing the course</p>

            <h2 style={courseTitle}>{course?.title || "Course"}</h2>

            <p style={desc}>
              Awarded for completing all lessons and demonstrating commitment to
              learning through the Saha LMS platform.
            </p>

            <div style={bottomRow}>
              <div>
                <div style={line}></div>
                <p style={label}>Instructor</p>
                <strong>{course?.teacher_name || "Course Instructor"}</strong>
              </div>

              <div>
                <div style={line}></div>
                <p style={label}>Authorized By</p>
                <strong>Saha LMS</strong>
              </div>

              <div>
                <div style={line}></div>
                <p style={label}>Date</p>
                <strong>
                  {certificate.issued_at
                    ? new Date(certificate.issued_at).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </strong>
              </div>
            </div>

            <p style={certId}>Certificate ID: {certificate.certificate_id}</p>
          </div>
        </div>
      </div>
    </>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f7f6f2",
  padding: "60px 20px",
};

const container = {
  maxWidth: 1000,
  margin: "0 auto",
};

const actions = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 24,
};

const buttonGroup = {
  display: "flex",
  gap: 12,
};

const backBtn = {
  padding: "11px 20px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#102419",
  fontWeight: 900,
  cursor: "pointer",
};

const printBtn = {
  padding: "11px 20px",
  borderRadius: 999,
  border: "none",
  background: "#102419",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const downloadBtn = {
  padding: "11px 20px",
  borderRadius: 999,
  border: "none",
  background: "#F5C518",
  color: "#102419",
  fontWeight: 950,
  cursor: "pointer",
};

const certificateBox = {
  background: "#fff",
  padding: "56px 60px",
  borderRadius: 24,
  border: "8px solid #F5C518",
  textAlign: "center",
  boxShadow: "0 18px 44px rgba(0,0,0,0.12)",
};

const logoWrapper = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 18,
};

const logoStyle = {
  width: 135,
  height: "auto",
  objectFit: "contain",
};

const eyebrow = {
  color: "#0d6b36",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  margin: "0 0 10px",
};

const title = {
  fontSize: 38,
  fontWeight: 950,
  margin: "8px 0 20px",
  color: "#102419",
};

const subtitle = {
  color: "#666",
  margin: "12px 0",
  fontSize: 16,
};

const studentName = {
  fontSize: 32,
  fontWeight: 950,
  color: "#102419",
  margin: "10px 0",
  wordBreak: "break-word",
};

const courseTitle = {
  fontSize: 28,
  fontWeight: 950,
  color: "#1a1a1a",
  marginTop: 10,
};

const desc = {
  margin: "22px auto 0",
  color: "#555",
  lineHeight: 1.7,
  maxWidth: 680,
};

const bottomRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 24,
  marginTop: 50,
};

const line = {
  height: 1,
  background: "#102419",
  marginBottom: 10,
};

const label = {
  color: "#777",
  fontSize: 12,
  margin: "0 0 4px",
  textTransform: "uppercase",
  fontWeight: 900,
};

const certId = {
  marginTop: 38,
  fontSize: 13,
  color: "#888",
  fontWeight: 800,
};

const center = {
  minHeight: "100vh",
  padding: 120,
  textAlign: "center",
  background: "#f7f6f2",
};