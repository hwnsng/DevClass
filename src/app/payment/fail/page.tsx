"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentFailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const errorMessage = params.get("message") || "결제가 취소되었거나 처리 중 오류가 발생했습니다.";
  const errorCode = params.get("code");
  const orderId = params.get("orderId");

  if (orderId && typeof window !== "undefined") {
    sessionStorage.removeItem(`devclass-payment-${orderId}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#03071e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 520, background: "rgba(55,6,23,.6)", border: "1px solid rgba(232,93,4,.25)", borderRadius: 20, padding: 42 }}>
        <h1 style={{ color: "#e85d04", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>결제를 완료하지 못했습니다</h1>
        {errorCode && <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>오류 코드: {errorCode}</p>}
        <p style={{ color: "#ccc", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>{errorMessage}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button style={button} onClick={() => router.push("/cart")}>장바구니로 돌아가기</button>
          <button style={{ ...button, background: "rgba(255,255,255,.1)" }} onClick={() => router.push("/")}>홈으로</button>
        </div>
      </div>
    </div>
  );
}

const button: React.CSSProperties = { background: "linear-gradient(135deg, #d00000, #f48c06)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" };

export default function PaymentFailPage() {
  return <Suspense><PaymentFailContent /></Suspense>;
}
