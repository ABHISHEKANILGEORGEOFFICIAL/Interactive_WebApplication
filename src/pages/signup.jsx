import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import sahabg2 from "../assets/sahabg2.mp4";
import logo from "/logo.png";

const normalizeList = (data) => {
  if (Array.isArray(data?.colleges)) return data.colleges;
  if (Array.isArray(data?.schools)) return data.schools;
  if (Array.isArray(data?.streams)) return data.streams;
  if (Array.isArray(data?.departments)) return data.departments;
  if (Array.isArray(data?.course_years)) return data.course_years;
  if (Array.isArray(data?.courseYears)) return data.courseYears;
  if (Array.isArray(data?.years)) return data.years;
  if (Array.isArray(data?.courses)) return data.courses;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const DEFAULT_SCHOOL_GRADE_OPTIONS = [
  { value: "10", label: "10th", level: "10" },
  { value: "11", label: "11th", level: "11" },
  { value: "12", label: "12th", level: "12" },
];

const DEFAULT_COLLEGE_YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
];

const EMPTY_FORM = {
  username: "",
  name: "",
  email: "",
  password: "",
  gender: "",
  year: "",
  subject: "",
  stream: "",
  department: "",
  course: "",
  college: "",
};

const getEntityId = (item, keys) => {
  if (typeof item === "string" || typeof item === "number") return String(item);

  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }

  return "";
};

