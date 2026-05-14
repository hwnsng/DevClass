import { useRef, useState } from "react";
import {
  CreateStep,
  LessonDraft,
  btnPrimary,
  btnSecondary,
  inputStyle,
  statusIcon,
} from "./types";
import { apiUpload } from "@/app/lib/api";

interface CourseForm {
  title: string;
  description: string;
  price: string;
}

interface Props {
  step: CreateStep;
  courseForm: CourseForm;
  lessonDrafts: LessonDraft[];
  isSubmitting: boolean;
  formError: string;
  createdCourseId: number | null;
  onCourseFormChange: (key: keyof CourseForm, value: string) => void;
  onNextStep: () => void;
  onUpdateDraft: (uid: string, patch: Partial<LessonDraft>) => void;
  onUploadLesson: (draft: LessonDraft, order: number) => void;
  onAddDraft: () => void;
  onFinish: () => void;
  onClose: () => void;
}

export default function CreateCourseModal({
  step,
  courseForm,
  lessonDrafts,
  isSubmitting,
  formError,
  createdCourseId,
  onCourseFormChange,
  onNextStep,
  onUpdateDraft,
  onUploadLesson,
  onAddDraft,
  onFinish,
  onClose,
}: Props) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 40,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 진행 바 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["info", "lessons"] as CreateStep[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  step === "lessons" || (step === "info" && i === 0)
                    ? "#20B486"
                    : "#e0e0e0",
              }}
            />
          ))}
        </div>

        {step === "info" ? (
          <StepInfo
            form={courseForm}
            isSubmitting={isSubmitting}
            error={formError}
            onChange={onCourseFormChange}
            onNext={onNextStep}
            onClose={onClose}
          />
        ) : (
          <StepLessons
            lessonDrafts={lessonDrafts}
            fileInputRefs={fileInputRefs}
            createdCourseId={createdCourseId}
            onUpdateDraft={onUpdateDraft}
            onUploadLesson={onUploadLesson}
            onAddDraft={onAddDraft}
            onFinish={onFinish}
          />
        )}
      </div>
    </div>
  );
}

