import * as XLSX from "xlsx";
import { fmtDate } from "./formatters";
import { computeSummary } from "./reportGenerator";

// Generates and downloads a 3-sheet .xlsx workbook: Transactions,
// Budget Analysis, and Category Trends — matching the layout of a
// full spreadsheet report rather than a single flat table.
//
// Why the `xlsx` (SheetJS) package again, after removing it earlier:
// this app's code path only ever WRITES a workbook (aoa_to_sheet +
// writeFile) — it never calls XLSX.read() on any file, uploaded or
// otherwise. SheetJS's known CVEs (prototype pollution, ReDoS) are
// both specifically in *parsing* untrusted files; a multi-sheet
// binary .xlsx genuinely can't be produced without a library like
// this one (a CSV has no concept of multiple sheets), so for a
// write-only workflow the risk those advisories describe doesn't
// apply here. `npm audit` will still flag the package regardless —
// that's expected and can be safely ignored for this specific usage.

function buildTransactionsSheet(transactions, totalSavings) {
  const { income, expenses, net } = computeSummary(transactions, totalSavings);

  return [
    ["Date", "Description", "Category", "Type", "Amount"],
    ...transactions.map((t) => [
      fmtDate(t.date),
      t.description,
      t.category,
      t.amount >= 0 ? "Income" : "Expense",
      t.amount,
    ]),
    [],
    [],
    ["Summary"],
    ["Total Income", null, null, null, income],
    ["Total Expenses", null, null, null, -expenses],
    ["Savings Set Aside", null, null, null, -totalSavings],
    ["Net Balance", null, null, null, net],
  ];
}

function buildBudgetAnalysisSheet(allBudgets) {
  return [
    ["Month", "Category", "Monthly Budget", "Spent", "Status", "Carryover / Deficit", "% Used"],
    ...allBudgets.map((b) => {
      const pct = Math.round((b.spent / b.limit) * 1000) / 10;
      return [
        b.month,
        b.category,
        b.limit,
        b.spent,
        pct >= 90 ? "Near Limit" : "On Track",
        Math.round((b.limit - b.spent) * 100) / 100,
        pct,
      ];
    }),
  ];
}

function buildCategoryTrendsSheet(trendData, monthLabels) {
  const categories = Object.keys(trendData);
  return [
    ["Category", ...monthLabels],
    ...categories.map((cat) => [cat, ...trendData[cat]]),
  ];
}

export function downloadWorkbook(transactions, allBudgets, trendData, monthLabels, totalSavings = 0) {
  const workbook = XLSX.utils.book_new();

  const txSheet = XLSX.utils.aoa_to_sheet(buildTransactionsSheet(transactions, totalSavings));
  txSheet["!cols"] = [{ wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(workbook, txSheet, "Transactions");

  const budgetSheet = XLSX.utils.aoa_to_sheet(buildBudgetAnalysisSheet(allBudgets));
  budgetSheet["!cols"] = [{ wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, budgetSheet, "Budget Analysis");

  const trendSheet = XLSX.utils.aoa_to_sheet(buildCategoryTrendsSheet(trendData, monthLabels));
  trendSheet["!cols"] = [{ wch: 16 }, ...monthLabels.map(() => ({ wch: 8 }))];
  XLSX.utils.book_append_sheet(workbook, trendSheet, "Category Trends");

  const filename = `ledger_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
