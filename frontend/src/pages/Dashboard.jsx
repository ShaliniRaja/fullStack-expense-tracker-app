import React from "react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import TxRow from "../components/common/TxRow";
import { THEME } from "../constants/theme";
import { fmt } from "../utils/formatters";
import { useVisibility } from "../context/VisibilityContext";

export default function Dashboard({ transactions, totalSavings, setView }) {
  const { hidden } = useVisibility();
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  // Money moved into savings goals is no longer part of your available
  // balance, so it comes out of Net Balance too — not just income minus
  // expenses.
  const net = income - expenses - totalSavings;

  const stats = [
    { label: "NET BALANCE", value: net, note: "After income, expenses & savings", positive: net >= 0, sign: true },
    { label: "TOTAL INCOME", value: income, note: "This month", positive: true },
    { label: "TOTAL EXPENSES", value: expenses, note: "This month", positive: false },
    { label: "TOTAL SAVINGS", value: totalSavings, note: "Across all goals", positive: true },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="August 2026 — Financial overview" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>{s.label}</div>
            <div className="text-2xl font-bold mt-2" style={{ color: THEME.text }}>
              {hidden ? "••••" : `${s.sign && s.value < 0 ? "-" : ""}${fmt(Math.abs(s.value))}`}
            </div>
            <div className="text-xs mt-1.5 font-medium" style={{ color: s.label === "TOTAL EXPENSES" ? THEME.red : s.sign ? (s.positive ? THEME.green : THEME.red) : THEME.green }}>
              {s.sign ? `${s.positive ? "↑" : "↓"} ${s.note}` : s.note}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-15 font-bold" style={{ color: THEME.text }}>Recent Transactions</div>
          <button onClick={() => setView("transactions")} className="text-xs" style={{ color: THEME.faint }}>
            {transactions.length} entries
          </button>
        </div>
        <div className="mt-2">
          {transactions.slice(0, 4).map((t) => <TxRow key={t.id} tx={t} hidden={hidden} />)}
        </div>
      </Card>
    </div>
  );
}
