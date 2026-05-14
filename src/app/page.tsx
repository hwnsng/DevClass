"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { apiFetch } from "./lib/api";

interface Course {
  courseId: number;
  title: string;
  instructorName?: string;
  price: number;
  ratingAvg: number;
  studentCount: number;
  createdAt: string;
  thumbnailUrl?: string;
}

const EMOJI: Record<string, string> = {
  React: "⚛️",
  Spring: "🍃",
  Next: "▲",
  Type: "📘",
  Docker: "🐳",
  MySQL: "🗄️",
  Java: "☕",
};

const getEmoji = (title: string) =>
  Object.entries(EMOJI).find(([k]) => title.includes(k))?.[1] ?? "📖";

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: "1", size: "20", sort });
      if (query) params.set("query", query);
      const data = await apiFetch(`/courses?${params}`);
      setCourses(data.items);
      setTotal(data.page.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, sort]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf9" }}>
      <Navbar active="강의" />

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #20B486 0%, #17926d 100%)",
          padding: "64px 40px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 3,
            opacity: 0.8,
            marginBottom: 14,
          }}
        >
          START TO SUCCESS
        </p>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 14,
          }}
        >
          개발자를 위한
          <br />
          온라인 강의 플랫폼
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 36 }}>
          원하는 강의를 찾고, 언제 어디서나 학습하세요.
        </p>
        <div
          style={{
            display: "flex",
            maxWidth: 500,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          }}
        >
          <input
            type="text"
            placeholder="배우고 싶은 기술을 검색하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "15px 20px",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "#333",
            }}
          />
          <button
            onClick={fetchCourses}
            style={{
              background: "#20B486",
              color: "#fff",
              border: "none",
              padding: "15px 28px",
              fontSize: 15,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            검색
          </button>
        </div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "center",
            gap: 36,
            fontSize: 14,
            opacity: 0.85,
          }}
        >
          <span>✦ {total}개 강의</span>
          <span>✦ 현직 강사진</span>
          <span>✦ 진도 기록 지원</span>
        </div>
      </div>

      {/* List */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
            전체 강의{" "}
            <span style={{ color: "#20B486", fontSize: 16 }}>{total}개</span>
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["latest", "popular"].map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: sort === s ? "#20B486" : "#fff",
                  color: sort === s ? "#fff" : "#666",
                  border: sort === s ? "none" : "1.5px solid #ddd",
                  transition: "all 0.2s",
                }}
              >
                {s === "latest" ? "최신순" : "인기순"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>강의를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#ff4d4f" }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p>{error}</p>
            <button
              onClick={fetchCourses}
              style={{
                marginTop: 16,
                background: "#20B486",
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
        ) : courses.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16 }}>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {courses.map((c) => (
              <Link
                key={c.courseId}
                href={`/courses/${c.courseId}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 8px 28px rgba(32,180,134,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 2px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  <div
                    style={{
                      height: 160,
                      background: "linear-gradient(135deg, #20B486, #17926d)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt={c.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span style={{ fontSize: 52 }}>{getEmoji(c.title)}</span>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "rgba(0,0,0,0.35)",
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 12,
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      ★ {c.ratingAvg}
                    </div>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1a1a2e",
                        marginBottom: 6,
                      }}
                    >
                      {c.title}
                    </h3>
                    <p
                      style={{ fontSize: 13, color: "#999", marginBottom: 14 }}
                    >
                      {c.instructorName ?? "강사"}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#20B486",
                        }}
                      >
                        ₩{c.price.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: "#bbb" }}>
                        수강생 {c.studentCount}명
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer
        style={{
          background: "#1a1a2e",
          color: "#aaa",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          <span style={{ color: "#20B486" }}>Dev</span>
          <span style={{ color: "#fff" }}>Class</span>
        </div>
        <p style={{ fontSize: 13 }}>© 2026 DevClass. All rights reserved.</p>
      </footer>
    </div>
  );
}
