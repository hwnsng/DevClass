import { useState } from "react";
import { apiFetch, apiUpload } from "@/app/lib/api";
import { Course, Lesson, btnPrimary, btnSecondary, inputStyle } from "./types";
import ConfirmToast from "@/app/components/ConfirmToast";

interface Props {
  course: Course;
  lessons: Lesson[];
  onLessonsChange: (lessons: Lesson[]) => void;
  onClose: () => void;
}

export default function LessonManageModal({
  course,
  lessons,
  onLessonsChange,
  onClose,
}: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pendingDeleteLesson, setPendingDeleteLesson] = useState<number | null>(null);

  // 썸네일 상태
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailDone, setThumbnailDone] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");

  const handleThumbnailUpload = async () => {
    if (!thumbnailFile) return;
    setThumbnailUploading(true);
    setThumbnailError("");
    try {
      const fd = new FormData();
      fd.append("file", thumbnailFile);
      await apiUpload(`/courses/${course.courseId}/thumbnail`, fd);
      setThumbnailDone(true);
    } catch (e: any) {
      setThumbnailError(e.message);
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) { setError("제목을 입력해주세요."); return; }
    if (!newFile) { setError("MP4 파일을 선택해주세요."); return; }

    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", newTitle.trim());
      fd.append("lessonOrder", String(lessons.length + 1));
      if (newDescription.trim()) fd.append("description", newDescription.trim());
      fd.append("file", newFile);
      await apiUpload(`/courses/${course.courseId}/lessons`, fd);

      const data = await apiFetch(`/courses/${course.courseId}`);
      onLessonsChange(data.lessons ?? []);
      setNewTitle("");
      setNewDescription("");
      setNewFile(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (lessonId: number) => {
    setPendingDeleteLesson(lessonId);
  };

  const confirmDeleteLesson = async () => {
    if (pendingDeleteLesson === null) return;
    try {
      await apiFetch(`/lessons/${pendingDeleteLesson}`, { method: "DELETE" });
      onLessonsChange(lessons.filter((l) => l.lessonId !== pendingDeleteLesson));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPendingDeleteLesson(null);
    }
  };

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
          padding: 36,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#03071e", marginBottom: 4 }}>
          레슨 관리
        </h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>{course.title}</p>

        {/* 썸네일 업로드 */}
        <div style={{
          border: "1.5px dashed #c0e8d8",
          borderRadius: 12,
          padding: 16,
          background: thumbnailDone ? "#f0faf5" : "#f8fdf9",
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#d00000", marginBottom: 10 }}>
            {thumbnailDone ? "✅ 썸네일 업로드 완료" : "📷 강의 썸네일 변경"}
          </p>
          {!thumbnailDone && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                style={{ flex: 1, fontSize: 13 }}
              />
              <button
                onClick={handleThumbnailUpload}
                disabled={!thumbnailFile || thumbnailUploading}
                style={{
                  ...btnPrimary,
                  padding: "8px 14px",
                  fontSize: 13,
                  opacity: !thumbnailFile || thumbnailUploading ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {thumbnailUploading ? "업로드 중..." : "업로드"}
              </button>
            </div>
          )}
          {thumbnailError && <p style={{ color: "#ff4d4f", fontSize: 12, marginTop: 6 }}>{thumbnailError}</p>}
        </div>

        {/* 기존 레슨 목록 */}
        {lessons.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 20 }}>아직 레슨이 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {lessons.map((l) => (
              <div
                key={l.lessonId}
                style={{
                  padding: "12px 16px",
                  border: "1.5px solid #eee",
                  borderRadius: 10,
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#d00000",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {l.order}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{l.title}</div>
                    {l.description && (
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.description}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: l.videoUrl ? "#d00000" : "#aaa", flexShrink: 0 }}>
                    {l.videoUrl ? "▶ 영상 있음" : "영상 없음"}
                  </span>
                  <button
                    onClick={() => handleDelete(l.lessonId)}
                    style={{
                      background: "#fff",
                      color: "#ff4d4f",
                      border: "1.5px solid #ffcdd2",
                      padding: "5px 12px",
                      borderRadius: 7,
                      fontSize: 12,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 새 레슨 추가 */}
        <div
          style={{
            border: "1.5px dashed #c0e8d8",
            borderRadius: 12,
            padding: 18,
            background: "#f8fdf9",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#d00000", marginBottom: 12 }}>
            + 새 레슨 추가
          </p>
          <input
            type="text"
            placeholder="레슨 제목 *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="레슨 설명 (선택)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="file"
              accept="video/mp4"
              onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              style={{ flex: 1, fontSize: 13 }}
            />
            <button
              onClick={handleAdd}
              disabled={uploading}
              style={{
                ...btnPrimary,
                padding: "8px 16px",
                fontSize: 13,
                opacity: uploading ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {uploading ? "업로드 중..." : "추가"}
            </button>
          </div>
          {error && <p style={{ color: "#ff4d4f", fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>

        <button onClick={onClose} style={{ ...btnSecondary, width: "100%" }}>
          닫기
        </button>
      </div>

      {pendingDeleteLesson !== null && (
        <ConfirmToast
          message="레슨을 삭제하시겠습니까?"
          subMessage="삭제된 레슨은 복구할 수 없습니다."
          confirmLabel="삭제"
          danger
          onConfirm={confirmDeleteLesson}
          onCancel={() => setPendingDeleteLesson(null)}
        />
      )}
    </div>
  );
}
