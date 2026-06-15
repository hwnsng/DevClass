"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, getAuthUser } from "@/app/lib/api";
import { useToast } from "@/app/components/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAuthUser()?.role === "ADMIN") router.replace("/admin");
  }, [router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return showToast("관리자 이메일을 입력해주세요.", "error");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast("올바른 이메일 형식을 입력해주세요.", "error");
    if (!password) return showToast("비밀번호를 입력해주세요.", "error");

    setLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      if (data.role !== "ADMIN") {
        localStorage.removeItem("devclass-auth");
        showToast("관리자 권한이 없는 계정입니다.", "error");
        return;
      }
      localStorage.setItem("devclass-auth", JSON.stringify({
        id: data.id, email: data.email, name: data.name, role: data.role, token: data.token,
      }));
      showToast("관리자 인증이 완료되었습니다.", "success");
      router.replace("/admin");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "관리자 로그인에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <div className="brand"><span>Dev</span>Class</div>
        <div style={{ margin: "26px 0" }}>
          <div className="eyebrow">Operations access</div>
          <h1 className="page-title" style={{ fontSize: 34 }}>관리자 로그인</h1>
          <p className="page-copy">서비스 운영 권한이 있는 계정만 접근할 수 있습니다.</p>
        </div>
        <form className="form-grid" onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="admin-email">관리자 이메일</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="admin-password">비밀번호</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <button className="btn btn-primary" disabled={loading}>{loading ? "인증 중..." : "운영 콘솔 로그인"}</button>
        </form>
      </section>
    </main>
  );
}
