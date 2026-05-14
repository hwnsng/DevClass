"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "STUDENT" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { setError("모든 항목을 입력해주세요."); return; }
    if (form.password !== form.confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (form.password.length < 4) { setError("비밀번호는 4자 이상이어야 합니다."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await authApi.register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      });
      localStorage.setItem("devclass-auth", JSON.stringify({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        token: data.token,
      }));
      router.push("/");
    } catch (e: any) {
      setError(e.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8faf9 0%, #e8f5f0 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 32 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#20B486" }}>Dev</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e" }}>Class</span>
      </Link>

      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(32,180,134,0.12)", border: "1.5px solid #e8f5f0" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 8, textAlign: "center" }}>회원가입</h2>
        <p style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 32 }}>DevClass와 함께 성장하세요!</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>이름</label>
            <input type="text" placeholder="이름을 입력하세요" value={form.name} onChange={e => set("name", e.target.value)} style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#20B486"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>이메일</label>
            <input type="email" placeholder="이메일을 입력하세요" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#20B486"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>비밀번호</label>
            <input type="password" placeholder="비밀번호를 입력하세요" value={form.password} onChange={e => set("password", e.target.value)} style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#20B486"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>비밀번호 확인</label>
            <input type="password" placeholder="비밀번호를 다시 입력하세요" value={form.confirm} onChange={e => set("confirm", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#20B486"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>역할</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ value: "STUDENT", label: "🎓 학생" }, { value: "INSTRUCTOR", label: "👨‍💻 강사" }].map(r => (
                <button key={r.value} onClick={() => set("role", r.value)} style={{ flex: 1, padding: "12px", border: `2px solid ${form.role === r.value ? "#20B486" : "#e0e0e0"}`, borderRadius: 10, background: form.role === r.value ? "#e8f5f0" : "#fff", color: form.role === r.value ? "#20B486" : "#666", fontWeight: form.role === r.value ? 700 : 500, fontSize: 14, cursor: "pointer" }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ background: "#fff5f5", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e53935" }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: 15, background: loading ? "#aaa" : "#20B486", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer", marginTop: 8 }}>
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" style={{ color: "#20B486", fontWeight: 700, textDecoration: "none" }}>로그인</Link>
        </div>
      </div>
    </div>
  );
}
