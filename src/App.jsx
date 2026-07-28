import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Signup from "./pages/signup";
import Login from "./pages/login";
import FaceVerification from "./pages/FaceVerification";
import LogoutPopup from "./pages/LogoutPopup";
import CreatePost from "./pages/createpost";

// Teacher
import TeacherHome from "./pages/teacher/teacherhome";
import TeacherTuition from "./pages/teacher/TeacherTuition";
import TeacherTask from "./pages/teacher/TeacherTask";
import TeacherFollowing from "./pages/teacher/TeacherFollowing";

import ViewClasses from "./pages/teacher/ViewClasses";
import TuitionClassDetail from "./pages/teacher/TuitionClassDetail";


// Admin
import AdminHome from "./pages/admin/AdminHome";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminStates from "./pages/admin/AdminStates";
import AdminDistricts from "./pages/admin/AdminDistricts";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminColleges from "./pages/admin/AdminColleges";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminCollegeDepartments from "./pages/admin/AdminCollegeDepartments";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseDetail from "./pages/admin/AdminCourseDetail";
import ReportedPosts from "./pages/admin/ReportedPosts";

import TeacherCommunities from "./pages/teacher/TeacherCommunities";
import CreateCommunity from "./pages/teacher/CreateCommunity";
import CommunityFeed from "./pages/teacher/CommunityFeed";
import CommunityDetail from "./pages/teacher/CommunityDetail";
import CommunityEdit from "./pages/teacher/CommunityEdit";
import CommunityPermissions from "./pages/teacher/CommunityPermissions";
import CommunityAllMembers from "./pages/teacher/CommunityAllMembers";
import AddMembers from "./pages/teacher/AddMembers";

import StudentHome from "./pages/student/StudentHome";
import StudentTuition from "./pages/student/StudentTuition";
import TaskSubmission from "./pages/student/TaskSubmission";
import StudentTaskList from "./pages/student/StudentTaskList";
import StudentCommunity from "./pages/student/StudentCommunity";
import StudentCommunityDetail from "./pages/student/StudentCommunityDetail";
import StudentFollowing from "./pages/student/StudentFollowing";
import StudentRequests from "./pages/student/StudentRequests";

// Chat
import ChatWidget from "./components/chat/ChatWidget";
import { WebSocketChatProvider } from "./context/WebSocketChatContext";

// ✅ LMS PAGES (ADD THESE)
import TeacherCourses from "./pages/teacher/TeacherCourses";
import CourseCreate from "./pages/teacher/CourseCreate";
import CourseView from "./pages/teacher/CourseView";
import CourseEdit from "./pages/teacher/CourseEdit";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseDetail from "./pages/student/StudentCourseDetail";
import StudentCoursePayment from "./pages/student/StudentCoursePayment";
import StudentPaymentSuccess from "./pages/student/StudentPaymentSuccess";
import StudentLearningPage from "./pages/student/StudentLearningPage";
import StudentCertificate from "./pages/student/StudentCertificate";
import StudentMyCourses from "./pages/student/StudentMyCourses";
import CourseDetail from "./pages/teacher/CourseDetail";
import StudentCollections from "./pages/student/StudentCollections";

