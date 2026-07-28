import { useEffect } from "react";

const FEEDBACK_STYLE_ID = "community-feedback-styles";

const FEEDBACK_STYLES = `
  .cfb-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.62);
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .cfb-modal {
    width: 100%;
    max-width: 460px;
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(15,34,20,0.98) 0%, rgba(9,24,14,0.98) 100%);
    border: 1px solid rgba(120,200,145,0.24);
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
    backdrop-filter: blur(14px);
    padding: 24px;
  }
  .cfb-title {
    margin: 0 0 6px;
    font-size: 20px;
    font-weight: 800;
    color: #e8f0e2;
    letter-spacing: -0.01em;
  }
  .cfb-message {
    margin: 0;
    font-size: 13px;
    color: rgba(160,210,170,0.72);
    line-height: 1.65;
  }
  .cfb-note {
    margin-top: 14px;
    border-radius: 14px;
    border: 1px solid rgba(120,200,145,0.18);
    background: rgba(245,197,24,0.07);
    color: rgba(232,240,226,0.92);
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.55;
  }
  .cfb-note-danger {
    border-color: rgba(220,38,38,0.22);
    background: rgba(220,38,38,0.10);
    color: #fecaca;
  }
  .cfb-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid rgba(120,200,145,0.16);
  }
  .cfb-btn {
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 18px;
    border-radius: 999px;
    border: 1px solid rgba(120,200,145,0.24);
    background: rgba(255,255,255,0.06);
    color: #e8f0e2;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
    transition: transform .12s, background .12s, border-color .12s, color .12s, box-shadow .12s;
  }
  .cfb-btn:hover,
  .cfb-btn:focus-visible {
    background: rgba(245,197,24,0.14);
    border-color: rgba(245,197,24,0.34);
    color: #F5C518;
    transform: translateY(-1px);
    outline: none;
  }
  .cfb-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
  .cfb-btn-primary {
    background: #F5C518;
    color: #1a3010;
    border-color: #F5C518;
    box-shadow: 0 10px 18px rgba(245,197,24,0.18);
  }
  .cfb-btn-primary:hover,
  .cfb-btn-primary:focus-visible {
    background: #f2c61c;
    color: #1a3010;
  }
  .cfb-btn-danger {
    background: #dc2626;
    color: #fff;
    border-color: #dc2626;
    box-shadow: 0 10px 18px rgba(220,38,38,0.2);
  }
  .cfb-btn-danger:hover,
  .cfb-btn-danger:focus-visible {
    background: #b91c1c;
    color: #fff;
    border-color: #b91c1c;
  }
  .cfb-toast-wrap {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 1300;
    pointer-events: none;
  }
  .cfb-toast {
    min-width: 260px;
    max-width: min(420px, calc(100vw - 32px));
    border-radius: 18px;
    border: 1px solid rgba(120,200,145,0.18);
    box-shadow: 0 18px 36px rgba(0,0,0,0.26);
    backdrop-filter: blur(12px);
    padding: 14px 16px;
    display: grid;
    gap: 4px;
    background: linear-gradient(180deg, rgba(12,31,18,0.96) 0%, rgba(8,24,14,0.92) 100%);
    color: #e8f0e2;
    animation: cfb-toast-in .2s ease;
  }
  .cfb-toast-success {
    border-color: rgba(16,185,129,0.26);
    background: linear-gradient(180deg, rgba(11,49,33,0.98) 0%, rgba(8,24,14,0.94) 100%);
  }
  .cfb-toast-error {
    border-color: rgba(220,38,38,0.24);
    background: linear-gradient(180deg, rgba(71,18,18,0.98) 0%, rgba(26,11,11,0.96) 100%);
  }
  .cfb-toast-info {
    border-color: rgba(245,197,24,0.28);
  }
  .cfb-toast-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: rgba(160,210,170,0.48);
  }
  .cfb-toast-error .cfb-toast-label { color: rgba(254,202,202,0.72); }
  .cfb-toast-success .cfb-toast-label { color: rgba(94,234,212,0.78); }
  .cfb-toast-message {
    font-size: 13px;
    line-height: 1.5;
  }
  @keyframes cfb-toast-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 600px) {
    .cfb-overlay {
      align-items: flex-end;
      padding: 12px;
    }
    .cfb-modal {
      max-width: none;
      border-radius: 24px;
      padding: 22px 18px;
    }
    .cfb-actions {
      flex-direction: column-reverse;
      align-items: stretch;
    }
    .cfb-actions > .cfb-btn {
      width: 100%;
    }
    .cfb-toast-wrap {
      left: 12px;
      right: 12px;
      bottom: 12px;
    }
    .cfb-toast {
      max-width: none;
      min-width: 0;
    }
  }
`;

export function CommunityFeedbackStyles() {
  useEffect(() => {
    if (document.getElementById(FEEDBACK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = FEEDBACK_STYLE_ID;
    style.textContent = FEEDBACK_STYLES;
    document.head.appendChild(style);
  }, []);

  return null;
}

export function CommunityToast({ toast }) {
  if (!toast?.message) return null;

  const tone = toast.tone || "info";
  const label = tone === "error" ? "Error" : tone === "success" ? "Success" : "Notice";

  return (
    <div className="cfb-toast-wrap" aria-live="polite" aria-atomic="true">
      <div className={`cfb-toast cfb-toast-${tone}`} role="status">
        <div className="cfb-toast-label">{label}</div>
        <div className="cfb-toast-message">{toast.message}</div>
      </div>
    </div>
  );
}

export function CommunityConfirmModal({
  open,
  title,
  message,
  note,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="cfb-overlay" onClick={() => !busy && onCancel?.()}>
      <div className="cfb-modal" onClick={(event) => event.stopPropagation()}>
        <h3 className="cfb-title">{title}</h3>
        <p className="cfb-message">{message}</p>
        {note ? <div className={`cfb-note${destructive ? " cfb-note-danger" : ""}`}>{note}</div> : null}

        <div className="cfb-actions">
          <button type="button" className="cfb-btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cfb-btn ${destructive ? "cfb-btn-danger" : "cfb-btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}