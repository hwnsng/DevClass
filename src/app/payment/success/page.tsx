"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthUser, paymentApi } from "../../lib/api";

function PaymentSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = Number(params.get("amount"));
    const user = getAuthUser();
    const pendingRaw = orderId ? sessionStorage.getItem(`devclass-payment-${orderId}`) : null;

    if (!user || !paymentKey || !orderId || !Number.isSafeInteger(amount) || amount <= 0 || !pendingRaw) {
      setStatus("error");
      setMessage("결제 정보가 올바르지 않거나 로그인 세션이 만료되었습니다.");
      return;
    }

    let pending: { userId: number; amount: number };
    try {
      pending = JSON.parse(pendingRaw);
    } catch {
      setStatus("error");
      setMessage("저장된 주문 정보를 확인할 수 없습니다.");
      return;
    }

    if (pending.userId !== user.id || pending.amount !== amount) {
      setStatus("error");
      setMessage("결제 금액 또는 구매자 정보가 주문과 일치하지 않습니다.");
      return;
    }

    paymentApi.confirm({ userId: user.id, paymentKey, orderId, amount })
      .then(() => {
        sessionStorage.removeItem(`devclass-payment-${orderId}`);
        setStatus("success");
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message);
      });
  }, [params]);

  if (status === "loading") return <StatusPage title="결제 승인 중" sub="창을 닫지 말고 잠시 기다려주세요." color="#faa307" />;
  if (status === "error") {
    return (
      <StatusPage title="결제를 완료하지 못했습니다" sub={message} color="#e85d04">
        <button style={button} onClick={() => router.push("/cart")}>장바구니로 돌아가기</button>
      </StatusPage>
    );
  }
  return (
    <StatusPage title="결제가 완료되었습니다" sub="구매한 강의가 내 학습에 등록되었습니다." color="#ffba08">
      <div style={{ display: "flex", gap: 12 }}>
        <button style={button} onClick={() => router.push("/enrollments")}>내 강의 보기</button>
        <button style={{ ...button, background: "rgba(255,255,255,.1)" }} onClick={() => router.push("/")}>강의 둘러보기</button>
      </div>
    </StatusPage>
  );
}

function StatusPage({ title, sub, color, children }: { title: string; sub: string; color: string; children?: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#03071e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 520, background: "rgba(55,6,23,.6)", border: "1px solid rgba(255,186,8,.18)", borderRadius: 20, padding: 42 }}>
        <h1 style={{ color, fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{title}</h1>
        <p style={{ color: "#ccc", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>{sub}</p>
        {children}
      </div>
    </div>
  );
}

const button: React.CSSProperties = { background: "linear-gradient(135deg, #d00000, #f48c06)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" };

export default function PaymentSuccessPage() {
  return <Suspense><PaymentSuccessContent /></Suspense>;
}
