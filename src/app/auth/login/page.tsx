"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/lib/api";
import { useToast } from "@/app/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return showToast("이메일을 입력해주세요.", "error");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast("올바른 이메일 형식을 입력해주세요.", "error");
    if (!password) return showToast("비밀번호를 입력해주세요.", "error");
    setLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      if (data.role === "ADMIN") {
        localStorage.removeItem("devclass-auth");
        showToast("관리자 계정은 관리자 전용 로그인 화면을 이용해주세요.", "error");
        return;
      }
      localStorage.setItem("devclass-auth", JSON.stringify({ id: data.id, email: data.email, name: data.name, role: data.role, token: data.token }));
      showToast("로그인되었습니다.", "success"); router.push("/");
    } catch (error: any) { showToast(error.message || "로그인에 실패했습니다.", "error"); }
    finally { setLoading(false); }
  };
  return <main className="auth-shell"><section className="card auth-card">
    <Link className="brand" href="/"><span>Dev</span>Class</Link>
    <div style={{ margin: "26px 0" }}><div className="eyebrow">Welcome back</div><h1 className="page-title" style={{ fontSize: 34 }}>다시 학습을 시작하세요</h1></div>
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field"><label htmlFor="email">이메일</label><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@devclass.com" /></div>
      <div className="field"><label htmlFor="password">비밀번호</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" /></div>
      <button className="btn btn-primary" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
    </form>
    <p className="page-copy" style={{ textAlign: "center" }}>계정이 없다면 <Link href="/auth/register" style={{ color: "#d00000", fontWeight: 900 }}>회원가입</Link></p>
  </section></main>;
}
