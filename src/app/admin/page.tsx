"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import ConfirmToast from "../components/ConfirmToast";
import SuccessToast from "../components/SuccessToast";
import { reportApi, adminApi, getAuthUser } from "@/app/lib/api";

interface ReportDetail {
  id: number;
  userId: number;
  reason: string;
  description: string;
  createdAt: string;
}

interface ReportSummary {
  courseId: number;
  courseTitle: string;
  reportCount: number;
  details: ReportDetail[];
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

const REASON_COLOR: Record<string, string> = {
  "저작권 침해": "#ff4d4f",
  "스팸": "#fa8c16",
  "잘못된 강의 내용": "#1890ff",
  "부적절한 콘텐츠": "#722ed1",
  "기타": "#888",
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "학생",
  INSTRUCTOR: "강사",
  ADMIN: "관리자",
};

const ROLE_COLOR: Record<string, string> = {
  STUDENT: "#20B486",
  INSTRUCTOR: "#5a7fcc",
  ADMIN: "#ff4d4f",
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"reports" | "users">("reports");

  // Reports
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ courseId: number; title: string } | null>(null);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<AdminUser | null>(null);

  // Toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "ADMIN") { router.push("/"); return; }

    reportApi.getAdminReports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    adminApi.getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
  }, [tab, users.length, loadUsers]);

  const confirmDeleteCourse = async () => {
    if (!pendingDelete) return;
    try {
      await reportApi.deleteCourse(pendingDelete.courseId, "관리자에 의해 삭제된 강의입니다.");
      setReports(p => p.filter(r => r.courseId !== pendingDelete.courseId));
      setSuccessMsg("강의가 삭제되었습니다. 수강생에게 알림이 발송되었습니다.");
    } catch (e: any) {
      setSuccessMsg("삭제 실패: " + e.message);
    } finally {
      setPendingDelete(null);
    }
  };

  const confirmToggleUser = async () => {
    if (!pendingToggle) return;
    try {
      if (pendingToggle.status === "ACTIVE") {
        await adminApi.deactivateUser(pendingToggle.id);
        setUsers(p => p.map(u => u.id === pendingToggle.id ? { ...u, status: "INACTIVE" } : u));
        setSuccessMsg(`${pendingToggle.name} 계정을 비활성화했습니다.`);
      } else {
        await adminApi.activateUser(pendingToggle.id);
        setUsers(p => p.map(u => u.id === pendingToggle.id ? { ...u, status: "ACTIVE" } : u));
        setSuccessMsg(`${pendingToggle.name} 계정을 활성화했습니다.`);
      }
    } catch (e: any) {
      setSuccessMsg("처리 실패: " + e.message);
    } finally {
      setPendingToggle(null);
    }
  };

  const total = reports.reduce((s, r) => s + r.reportCount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf9" }}>
      <Navbar active="관리자" />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>관리자 페이지</h1>
          <p style={{ fontSize: 15, color: "#888" }}>신고된 강의를 확인하고 사용자를 관리하세요.</p>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {(["reports", "users"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                background: tab === t ? "#1a1a2e" : "#f0f0f0",
                color: tab === t ? "#fff" : "#666",
              }}
            >
              {t === "reports" ? "🚨 신고 관리" : "👥 사용자 관리"}
            </button>
          ))}
        </div>

        {/* 신고 탭 */}
        {tab === "reports" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 36 }}>
              {[
                { label: "신고된 강의", value: reports.length, icon: "🚨" },
                { label: "총 신고 건수", value: total, icon: "📋" },
                { label: "처리 대기", value: reports.length, icon: "⏳" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#ff4d4f" }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>신고 목록</h2>

            {loadingReports ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: 40 }}>불러오는 중...</p>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <p style={{ fontSize: 16 }}>신고된 강의가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reports.map(r => (
                  <div key={r.courseId} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #eee" }}>
                    <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, background: "#fff5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚨</div>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{r.courseTitle}</h3>
                          <span style={{ background: "#fff5f5", color: "#ff4d4f", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>신고 {r.reportCount}건</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setExpanded(expanded === r.courseId ? null : r.courseId)}
                          style={{ background: "#f5f5f5", color: "#555", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          {expanded === r.courseId ? "▲ 접기" : "▼ 상세 보기"}
                        </button>
                        <button
                          onClick={() => setPendingDelete({ courseId: r.courseId, title: r.courseTitle })}
                          style={{ background: "#ff4d4f", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          강의 삭제
                        </button>
                      </div>
                    </div>

                    {expanded === r.courseId && (
                      <div style={{ borderTop: "1px solid #f5f5f5" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", padding: "12px 24px", background: "#f8faf9", fontSize: 12, fontWeight: 700, color: "#aaa" }}>
                          <span>사용자 ID</span><span>신고 사유</span><span>내용</span><span>신고일</span>
                        </div>
                        {r.details.map((d, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", padding: "14px 24px", borderTop: "1px solid #f5f5f5", alignItems: "center", fontSize: 14 }}>
                            <span style={{ fontWeight: 600, color: "#333" }}>#{d.userId}</span>
                            <span style={{ background: `${REASON_COLOR[d.reason] || "#888"}15`, color: REASON_COLOR[d.reason] || "#888", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, width: "fit-content" }}>{d.reason}</span>
                            <span style={{ color: "#666" }}>{d.description}</span>
                            <span style={{ color: "#aaa", fontSize: 13 }}>{d.createdAt?.slice(0, 10)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 사용자 탭 */}
        {tab === "users" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>사용자 목록 ({users.length}명)</h2>
              <button onClick={loadUsers} style={{ background: "#f0f0f0", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555" }}>
                새로고침
              </button>
            </div>

            {loadingUsers ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: 40 }}>불러오는 중...</p>
            ) : (
              <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #eee" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr", padding: "12px 24px", background: "#f8faf9", fontSize: 12, fontWeight: 700, color: "#aaa", borderBottom: "1px solid #eee" }}>
                  <span>ID</span><span>이메일</span><span>이름</span><span>역할</span><span>상태</span><span>액션</span>
                </div>
                {users.length === 0 ? (
                  <p style={{ textAlign: "center", padding: 40, color: "#aaa" }}>사용자가 없습니다.</p>
                ) : (
                  users.map((u, i) => (
                    <div
                      key={u.id}
                      style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr", padding: "14px 24px", borderTop: i === 0 ? "none" : "1px solid #f5f5f5", alignItems: "center", fontSize: 14 }}
                    >
                      <span style={{ fontWeight: 600, color: "#888" }}>#{u.id}</span>
                      <span style={{ color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{u.name}</span>
                      <span style={{ background: `${ROLE_COLOR[u.role] || "#888"}18`, color: ROLE_COLOR[u.role] || "#888", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, width: "fit-content" }}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                      <span style={{ color: u.status === "ACTIVE" ? "#20B486" : "#ff4d4f", fontWeight: 600, fontSize: 13 }}>
                        {u.status === "ACTIVE" ? "활성" : "비활성"}
                      </span>
                      {u.role !== "ADMIN" ? (
                        <button
                          onClick={() => setPendingToggle(u)}
                          style={{
                            background: u.status === "ACTIVE" ? "#fff5f5" : "#e8f5f0",
                            color: u.status === "ACTIVE" ? "#ff4d4f" : "#20B486",
                            border: `1.5px solid ${u.status === "ACTIVE" ? "#ffcdd2" : "#b7e4d2"}`,
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "fit-content",
                          }}
                        >
                          {u.status === "ACTIVE" ? "비활성화" : "활성화"}
                        </button>
                      ) : (
                        <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ConfirmToast - 강의 삭제 */}
      {pendingDelete && (
        <ConfirmToast
          message="강의를 삭제하시겠습니까?"
          subMessage={`"${pendingDelete.title}" 강의와 모든 레슨이 삭제됩니다.\n수강생에게 알림이 발송됩니다.`}
          confirmLabel="삭제"
          danger
          onConfirm={confirmDeleteCourse}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {/* ConfirmToast - 사용자 상태 변경 */}
      {pendingToggle && (
        <ConfirmToast
          message={pendingToggle.status === "ACTIVE" ? "계정을 비활성화하시겠습니까?" : "계정을 활성화하시겠습니까?"}
          subMessage={`${pendingToggle.name} (${pendingToggle.email})`}
          confirmLabel={pendingToggle.status === "ACTIVE" ? "비활성화" : "활성화"}
          danger={pendingToggle.status === "ACTIVE"}
          onConfirm={confirmToggleUser}
          onCancel={() => setPendingToggle(null)}
        />
      )}

      {/* SuccessToast */}
      {successMsg && (
        <SuccessToast message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}
    </div>
  );
}
