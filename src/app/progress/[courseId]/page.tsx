"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiFetch, watchApi, reviewApi, getLocalUserId } from "@/app/lib/api";
import LessonSidebar from "./_components/LessonSidebar";
import VideoPlayer from "./_components/VideoPlayer";

const AUTO_SAVE_INTERVAL = 10000;

export default function ProgressPage() {
  const { courseId } = useParams();
  const userId = getLocalUserId(0);
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [percent, setPercent] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // 리뷰 상태
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<any>(null);

  // 이어보기 위치 (초)
  const [resumePosition, setResumePosition] = useState<number | undefined>(undefined);

  useEffect(() => {
    const uid = getLocalUserId(0);
    Promise.all([
      apiFetch(`/courses/${courseId}`),
      apiFetch(`/users/${uid}/courses/${courseId}/progress`).catch(() => null),
    ])
      .then(async ([courseData, progressData]) => {
        setCourse(courseData);
        if (progressData) {
          setProgress(progressData);
          const savedPercent = progressData.percent ?? 0;
          setPercent(savedPercent);
          const total = courseData.lessons?.length ?? 1;
          setCompletedCount(Math.round((savedPercent / 100) * total));
          const lastLesson = courseData.lessons?.find(
            (l: any) => l.lessonId === progressData.lastLessonId,
          );
          const startLesson = lastLesson ?? courseData.lessons?.[0];
          setCurrentLesson(startLesson);

          // 이어보기 위치 조회
          if (startLesson) {
            const pos = await watchApi.getLessonPosition(startLesson.lessonId, uid);
            if (pos) setResumePosition(pos.lastPositionSeconds);
          }
        } else {
          setCurrentLesson(courseData.lessons?.[0]);
        }

        // 내 리뷰 확인
        const reviews = await reviewApi.getCourseReviews(Number(courseId)).catch(() => []);
        const mine = reviews.find((r: any) => r.userId === uid);
        if (mine) setMyReview(mine);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const saveProgress = useCallback(
    async (newPercent: number, lessonId: number, newCompletedCount: number) => {
      const uid = getLocalUserId(0);
      try {
        setSaveStatus("saving");
        const data = await apiFetch(`/users/${uid}/courses/${courseId}/progress`, {
          method: "PUT",
          body: JSON.stringify({ percent: newPercent, lastLessonId: lessonId }),
        });
        setProgress(data);
        setPercent(newPercent);
        setCompletedCount(newCompletedCount);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [courseId],
  );

  const handleSelectLesson = async (lesson: any) => {
    const uid = getLocalUserId(0);
    setCurrentLesson(lesson);
    setResumePosition(undefined);

    // 이어보기 위치 조회
    const pos = await watchApi.getLessonPosition(lesson.lessonId, uid);
    if (pos) setResumePosition(pos.lastPositionSeconds);

    if (!course?.lessons) return;
    const idx = course.lessons.findIndex((l: any) => l.lessonId === lesson.lessonId);
    const newCompletedCount = Math.max(completedCount, idx);
    const newPercent = Math.round((newCompletedCount / course.lessons.length) * 100);

    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    autoSaveTimer.current = setInterval(
      () => saveProgress(newPercent, lesson.lessonId, newCompletedCount),
      AUTO_SAVE_INTERVAL,
    );
    saveProgress(newPercent, lesson.lessonId, newCompletedCount);
  };

  const handleComplete = () => {
    if (!course?.lessons || !currentLesson) return;
    const idx = course.lessons.findIndex((l: any) => l.lessonId === currentLesson.lessonId);
    const newCompletedCount = idx + 1;
    const newPercent = Math.round((newCompletedCount / course.lessons.length) * 100);
    saveProgress(newPercent, currentLesson.lessonId, newCompletedCount);

    if (idx < course.lessons.length - 1) {
      const nextLesson = course.lessons[idx + 1];
      setTimeout(() => {
        setCurrentLesson(nextLesson);
        setResumePosition(undefined);
        if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = setInterval(
          () => saveProgress(newPercent, nextLesson.lessonId, newCompletedCount),
          AUTO_SAVE_INTERVAL,
        );
      }, 500);
    }
  };

  // 수강 히스토리 저장 (VideoPlayer에서 주기적으로 호출)
  const handleWatchProgress = useCallback((positionSeconds: number) => {
    if (!currentLesson) return;
    const uid = getLocalUserId(0);
    watchApi.savePosition(currentLesson.lessonId, {
      userId: uid,
      courseId: Number(courseId),
      positionSeconds,
    }).catch(() => {});
  }, [currentLesson, courseId]);

  const handleSubmitReview = async () => {
    const uid = getLocalUserId(0);
    if (percent < 80) {
      alert(`리뷰는 80% 이상 수강 후 작성할 수 있습니다. (현재 ${percent}%)`);
      return;
    }
    setReviewSubmitting(true);
    try {
      const r = await reviewApi.createReview(Number(courseId), {
        userId: uid, rating: reviewRating, content: reviewContent,
      });
      setMyReview(r);
      setShowReviewForm(false);
      alert("리뷰가 등록되었습니다!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <p style={{ color: "#aaa" }}>강의를 불러오는 중...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <p style={{ color: "#ff4d4f" }}>{error}</p>
      <Link href="/enrollments" style={{ color: "#20B486", fontWeight: 600, textDecoration: "none" }}>← 내 강의로</Link>
    </div>
  );

  const totalCount = course?.lessons?.length ?? 0;
  const isLastLesson = currentLesson?.order === totalCount;
  const canReview = percent >= 80;

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf9" }}>
      <Navbar active="내 강의" />

      {/* 상단 진도 바 */}
      <div style={{ background: "#1a1a2e", padding: "20px 40px", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link href="/enrollments" style={{ color: "#20B486", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← 내 강의</Link>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{course?.title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {saveStatus === "saving" && <span style={{ fontSize: 13, color: "#aaa" }}>💾 저장 중...</span>}
            {saveStatus === "saved" && <span style={{ fontSize: 13, color: "#20B486" }}>✓ 자동 저장됨</span>}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#20B486" }}>{percent}%</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>{completedCount}/{totalCount}강 완료</div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "12px auto 0" }}>
          <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${percent}%`, background: "#20B486", borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        <LessonSidebar
          lessons={course?.lessons ?? []}
          currentLessonId={currentLesson?.lessonId}
          completedCount={completedCount}
          totalCount={totalCount}
          percent={percent}
          onSelect={handleSelectLesson}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <VideoPlayer
            lessonId={currentLesson?.lessonId}
            videoUrl={currentLesson?.videoUrl}
            title={currentLesson?.title}
            resumePosition={resumePosition}
            onTimeUpdate={handleWatchProgress}
          />

          {/* 레슨 정보 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{ fontSize: 12, color: "#20B486", fontWeight: 700, marginBottom: 6 }}>{currentLesson?.order}강</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0, marginBottom: 8 }}>{currentLesson?.title}</h3>
                {currentLesson?.description && (
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0, marginBottom: 8 }}>{currentLesson.description}</p>
                )}
                {progress?.updatedAt && (
                  <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
                    마지막 저장: {new Date(progress.updatedAt).toLocaleString("ko-KR")}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                <button
                  onClick={handleComplete}
                  style={{ background: isLastLesson ? "#17926d" : "#20B486", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  {isLastLesson ? "✓ 강의 완료" : "다음 강의 →"}
                </button>
              </div>
            </div>
          </div>

          {/* 진도 현황 카드 */}
          <div style={{ background: "#e8f5f0", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <p style={{ fontSize: 13, color: "#17926d", margin: 0, fontWeight: 600 }}>수강 진도율</p>
                <p style={{ fontSize: 12, color: "#20B486", margin: 0 }}>
                  {completedCount}개 완료 · 남은 강의 {totalCount - completedCount}개
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#20B486" }}>{percent}%</div>
              <div style={{ fontSize: 12, color: "#17926d" }}>{completedCount}/{totalCount}강</div>
            </div>
          </div>

          {/* 리뷰 섹션 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>⭐ 강의 리뷰</h3>
            {myReview ? (
              <div style={{ background: "#f8faf9", borderRadius: 10, padding: 16, border: "1px solid #eef7f3" }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 18, color: s <= myReview.rating ? "#f59e0b" : "#ddd" }}>★</span>
                  ))}
                </div>
                <p style={{ color: "#444", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{myReview.content}</p>
                <p style={{ color: "#aaa", fontSize: 12, margin: "8px 0 0" }}>내가 작성한 리뷰</p>
              </div>
            ) : canReview ? (
              showReviewForm ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1,2,3,4,5].map(s => (
                      <span
                        key={s}
                        onClick={() => setReviewRating(s)}
                        style={{ fontSize: 28, cursor: "pointer", color: s <= reviewRating ? "#f59e0b" : "#ddd" }}
                      >★</span>
                    ))}
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="강의 후기를 작성해주세요..."
                    rows={4}
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting}
                      style={{ background: "#20B486", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                    >
                      {reviewSubmitting ? "등록 중..." : "리뷰 등록"}
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      style={{ background: "#f0f0f0", color: "#666", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  style={{ background: "#20B486", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  ⭐ 리뷰 작성하기
                </button>
              )
            ) : (
              <div style={{ background: "#fff8e1", borderRadius: 10, padding: 14, border: "1px solid #fde68a" }}>
                <p style={{ color: "#92400e", fontSize: 13, margin: 0 }}>
                  강의를 80% 이상 수강하면 리뷰를 작성할 수 있습니다. (현재 {percent}%)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
