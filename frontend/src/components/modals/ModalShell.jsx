import React from "react";
import { X } from "lucide-react";
import { THEME } from "../../constants/theme";

export default function ModalShell({ title, onClose, children, width = 480 }) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-width rounded-2xl p-6 w-full max-h-85vh overflow-y-auto"
        style={{ background: THEME.card, border: `1px solid ${THEME.cardBorder}`, maxWidth: `min(92vw, ${width}px)` }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: THEME.text }}>{title}</h2>
          <button onClick={onClose} style={{ color: THEME.faint }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
