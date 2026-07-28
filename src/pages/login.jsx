import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API, { getApiErrorMessage } from "../api";
import sahabg2 from "../assets/sahabg2.mp4";
import logo from "/logo.png";

const getEntityId = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value.id ?? value.pk ?? value.school_id ?? value.college_id ?? "");
};

const getNestedValue = (source, path) => {
  if (!source || !path) return undefined;
  return path.split(".").reduce((value, key) => value?.[key], source);
};

const resolveEntityId = (source, paths) => {
  for (const path of paths) {
    const resolved = getEntityId(getNestedValue(source, path));
    if (resolved) return resolved;
  }
  return "";
};

const getEntityLabel = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value.school_name ?? value.college_name ?? value.name ?? value.title ?? "");
};

const setStorageValue = (key, value) => {
  if (value === undefined || value === null || value === "") {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, String(value));
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password) {
      setError("Enter email and password.");
      return;
    }

    let data;
    try {
      const loginPayload = {
        
        email: form.email,
        password: form.password,
      };

      const response = await API.post("login/", loginPayload);
      data = response.data;
    } catch (err) {
      console.error("Login error response:", err.response?.data);
      console.error("Login error status:", err.response?.status);
      console.error("Full error:", err);
      setError(getApiErrorMessage(err, "Login failed. Check your credentials and backend."));
      return;
    }
    

    try {
      console.log("Login success", data);
      const token = data?.access || data?.access_token || data?.token || data?.key;
      setStorageValue("access_token", token);

      const refresh = data?.refresh || data?.refresh_token;
      setStorageValue("refresh_token", refresh);

      const userInfo = data?.user || data?.profile || {};
      const roleRaw =
        data?.role ||
        data?.user_role ||
        data?.account_type ||
        userInfo?.role ||
        userInfo?.user_role ||
        userInfo?.account_type ||
        "";

      setStorageValue("user_role", roleRaw);
      setStorageValue("user_id", data?.user_id ?? userInfo?.id);
      setStorageValue("user_email", data?.email ?? userInfo?.email);

      const schoolId =
        getEntityId(data?.school) ||
        getEntityId(userInfo?.school) ||
        getEntityId(userInfo?.school_id) ||
        getEntityId(data?.school_id);
      const schoolName =
        getEntityLabel(data?.school) ||
        getEntityLabel(userInfo?.school) ||
        String(data?.school_name || userInfo?.school_name || "");
      setStorageValue("user_school_id", schoolId);
      setStorageValue("user_school_name", schoolName);

      const collegeId =
        resolveEntityId(data, ["college", "college_id"]) ||
        resolveEntityId(userInfo, [
          "college",
          "college_id",
          "department.college",
          "department.college_id",
          "course.college",
          "course.college_id",
          "course.department.college",
          "course.department.college_id",
        ]);
      const collegeName =
        getEntityLabel(data?.college) ||
        getEntityLabel(userInfo?.college) ||
        getEntityLabel(userInfo?.department?.college) ||
        getEntityLabel(userInfo?.course?.college) ||
        getEntityLabel(userInfo?.course?.department?.college) ||
        String(data?.college_name || userInfo?.college_name || "");
      setStorageValue("user_college_id", collegeId);
      setStorageValue("user_college_name", collegeName);

      const role = String(roleRaw).toLowerCase();
      const isSuperAdmin =
        role === "superadmin" ||
        role === "super_admin" ||
        role === "admin" ||
        role === "superuser" ||
        Boolean(data?.is_superuser || data?.is_admin || data?.is_staff || userInfo?.is_superuser || userInfo?.is_admin || userInfo?.is_staff);

      if (isSuperAdmin) {
        localStorage.setItem("user_role", "superadmin");
        navigate("/admin/home");
      } else if (role === "student") {
        navigate("/student/home");
      } else {
        navigate("/teacher/home");
      }
    } catch (err) {
      console.error("Login post-processing failed", err);
      setError("Login succeeded, but the session could not be initialized. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(245,197,24,0.25)",
    background: "rgba(0,0,0,0.35)",
    color: "white",
    fontSize: 14,
    outline: "none",
    marginBottom: 12,
    boxSizing: "border-box",
  };

  const btnStyle = {
    width: "100%",
    padding: "11px 0",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 15,
    background: "#F5C518",
    color: "#1a1a1a",
    border: "none",
    cursor: "pointer",
    marginTop: 6,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "#06261C",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            minWidth: "100%",
            minHeight: "100%",
            objectFit: "cover",
            filter: "saturate(1.18) brightness(0.65) contrast(1.05)",
            pointerEvents: "none",
          }}
        >
          <source src={sahabg2} type="video/mp4" />
        </video>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(13,117,87,0.45))",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "min(400px, 92vw)",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 28,
          padding: "36px 32px",
          color: "white",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src={logo}
            alt="SAHA"
            style={{
              width: 52,
              borderRadius: "50%",
              display: "block",
              margin: "0 auto 8px",
              boxShadow: "0 0 16px rgba(245,197,24,0.4)",
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.12em",
              background: "linear-gradient(90deg,#fff,#F5C518)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SAHA
          </div>
        </div>

        <h2
          style={{
            textAlign: "center",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 20,
            color: "white",
          }}
        >
          Welcome back
        </h2>

        {error && (
          <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
            {error}
          </div>
        )}

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Username or Email"
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          style={inputStyle}
        />

        <button onClick={handleSubmit} style={btnStyle}>
          Login
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" style={{ color: "#059669", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}