import Link from "next/link";
import { Course } from "./types";

interface Props {
  course: Course;
  onLessons: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}

export default function CourseCard({ course, onLessons, onEdit, onDelete }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "22px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1.5px solid #eadfd3",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          background: "linear-gradient(135deg,#d00000,#9d0208)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
          color: "#fff",
          fontWeight: 800,
        }}
      >
        {course.title.charAt(0)}
      </div>

      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#03071e",
            marginBottom: 4,
          }}
        >
          {course.title}
        </h3>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888" }}>
          <span>👥 {course.studentCount ?? 0}명</span>
          <span>⭐ {(course.ratingAvg ?? 0).toFixed(1)}</span>
          <span>₩{(course.price ?? 0).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onLessons(course)}
          style={{
            background: "#fff0df",
            color: "#d00000",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          레슨 관리
        </button>
        <Link
          href={`/instructor/courses/${course.courseId}`}
          style={{
            background: "#f0f4ff",
            color: "#5a7fcc",
            textDecoration: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          수강자 보기
        </Link>
        <button
          onClick={() => onEdit(course)}
          style={{
            background: "#fff",
            color: "#555",
            border: "1.5px solid #ddd",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          수정
        </button>
        <button
          onClick={() => onDelete(course)}
          style={{
            background: "#fff",
            color: "#ff4d4f",
            border: "1.5px solid #ffcdd2",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
