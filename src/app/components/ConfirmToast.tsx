"use client";

interface Props {
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmToast({
  message,
  subMessage,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 998 }}
        onClick={onCancel}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 999,
          background: "#fff",
          borderRadius: 18,
          padding: "32px 36px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
          minWidth: 320,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 14 }}>
          {danger ? "⚠️" : "💬"}
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: subMessage ? 8 : 28 }}>
          {message}
        </p>
        {subMessage && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
            {subMessage}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "11px 30px",
              background: "#f5f5f5",
              border: "none",
              borderRadius: 10,
              color: "#555",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "11px 30px",
              background: danger ? "#ff4d4f" : "#20B486",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
