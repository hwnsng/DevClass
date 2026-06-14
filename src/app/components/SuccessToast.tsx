"use client";
import { useEffect } from "react";

export default function SuccessToast({ message, subMessage, duration = 3000, onClose }: { message: string; subMessage?: string; duration?: number; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, duration); return () => window.clearTimeout(timer); }, [duration, onClose]);
  return <div className="toast-stack" aria-live="polite"><button className="toast toast-success" onClick={onClose}><span>완료</span><strong>{message}{subMessage && <small>{subMessage}</small>}</strong></button></div>;
}
