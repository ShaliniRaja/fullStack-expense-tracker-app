// Pure formatting helpers — no side effects, no external calls.

export const fmt = (n) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// "2026-08" -> "August 2026"
export const fmtMonthLabel = (yyyyMM) => {
  const [year, month] = yyyyMM.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// Client-side guess of "now" in yyyy-MM — used only to decide which
// dropdown option to show as editable in the UI. The backend never
// trusts this; it always uses its own clock to decide what's current.
export const currentMonthGuess = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
