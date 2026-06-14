"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { apiFetch } from "@/app/lib/api";

export default function StudentsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch(`/courses/${courseId}`),
      apiFetch(`/courses/${courseId}/students`),
    ])
      .then(([courseData, studentData]) => {
        setCourse(courseData);
        setStudents(studentData ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#aaa" }}>불러오는 중...</p>
    </div>
  );

  if (error || !course) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <span style={{ fontSize: 64 }}>😅</span>
      <h2>강의 정보 없음</h2>
      <Link href="/instructor" style={{ color: "#d00000", fontWeight: 600, textDecoration: "none" }}>← 대시보드로</Link>
    </div>
  );

  const avg = students.length
    ? Math.round(students.reduce((s: number, st: any) => s + (st.progressPercent ?? 0), 0) / students.length)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#fffaf1" }}>
      <Navbar active="강사" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <Link href="/instructor" style={{ color: "#d00000", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
          ← 대시보드로
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#03071e", margin: "16px 0 6px" }}>
          {course.title}
        </h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32 }}>수강자 목록</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "총 수강생", value: `${students.length}명`, icon: "👥" },
            { label: "평균 진도율", value: `${avg}%`, icon: "📊" },
            { label: "완료", value: `${students.filter((s: any) => s.progressPercent === 100).length}명`, icon: "✅" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#d00000" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {students.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", color: "#aaa", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p>아직 수강생이 없습니다.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "16px 24px", background: "#fffaf1", borderBottom: "1px solid #eee", fontSize: 13, fontWeight: 700, color: "#888" }}>
              <span>수강생</span>
              <span>진도율</span>
              <span>수강 시작일</span>
            </div>
            {students.map((s: any) => (
              <div key={s.userId} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "18px 24px", borderBottom: "1px solid #f5f5f5", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#d00000,#9d0208)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>
                    {s.name?.[0] ?? "?"}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#03071e" }}>{s.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.progressPercent}%`, background: "linear-gradient(90deg,#d00000,#9d0208)", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#333", minWidth: 36 }}>{s.progressPercent}%</span>
                </div>
                <span style={{ fontSize: 14, color: "#888" }}>{s.enrolledAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
