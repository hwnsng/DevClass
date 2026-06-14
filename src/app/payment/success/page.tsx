"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentApi } from "../../lib/api";

const USER_ID = 3;

function PaymentSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId    = params.get("orderId");
    const amount     = Number(params.get("amount"));
    const courseIds  = (params.get("courseIds") || "").split(",").map(Number).filter(Boolean);

    if (!paymentKey || !orderId) {
      setStatus("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    paymentApi
      .confirm({ userId: USER_ID, paymentKey, orderId, amount, courseIds })
      .then(() => setStatus("success"))
      .catch((e: Error) => { setStatus("error"); setMessage(e.message); });
  }, [params]);

  if (status === "loading")
    return <StatusPage icon="⏳" title="결제 처리 중..." sub="잠시만 기다려주세요." color="#d00000" />;

  if (status === "error")
    return (
      <StatusPage icon="❌" title="결제 실패" sub={message} color="#ef4444">
        <button style={btn} onClick={() => router.push("/cart")}>장바구니로 돌아가기</button>
      </StatusPage>
    );

  return (
    <StatusPage icon="✅" title="결제 완료!" sub="강의 수강 등록이 완료되었습니다." color="#d00000">
      <div style={{ display: "flex", gap: 12 }}>
        <button style={btn} onClick={() => router.push("/enrollments")}>내 강의 보기</button>
        <button style={{ ...btn, background: "rgba(255,255,255,0.1)" }} onClick={() => router.push("/")}>
          강의 둘러보기
        </button>
      </div>
    </StatusPage>
  );
}

function StatusPage({ icon, title, sub, color, children }: {
  icon: string; title: string; sub: string; color: string; children?: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>{icon}</div>
        <h1 style={{ color, fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{title}</h1>
        <p style={{ color: "#aaa", fontSize: 16, marginBottom: 32 }}>{sub}</p>
        {children}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#d00000", color: "#fff", border: "none", borderRadius: 8,
  padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer",
};

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
