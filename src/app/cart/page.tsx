"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cartApi, paymentApi } from "../lib/api";
import MockPaymentModal from "../components/MockPaymentModal";
import ConfirmToast from "../components/ConfirmToast";

function getLocalUserId(): number {
  try {
    const raw = localStorage.getItem("devclass-auth");
    return raw ? (JSON.parse(raw).id ?? 0) : 0;
  } catch { return 0; }
}

interface CartItem {
  cartItemId: number;
  courseId: number;
  title: string;
  price: number;
  thumbnailUrl?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<number | null>(null);

  useEffect(() => {
    cartApi.getCart(getLocalUserId())
      .then((data: CartItem[]) => {
        setItems(data);
        setSelected(new Set(data.map((i) => i.cartItemId)));
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeItem(cartItemId: number) {
    setRemoveTarget(null);
    await cartApi.removeFromCart(cartItemId, getLocalUserId());
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    setSelected((prev) => { const next = new Set(prev); next.delete(cartItemId); return next; });
  }

  const selectedItems = items.filter((i) => selected.has(i.cartItemId));
  const totalAmount = selectedItems.reduce((sum, i) => sum + i.price, 0);

  async function handlePayment() {
    if (selectedItems.length === 0) return alert("결제할 강의를 선택해주세요.");
    setShowPayment(true);
  }

  async function doPay() {
    const courseIds = selectedItems.map((i) => i.courseId);
    const prepared = await paymentApi.prepare(getLocalUserId(), courseIds);
    await paymentApi.confirm({
      userId: getLocalUserId(),
      paymentKey: "MOCK-" + Date.now(),
      orderId: prepared.orderId,
      amount: totalAmount,
      courseIds,
    });
    // 결제 완료 후 장바구니에서 제거
    setItems((prev) => prev.filter((i) => !selected.has(i.cartItemId)));
    setSelected(new Set());
    setPaySuccess(true);
  }

  if (loading) return <div style={styles.center}>장바구니 불러오는 중...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>장바구니</h1>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: "#aaa", fontSize: 18 }}>장바구니가 비어있습니다.</p>
          <button style={styles.btn} onClick={() => router.push("/")}>강의 둘러보기</button>
        </div>
      ) : (
        <div style={styles.layout}>
          {/* 강의 목록 */}
          <div style={styles.list}>
            {items.map((item) => (
              <div key={item.cartItemId} style={styles.card}>
                <input
                  type="checkbox"
                  checked={selected.has(item.cartItemId)}
                  onChange={() => toggleSelect(item.cartItemId)}
                  style={{ width: 18, height: 18, accentColor: "#20B486", flexShrink: 0 }}
                />
                <div
                  style={{
                    width: 80, height: 54, borderRadius: 8, flexShrink: 0,
                    background: item.thumbnailUrl ? `url(${item.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #20B486, #17926d)",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={styles.itemTitle}>{item.title}</p>
                  <p style={styles.itemPrice}>
                    {item.price === 0 ? "무료" : item.price.toLocaleString() + "원"}
                  </p>
                </div>
                <button
                  style={styles.removeBtn}
                  onClick={() => setRemoveTarget(item.cartItemId)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 결제 요약 */}
          <div style={styles.summary}>
            <h3 style={{ color: "#fff", marginBottom: 16 }}>결제 요약</h3>
            <div style={styles.summaryRow}>
              <span style={{ color: "#aaa" }}>선택 강의</span>
              <span style={{ color: "#fff" }}>{selectedItems.length}개</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={{ color: "#aaa" }}>총 금액</span>
              <span style={{ color: "#20B486", fontSize: 20, fontWeight: 700 }}>
                {totalAmount === 0 ? "무료" : totalAmount.toLocaleString() + "원"}
              </span>
            </div>
            <button
              style={{ ...styles.btn, width: "100%", marginTop: 20 }}
              onClick={handlePayment}
            >
              {totalAmount === 0 ? "무료 수강 등록" : "결제하기"}
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 토스트 */}
      {removeTarget !== null && (
        <ConfirmToast
          message="장바구니에서 삭제하시겠습니까?"
          subMessage={items.find((i) => i.cartItemId === removeTarget)?.title}
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onConfirm={() => removeItem(removeTarget)}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {/* 결제 모달 */}
      {showPayment && (
        <MockPaymentModal
          items={selectedItems.map((i) => ({
            courseId: i.courseId,
            title: i.title,
            price: i.price,
            thumbnailUrl: i.thumbnailUrl,
          }))}
          onPay={doPay}
          onClose={() => {
            setShowPayment(false);
            if (paySuccess) router.push("/enrollments");
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", background: "#0a0a1a", padding: "40px 24px", maxWidth: 1000,
    margin: "0 auto", color: "#fff",
  },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 32 },
  center: { minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "80px 0" },
  layout: { display: "flex", gap: 32, alignItems: "flex-start" },
  list: { flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  card: {
    display: "flex", alignItems: "center", gap: 16,
    background: "rgba(255,255,255,0.05)", borderRadius: 12,
    padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)",
  },
  itemTitle: { color: "#fff", fontWeight: 600, marginBottom: 4, fontSize: 15 },
  itemPrice: { color: "#20B486", fontSize: 14 },
  removeBtn: {
    background: "none", border: "none", color: "#888", cursor: "pointer",
    fontSize: 18, padding: "4px 8px",
  },
  summary: {
    width: 280, background: "rgba(255,255,255,0.05)", borderRadius: 16,
    padding: 24, border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
  },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  btn: {
    background: "#20B486", color: "#fff", border: "none", borderRadius: 8,
    padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer",
  },
};
