"use client";
import { useEffect } from "react";

interface Props {
  message: string;
  subMessage?: string;
  duration?: number;
  onClose: () => void;
}

export default function SuccessToast({
  message,
  subMessage,
  duration = 3000,
  onClose,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 1200,
        background: "#fff",
        borderRadius: 14,
        padding: "16px 24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        minWidth: 260,
        maxWidth: 360,
        borderLeft: "4px solid #20B486",
        animation: "slideIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          width: 36,
          height: 36,
          background: "#e8f5f0",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        ✅
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{message}</p>
        {subMessage && (
          <p style={{ fontSize: 12, color: "#888", margin: "3px 0 0" }}>{subMessage}</p>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#bbb",
          fontSize: 18,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
