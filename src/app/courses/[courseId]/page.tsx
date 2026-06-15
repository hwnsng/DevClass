"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ConfirmToast from "../../components/ConfirmToast";
import SuccessToast from "../../components/SuccessToast";
import { apiFetch, reportApi, cartApi, getLocalUserId, getAuthUser, thumbnailSrc } from "@/app/lib/api";
import CourseQna from "./CourseQna";

const REPORT_REASONS = [
  "저작권 침해",
  "스팸",
  "잘못된 강의 내용",
  "부적절한 콘텐츠",
  "기타",
];

export default function CourseDetail() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<number | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  // 신고
  const [reported, setReported] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState("");

  // 토스트
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(courseId);
    const user = getAuthUser();
    const courseRequest = apiFetch(`/courses/${id}`);
    const enrollmentRequest = user
      ? apiFetch(`/users/${user.id}/enrollments?page=1&size=100`).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] });
    const cartRequest = user
      ? cartApi.getCart(user.id).catch(() => [])
      : Promise.resolve([]);

    Promise.all([courseRequest, enrollmentRequest, cartRequest])
      .then(([courseData, enrollmentData, cartData]: [any, any, any[]]) => {
        setCourse(courseData);
        setEnrolled(enrollmentData.items?.some((item: any) => item.courseId === id) ?? false);
        setAddedToCart(cartData.some((item: any) => item.courseId === id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  // 무료 수강 등록
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

  const handleAddToCart = async () => {
    const user = getAuthUser();
    if (!user) { router.push("/auth/login"); return; }
    try {
      await cartApi.addToCart(user.id, Number(courseId));
      setAddedToCart(true);
      setSuccessMsg("장바구니에 강의를 담았습니다.");
    } catch (e: any) {
      if (e.message?.includes("이미")) {
        setAddedToCart(true);
        setSuccessMsg("이미 장바구니에 담긴 강의입니다.");
      } else {
        setSuccessMsg("장바구니 추가 실패: " + e.message);
      }
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
      <p style={{ color: "#aaa", fontSize: 16 }} aria-live="polite">불러오는 중...</p>
    </div>
  );

  if (error || !course) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <span style={{ fontSize: 64 }} aria-hidden="true">😅</span>
      <h2 style={{ color: "#03071e" }}>강의를 찾을 수 없습니다.</h2>
      <Link href="/" style={{ color: "#d00000", fontWeight: 600, textDecoration: "none" }}>← 목록으로</Link>
    </div>
  );

  const isPaid = course.price > 0;
  return (
    <>
    <div style={{ minHeight: "100vh", background: "#fffaf1" }}>
      <a href="#main-content" className="skip-nav">본문으로 이동</a>
      <Navbar active="강의" />

      {/* 헤더 */}
      <header style={{ background: "linear-gradient(135deg, #03071e, #370617)", padding: "48px 40px", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Link href="/" style={{ color: "#d00000", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← 전체 강의</Link>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 28, marginTop: 20 }}>
            <div style={{
              width: 200, height: 130, borderRadius: 12, overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(135deg, #d00000, #9d0208)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {course.thumbnailUrl ? (
                <img src={thumbnailSrc(Number(courseId))} alt={`${course.title} 썸네일`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : <span style={{ fontSize: 48 }} aria-hidden="true">📖</span>}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>{course.title}</h1>
              <p style={{ color: "#ffba08", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                강사 {course.instructorName || "알 수 없는 강사"}
              </p>
              <p style={{ fontSize: 15, color: "#ccc", maxWidth: 600, lineHeight: 1.7, marginBottom: 16 }}>
                {course.description}
              </p>
              <div style={{ display: "flex", gap: 20, fontSize: 14, color: "#aaa", flexWrap: "wrap" }}>
                <span><span aria-hidden="true">⭐ </span><span>평점 {course.ratingAvg}</span></span>
                <span><span aria-hidden="true">👥 </span><span>수강생 {course.studentCount}명</span></span>
                <span><span aria-hidden="true">📚 </span><span>{course.lessons?.length ?? 0}강</span></span>
                <span><span aria-hidden="true">📅 </span><span>{course.createdAt?.slice(0, 10)}</span></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main id="main-content" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>

        {/* 좌측: 커리큘럼 */}
        <section aria-label="커리큘럼">
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", minHeight: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#03071e", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #f0f9f5" }}>
              <span aria-hidden="true">📚 </span>커리큘럼{" "}
              <span style={{ color: "#d00000", fontSize: 14 }}>{course.lessons?.length ?? 0}강</span>
            </h2>
            {(course.lessons?.length ?? 0) === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "32px 0" }}>등록된 레슨이 없습니다.</p>
            ) : (
              <ol style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
                {course.lessons?.map((l: any) => {
                  const isOpen = openLessonId === l.lessonId;
                  return (
                    <li key={l.lessonId}>
                      <button
                        onClick={() => setOpenLessonId(isOpen ? null : l.lessonId)}
                        aria-expanded={isOpen}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                          borderRadius: isOpen ? "10px 10px 0 0" : 10,
                          background: isOpen ? "#fff0df" : "#fffaf1",
                          border: `1.5px solid ${isOpen ? "#d00000" : "#eadfd3"}`,
                          borderBottom: isOpen ? "none" : undefined,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, background: "#d00000", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }} aria-hidden="true">
                          {l.order}
                        </div>
                        <span style={{ fontSize: 15, color: "#333", fontWeight: 500, flex: 1 }}>{l.title}</span>
                        <span style={{ fontSize: 12, color: "#d00000" }} aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: "14px 20px", background: "#f8fdf9",
                          border: "1.5px solid #d00000", borderTop: "1px solid #ffd49a",
                          borderRadius: "0 0 10px 10px", fontSize: 14,
                          color: l.description ? "#555" : "#aaa", lineHeight: 1.7,
                        }}>
                          {l.description || "설명이 없습니다."}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        {/* 우측: 수강 신청 카드 */}
        <aside aria-label="수강 신청" style={{ alignSelf: "start", background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(208,0,0,0.14)", border: "1.5px solid #fff0df" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#d00000", marginBottom: 6 }}>
            {course.price === 0 ? "무료" : `₩${course.price?.toLocaleString()}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <span style={{ color: "#f59e0b" }} aria-hidden="true">{"★".repeat(Math.floor(Number(course.ratingAvg)))}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{course.ratingAvg}</span>
            <span style={{ fontSize: 13, color: "#aaa" }}>({course.studentCount}명)</span>
          </div>

          <dl style={{ background: "#fffaf1", borderRadius: 10, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[["강의 수", `${course.lessons?.length ?? 0}강`], ["수강생", `${course.studentCount}명`]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <dt style={{ color: "#888" }}>{k}</dt>
                <dd style={{ fontWeight: 600, color: "#333", margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>

          {/* 결제/수강 버튼 */}
          {isPaid && !enrolled && !addedToCart ? (
            <button
              onClick={handleAddToCart}
              style={{
                width: "100%", padding: 16,
                background: "#d00000",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                marginBottom: 12,
              }}
              aria-label={`${course.title} 장바구니 담기`}
            >
              {addedToCart ? "장바구니에 담김" : "장바구니 담기"}
            </button>
          ) : !isPaid ? (
            <button
              onClick={() => !enrolled && setShowEnrollConfirm(true)}
              disabled={enrolled || enrolling}
              style={{
                width: "100%", padding: 16,
                background: enrolled ? "#aaa" : "#d00000",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700,
                cursor: enrolled ? "default" : "pointer",
                marginBottom: 12,
              }}
              aria-label={enrolled ? "수강 등록 완료" : `${course.title} 무료 수강 등록하기`}
            >
              {enrolling ? "처리 중..." : enrolled ? "✓ 수강 등록 완료" : "수강 등록하기"}
            </button>
          ) : null}

          {isPaid && addedToCart && (
            <Link href="/cart" style={{ display: "block", textAlign: "center", color: "#d00000", textDecoration: "none", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              장바구니 보기 →
            </Link>
          )}

          {enrolled && (
            <Link href="/enrollments" style={{ display: "block", textAlign: "center", color: "#d00000", textDecoration: "none", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
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
                aria-label={reported ? "신고 접수 완료" : "강의 신고하기"}
              >
                {reported ? "✓ 신고 접수 완료" : "🚨 강의 신고하기"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#ff4d4f", margin: 0 }}>🚨 강의 신고</p>

                <label htmlFor="report-reason" style={{ display: "none" }}>신고 사유</label>
                <select
                  id="report-reason"
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

                <label htmlFor="report-desc" style={{ display: "none" }}>상세 내용</label>
                <textarea
                  id="report-desc"
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
                  <p style={{ fontSize: 12, color: "#ff4d4f", margin: 0 }} role="alert">{reportError}</p>
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
        </aside>
        <CourseQna courseId={Number(courseId)} />
      </main>
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
