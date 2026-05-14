"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import ConfirmToast from "../../components/ConfirmToast";
import SuccessToast from "../../components/SuccessToast";
import { apiFetch, reportApi, getLocalUserId, getAuthUser } from "@/app/lib/api";

const REPORT_REASONS = [
  "저작권 침해",
  "스팸",
  "잘못된 강의 내용",
  "부적절한 콘텐츠",
  "기타",
];

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<number | null>(null);

  // 신고
  const [reported, setReported] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState("");

  // 수강 확인 & 성공 토스트
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(courseId);
    apiFetch(`/courses/${id}`)
      .then(setCourse)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const doEnroll = async () => {
    setEnrolling(true);
    try {
      await apiFetch("/enrollments", {
        method: "POST",
        body: JSON.stringify({ userId: getLocalUserId(), courseId: Number(courseId) }),
      });
      setEnrolled(true);
      setSuccessMsg(`"${course?.title}" 수강 등록이 완료되었습니다!`);
    } catch (e: any) {
      if (e.message?.includes("이미 수강")) {
        setEnrolled(true);
      } else {
        setSuccessMsg("수강 등록 실패: " + e.message);
      }
    } finally {
      setEnrolling(false);
      setShowEnrollConfirm(false);
    }
  };

  const handleReport = async () => {
    const user = getAuthUser();
    if (!user) { setReportError("로그인이 필요합니다."); return; }
    setReporting(true);
    setReportError("");
    try {
      await reportApi.report(Number(courseId), {
        userId: user.id,
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });
      setReported(true);
      setShowReportForm(false);
      setSuccessMsg("신고가 접수되었습니다. 관리자가 검토 후 조치합니다.");
    } catch (e: any) {
      setReportError(e.message);
    } finally {
      setReporting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#aaa", fontSize: 16 }}>불러오는 중...</p>
    </div>
  );

  if (error || !course) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <span style={{ fontSize: 64 }}>😅</span>
      <h2 style={{ color: "#1a1a2e" }}>강의를 찾을 수 없습니다.</h2>
      <Link href="/" style={{ color: "#20B486", fontWeight: 600, textDecoration: "none" }}>← 목록으로</Link>
    </div>
  );

  return (
    <>
    <div style={{ minHeight: "100vh", background: "#f8faf9" }}>
      <Navbar active="강의" />

      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "48px 40px", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Link href="/" style={{ color: "#20B486", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← 전체 강의</Link>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 28, marginTop: 20 }}>
            <div style={{
              width: 200, height: 130, borderRadius: 12, overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(135deg, #20B486, #17926d)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : <span style={{ fontSize: 48 }}>📖</span>}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>{course.title}</h1>
              <p style={{ fontSize: 15, color: "#ccc", maxWidth: 600, lineHeight: 1.7, marginBottom: 16 }}>
                {course.description}
              </p>
              <div style={{ display: "flex", gap: 20, fontSize: 14, color: "#aaa" }}>
                <span>⭐ {course.ratingAvg}</span>
                <span>👥 {course.studentCount}명</span>
                <span>📚 {course.lessons?.length ?? 0}강</span>
                <span>📅 {course.createdAt?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>

        {/* 좌측: 커리큘럼 */}
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #f0f9f5" }}>
              📚 커리큘럼 <span style={{ color: "#20B486", fontSize: 14 }}>{course.lessons?.length ?? 0}강</span>
            </h2>
            {(course.lessons?.length ?? 0) === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "32px 0" }}>등록된 레슨이 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {course.lessons?.map((l: any) => {
                  const isOpen = openLessonId === l.lessonId;
                  return (
                    <div key={l.lessonId}>
                      <div
                        onClick={() => setOpenLessonId(isOpen ? null : l.lessonId)}
                        style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                          borderRadius: isOpen ? "10px 10px 0 0" : 10,
                          background: isOpen ? "#e8f5f0" : "#f8faf9",
                          border: `1.5px solid ${isOpen ? "#20B486" : "#eef7f3"}`,
                          borderBottom: isOpen ? "none" : undefined,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, background: "#20B486", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {l.order}
                        </div>
                        <span style={{ fontSize: 15, color: "#333", fontWeight: 500, flex: 1 }}>{l.title}</span>
                        <span style={{ fontSize: 12, color: "#20B486" }}>{isOpen ? "▲" : "▼"}</span>
                      </div>
                      {isOpen && (
                        <div style={{
                          padding: "14px 20px", background: "#f8fdf9",
                          border: "1.5px solid #20B486", borderTop: "1px solid #c8edd9",
                          borderRadius: "0 0 10px 10px", fontSize: 14,
                          color: l.description ? "#555" : "#aaa", lineHeight: 1.7,
                        }}>
                          {l.description || "설명이 없습니다."}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 수강 신청 카드 */}
        <div style={{ position: "sticky", top: 80, height: "fit-content", background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(32,180,134,0.12)", border: "1.5px solid #e8f5f0" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#20B486", marginBottom: 6 }}>
            {course.price === 0 ? "무료" : `₩${course.price?.toLocaleString()}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <span style={{ color: "#f59e0b" }}>{"★".repeat(Math.floor(Number(course.ratingAvg)))}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{course.ratingAvg}</span>
            <span style={{ fontSize: 13, color: "#aaa" }}>({course.studentCount}명)</span>
          </div>

          <div style={{ background: "#f8faf9", borderRadius: 10, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[["강의 수", `${course.lessons?.length ?? 0}강`], ["수강생", `${course.studentCount}명`]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#888" }}>{k}</span>
                <span style={{ fontWeight: 600, color: "#333" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* 수강 등록 버튼 */}
          <button
            onClick={() => !enrolled && setShowEnrollConfirm(true)}
            disabled={enrolled || enrolling}
            style={{
              width: "100%", padding: 16,
              background: enrolled ? "#aaa" : "#20B486",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 16, fontWeight: 700,
              cursor: enrolled ? "default" : "pointer",
              marginBottom: 12,
            }}
          >
            {enrolling ? "처리 중..." : enrolled ? "✓ 수강 등록 완료" : "수강 등록하기"}
          </button>

          {enrolled && (
            <Link href="/enrollments" style={{ display: "block", textAlign: "center", color: "#20B486", textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              내 강의 목록 보기 →
            </Link>
          )}

          {/* 신고 */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
            {!showReportForm ? (
              <button
                onClick={() => !reported && setShowReportForm(true)}
                disabled={reported}
                style={{
                  width: "100%", padding: "10px",
                  background: "none",
                  color: reported ? "#aaa" : "#ff4d4f",
                  border: `1.5px solid ${reported ? "#ddd" : "#ffcdd2"}`,
                  borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: reported ? "default" : "pointer",
                }}
              >
                {reported ? "✓ 신고 접수 완료" : "🚨 강의 신고하기"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#ff4d4f", margin: 0 }}>🚨 강의 신고</p>

                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px",
                    border: "1.5px solid #ffcdd2", borderRadius: 8,
                    fontSize: 13, outline: "none", background: "#fff",
                    color: "#333", boxSizing: "border-box",
                  }}
                >
                  {REPORT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <textarea
                  placeholder="상세 내용 (선택사항)"
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 12px",
                    border: "1.5px solid #ffcdd2", borderRadius: 8,
                    fontSize: 13, outline: "none", resize: "none",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />

                {reportError && (
                  <p style={{ fontSize: 12, color: "#ff4d4f", margin: 0 }}>{reportError}</p>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleReport}
                    disabled={reporting}
                    style={{
                      flex: 1, padding: "9px",
                      background: "#ff4d4f", color: "#fff",
                      border: "none", borderRadius: 8,
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      opacity: reporting ? 0.7 : 1,
                    }}
                  >
                    {reporting ? "신고 중..." : "신고 제출"}
                  </button>
                  <button
                    onClick={() => { setShowReportForm(false); setReportError(""); }}
                    style={{
                      flex: 1, padding: "9px",
                      background: "#f5f5f5", color: "#666",
                      border: "none", borderRadius: 8,
                      fontSize: 13, cursor: "pointer",
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {showEnrollConfirm && (
      <ConfirmToast
        message="수강 등록하시겠습니까?"
        subMessage={course.title}
        confirmLabel="등록하기"
        cancelLabel="취소"
        onConfirm={doEnroll}
        onCancel={() => setShowEnrollConfirm(false)}
      />
    )}

    {successMsg && (
      <SuccessToast message={successMsg} onClose={() => setSuccessMsg(null)} />
    )}
    </>
  );
}
