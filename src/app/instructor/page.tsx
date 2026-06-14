"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { apiFetch, apiUpload, getLocalUserId, getAuthUser, courseApi } from "@/app/lib/api";
import ConfirmToast from "../components/ConfirmToast";
import SuccessToast from "../components/SuccessToast";
import { Course, Lesson, LessonDraft, ModalMode } from "./_components/types";
import CourseCard from "./_components/CourseCard";
import CreateCourseModal from "./_components/CreateCourseModal";
import LessonManageModal from "./_components/LessonManageModal";
import EditCourseModal from "./_components/EditCourseModal";
import InstructorQuestions from "./_components/InstructorQuestions";

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function InstructorPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({ count: 0, students: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [modalMode, setModalMode] = useState<ModalMode>("none");

  // 강의 생성 상태
  const [createStep, setCreateStep] = useState<"info" | "lessons">("info");
  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", price: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonDrafts, setLessonDrafts] = useState<LessonDraft[]>([
    { uid: uid(), title: "", file: null, status: "pending" },
  ]);

  // 레슨 관리 상태
  const [manageCourse, setManageCourse] = useState<Course | null>(null);
  const [manageLessons, setManageLessons] = useState<Lesson[]>([]);

  // 강의 수정 상태
  const [editCourse, setEditCourse] = useState<Course | null>(null);

  // 강의 삭제 상태
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") { router.push("/"); return; }
  }, []);

  const loadCourses = () => {
    const instructorId = getLocalUserId(1);
    setLoading(true);
    apiFetch(`/courses?instructorId=${instructorId}&size=100`)
      .then((data) => {
        const list: Course[] = data.items ?? [];
        setCourses(list);
        setStats({
          count: list.length,
          students: list.reduce((s, c) => s + (c.studentCount ?? 0), 0),
          rating:
            list.length > 0
              ? list.reduce((s, c) => s + (c.ratingAvg ?? 0), 0) / list.length
              : 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCourses(); }, []);

  // ─── 강의 생성 핸들러 ───────────────────────────────────────
  const openCreate = () => {
    setCourseForm({ title: "", description: "", price: "" });
    setFormError("");
    setLessonDrafts([{ uid: uid(), title: "", file: null, status: "pending" }]);
    setCreatedCourseId(null);
    setCreateStep("info");
    setModalMode("create");
  };

  const handleNextStep = async () => {
    if (!courseForm.title.trim()) { setFormError("강의 제목을 입력해주세요."); return; }
    setIsSubmitting(true);
    setFormError("");
    try {
      const data = await apiFetch("/courses", {
        method: "POST",
        body: JSON.stringify({
          instructorId: getLocalUserId(1),
          title: courseForm.title.trim(),
          description: courseForm.description.trim(),
          price: parseInt(courseForm.price) || 0,
        }),
      });
      setCreatedCourseId(data.courseId);
      setCreateStep("lessons");
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDraft = (draftUid: string, patch: Partial<LessonDraft>) => {
    setLessonDrafts((prev) =>
      prev.map((d) => (d.uid === draftUid ? { ...d, ...patch } : d))
    );
  };

  const uploadLesson = async (draft: LessonDraft, order: number) => {
    if (!draft.title.trim()) { updateDraft(draft.uid, { status: "error", errorMsg: "제목을 입력해주세요." }); return; }
    if (!draft.file) { updateDraft(draft.uid, { status: "error", errorMsg: "MP4 파일을 선택해주세요." }); return; }
    updateDraft(draft.uid, { status: "uploading", errorMsg: undefined });
    try {
      const fd = new FormData();
      fd.append("title", draft.title.trim());
      fd.append("lessonOrder", String(order));
      if (draft.description?.trim()) fd.append("description", draft.description.trim());
      fd.append("file", draft.file);
      await apiUpload(`/courses/${createdCourseId}/lessons`, fd);
      updateDraft(draft.uid, { status: "done" });
    } catch (e: any) {
      updateDraft(draft.uid, { status: "error", errorMsg: e.message });
    }
  };

  // ─── 강의 삭제 핸들러 ───────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!deleteCourse) return;
    const title = deleteCourse.title;
    try {
      await courseApi.delete(deleteCourse.courseId, getLocalUserId(1));
      loadCourses();
      setSuccessMsg(`"${title}" 강의가 삭제되었습니다.`);
    } catch (e: any) {
      setSuccessMsg("삭제 실패: " + e.message);
    } finally {
      setDeleteCourse(null);
    }
  };

  // ─── 레슨 관리 핸들러 ───────────────────────────────────────
  const openLessons = async (course: Course) => {
    setManageCourse(course);
    try {
      const data = await apiFetch(`/courses/${course.courseId}`);
      setManageLessons(data.lessons ?? []);
    } catch {
      setManageLessons([]);
    }
    setModalMode("lessons");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf9" }}>
      <Navbar active="강사" />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>
              강사 대시보드
            </h1>
            <p style={{ fontSize: 15, color: "#888" }}>강의를 만들고 레슨을 관리하세요.</p>
          </div>
          <button
            onClick={openCreate}
            style={{ background: "#20B486", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            + 새 강의 만들기
          </button>
        </div>

        {/* 통계 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 36 }}>
          {[
            { label: "내 강의", value: `${stats.count}개`, icon: "📚" },
            { label: "전체 수강생", value: `${stats.students}명`, icon: "👥" },
            { label: "평균 평점", value: stats.rating.toFixed(1), icon: "⭐" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 52, height: 52, background: "#e8f5f0", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#20B486" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <InstructorQuestions />

        {/* 강의 목록 */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>내 강의 목록</h2>
        {loading ? (
          <p style={{ color: "#aaa", textAlign: "center", padding: 40 }}>불러오는 중...</p>
        ) : courses.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", color: "#aaa", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p>아직 강의가 없습니다. 새 강의를 만들어보세요!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {courses.map((c) => (
              <CourseCard
                key={c.courseId}
                course={c}
                onLessons={openLessons}
                onEdit={(course) => { setEditCourse(course); setModalMode("edit"); }}
                onDelete={(course) => setDeleteCourse(course)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 모달 */}
      {modalMode === "create" && (
        <CreateCourseModal
          step={createStep}
          courseForm={courseForm}
          lessonDrafts={lessonDrafts}
          isSubmitting={isSubmitting}
          formError={formError}
          createdCourseId={createdCourseId}
          onCourseFormChange={(key, value) => setCourseForm((p) => ({ ...p, [key]: value }))}
          onNextStep={handleNextStep}
          onUpdateDraft={updateDraft}
          onUploadLesson={uploadLesson}
          onAddDraft={() => setLessonDrafts((p) => [...p, { uid: uid(), title: "", file: null, status: "pending" }])}
          onFinish={() => { setModalMode("none"); loadCourses(); }}
          onClose={() => setModalMode("none")}
        />
      )}

      {modalMode === "lessons" && manageCourse && (
        <LessonManageModal
          course={manageCourse}
          lessons={manageLessons}
          onLessonsChange={setManageLessons}
          onClose={() => setModalMode("none")}
        />
      )}

      {modalMode === "edit" && editCourse && (
        <EditCourseModal
          course={editCourse}
          onSaved={() => { setModalMode("none"); loadCourses(); }}
          onClose={() => setModalMode("none")}
        />
      )}

      {deleteCourse && (
        <ConfirmToast
          message="강의를 삭제하시겠습니까?"
          subMessage={`"${deleteCourse.title}" 강의와 모든 레슨이 영구 삭제됩니다.`}
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteCourse(null)}
        />
      )}

      {successMsg && (
        <SuccessToast message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}
    </div>
  );
}
