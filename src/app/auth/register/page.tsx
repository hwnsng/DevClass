"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/lib/api";
import { useToast } from "@/app/components/ToastProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "STUDENT" });
  const [loading, setLoading] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return showToast("이름을 입력해주세요.", "error");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return showToast("올바른 이메일을 입력해주세요.", "error");
    if (form.password.length < 8) return showToast("비밀번호는 8자 이상 입력해주세요.", "error");
    if (form.password !== form.confirm) return showToast("비밀번호 확인이 일치하지 않습니다.", "error");
    setLoading(true);
    try {
      const data = await authApi.register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      localStorage.setItem("devclass-auth", JSON.stringify({ id: data.id, email: data.email, name: data.name, role: data.role, token: data.token }));
      showToast("회원가입이 완료되었습니다.", "success"); router.push("/");
    } catch (error: any) { showToast(error.message || "회원가입에 실패했습니다.", "error"); }
    finally { setLoading(false); }
  };
  return <main className="auth-shell"><section className="card auth-card">
    <Link className="brand" href="/"><span>Dev</span>Class</Link>
    <div style={{ margin: "24px 0" }}><div className="eyebrow">Join DevClass</div><h1 className="page-title" style={{ fontSize: 32 }}>배움과 가르침을 연결합니다</h1></div>
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field"><label htmlFor="name">이름</label><input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="field"><label htmlFor="email">이메일</label><input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div className="field"><label htmlFor="password">비밀번호</label><input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="8자 이상" /></div>
      <div className="field"><label htmlFor="confirm">비밀번호 확인</label><input id="confirm" type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} /></div>
      <div className="field"><label>가입 유형</label><div className="actions"><button type="button" className={`btn ${form.role === "STUDENT" ? "btn-dark" : "btn-soft"}`} onClick={() => set("role", "STUDENT")}>학생</button><button type="button" className={`btn ${form.role === "INSTRUCTOR" ? "btn-dark" : "btn-soft"}`} onClick={() => set("role", "INSTRUCTOR")}>강사</button></div></div>
      <button className="btn btn-primary" disabled={loading}>{loading ? "가입 중..." : "회원가입"}</button>
    </form>
    <p className="page-copy" style={{ textAlign: "center" }}>이미 계정이 있다면 <Link href="/auth/login" style={{ color: "#d00000", fontWeight: 900 }}>로그인</Link></p>
  </section></main>;
}
