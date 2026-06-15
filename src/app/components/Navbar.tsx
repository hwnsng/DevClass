"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmToast from "./ConfirmToast";

type AuthUser = { id: number; name: string; role: string };

export default function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("devclass-auth") || "null");
      if (stored?.role === "ADMIN") { router.replace("/admin"); return; }
      setUser(stored);
    } catch {}
  }, [router]);

  const links = [
    { href: "/", label: "강의" },
    { href: "/enrollments", label: "내 학습" },
    ...(user ? [{ href: "/cart", label: "장바구니" }] : []),
    ...(user?.role === "INSTRUCTOR" ? [{ href: "/instructor", label: "강사 센터" }] : []),
  ];

  return <>
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(3,7,30,.96)", color: "white", borderBottom: "1px solid rgba(255,186,8,.24)" }}>
      <div className="container" style={{ minHeight: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <Link className="brand" href="/" style={{ color: "white" }}><span>Dev</span>Class</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18, overflowX: "auto" }}>
          {links.map((link) => <Link key={link.href} href={link.href} style={{ textDecoration: "none", whiteSpace: "nowrap", color: active === link.label ? "#ffba08" : "#f4e9df", fontSize: 14, fontWeight: 800 }}>{link.label}</Link>)}
          {user ? <>
            <span style={{ whiteSpace: "nowrap", color: "#f48c06", fontSize: 13, fontWeight: 800 }}>{user.name}</span>
            <button className="btn btn-soft btn-small" onClick={() => setConfirming(true)}>로그아웃</button>
          </> : <Link className="btn btn-primary btn-small" href="/auth/login" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>로그인</Link>}
        </div>
      </div>
    </nav>
    {confirming && <ConfirmToast message="로그아웃하시겠습니까?" confirmLabel="로그아웃" onCancel={() => setConfirming(false)} onConfirm={() => { localStorage.removeItem("devclass-auth"); setUser(null); setConfirming(false); router.push("/"); }} />}
  </>;
}
