export type ModalMode = "none" | "create" | "edit" | "lessons";
export type CreateStep = "info" | "lessons";
export type UploadStatus = "pending" | "uploading" | "done" | "error";

export interface LessonDraft {
  uid: string;
  title: string;
  description?: string;
  file: File | null;
  status: UploadStatus;
  errorMsg?: string;
}

export interface Course {
  courseId: number;
  title: string;
  description?: string;
  price?: number;
  studentCount?: number;
  ratingAvg?: number;
}

export interface Lesson {
  lessonId: number;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
}

export const statusIcon: Record<UploadStatus, string> = {
  pending: "⬜",
  uploading: "⏳",
  done: "✅",
  error: "❌",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e0e0e0",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export const btnPrimary: React.CSSProperties = {
  background: "#20B486",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "11px 22px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export const btnSecondary: React.CSSProperties = {
  background: "#f5f5f5",
  color: "#555",
  border: "none",
  borderRadius: 10,
  padding: "11px 22px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
