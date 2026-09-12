// Quick date-range presets — computed client-side purely to pre-fill
// the fromDate/toDate values sent to the backend; the backend does the
// actual filtering (see TransactionService.search), this just saves
// the person from having to pick two exact dates for common cases.
const toISO = (d) => d.toISOString().slice(0, 10);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function getDateRangePresets() {
  const today = new Date();
  const startOfWeek = daysAgo(today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: "Today", fromDate: toISO(today), toDate: toISO(today) },
    { label: "This Week", fromDate: toISO(startOfWeek), toDate: toISO(today) },
    { label: "This Month", fromDate: toISO(startOfMonth), toDate: toISO(today) },
    { label: "Last Month", fromDate: toISO(startOfLastMonth), toDate: toISO(endOfLastMonth) },
    { label: "Last 30 Days", fromDate: toISO(daysAgo(30)), toDate: toISO(today) },
    { label: "Last 3 Months", fromDate: toISO(daysAgo(90)), toDate: toISO(today) },
  ];
}
