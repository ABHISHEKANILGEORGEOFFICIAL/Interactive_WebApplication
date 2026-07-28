import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      {/* HEADER */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ color: "#F5C518", marginBottom: 6 }}>
          Dashboard Overview
        </h2>
        <p style={{ color: "#aaa" }}>
          Welcome back! Here's what's happening with your LMS.
        </p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <AdminStatCard title="Teachers" value={0} />
        <AdminStatCard title="Students" value={0} />
        <AdminStatCard title="Courses" value={0} />
        <AdminStatCard title="Enrollments" value={0} />
      </div>

      {/* TWO COLUMN SECTION */}
      <div style={{ display: "flex", gap: 20 }}>

        {/* RECENT COURSES */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Recent Courses</h3>

          <div style={itemStyle}>
            <div>
              <b>Machine Learning Basics</b>
              <div style={subText}>By John</div>
            </div>
            <div style={dateText}>May 30</div>
          </div>

          <div style={itemStyle}>
            <div>
              <b>React for Beginners</b>
              <div style={subText}>By Jane</div>
            </div>
            <div style={dateText}>May 28</div>
          </div>

          <div style={itemStyle}>
            <div>
              <b>Python Programming</b>
              <div style={subText}>By Mike</div>
            </div>
            <div style={dateText}>May 27</div>
          </div>

          <div style={{ marginTop: 10, color: "#F5C518", cursor: "pointer" }}>
            View All Courses →
          </div>
        </div>

        {/* RECENT ENROLLMENTS */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Recent Enrollments</h3>

          <div style={itemStyle}>
            <div>
              <b>Rahul Sharma</b>
              <div style={subText}>Machine Learning</div>
            </div>
            <div style={greenBadge}>2h ago</div>
          </div>

          <div style={itemStyle}>
            <div>
              <b>Priya Patel</b>
              <div style={subText}>React Course</div>
            </div>
            <div style={greenBadge}>5h ago</div>
          </div>

          <div style={itemStyle}>
            <div>
              <b>Amit Kumar</b>
              <div style={subText}>Python</div>
            </div>
            <div style={greenBadge}>1 day</div>
          </div>

          <div style={{ marginTop: 10, color: "#F5C518", cursor: "pointer" }}>
            View All Enrollments →
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginTop: 30 }}>
        <h3 style={titleStyle}>Quick Actions</h3>

        <div style={{ display: "flex", gap: 15, marginTop: 15 }}>
          <ActionCard text="Add Course" />
          <ActionCard text="Add Teacher" />
          <ActionCard text="Add Student" />
          <ActionCard text="Add Subject" />
        </div>
      </div>
    </AdminLayout>
  );
}

/* ---------- STYLES ---------- */

const cardStyle = {
  flex: 1,
  background: "rgba(10,28,16,0.9)",
  border: "1px solid rgba(25,158,115,0.2)",
  borderRadius: 16,
  padding: 20,
};

const titleStyle = {
  color: "#fff",
  marginBottom: 15,
};

const itemStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const subText = {
  fontSize: 12,
  color: "#aaa",
};

const dateText = {
  fontSize: 12,
  color: "#888",
};

const greenBadge = {
  fontSize: 12,
  color: "#0f0",
};

function ActionCard({ text }) {
  return (
    <div
      style={{
        padding: "14px 20px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        cursor: "pointer",
        color: "#ccc",
      }}
    >
      {text}
    </div>
  );
}