function StepInfo({
  form,
  isSubmitting,
  error,
  onChange,
  onNext,
  onClose,
}: {
  form: { title: string; description: string; price: string };
  isSubmitting: boolean;
  error: string;
  onChange: (key: "title" | "description" | "price", value: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const fields = [
    { key: "title" as const, label: "강의 제목 *", placeholder: "강의 제목을 입력하세요" },
    { key: "description" as const, label: "강의 설명", placeholder: "강의 설명을 입력하세요" },
    { key: "price" as const, label: "가격 (원)", placeholder: "예: 30000 (무료는 0)" },
  ];

  return (
    <>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>
        새 강의 만들기
      </h3>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Step 1 / 2 — 강의 기본 정보를 입력하세요.
      </p>

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
              onChange={(e) => onChange(f.key, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {error && <p style={{ color: "#ff4d4f", fontSize: 13, marginTop: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button onClick={onClose} style={{ ...btnSecondary, flex: 1 }}>취소</button>
        <button
          onClick={onNext}
          disabled={isSubmitting}
          style={{ ...btnPrimary, flex: 1, opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? "생성 중..." : "다음 →"}
        </button>
      </div>
    </>
  );
}

function StepLessons({
  lessonDrafts,
  fileInputRefs,
  createdCourseId,
  onUpdateDraft,
  onUploadLesson,
  onAddDraft,
  onFinish,
}: {
  lessonDrafts: LessonDraft[];
  fileInputRefs: React.RefObject<Record<string, HTMLInputElement | null>>;
  createdCourseId: number | null;
  onUpdateDraft: (uid: string, patch: Partial<LessonDraft>) => void;
  onUploadLesson: (draft: LessonDraft, order: number) => void;
  onAddDraft: () => void;
  onFinish: () => void;
}) {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailStatus, setThumbnailStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [thumbnailError, setThumbnailError] = useState("");

  const handleThumbnailUpload = async () => {
    if (!thumbnailFile || !createdCourseId) return;
    setThumbnailStatus("uploading");
    setThumbnailError("");
    try {
      const fd = new FormData();
      fd.append("file", thumbnailFile);
      await apiUpload(`/courses/${createdCourseId}/thumbnail`, fd);
      setThumbnailStatus("done");
    } catch (e: any) {
      setThumbnailStatus("error");
      setThumbnailError(e.message);
    }
  };

  return (
    <>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>
        레슨 추가
      </h3>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Step 2 / 2 — 썸네일과 레슨을 업로드하세요.
      </p>

      {/* 썸네일 업로드 */}
      <div style={{
        border: "1.5px dashed #c0e8d8",
        borderRadius: 12,
        padding: 16,
        background: thumbnailStatus === "done" ? "#f0faf5" : "#f8fdf9",
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#20B486", marginBottom: 10 }}>
          {thumbnailStatus === "done" ? "✅ 썸네일 업로드 완료" : "📷 강의 썸네일 (선택)"}
        </p>
        {thumbnailStatus !== "done" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              style={{ flex: 1, fontSize: 13 }}
            />
            <button
              onClick={handleThumbnailUpload}
              disabled={!thumbnailFile || thumbnailStatus === "uploading"}
              style={{
                ...btnPrimary,
                padding: "8px 14px",
                fontSize: 13,
                opacity: !thumbnailFile || thumbnailStatus === "uploading" ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {thumbnailStatus === "uploading" ? "업로드 중..." : "업로드"}
            </button>
          </div>
        )}
        {thumbnailError && <p style={{ color: "#ff4d4f", fontSize: 12, marginTop: 6 }}>{thumbnailError}</p>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lessonDrafts.map((draft, idx) => (
          <div
            key={draft.uid}
            style={{
              border: "1.5px solid #e0e0e0",
              borderRadius: 12,
              padding: 16,
              background: draft.status === "done" ? "#f0faf5" : "#fafafa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{statusIcon[draft.status]}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{idx + 1}강</span>
            </div>
            <input
              type="text"
              placeholder="레슨 제목"
              value={draft.title}
              disabled={draft.status === "done"}
              onChange={(e) => onUpdateDraft(draft.uid, { title: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="레슨 설명 (선택)"
              value={draft.description ?? ""}
              disabled={draft.status === "done"}
              onChange={(e) => onUpdateDraft(draft.uid, { description: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={(el) => { if (fileInputRefs.current) fileInputRefs.current[draft.uid] = el; }}
                type="file"
                accept="video/mp4"
                disabled={draft.status === "done"}
                onChange={(e) => onUpdateDraft(draft.uid, { file: e.target.files?.[0] ?? null })}
                style={{ flex: 1, fontSize: 13 }}
              />
              {draft.status !== "done" && (
                <button
                  onClick={() => onUploadLesson(draft, idx + 1)}
                  disabled={draft.status === "uploading"}
                  style={{
                    ...btnPrimary,
                    padding: "8px 16px",
                    fontSize: 13,
                    opacity: draft.status === "uploading" ? 0.7 : 1,
                    flexShrink: 0,
                  }}
                >
                  {draft.status === "uploading" ? "업로드 중..." : "업로드"}
                </button>
              )}
            </div>
            {draft.status === "error" && (
              <p style={{ color: "#ff4d4f", fontSize: 12, marginTop: 6 }}>{draft.errorMsg}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onAddDraft}
        style={{
          ...btnSecondary,
          width: "100%",
          marginTop: 12,
          border: "1.5px dashed #ccc",
          background: "#fafafa",
        }}
      >
        + 레슨 추가
      </button>

      <button onClick={onFinish} style={{ ...btnPrimary, width: "100%", marginTop: 20 }}>
        완료
      </button>
      <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 10 }}>
        완료 후에도 레슨 관리에서 추가/수정할 수 있습니다.
      </p>
    </>
  );
}
