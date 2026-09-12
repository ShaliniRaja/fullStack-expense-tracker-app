import * as trendsApi from "../api/trendsApi";
import { MONTH_LABELS, MONTHLY_TREND } from "../constants/trendData";

// Real data comes from the backend, computed from actual transactions.
// The static seed data is only ever used if the backend can't be
// reached at all — it exists so the Trends page still renders
// something during local development without a running backend,
// not as a stand-in for real per-user history.
export async function listTrends(months = 12) {
  try {
    const res = await trendsApi.getTrends(months);
    const series = {};
    res.categories.forEach((c) => { series[c.category] = c.values; });
    return { months: res.months, series };
  } catch {
    const series = {};
    Object.keys(MONTHLY_TREND).forEach((cat) => {
      series[cat] = MONTHLY_TREND[cat].slice(12 - months);
    });
    return { months: MONTH_LABELS.slice(12 - months), series };
  }
}
