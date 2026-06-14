"use client";
import { useState } from "react";
import { useToast } from "./ToastProvider";

export interface PayItem {
  courseId: number;
  title: string;
  price: number;
  thumbnailUrl?: string;
}

interface Props {
  items: PayItem[];
  onPay: () => Promise<void>;
  onClose: () => void;
}

function formatCard(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 - ").trimEnd().replace(/ - $/, "");
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + " / " + digits.slice(2);
  return digits;
}

export default function MockPaymentModal({ items, onPay, onClose }: Props) {
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [method, setMethod] = useState<"card" | "kakao" | "naver">("card");

  const total = items.reduce((s, i) => s + i.price, 0);

  const handlePay = async () => {
    if (method === "card" && cardNumber.replace(/\D/g, "").length !== 16) return showToast("카드번호 16자리를 입력해주세요.", "error");
    if (method === "card" && expiry.replace(/\D/g, "").length !== 4) return showToast("카드 유효기간을 입력해주세요.", "error");
    if (method === "card" && cvv.length !== 3) return showToast("CVV 3자리를 입력해주세요.", "error");
    if (method === "card" && !cardName.trim()) return showToast("카드 소유자 이름을 입력해주세요.", "error");
    setPaying(true);
    try {
      await onPay();
      setPaid(true);
    } catch (e: any) {
      showToast(e.message || "결제 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}
      >
        {paid ? (
          /* ── 결제 완료 화면 ── */
          <div style={{ padding: "56px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 10 }}>
              수강 등록 완료!
            </h2>
            <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
              강의 수강이 성공적으로 등록되었습니다.
            </p>
            <p style={{ color: "#aaa", fontSize: 13, marginBottom: 36 }}>
              내 강의 페이지에서 바로 시작할 수 있어요.
            </p>
            <button
              onClick={onClose}
              style={{
                background: "#20B486",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px 48px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {/* ── 헤더 ── */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "linear-gradient(135deg, #20B486, #17926d)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  🎓
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>안전결제</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>DevClass Pay</div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#aaa",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* ── 주문 내역 ── */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f7f7f7" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>
                주문 내역
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <div
                    key={item.courseId}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 44,
                          height: 30,
                          borderRadius: 6,
                          background: item.thumbnailUrl
                            ? `url(${item.thumbnailUrl}) center/cover`
                            : "linear-gradient(135deg, #20B486, #17926d)",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          color: "#333",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#333", flexShrink: 0 }}>
                      {item.price === 0 ? "무료" : `₩${item.price.toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1.5px dashed #e0e0e0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>최종 결제금액</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#20B486" }}>
                  {total === 0 ? "무료" : `₩${total.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* ── 결제 수단 ── */}
            {total > 0 && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f7f7f7" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>
                  결제 수단
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {(["card", "kakao", "naver"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      style={{
                        flex: 1,
                        padding: "10px 4px",
                        border: `1.5px solid ${method === m ? "#20B486" : "#e0e0e0"}`,
                        borderRadius: 8,
                        background: method === m ? "#f0faf5" : "#fff",
                        color: method === m ? "#20B486" : "#666",
                        fontWeight: method === m ? 700 : 500,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {m === "card" ? "💳 카드" : m === "kakao" ? "🟡 카카오페이" : "🟢 네이버페이"}
                    </button>
                  ))}
                </div>

                {method === "card" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block" }}>카드 번호</label>
                      <input
                        type="text"
                        placeholder="0000 - 0000 - 0000 - 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          border: "1.5px solid #e0e0e0",
                          borderRadius: 8,
                          fontSize: 15,
                          outline: "none",
                          boxSizing: "border-box",
                          letterSpacing: 1,
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block" }}>유효기간</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            border: "1.5px solid #e0e0e0",
                            borderRadius: 8,
                            fontSize: 15,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block" }}>CVC</label>
                        <input
                          type="password"
                          placeholder="• • •"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            border: "1.5px solid #e0e0e0",
                            borderRadius: 8,
                            fontSize: 15,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "block" }}>카드 소유자명</label>
                      <input
                        type="text"
                        placeholder="홍길동"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          border: "1.5px solid #e0e0e0",
                          borderRadius: 8,
                          fontSize: 15,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                )}

                {(method === "kakao" || method === "naver") && (
                  <div
                    style={{
                      background: method === "kakao" ? "#FEF01B22" : "#03C75A22",
                      borderRadius: 10,
                      padding: "20px",
                      textAlign: "center",
                      border: `1px solid ${method === "kakao" ? "#FEF01B" : "#03C75A"}44`,
                    }}
                  >
                    <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                      {method === "kakao" ? "🟡" : "🟢"}{" "}
                      {method === "kakao" ? "카카오페이" : "네이버페이"} 앱으로 결제가 진행됩니다.
                      <br />
                      <span style={{ color: "#aaa", fontSize: 12 }}>(테스트 환경 — 실제 결제 없음)</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── 보안 안내 + 결제 버튼 ── */}
            <div style={{ padding: "20px 24px 28px" }}>
              {total > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f8faf9",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                  }}
                >
                  <span>🔒</span>
                  <span style={{ fontSize: 12, color: "#888" }}>
                    SSL 256-bit 암호화로 안전하게 처리됩니다. (테스트 환경)
                  </span>
                </div>
              )}
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: paying ? "#aaa" : "#20B486",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 17,
                  fontWeight: 800,
                  cursor: paying ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {paying
                  ? "처리 중..."
                  : total === 0
                  ? "무료 수강 등록"
                  : `₩${total.toLocaleString()} 결제하기`}
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 10 }}>
                이 결제는 실제로 처리되지 않는 테스트 환경입니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
