import { useParams } from "react-router-dom";
import TeacherLayout from "../../components/teacher/TeacherLayout";

// This component is a copy of TuitionClassDetail, but can be customized for tasks
const TuitionClassTasks = () => {
  const { id } = useParams();
  // You can add state/logic here for tasks

  // For now, reuse TuitionClassDetail's structure
  // TODO: Add task assignment UI here
  return (
    <TeacherLayout>
      <div className="class-detail-layout">
        <div className="class-detail-left">
          <div className="class-welcome">
            <h2>Class Tasks</h2>
            <p>Assign and manage tasks for all students in this class.</p>
          </div>
          {/* Add more UI for tasks here */}
        </div>
        <div className="class-detail-shell">
          {/* You can reuse or import sections from TuitionClassDetail here */}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TuitionClassTasks;
