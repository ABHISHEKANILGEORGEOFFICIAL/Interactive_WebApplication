import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import StudentLayout from "../../components/student/StudentLayout";

export default function StudentRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("student/my-requests/");
        setRequests(res.data);
      } catch (e) {
        console.log("Error loading requests");
      }
    };
    load();
  }, []);

  return (
    <StudentLayout>
      <div style={{ maxWidth: "800px", margin: "120px auto", padding: "20px" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2>📋 My Permission Requests</h2>

          <Link to="/student/community">
            <button>← Back</button>
          </Link>
        </div>

        {/* LIST */}
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            No requests yet
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "16px",
              marginBottom: "12px"
            }}>
              <h3>{req.community_name}</h3>

              <p>{req.description}</p>

              <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                Teacher: {req.teacher_name}
              </div>

              <div style={{
                padding: "5px 10px",
                borderRadius: "10px",
                display: "inline-block",
                background:
                  req.status === "pending" ? "#FFF3E0" :
                  req.status === "approved" ? "#E8F5E9" :
                  "#FFEBEE"
              }}>
                {req.status}
              </div>

              {/* Teacher note */}
              {req.teacher_note && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Note:</strong> {req.teacher_note}
                </div>
              )}

              {/* Approved action */}
              {req.status === "approved" && req.community_id && (
                <Link to={`/student/community/${req.community_id}`}>
                  <button style={{ marginTop: "10px" }}>
                    View Community
                  </button>
                </Link>
              )}
            </div>
          ))
        )}

      </div>
    </StudentLayout>
  );
}