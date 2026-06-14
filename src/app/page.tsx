"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { useToast } from "./components/ToastProvider";
import { apiFetch, thumbnailSrc } from "./lib/api";

type Course = { courseId: number; title: string; instructorName?: string; price: number; ratingAvg: number; studentCount: number; thumbnailUrl?: string };

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", size: "24", sort });
      if (query.trim()) params.set("query", query.trim());
      const data = await apiFetch(`/courses?${params}`);
      setCourses(data.items || []);
      setTotal(data.page?.total || 0);
    } catch (error: any) {
      showToast(error.message || "강의를 불러오지 못했습니다.", "error");
    } finally { setLoading(false); }
  }, [query, sort, showToast]);

  useEffect(() => { load(); }, [load]);
  const search = (event: FormEvent) => { event.preventDefault(); load(); };

  return <div className="shell">
    <a className="skip-nav" href="#courses">강의 목록으로 이동</a>
    <Navbar active="강의" />
    <header className="hero">
      <div className="container hero-content">
        <div className="eyebrow" style={{ color: "#ffba08" }}>Learn. Build. Ship.</div>
        <h1>배운 기술을<br />실력으로 바꾸는 곳</h1>
        <p>현업 중심 개발 강의, 학습 진도 관리, 강사와의 Q&A까지 한 흐름으로 연결했습니다.</p>
        <form className="search-bar" onSubmit={search} role="search">
          <input aria-label="강의 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="React, Spring, Docker를 검색해보세요" />
          <button className="btn btn-primary" type="submit">강의 찾기</button>
        </form>
      </div>
    </header>
    <main id="courses" className="container page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div><div className="eyebrow">Curated courses</div><h2 className="page-title" style={{ fontSize: 32 }}>지금 성장에 필요한 강의</h2><p className="page-copy">승인된 강의 {total.toLocaleString()}개를 만나보세요.</p></div>
        <div className="actions">
          <button className={`btn ${sort === "latest" ? "btn-dark" : "btn-soft"}`} onClick={() => setSort("latest")}>최신순</button>
          <button className={`btn ${sort === "popular" ? "btn-dark" : "btn-soft"}`} onClick={() => setSort("popular")}>인기순</button>
        </div>
      </div>
      {loading ? <div className="empty">강의를 불러오는 중입니다.</div> : courses.length === 0 ? <div className="card empty">검색 결과가 없습니다. 다른 키워드로 찾아보세요.</div> :
        <div className="grid course-grid">{courses.map((course) =>
          <Link className="card course-card" href={`/courses/${course.courseId}`} key={course.courseId}>
            <div className="course-cover" style={course.thumbnailUrl ? { backgroundImage: `linear-gradient(rgba(3,7,30,.2),rgba(3,7,30,.55)),url(${thumbnailSrc(course.courseId)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>DEV</div>
            <div className="course-body"><div className="eyebrow">{course.instructorName || "DevClass Instructor"}</div><h3>{course.title}</h3><div className="course-meta"><span>평점 {Number(course.ratingAvg || 0).toFixed(1)}</span><span>수강생 {course.studentCount || 0}명</span></div><div className="course-price">{course.price ? `${course.price.toLocaleString()}원` : "무료"}</div></div>
          </Link>)}</div>}
    </main>
  </div>;
}
