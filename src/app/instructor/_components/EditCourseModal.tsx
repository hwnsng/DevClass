import { useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { Course, btnPrimary, btnSecondary, inputStyle } from "./types";

interface Props {
  course: Course;
  onSaved: () => void;
  onClose: () => void;
}

export default function EditCourseModal({ course, onSaved, onClose }: Props) {
  const [form, setForm] = useState({
    title: course.title ?? "",
    description: course.description ?? "",
    price: String(course.price ?? 0),
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("강의 제목을 입력해주세요."); return; }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/courses/${course.courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price: parseInt(form.price) || 0,
        }),
      });
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: "title" as const, label: "강의 제목 *", placeholder: "강의 제목" },
    { key: "description" as const, label: "강의 설명", placeholder: "강의 설명" },
    { key: "price" as const, label: "가격 (원)", placeholder: "예: 30000" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 40,
          width: "100%",
          maxWidth: 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 24 }}>
          강의 수정
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                type={f.key === "price" ? "number" : "text"}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {error && <p style={{ color: "#ff4d4f", fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 1 }}>취소</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ ...btnPrimary, flex: 1, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
