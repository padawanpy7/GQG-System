"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Modal de confirmacion estandar del sistema (reemplaza window.confirm/alert).
export default function ConfirmDialog({
  open,
  title,
  message,
  icon,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-[26rem] max-w-[calc(100vw-2rem)] shrink-0 rounded-lg border border-outline bg-surface-lowest p-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabecera: icono + accion */}
        <div className="flex items-center gap-sm">
          {icon && (
            <span className={`material-symbols-outlined ${danger ? "text-error" : "text-primary"}`}>
              {icon}
            </span>
          )}
          <h3 className="font-headline-sm text-headline-sm text-primary">{title}</h3>
        </div>

        {message && <p className="mt-sm font-body-sm text-body-sm text-secondary">{message}</p>}

        <div className="mt-lg flex justify-end gap-md">
          <button
            onClick={onClose}
            disabled={busy}
            className="h-10 rounded border border-outline-variant px-xl font-label-caps text-label-caps text-primary transition-colors hover:bg-surface-container disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 rounded px-xl font-label-caps text-label-caps font-bold text-white transition-all disabled:opacity-50 ${
              danger ? "bg-error hover:opacity-90" : "bg-primary hover:bg-primary-container"
            }`}
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
