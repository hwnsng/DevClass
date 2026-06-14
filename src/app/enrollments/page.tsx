"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import ConfirmToast from "@/app/components/ConfirmToast";
import SuccessToast from "@/app/components/SuccessToast";
import { apiFetch } from "@/app/lib/api";

function getLocalUserId(fallback = 0): number {
  try {
    const raw = localStorage.getItem("devclass-auth");
    return raw ? (JSON.parse(raw).id ?? fallback) : fallback;
  } catch { return fallback; }
}

const EMOJI: Record<string, string> = {
  React: "⚛️",
  Spring: "🍃",
  Next: "▲",
  Type: "📘",
  Docker: "🐳",
  MySQL: "🗄️",
};
const getEmoji = (title: string) =>
  Object.entries(EMOJI).find(([k]) => title.includes(k))?.[1] ?? "📖";

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<{ enrollmentId: number; title: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `/users/${getLocalUserId()}/enrollments?page=1&size=20`,
      );

      const enriched = await Promise.all(
        data.items.map(async (e: any) => {
          const [course, progress] = await Promise.all([
            apiFetch(`/courses/${e.courseId}`).catch(() => null),
            apiFetch(
              `/users/${getLocalUserId()}/courses/${e.courseId}/progress`,
            ).catch(() => null),
          ]);
          return {
            ...e,
            title: course?.title ?? `강의 #${e.courseId}`,
            progressPercent: progress?.percent ?? 0,
            lastLesson:
              course?.lessons?.find(
                (l: any) => l.lessonId === progress?.lastLessonId,
              )?.title ?? null,
          };
        }),
      );

      setEnrollments(enriched);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (enrollmentId: number, title: string) => {
    setCancelTarget({ enrollmentId, title });
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await apiFetch(`/enrollments/${cancelTarget.enrollmentId}?userId=${getLocalUserId()}`, {
        method: "DELETE",
      });
      setEnrollments((p) => p.filter((e) => e.enrollmentId !== cancelTarget.enrollmentId));
      setSuccessMsg(`"${cancelTarget.title}" 수강이 취소되었습니다.`);
    } catch (e: any) {
      setSuccessMsg("취소 실패: " + e.message);
    } finally {
      setCancelTarget(null);
    }
  };

  const avg = enrollments.length
    ? Math.round(
        enrollments.reduce((s, e) => s + (e.progressPercent ?? 0), 0) /
          enrollments.length,
      )
    : 0;

  return (
    <>
    <div style={{ minHeight: "100vh", background: "#fffaf1" }}>
      <Navbar active="내 강의" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#03071e",
              marginBottom: 6,
            }}
          >
            내 강의
          </h1>
          <p style={{ fontSize: 15, color: "#888" }}>
            수강 중인 강의{" "}
            <span style={{ color: "#d00000", fontWeight: 700 }}>
              {enrollments.length}개
            </span>
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            { label: "수강 중", value: enrollments.length, icon: "📚" },
            { label: "평균 진도율", value: `${avg}%`, icon: "📊" },
            {
              label: "완료",
              value: `${enrollments.filter((e) => e.progressPercent === 100).length}개`,
              icon: "✅",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "20px 24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div
                  style={{ fontSize: 22, fontWeight: 800, color: "#d00000" }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>불러오는 중...</p>
          </div>
        ) : error ? (
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#ff4d4f" }}
          >
            <p>{error}</p>
            <button
              onClick={fetchEnrollments}
              style={{
                marginTop: 16,
                background: "#d00000",
                color: "#fff",
                border: "none",
                padding: "10px 24px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              다시 시도
            </button>
          </div>
        ) : enrollments.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 16, marginBottom: 20 }}>
              수강 중인 강의가 없습니다.
            </p>
            <Link
              href="/"
              style={{
                background: "#d00000",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              강의 둘러보기
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {enrollments.map((e) => (
              <div
                key={e.enrollmentId}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: "1.5px solid #eadfd3",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        background: "linear-gradient(135deg,#d00000,#9d0208)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {getEmoji(e.title ?? "")}
                    </div>
                    <div>
                      <Link
                        href={`/courses/${e.courseId}`}
                        style={{ textDecoration: "none" }}
                      >
                        <h3
                          style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: "#03071e",
                            marginBottom: 4,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(ev) =>
                            ((ev.currentTarget as HTMLElement).style.color =
                              "#d00000")
                          }
                          onMouseLeave={(ev) =>
                            ((ev.currentTarget as HTMLElement).style.color =
                              "#03071e")
                          }
                        >
                          {e.title}
                        </h3>
                      </Link>
                      <p style={{ fontSize: 13, color: "#999", margin: 0 }}>
                        수강 시작: {e.enrolledAt}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                    <Link
                      href={`/progress/${e.courseId}`}
                      style={{
                        background: "#d00000",
                        color: "#fff",
                        textDecoration: "none",
                        padding: "8px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      이어 학습
                    </Link>
                    <button
                      onClick={() => handleCancel(e.enrollmentId, e.title)}
                      style={{
                        background: "#fff",
                        color: "#ff4d4f",
                        border: "1.5px solid #ffcdd2",
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#888" }}>
                      {e.lastLesson
                        ? `마지막: ${e.lastLesson}`
                        : "아직 시작 전"}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: e.progressPercent === 100 ? "#d00000" : "#333",
                      }}
                    >
                      {e.progressPercent}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "#f0f0f0",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${e.progressPercent}%`,
                        background: "linear-gradient(90deg,#d00000,#9d0208)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {cancelTarget && (
      <ConfirmToast
        message="수강을 취소하시겠습니까?"
        subMessage={`"${cancelTarget.title}" 수강이 취소됩니다.`}
        confirmLabel="취소하기"
        cancelLabel="아니오"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    )}

    {successMsg && (
      <SuccessToast message={successMsg} onClose={() => setSuccessMsg(null)} />
    )}
    </>
  );
}
