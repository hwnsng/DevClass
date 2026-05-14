"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem("devclass-auth", JSON.stringify({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        token: data.token,
      }));
      router.push("/");
    } catch (e: any) {
      setError(e.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8faf9 0%, #e8f5f0 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 32 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#20B486" }}>Dev</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e" }}>Class</span>
      </Link>

      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(32,180,134,0.12)", border: "1.5px solid #e8f5f0" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 8, textAlign: "center" }}>로그인</h2>
        <p style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 32 }}>DevClass에 오신 걸 환영합니다!</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>이메일</label>
            <input type="email" placeholder="이메일을 입력하세요" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#20B486"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>비밀번호</label>
            <input type="password" placeholder="비밀번호를 입력하세요" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#20B486"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#e0e0e0"} />
          </div>

          {error && <div style={{ background: "#fff5f5", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e53935" }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: 15, background: loading ? "#aaa" : "#20B486", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer", marginTop: 8 }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
          계정이 없으신가요?{" "}
          <Link href="/auth/register" style={{ color: "#20B486", fontWeight: 700, textDecoration: "none" }}>회원가입</Link>
        </div>
      </div>

      <Link href="/" style={{ marginTop: 24, color: "#aaa", textDecoration: "none", fontSize: 13 }}>← 메인으로 돌아가기</Link>
    </div>
  );
}
