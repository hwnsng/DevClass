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

export default function ConfirmToast({ message, subMessage, confirmLabel = "확인", cancelLabel = "취소", danger = false, onConfirm, onCancel }: Props) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section className="card dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="eyebrow">Confirm action</div>
      <h2 id="confirm-title" className="section-title">{message}</h2>
      {subMessage && <p className="page-copy">{subMessage}</p>}
      <div className="actions dialog-actions">
        <button className="btn btn-soft" onClick={onCancel}>{cancelLabel}</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
