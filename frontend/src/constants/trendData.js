// 12-month history used to power the Trends page charts and the
// "Category Trends" sheet in the exported workbook. The current
// (most recent) month is overwritten at render time with the live
// value from the real budgets data, so the chart and the export
// always agree with what's actually in the app right now — only the
// prior 11 months are fixed seed history for this demo.

export const MONTH_LABELS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const MONTHLY_TREND = {
  Food: [290, 320, 305, 260, 345, 280, 310, 275, 340, 290, 310, 164],
  Transport: [115, 140, 125, 135, 120, 145, 130, 145, 112, 160, 130, 130],
  Shopping: [195, 230, 165, 280, 140, 210, 220, 85, 310, 175, 240, 184],
  Bills: [1890, 1890, 1890, 1890, 1895, 1890, 1890, 1890, 1890, 1895, 1895, 1895],
  Health: [60, 75, 90, 45, 110, 80, 45, 105, 60, 90, 80, 105],
  Entertainment: [35, 48, 20, 60, 30, 42, 38, 22, 55, 30, 42, 25],
};

export const TREND_CATEGORY_NAMES = Object.keys(MONTHLY_TREND);
