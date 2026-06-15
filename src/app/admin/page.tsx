"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../components/AdminHeader";
import { useToast } from "../components/ToastProvider";
import { adminApi, getAuthUser, reportApi } from "../lib/api";

type Tab = "courses" | "reports" | "users";
type Course = { courseId: number; title: string; status: string; studentCount: number; price: number };
type User = { id: number; name: string; email: string; role: string; status: string };

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("courses");
  const [dashboard, setDashboard] = useState<any>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [summary, courseData, userData, reportData] = await Promise.all([
        adminApi.getDashboard(), adminApi.getCourses(), adminApi.getUsers(), reportApi.getAdminReports(),
      ]);
      setDashboard(summary); setCourses(courseData || []); setUsers(userData || []); setReports(reportData || []);
    } catch (error: any) { showToast(error.message || "관리자 데이터를 불러오지 못했습니다.", "error"); }
  }, [showToast]);

  useEffect(() => { const user = getAuthUser(); if (!user || user.role !== "ADMIN") { router.replace("/ops/login"); return; } load(); }, [load, router]);
  const run = async (action: () => Promise<any>, message: string) => { try { await action(); showToast(message, "success"); await load(); } catch (error: any) { showToast(error.message, "error"); } };

  const tabs: { id: Tab; label: string }[] = [{ id: "courses", label: "강의 승인" }, { id: "reports", label: "신고 관리" }, { id: "users", label: "사용자" }];
  return <div className="shell"><AdminHeader /><main className="container page">
    <div className="eyebrow">Operations console</div><h1 className="page-title">서비스 운영 관리</h1><p className="page-copy">강의 승인, 신고, 사용자, 스케줄러 실행 상태를 한곳에서 확인합니다.</p>
    <section className="grid stats-grid">
      {[['전체 사용자',dashboard.users],['전체 강의',dashboard.courses],['승인 대기',dashboard.pendingCourses],['누적 결제액',`${Number(dashboard.paidRevenue||0).toLocaleString()}원`]].map(([label,value]) => <div className="card stat" key={String(label)}><span>{label}</span><strong>{value ?? 0}</strong></div>)}
    </section>
    <div className="actions" style={{ marginBottom: 18 }}>{tabs.map((item) => <button key={item.id} className={`btn ${tab === item.id ? "btn-dark" : "btn-soft"}`} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <section className="card panel table-wrap">
      {tab === "courses" && <table><thead><tr><th>강의</th><th>상태</th><th>수강생</th><th>가격</th><th>조치</th></tr></thead><tbody>{courses.map((course) => <tr key={course.courseId}><td><strong>{course.title}</strong></td><td><span className={`badge ${course.status === "PUBLISHED" ? "badge-done" : "badge-open"}`}>{course.status}</span></td><td>{course.studentCount}명</td><td>{course.price.toLocaleString()}원</td><td><div className="actions">{course.status === "PUBLISHED" ? <button className="btn btn-danger btn-small" onClick={() => run(() => adminApi.updateCourseStatus(course.courseId,"HIDDEN"),"강의를 숨김 처리했습니다.")}>숨김</button> : <button className="btn btn-primary btn-small" onClick={() => run(() => adminApi.updateCourseStatus(course.courseId,"PUBLISHED"),"강의를 승인했습니다.")}>승인</button>}</div></td></tr>)}</tbody></table>}
      {tab === "reports" && (reports.length ? <table><thead><tr><th>강의</th><th>신고 수</th><th>관리</th></tr></thead><tbody>{reports.map((report) => <tr key={report.courseId}><td>{report.courseTitle}</td><td>{report.reportCount}건</td><td><button className="btn btn-danger btn-small" onClick={() => run(() => reportApi.deleteCourse(report.courseId,"신고 검토 결과 운영 정책 위반"),"강의를 삭제했습니다.")}>강의 삭제</button></td></tr>)}</tbody></table> : <div className="empty">접수된 신고가 없습니다.</div>)}
      {tab === "users" && <table><thead><tr><th>사용자</th><th>역할</th><th>상태</th><th>조치</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><div className="muted">{user.email}</div></td><td>{user.role}</td><td>{user.status}</td><td><button className={`btn btn-small ${user.status === "ACTIVE" ? "btn-danger" : "btn-primary"}`} onClick={() => run(() => user.status === "ACTIVE" ? adminApi.deactivateUser(user.id) : adminApi.activateUser(user.id), user.status === "ACTIVE" ? "사용자를 비활성화했습니다." : "사용자를 활성화했습니다.")}>{user.status === "ACTIVE" ? "비활성화" : "활성화"}</button></td></tr>)}</tbody></table>}
    </section>
  </main></div>;
}