function App() {
  return (
    <Router>
      <WebSocketChatProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/face-verification" element={<FaceVerification />} />
          <Route path="/logout" element={<LogoutPopup />} />

          {/* Teacher */}
          <Route path="/teacher/home" element={<TeacherHome />} />
          <Route path="/teacher/following" element={<TeacherFollowing />} />
          <Route path="/teacher/tuition" element={<TeacherTuition />} />
          <Route path="/teacher/tuition/classes" element={<ViewClasses />} />
          <Route path="/teacher/tuition/classes/:id" element={<TuitionClassDetail />} />
          <Route path="/teacher/tasks" element={<TeacherTask />} />
          <Route path="/teacher/create-post" element={<CreatePost />} />
          <Route path="/teacher/communities" element={<TeacherCommunities />} />
          <Route path="/teacher/community/create" element={<CreateCommunity />} />
          <Route path="/teacher/community/:id" element={<CommunityDetail />} />
          <Route path="/teacher/community/:id/edit" element={<CommunityEdit />} />
          <Route path="/teacher/community/:id/feed" element={<CommunityFeed />} />
          <Route path="/teacher/community/:id/members" element={<CommunityAllMembers />} />
          <Route path="/teacher/community/:id/all-members" element={<CommunityAllMembers />} />
          <Route path="/teacher/community/:id/add-members" element={<AddMembers />} />

          {/* Student */}
          <Route path="/student/home" element={<StudentHome />} />
          <Route path="/student/create-post" element={<CreatePost />} />
          <Route path="/student/tuition" element={<StudentTuition />} />
          <Route path="/student/tasks" element={<StudentTaskList />} />
          <Route path="/student/task/:id" element={<TaskSubmission />} />
          <Route path="/student/communities" element={<StudentCommunity />} />
          <Route path="/student/communities/:id" element={<CommunityDetail />} />
          <Route path="/student/community/:id" element={<CommunityDetail />} />
          <Route path="/student/community/:id/feed" element={<CommunityFeed />} />
          <Route path="/student/communities/:id/feed" element={<CommunityFeed />} />
          <Route path="/student/following" element={<StudentFollowing />} />
          <Route path="/student/requests" element={<StudentRequests />} />

          {/* Admin */}
          <Route path="/admin/home" element={<AdminHome />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/states" element={<AdminStates />} />
          <Route path="/admin/districts" element={<AdminDistricts />} />
          <Route path="/admin/schools" element={<AdminSchools />} />
          <Route path="/admin/colleges" element={<AdminColleges />} />
          <Route path="/admin/classes" element={<AdminClasses />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/course/:id" element={<AdminCourseDetail />} />
          <Route path="/admin/college-departments" element={<AdminCollegeDepartments />} />
          <Route path="/admin/data" element={<AdminDashboard />} />
          <Route path="/admin/reported-posts" element={<ReportedPosts />} />
          <Route path="/teacher/create-post" element={<CreatePost />} />
          <Route path="/teacher/communities" element={<TeacherCommunities />} />
          <Route path="/teacher/community/create" element={<CreateCommunity />} />
          <Route path="/teacher/community/:id" element={<CommunityFeed />} />
          <Route path="/teacher/community/:id/edit" element={<CommunityEdit />} />
          <Route path="/teacher/community/:id/permissions" element={<CommunityPermissions />} />
          <Route path="/teacher/community/:id/all-members" element={<CommunityAllMembers />} />
          <Route path="/teacher/community/:id/feed" element={<CommunityFeed />} />
          <Route path="/teacher/community/:id/add-members" element={<AddMembers />} />
          <Route path="/student/home" element={<StudentHome />} />
          {/* ───────────── LMS SYSTEM ───────────── */}
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/courses/create" element={<CourseCreate />} />
          <Route path="/teacher/courses/:id" element={<CourseView />} />
          <Route path="/teacher/courses/:id/edit" element={<CourseEdit />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/collections" element={<StudentCollections />} />
          <Route path="/student/courses/:id" element={<StudentCourseDetail />} />
          <Route path="/student/courses/:id/payment" element={<StudentCoursePayment />} />
          <Route path="/student/courses/:id/payment-success" element={<StudentPaymentSuccess />} />
          <Route path="/student/courses/:id/learn" element={<StudentLearningPage />} />
          <Route path="/student/certificate/:id" element={<StudentCertificate />} />
          <Route path="/student/my-courses" element={<StudentMyCourses />} />
          <Route path="/student/create-post" element={<CreatePost />} />
          <Route path="/student/tuition" element={<StudentTuition />} />
          <Route path="/student/tasks" element={<StudentTaskList />} />
          <Route path="/student/task/:id" element={<TaskSubmission />} />
          <Route path="/student/communities" element={<StudentCommunity />} />
          <Route path="/student/communities/:id" element={<StudentCommunityDetail />} />
          <Route path="/student/requests" element={<StudentRequests />} />
          <Route path="/student/following" element={<StudentFollowing />} />
        </Routes>

        {/* Chat always visible */}
        <ChatWidget />
      </WebSocketChatProvider>
    </Router>
  );
}

export default App;