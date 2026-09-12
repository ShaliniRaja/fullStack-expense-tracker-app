import React, { useMemo, useState } from "react";
import { Download, MessageCircle, Mail, Copy, Check } from "lucide-react";
import ModalShell from "./ModalShell";
import { THEME } from "../../constants/theme";
import { buildMessagePreview, buildEmailSubject } from "../../utils/reportGenerator";
import { downloadWorkbook } from "../../utils/excelExport";
import * as budgetService from "../../services/budgetService";

export default function ExportShareModal({ onClose, transactions, trends, totalSavings = 0 }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const message = useMemo(() => buildMessagePreview(transactions, totalSavings), [transactions, totalSavings]);

  // Pulls every month's budgets (not just the current one) right before
  // building the workbook — the Budget Analysis sheet is meant to be a
  // full history, not a snapshot of whatever's currently on screen.
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const allBudgets = await budgetService.listAllBudgetsHistory();
      downloadWorkbook(transactions, allBudgets, trends.series, trends.months, totalSavings);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(buildEmailSubject());
    const body = encodeURIComponent(message);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied or unavailable — nothing to fall back to safely.
    }
  };

  const rows = [
    { icon: Download, title: "Download Excel", sub: "3-sheet workbook: transactions, full budget history, trends", action: downloading ? "Preparing…" : "Download", color: THEME.green, onClick: handleDownload, disabled: downloading },
    { icon: MessageCircle, title: "Share on WhatsApp", sub: "Send a text summary to any chat", action: "Open", color: THEME.green, onClick: handleWhatsApp },
    { icon: Mail, title: "Send via Email", sub: "Opens your mail app with the report", action: "Compose", color: THEME.blue, onClick: handleEmail },
    { icon: copied ? Check : Copy, title: "Copy Summary", sub: "Plain text — paste anywhere", action: copied ? "Copied" : "Copy", color: THEME.inputBg, dark: true, onClick: handleCopy },
  ];

  return (
    <ModalShell title="Export & Share" onClose={onClose} width={460}>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.title} className="flex items-center justify-between p-4 rounded-xl" style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}` }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: THEME.card }}>
                <r.icon size={16} style={{ color: THEME.text }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: THEME.text }}>{r.title}</div>
                <div className="text-xs mt-0.5 truncate" style={{ color: THEME.faint }}>{r.sub}</div>
              </div>
            </div>
            <button
              onClick={r.onClick}
              disabled={r.disabled}
              className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0 ml-3"
              style={{ background: r.dark ? THEME.card : r.color, color: r.dark ? THEME.text : "#06280f", border: r.dark ? `1px solid ${THEME.cardBorder}` : "none", opacity: r.disabled ? 0.6 : 1 }}
            >
              {r.action}
            </button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
