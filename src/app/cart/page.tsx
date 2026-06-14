"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmToast from "../components/ConfirmToast";
import { useToast } from "../components/ToastProvider";
import { apiFetch, cartApi, getAuthUser, paymentApi } from "../lib/api";

interface CartItem {
  cartItemId: number;
  courseId: number;
  title: string;
  price: number;
  thumbnailUrl?: string;
}

interface PreparedPayment {
  orderId: string;
  orderName: string;
  totalAmount: number;
}

function getCustomerKey(userId: number) {
  const storageKey = `devclass-toss-customer-key-${userId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) return saved;
  const customerKey = crypto.randomUUID();
  localStorage.setItem(storageKey, customerKey);
  return customerKey;
}

export default function CartPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<number | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      showToast("로그인 후 장바구니를 이용할 수 있습니다.", "error");
      router.replace("/auth/login");
      return;
    }
    cartApi.getCart(user.id)
      .then((data: CartItem[]) => {
        setItems(data);
        setSelected(new Set(data.map((item) => item.cartItemId)));
      })
      .catch((error: Error) => showToast(error.message, "error"))
      .finally(() => setLoading(false));
  }, [router, showToast]);

  function toggleSelect(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeItem(cartItemId: number) {
    const user = getAuthUser();
    setRemoveTarget(null);
    if (!user) return;
    try {
      await cartApi.removeFromCart(cartItemId, user.id);
      setItems((current) => current.filter((item) => item.cartItemId !== cartItemId));
      setSelected((current) => {
        const next = new Set(current);
        next.delete(cartItemId);
        return next;
      });
      showToast("장바구니에서 삭제했습니다.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "삭제하지 못했습니다.", "error");
    }
  }

  const selectedItems = items.filter((item) => selected.has(item.cartItemId));
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

  async function enrollFreeCourses(userId: number) {
    for (const item of selectedItems) {
      await apiFetch("/enrollments", {
        method: "POST",
        body: JSON.stringify({ userId, courseId: item.courseId }),
      });
      await cartApi.removeFromCart(item.cartItemId, userId);
    }
    showToast("무료 강의 수강 등록이 완료되었습니다.", "success");
    router.push("/enrollments");
  }

  async function handlePayment() {
    const user = getAuthUser();
    if (!user) {
      showToast("로그인이 필요합니다.", "error");
      router.push("/auth/login");
      return;
    }
    if (selectedItems.length === 0) {
      showToast("결제할 강의를 선택해주세요.", "error");
      return;
    }

    setPaying(true);
    try {
      if (totalAmount === 0) {
        await enrollFreeCourses(user.id);
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.");

      const courseIds = selectedItems.map((item) => item.courseId);
      const prepared = await paymentApi.prepare(user.id, courseIds) as PreparedPayment;
      if (prepared.totalAmount !== totalAmount) {
        throw new Error("강의 가격이 변경되었습니다. 장바구니를 새로고침해주세요.");
      }

      sessionStorage.setItem(
        `devclass-payment-${prepared.orderId}`,
        JSON.stringify({ userId: user.id, amount: prepared.totalAmount })
      );

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: getCustomerKey(user.id) });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: prepared.totalAmount },
        orderId: prepared.orderId,
        orderName: prepared.orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user.email,
        customerName: user.name,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "결제창을 열지 못했습니다.";
      if (!message.includes("취소")) showToast(message, "error");
      setPaying(false);
    }
  }

  if (loading) return <div style={styles.center}>장바구니를 불러오는 중...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>장바구니</h1>
      {items.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: "#aaa", fontSize: 18 }}>장바구니가 비어 있습니다.</p>
          <button style={styles.btn} onClick={() => router.push("/")}>강의 둘러보기</button>
        </div>
      ) : (
        <div style={styles.layout}>
          <div style={styles.list}>
            {items.map((item) => (
              <div key={item.cartItemId} style={styles.card}>
                <input type="checkbox" checked={selected.has(item.cartItemId)}
                  onChange={() => toggleSelect(item.cartItemId)}
                  style={{ width: 18, height: 18, accentColor: "#d00000", flexShrink: 0 }} />
                <div style={{ width: 80, height: 54, borderRadius: 8, flexShrink: 0,
                  background: item.thumbnailUrl ? `url(${item.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #e85d04, #9d0208)" }} />
                <div style={{ flex: 1 }}>
                  <p style={styles.itemTitle}>{item.title}</p>
                  <p style={styles.itemPrice}>{item.price === 0 ? "무료" : `${item.price.toLocaleString()}원`}</p>
                </div>
                <button style={styles.removeBtn} onClick={() => setRemoveTarget(item.cartItemId)} aria-label={`${item.title} 삭제`}>삭제</button>
              </div>
            ))}
          </div>
          <div style={styles.summary}>
            <h3 style={{ color: "#fff", marginBottom: 16 }}>결제 요약</h3>
            <div style={styles.summaryRow}><span style={{ color: "#aaa" }}>선택 강의</span><span>{selectedItems.length}개</span></div>
            <div style={styles.summaryRow}>
              <span style={{ color: "#aaa" }}>총 금액</span>
              <span style={{ color: "#ffba08", fontSize: 20, fontWeight: 700 }}>{totalAmount === 0 ? "무료" : `${totalAmount.toLocaleString()}원`}</span>
            </div>
            <button style={{ ...styles.btn, width: "100%", marginTop: 20, opacity: paying ? 0.65 : 1 }}
              onClick={handlePayment} disabled={paying}>
              {paying ? "처리 중..." : totalAmount === 0 ? "무료 수강 등록" : "토스로 결제하기"}
            </button>
          </div>
        </div>
      )}
      {removeTarget !== null && (
        <ConfirmToast message="장바구니에서 삭제하시겠습니까?"
          subMessage={items.find((item) => item.cartItemId === removeTarget)?.title}
          confirmLabel="삭제" cancelLabel="취소" danger
          onConfirm={() => removeItem(removeTarget)} onCancel={() => setRemoveTarget(null)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#03071e", padding: "40px 24px", maxWidth: 1000, margin: "0 auto", color: "#fff" },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 32 },
  center: { minHeight: "100vh", background: "#03071e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "80px 0" },
  layout: { display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" },
  list: { flex: "1 1 560px", display: "flex", flexDirection: "column", gap: 16 },
  card: { display: "flex", alignItems: "center", gap: 16, background: "rgba(55,6,23,.55)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,186,8,.16)" },
  itemTitle: { color: "#fff", fontWeight: 600, marginBottom: 4, fontSize: 15 },
  itemPrice: { color: "#faa307", fontSize: 14 },
  removeBtn: { background: "transparent", border: "1px solid rgba(255,255,255,.15)", borderRadius: 7, color: "#bbb", cursor: "pointer", padding: "6px 10px" },
  summary: { width: 280, background: "linear-gradient(160deg, rgba(106,4,15,.75), rgba(3,7,30,.95))", borderRadius: 16, padding: 24, border: "1px solid rgba(255,186,8,.2)", flexShrink: 0 },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  btn: { background: "linear-gradient(135deg, #d00000, #f48c06)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer" },
};