const getEntityLabel = (item, keys, fallback = "") => {
  if (typeof item === "string" || typeof item === "number") return String(item);

  for (const key of keys) {
    const value = item?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
};

const toToken = (value) => String(value ?? "").trim().toLowerCase();

const extractFieldValues = (item, keys) => {
  const collected = [];

  for (const key of keys) {
    const value = item?.[key];

    if (Array.isArray(value)) {
      collected.push(...value);
    } else if (value !== undefined && value !== null && value !== "") {
      collected.push(value);
    }
  }

  return collected.flatMap((value) => {
    if (typeof value === "string") {
      return value
        .split(/[,/|]/)
        .map((part) => part.trim())
        .filter(Boolean);
    }

    return [String(value)];
  });
};

const normalizeAcademicLevel = (value) => {
  const token = toToken(value);

  if (!token) return "";
  if (token.includes("10")) return "10";
  if (token.includes("11") || token.includes("plus one")) return "11";
  if (token.includes("12") || token.includes("plus two")) return "12";

  return token;
};

const toSchoolStandardOption = (item) => {
  const label = getEntityLabel(
    item,
    ["standard_name", "class_name", "name", "label", "title", "standard", "grade", "value"],
    ""
  );

  const token = normalizeAcademicLevel(
    label || item?.standard || item?.grade || item?.class_name || item?.value
  );

  if (!["10", "11", "12"].includes(token)) return null;

  return {
    value: getEntityId(item, ["id", "pk"]) || token,
    label: label || `${token}th`,
    level: token,
  };
};

const itemSupportsLevel = (item, level) => {
  if (!level) return true;

  const levels = extractFieldValues(item, [
    "standard",
    "standards",
    "grade",
    "grades",
    "class_name",
    "class_names",
    "school_class",
    "school_class_id",
    "year",
    "years",
    "school_year",
    "school_years",
    "applicable_standard",
    "applicable_standards",
  ])
    .map(normalizeAcademicLevel)
    .filter(Boolean);

  return levels.length === 0 ? true : levels.includes(level);
};

const itemMatchesStream = (item, streamId) => {
  if (!streamId) return true;

  const streamTokens = new Set(
    extractFieldValues(item, ["stream", "stream_id", "streamid", "stream_pk"]).map(toToken)
  );

  return streamTokens.size === 0 ? true : streamTokens.has(toToken(streamId));
};

const getStreamIdsFromSubjects = (subjectList) => {
  const ids = new Set();

  subjectList.forEach((subject) => {
    extractFieldValues(subject, ["stream", "stream_id", "streamid", "stream_pk"])
      .map(toToken)
      .filter(Boolean)
      .forEach((id) => ids.add(id));
  });

  return ids;
};

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const SIGNUP_DRAFT_KEY = "signup_form_draft_v1";

  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [institution, setInstitution] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [subjects, setSubjects] = useState([]);
  const [streams, setStreams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseYears, setCourseYears] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [schoolGradeOptions, setSchoolGradeOptions] = useState(DEFAULT_SCHOOL_GRADE_OPTIONS);
  const [loadError, setLoadError] = useState("");
  const [courseLoadError, setCourseLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const isSchool = institution === "school";
  const isCollege = institution === "college";

  const selectedSchoolClass = schoolGradeOptions.find(
    (option) => String(option.value) === String(form.year)
  );

  const selectedSchoolLevel =
    normalizeAcademicLevel(selectedSchoolClass?.level) ||
    normalizeAcademicLevel(selectedSchoolClass?.label) ||
    normalizeAcademicLevel(form.year);

  const isSeniorSecondary = isSchool && ["11", "12"].includes(selectedSchoolLevel);
  const isClassTen = isSchool && selectedSchoolLevel === "10";

  const allSchoolSubjects = subjects.filter(
    (subject) => toToken(subject?.type || subject?.subject_type) === "school"
  );

  const filteredSchoolSubjects = useMemo(() => {
    return allSchoolSubjects.filter((subject) => {
      const byClassId =
        String(getEntityId(subject, ["school_class", "school_class_id"])) === String(form.year);

      const byLevel = itemSupportsLevel(subject, selectedSchoolLevel);

      return byClassId || byLevel;
    });
  }, [allSchoolSubjects, form.year, selectedSchoolLevel]);

  const displaySchoolSubjects =
    isSeniorSecondary && form.stream
      ? filteredSchoolSubjects.filter((subject) => itemMatchesStream(subject, form.stream))
      : filteredSchoolSubjects;

  const schoolStreamsForLevel = streams.filter((stream) => {
    const byClassId =
      String(getEntityId(stream, ["school_class", "school_class_id"])) === String(form.year);

    const byLevel = itemSupportsLevel(stream, selectedSchoolLevel);

    return byClassId || byLevel;
  });

  const schoolStreamIdsFromSubjects = getStreamIdsFromSubjects(filteredSchoolSubjects);

  const schoolStreamsFromSubjects = streams.filter((stream) =>
    schoolStreamIdsFromSubjects.has(
      toToken(getEntityId(stream, ["id", "streamid", "stream_id", "pk"]))
    )
  );

  const schoolStreamOptions = isSeniorSecondary
    ? schoolStreamsFromSubjects.length
      ? schoolStreamsFromSubjects
      : schoolStreamsForLevel
    : [];

  const collegeYearOptions = useMemo(() => {
    const fromModel = courseYears
      .map((item) => {
        const label = getEntityLabel(item, ["year_name", "class_name", "name", "label", "title"], "");
        const rawValue = getEntityId(item, ["year", "value", "id", "pk"]);
        const digits = rawValue || label.match(/\d+/)?.[0] || "";

        return {
          value: digits,
          label: label || `Year ${digits}`,
        };
      })
      .filter((item) => item.value && item.label);

    return fromModel.length ? fromModel : DEFAULT_COLLEGE_YEAR_OPTIONS;
  }, [courseYears]);

  const displayCollegeCourses = courses;

  useEffect(() => {
    const stateDraft = location.state?.signupDraft;

    if (stateDraft?.form) {
      if (stateDraft.role) setRole(stateDraft.role);
      if (stateDraft.institution) setInstitution(stateDraft.institution);

      setForm((prev) => ({
        ...prev,
        ...stateDraft.form,
      }));

      if (typeof stateDraft.step === "number") {
        setStep(stateDraft.step);
      }

      if (stateDraft?.faceVerified) {
        setIsFaceVerified(true);
      }

      return;
    }

    // Normal /signup visit should always start from the first screen.
    localStorage.removeItem(SIGNUP_DRAFT_KEY);
    setStep(0);
    setRole("");
    setInstitution("");
    setForm(EMPTY_FORM);
    setIsFaceVerified(false);
    setErrors({});
  }, [location.state]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;

      setLoadError("");

      try {
        const [
          subjectsRes,
          schoolsRes,
          streamsRes,
          departmentsRes,
          courseYearsRes,
          collegesRes,
          classesRes,
        ] = await Promise.allSettled([
          API.get("subjects/"),
          API.get("schools/"),
          API.get("streams/"),
          API.get("departments/"),
          API.get("course-years/"),
          API.get("colleges/"),
          API.get("classes/"),
        ]);

        if (!isMounted) return;

        if (subjectsRes.status === "fulfilled") {
          setSubjects(normalizeList(subjectsRes.value.data));
        }

        if (schoolsRes.status === "fulfilled") {
          setSchools(normalizeList(schoolsRes.value.data));
        }

        if (streamsRes.status === "fulfilled") {
          setStreams(normalizeList(streamsRes.value.data));
        }

        if (departmentsRes.status === "fulfilled") {
          setDepartments(normalizeList(departmentsRes.value.data));
        }

        if (courseYearsRes.status === "fulfilled") {
          setCourseYears(normalizeList(courseYearsRes.value.data));
        }

        if (collegesRes.status === "fulfilled") {
          setColleges(normalizeList(collegesRes.value.data));
        }

        if (classesRes.status === "fulfilled") {
          const classList = normalizeList(classesRes.value.data);
          setClassLevels(classList);

          const byLevel = new Map();

          classList
            .filter((item) => toToken(item?.type) === "school")
            .forEach((item) => {
              const option = toSchoolStandardOption(item);

              if (option && !byLevel.has(option.level)) {
                byLevel.set(option.level, option);
              }
            });

          const resolved = ["10", "11", "12"]
            .map((key) => byLevel.get(key))
            .filter(Boolean);

          if (resolved.length) {
            setSchoolGradeOptions(resolved);
          }
        }

        const allFailed = [
          subjectsRes,
          schoolsRes,
          streamsRes,
          departmentsRes,
          courseYearsRes,
          collegesRes,
          classesRes,
        ].every((x) => x.status === "rejected");

        if (allFailed) {
          setLoadError("Unable to load dropdown data. Check your backend URL and server status.");
        }

        const failedSources = [
          ["subjects", subjectsRes],
          ["schools", schoolsRes],
          ["streams", streamsRes],
          ["departments", departmentsRes],
          ["course-years", courseYearsRes],
          ["colleges", collegesRes],
          ["classes", classesRes],
        ]
          .filter(([, result]) => result.status === "rejected")
          .map(([name]) => name);

        if (!allFailed && failedSources.length) {
          setLoadError(`Some dropdown data could not be loaded: ${failedSources.join(", ")}.`);
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Dropdown data load failed", err);
        setLoadError("Unable to load dropdown data. Check your backend URL and server status.");
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isCollege || !form.year) {
      setCourses([]);
      setCourseLoadError("");
      return;
    }

    const fetchCourses = async () => {
      setCourseLoadError("");

      try {
        const params = new URLSearchParams({ year: String(form.year) });

        if (form.department) {
          params.set("department", String(form.department));
        }

        const response = await API.get(`courses/?${params.toString()}`);
        setCourses(normalizeList(response.data));
      } catch (err) {
        console.error("Course load failed", err);
        setCourses([]);
        setCourseLoadError("Unable to load courses for the selected year.");
      }
    };

    fetchCourses();
  }, [isCollege, form.year, form.department]);

  useEffect(() => {
    if (!isSchool) return;

    // Do not clear stream/subject before dropdown data finishes loading.
    if (subjects.length === 0) return;

    setForm((prev) => {
      const nextForm = { ...prev };
      let changed = false;

      if (!isSeniorSecondary && prev.stream) {
        nextForm.stream = "";
        changed = true;
      }

      if (isSeniorSecondary && prev.stream && schoolStreamOptions.length > 0) {
        const hasStream = schoolStreamOptions.some(
          (stream) =>
            String(getEntityId(stream, ["id", "streamid", "stream_id", "pk"])) ===
            String(prev.stream)
        );

        if (!hasStream) {
          nextForm.stream = "";
          changed = true;
        }
      }

      if (prev.subject && displaySchoolSubjects.length > 0) {
        const hasSubject = displaySchoolSubjects.some(
          (subject) =>
            String(getEntityId(subject, ["id", "subjectid"])) === String(prev.subject)
        );

        if (!hasSubject) {
          nextForm.subject = "";
          changed = true;
        }
      }

      return changed ? nextForm : prev;
    });
  }, [
    isSchool,
    isSeniorSecondary,
    subjects.length,
    displaySchoolSubjects,
    schoolStreamOptions,
  ]);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateStep = (currentStep) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!form.username.trim()) {
        nextErrors.username = "Username is required.";
      }

      if (!form.name.trim()) {
        nextErrors.name = "Full name is required.";
      }

      if (!form.email.trim()) {
        nextErrors.email = "Email is required.";
      } else if (!validateEmail(form.email)) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (!form.password) {
        nextErrors.password = "Password is required.";
      } else if (form.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }

      if (!form.gender) {
        nextErrors.gender = "Please select a gender.";
      }
    }

    if (currentStep === 3) {
      if (!form.year) {
        nextErrors.year = "Please select your grade or year.";
      }

      if (isSchool && !form.college.trim()) {
        nextErrors.college = "Please select your school.";
      }

      if (isCollege && !form.college.trim()) {
        nextErrors.college = "Please select your college.";
      }
    }

    if (currentStep === 4) {
      if (isSchool) {
        if (isSeniorSecondary && !form.stream) {
          nextErrors.stream = "Please select a stream.";
        }

        if (!form.subject) {
          nextErrors.subject = "Please select a subject.";
        }
      }

      if (isCollege) {
        if (!form.department) {
          nextErrors.department = "Please select a department.";
        }

        if (!form.course) {
          nextErrors.course = "Please select a course.";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nextForm = { ...prev, [name]: value };

      if (name === "year") {
        nextForm.subject = "";
        if (isSchool) nextForm.stream = "";
        if (isCollege) nextForm.course = "";
      }

      if (name === "stream") {
        nextForm.subject = "";
      }

      if (name === "college" && isCollege) {
        nextForm.department = "";
        nextForm.course = "";
      }

      if (name === "department" && isCollege) {
        nextForm.course = "";
      }

      return nextForm;
    });

    if (["year", "stream", "subject", "college", "department", "course"].includes(name)) {
      setIsFaceVerified(false);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "year" ? { subject: "", stream: "", course: "" } : {}),
      ...(name === "stream" ? { subject: "" } : {}),
      ...(name === "department" ? { course: "" } : {}),
    }));
  };

  const next = () => {
    const stepToValidate = step === 1 || step === 3 ? step : null;

    if (stepToValidate && !validateStep(stepToValidate)) return;

    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => s - 1);

  const getSafeSignupDraft = (faceVerified = false) => {
    return {
      step: 4,
      role,
      institution,
      form,
      faceVerified,
    };
  };

  const goToFaceVerification = () => {
    if (!validateStep(4)) return;

    const signupDraft = getSafeSignupDraft(false);

    localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(signupDraft));

    navigate("/face-verification", {
      state: { signupDraft },
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    const url = role === "teacher" ? "register/teacher/" : "register/student/";

    const payload = {
      username: form.username,
      password: form.password,
      email: form.email,
      name: form.name,
      gender: form.gender,

      ...(isSchool && {
        class_name: form.year,
        school: form.college,
        subject: form.subject,
        ...(form.stream ? { stream: form.stream } : {}),
      }),

      ...(isCollege && {
        college: form.college,
        department: form.department,
        course: form.course,
      }),
    };

    try {
      setIsSubmittingSignup(true);

      await API.post(url, payload);

      localStorage.removeItem(SIGNUP_DRAFT_KEY);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
      alert(JSON.stringify(err.response?.data || err.message || "Registration failed."));
      setIsSubmittingSignup(false);
    }
  };
  // ✅ ADD THIS NEW PART
  useEffect(() => {
    if (!isFaceVerified) return;
    if (!role || !institution) return;

    handleSubmit();
  }, [isFaceVerified]);


  const handleInterestsComplete = () => {
    localStorage.setItem("user_interests", JSON.stringify(selectedInterests));

    if (role === "teacher") {
      navigate("/teacher/home", { replace: true });
    } else {
      navigate("/student/home", { replace: true });
    }
  };

  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const goToLogin = () => {
    localStorage.removeItem(SIGNUP_DRAFT_KEY);
    navigate("/login", { replace: true });
  };

  const s = {
    input: {
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
    },
    btn: {
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
    },
    btnOutline: {
      width: "100%",
      padding: "11px 0",
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 15,
      background: "transparent",
      color: "white",
      border: "1px solid rgba(255,255,255,0.35)",
      cursor: "pointer",
      marginTop: 8,
    },
    error: {
      color: "#fca5a5",
      fontSize: 12,
      marginTop: -8,
      marginBottom: 8,
    },
    hint: {
      color: "rgba(245,197,24,0.75)",
      fontSize: 12,
      marginTop: -8,
      marginBottom: 8,
    },
  };

  const optionStyle = { color: "#111", background: "#fff" };

  const stepTitles = [
    "Who are you?",
    "Your Details",
    "Institution",
    "Your Info",
    "Academics",
    "Your Interests",
  ];

  const interestCategories = [
    {
      title: "Innovation & Research",
      items: ["Robotics", "AI & ML", "Space Science", "Inventions", "Research"],
    },
    {
      title: "Coding & Technology",
      items: ["Web Dev", "App Dev", "Python", "Game Dev", "Tech News"],
    },
    {
      title: "Reading & Writing",
      items: ["Poetry", "Fiction", "Non-Fiction", "Writing", "Journaling"],
    },
  ];

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
          width: "min(440px, 92vw)",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 28,
          padding: "36px 32px",
          color: "white",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={logo}
            alt="SAHA"
            style={{
              width: 52,
              borderRadius: "50%",
              marginBottom: 8,
              boxShadow: "0 0 16px rgba(245,197,24,0.4)",
              display: "block",
              margin: "0 auto 8px",
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

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background:
                  i === step
                    ? "#F5C518"
                    : i < step
                      ? "rgba(245,197,24,0.5)"
                      : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
              }}
            />
          ))}
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
          {stepTitles[step]}
        </h2>
        {isSubmittingSignup && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>⏳</div>

            <h3 style={{ marginBottom: 8 }}>
              Creating your account...
            </h3>

            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
              Please wait while we finish your signup.
            </p>
          </div>
        )}

        {!isSubmittingSignup && step === 0 && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {[
                { val: "student", icon: "🎓", label: "Student", sub: "Learn & grow" },
                { val: "teacher", icon: "👨‍🏫", label: "Teacher", sub: "Teach & inspire" },
              ].map(({ val, icon, label, sub }) => (
                <div
                  key={val}
                  onClick={() => setRole(val)}
                  style={{
                    flex: 1,
                    padding: "18px 12px",
                    borderRadius: 16,
                    textAlign: "center",
                    cursor: "pointer",
                    background:
                      role === val ? "rgba(245,197,24,0.18)" : "rgba(255,255,255,0.06)",
                    border:
                      role === val
                        ? "2px solid #F5C518"
                        : "1px solid rgba(255,255,255,0.15)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontWeight: 700, color: "white" }}>{label}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.55)",
                      marginTop: 2,
                    }}
                  >
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            <button disabled={!role} onClick={next} style={{ ...s.btn, opacity: role ? 1 : 0.45 }}>
              Continue
            </button>
          </>
        )}

        {!isSubmittingSignup && step === 1 && (
          <>
            <input
              name="username"
              value={form.username}
              placeholder="Username"
              style={s.input}
              onChange={handleChange}
            />
            {errors.username && <p style={s.error}>{errors.username}</p>}

            <input
              name="name"
              value={form.name}
              placeholder="Full Name"
              style={s.input}
              onChange={handleChange}
            />
            {errors.name && <p style={s.error}>{errors.name}</p>}

            <input
              name="email"
              value={form.email}
              placeholder="Email"
              style={s.input}
              onChange={handleChange}
            />
            {errors.email && <p style={s.error}>{errors.email}</p>}

            <input
              name="password"
              value={form.password}
              type="password"
              placeholder="Password"
              style={s.input}
              onChange={handleChange}
            />
            {errors.password && <p style={s.error}>{errors.password}</p>}

            <select name="gender" value={form.gender} style={s.input} onChange={handleChange}>
              <option value="" style={optionStyle}>
                Gender
              </option>
              <option value="male" style={optionStyle}>
                Male
              </option>
              <option value="female" style={optionStyle}>
                Female
              </option>
            </select>
            {errors.gender && <p style={s.error}>{errors.gender}</p>}

            <button onClick={next} style={s.btn}>
              Next
            </button>
            <button onClick={prev} style={s.btnOutline}>
              Back
            </button>
          </>
        )}

        {!isSubmittingSignup && step === 2 && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {[
                { val: "school", icon: "🏫", label: "School" },
                { val: "college", icon: "🎓", label: "College" },
              ].map(({ val, icon, label }) => (
                <div
                  key={val}
                  onClick={() => setInstitution(val)}
                  style={{
                    flex: 1,
                    padding: "18px 12px",
                    borderRadius: 16,
                    textAlign: "center",
                    cursor: "pointer",
                    background:
                      institution === val
                        ? "rgba(245,197,24,0.18)"
                        : "rgba(255,255,255,0.06)",
                    border:
                      institution === val
                        ? "2px solid #F5C518"
                        : "1px solid rgba(255,255,255,0.15)",
                    transition: "all 0.2s",
                    fontSize: 16,
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{icon}</div>
                  {label}
                </div>
              ))}
            </div>

            <button
              disabled={!institution}
              onClick={next}
              style={{ ...s.btn, opacity: institution ? 1 : 0.45 }}
            >
              Continue
            </button>

            <button onClick={prev} style={s.btnOutline}>
              Back
            </button>
          </>
        )}

        {!isSubmittingSignup && step === 3 && (
          <>
            <select name="year" value={form.year} style={s.input} onChange={handleChange}>
              <option value="" style={optionStyle}>
                Select Year / Grade
              </option>

              {isSchool &&
                schoolGradeOptions.map((option) => (
                  <option key={option.value} value={option.value} style={optionStyle}>
                    {option.label}
                  </option>
                ))}

              {isCollege &&
                collegeYearOptions.map((option) => (
                  <option key={option.value} value={option.value} style={optionStyle}>
                    {option.label}
                  </option>
                ))}
            </select>
            {errors.year && <p style={s.error}>{errors.year}</p>}

            {isSchool && (
              <>
                <select name="college" value={form.college} style={s.input} onChange={handleChange}>
                  <option value="" style={optionStyle}>
                    Select School
                  </option>

                  {schools.map((school) => (
                    <option
                      key={getEntityId(school, ["id", "schoolid", "school_id", "pk"])}
                      value={getEntityId(school, ["id", "schoolid", "school_id", "pk"])}
                      style={optionStyle}
                    >
                      {getEntityLabel(
                        school,
                        ["school_name", "schoolname", "name", "title"],
                        "Unnamed School"
                      )}
                    </option>
                  ))}
                </select>

                {!schools.length && !loadError ? (
                  <p style={s.hint}>No schools available to select.</p>
                ) : null}

                {errors.college && <p style={s.error}>{errors.college}</p>}
              </>
            )}

            {isCollege && (
              <>
                <select name="college" value={form.college} style={s.input} onChange={handleChange}>
                  <option value="" style={optionStyle}>
                    Select College
                  </option>

                  {colleges.map((c) => (
                    <option
                      key={getEntityId(c, ["id", "collegeid", "college_id", "pk"])}
                      value={getEntityId(c, ["id", "collegeid", "college_id", "pk"])}
                      style={optionStyle}
                    >
                      {getEntityLabel(
                        c,
                        ["college_name", "collegename", "name", "title"],
                        "Unnamed College"
                      )}
                    </option>
                  ))}
                </select>

                {!colleges.length && !loadError ? (
                  <p style={s.hint}>No colleges available to select.</p>
                ) : null}

                {errors.college && <p style={s.error}>{errors.college}</p>}
              </>
            )}

            <button onClick={next} style={s.btn}>
              Next
            </button>
            <button onClick={prev} style={s.btnOutline}>
              Back
            </button>
          </>
        )}

        {!isSubmittingSignup && step === 4 && (
          <>
            {loadError && (
              <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>
                {loadError}
              </div>
            )}

            {isSchool && (
              <>
                {isSeniorSecondary && (
                  <>
                    <p style={s.hint}>Select your stream first — subjects are filtered accordingly.</p>

                    <select
                      name="stream"
                      value={form.stream}
                      style={s.input}
                      onChange={handleChange}
                      disabled={!form.year}
                    >
                      <option value="" style={optionStyle}>
                        {!form.year ? "Select Grade First" : "Select Stream"}
                      </option>

                      {schoolStreamOptions.map((stream) => (
                        <option
                          key={getEntityId(stream, ["id", "streamid", "stream_id", "pk"])}
                          value={getEntityId(stream, ["id", "streamid", "stream_id", "pk"])}
                          style={optionStyle}
                        >
                          {getEntityLabel(
                            stream,
                            ["stream_name", "streamname", "name", "title"],
                            "Unnamed Stream"
                          )}
                        </option>
                      ))}
                    </select>

                    {form.year && schoolStreamOptions.length === 0 && (
                      <p style={s.error}>No streams available for the selected class.</p>
                    )}

                    {errors.stream && <p style={s.error}>{errors.stream}</p>}
                  </>
                )}

                <select
                  name="subject"
                  value={form.subject}
                  style={s.input}
                  onChange={handleChange}
                  disabled={!form.year || (isSeniorSecondary && !form.stream)}
                >
                  <option value="" style={optionStyle}>
                    {!form.year
                      ? "Select Grade First"
                      : isSeniorSecondary && !form.stream
                        ? "Select Stream First"
                        : "Select Subject"}
                  </option>

                  {displaySchoolSubjects.map((sub) => (
                    <option
                      key={getEntityId(sub, ["id", "subjectid"])}
                      value={getEntityId(sub, ["id", "subjectid"])}
                      style={optionStyle}
                    >
                      {getEntityLabel(sub, ["subject_name", "subjectname", "name"], "Unnamed Subject")}
                    </option>
                  ))}
                </select>

                {isClassTen && displaySchoolSubjects.length === 0 && (
                  <p style={s.error}>No subjects found for class 10. Please add subjects in admin.</p>
                )}

                {isSeniorSecondary && form.stream && displaySchoolSubjects.length === 0 && (
                  <p style={s.error}>
                    No subjects found for the selected stream. Please add subjects in admin.
                  </p>
                )}

                {errors.subject && <p style={s.error}>{errors.subject}</p>}
              </>
            )}

            {isCollege && (
              <>
                <select
                  name="department"
                  value={form.department}
                  style={s.input}
                  onChange={handleChange}
                >
                  <option value="" style={optionStyle}>
                    Select Department
                  </option>

                  {departments.map((d) => (
                    <option
                      key={getEntityId(d, ["id", "departmentid", "pk"])}
                      value={getEntityId(d, ["id", "departmentid", "pk"])}
                      style={optionStyle}
                    >
                      {getEntityLabel(
                        d,
                        ["department_name", "departmentname", "name"],
                        "Unnamed Department"
                      )}
                    </option>
                  ))}
                </select>
                {errors.department && <p style={s.error}>{errors.department}</p>}

                <select
                  name="course"
                  value={form.course}
                  style={s.input}
                  onChange={handleChange}
                  disabled={!form.year}
                >
                  <option value="" style={optionStyle}>
                    {!form.year ? "Select Year First" : "Select Course"}
                  </option>

                  {displayCollegeCourses.map((c) => (
                    <option
                      key={getEntityId(c, ["id", "courseid", "pk"])}
                      value={getEntityId(c, ["id", "courseid", "pk"])}
                      style={optionStyle}
                    >
                      {getEntityLabel(c, ["course_name", "coursename", "name"], "Unnamed Course")}
                    </option>
                  ))}
                </select>

                {courseLoadError && <p style={s.error}>{courseLoadError}</p>}
                {errors.course && <p style={s.error}>{errors.course}</p>}
              </>
            )}

            {isFaceVerified ? (
              <button onClick={handleSubmit} style={s.btn}>
                Create Account
              </button>
            ) : (
              <button onClick={goToFaceVerification} style={s.btn}>
                Next
              </button>
            )}

            <button onClick={prev} style={s.btnOutline}>
              Back
            </button>
          </>
        )}

        {!isSubmittingSignup && step === 5 && (
          <>
            <p style={s.hint}>
              Pick a few topics you care about. We’ll personalize your feed.
            </p>

            {interestCategories.map((category) => (
              <div key={category.title} style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{category.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {category.items.map((item) => {
                    const isSelected = selectedInterests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: isSelected
                            ? "1px solid #F5C518"
                            : "1px solid rgba(255,255,255,0.35)",
                          background: isSelected ? "#F5C518" : "rgba(255,255,255,0.08)",
                          color: isSelected ? "#1a1a1a" : "white",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleInterestsComplete}
              style={s.btn}
              disabled={selectedInterests.length === 0}
            >
              Finish
            </button>
            <button type="button" onClick={prev} style={s.btnOutline}>
              Back
            </button>
          </>
        )}

        {!isSubmittingSignup && (
          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Already have an account?{" "}
            <button
              type="button"
              onClick={goToLogin}
              style={{
                color: "#059669",
                fontWeight: 600,
                textDecoration: "none",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}