import React from "react";
import { THEME } from "../../constants/theme";
import { CATEGORIES } from "../../constants/categories";
import { fmt, fmtDate } from "../../utils/formatters";

export default function TxRow({ tx, hidden }) {
  const cat = CATEGORIES[tx.category] || CATEGORIES.Food;
  const Icon = cat.icon;
  const masked = hidden || tx.amount == null;
  const positive = tx.amount >= 0;

  return (
    <div className="flex items-center justify-between py-3.5 px-1" style={{ borderBottom: `1px solid ${THEME.cardBorder}` }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: cat.bg }}>
          <Icon size={16} style={{ color: cat.color }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: THEME.text }}>{tx.description}</div>
          <div className="text-xs mt-0.5" style={{ color: THEME.faint }}>{tx.category} · {fmtDate(tx.date)}</div>
        </div>
      </div>
      <div className="text-sm font-bold shrink-0 ml-3" style={{ color: masked ? THEME.faint : positive ? THEME.green : THEME.red }}>
        {masked ? "••••" : `${positive ? "+" : "-"}${fmt(Math.abs(tx.amount))}`}
      </div>
    </div>
  );
}
