"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmToast from "./ConfirmToast";

interface AuthUser {
  id: number;
  name: string;
  role: string;
}

export default function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("devclass-auth");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const confirmLogout = () => setShowLogoutConfirm(true);

  const handleLogout = () => {
    localStorage.removeItem("devclass-auth");
    setUser(null);
    setShowLogoutConfirm(false);
    router.push("/");
  };

  const baseLinks = [
    { href: "/", label: "강의" },
    { href: "/enrollments", label: "내 강의" },
  ];
  const instructorLink = { href: "/instructor", label: "강사" };
  const adminLink = { href: "/admin", label: "관리자" };

  const links = [
    ...baseLinks,
    ...(user && (user.role === "INSTRUCTOR" || user.role === "ADMIN") ? [instructorLink] : []),
    ...(user && user.role === "ADMIN" ? [adminLink] : []),
  ];

  return (
    <>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e8f5f0", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(32,180,134,0.07)" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#20B486" }}>Dev</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Class</span>
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: active === label ? "#20B486" : "#555", textDecoration: "none", fontSize: 14, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? "2px solid #20B486" : "none", paddingBottom: 2 }}>{label}</Link>
          ))}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>{user.name}</span>
              <button
                onClick={confirmLogout}
                style={{ background: "none", color: "#888", border: "1.5px solid #ddd", borderRadius: 8, padding: "7px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/auth/login" style={{ background: "#20B486", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 14 }}>로그인</Link>
          )}
        </div>
      </nav>

      {showLogoutConfirm && (
        <ConfirmToast
          message="로그아웃 하시겠습니까?"
          subMessage={`${user?.name}님, 정말 로그아웃 하시겠어요?`}
          confirmLabel="로그아웃"
          cancelLabel="취소"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
