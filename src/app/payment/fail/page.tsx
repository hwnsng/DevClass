"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentFailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const errorMsg  = params.get("message") || "결제가 취소되었거나 오류가 발생했습니다.";
  const errorCode = params.get("code") || "";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>❌</div>
        <h1 style={{ color: "#ef4444", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>결제 실패</h1>
        {errorCode && <p style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>코드: {errorCode}</p>}
        <p style={{ color: "#aaa", fontSize: 16, marginBottom: 32 }}>{errorMsg}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            style={{ background: "#20B486", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
            onClick={() => router.push("/cart")}
          >
            장바구니로 돌아가기
          </button>
          <button
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 16, cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailContent />
    </Suspense>
  );
}
