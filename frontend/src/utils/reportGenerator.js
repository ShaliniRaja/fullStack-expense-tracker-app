import { fmt, fmtDate } from "./formatters";

// totalSavings is optional so existing callers that only care about pure
// transaction totals (no savings context) keep working unchanged.
export function computeSummary(transactions, totalSavings = 0) {
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  // Money moved into savings goals is no longer part of the available
  // balance — matches how Net Balance is computed on the Dashboard.
  return { income, expenses, net: income - expenses - totalSavings };
}

const fmtLongDate = (date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Builds the exact share-message format used for WhatsApp / email / copy.
export function buildMessagePreview(transactions, totalSavings = 0) {
  const { income, expenses, net } = computeSummary(transactions, totalSavings);
  const recent = transactions.slice(0, 5);

  const lines = [
    "📊 *Expense Report — Ledger App*",
    `📅 Generated: ${fmtLongDate(new Date())}`,
    "",
    `💰 Total Income:   $${fmt(income)}`,
    `💸 Total Expenses: $${fmt(expenses)}`,
    `📈 Net Balance:    $${fmt(net)}`,
    "",
    "*Recent Transactions:*",
    ...recent.map((t) => {
      const sign = t.amount >= 0 ? "+" : "-";
      return `  • ${fmtDate(t.date)}  ${t.description}  ${sign}$${fmt(Math.abs(t.amount))}`;
    }),
    "",
    "— Sent from Ledger Expense Tracker",
  ];

  return lines.join("\n");
}

export function buildEmailSubject() {
  return `Expense Report — ${fmtLongDate(new Date())}`;
}
