import * as budgetsApi from "../api/budgetsApi";
import { MOCK_BUDGETS } from "../constants/mockData";
import { currentMonthGuess } from "../utils/formatters";

// Cache is only ever for the CURRENT month — historical months are
// fetched fresh each time (they're immutable, so there's nothing to
// keep in sync, and caching them would just risk showing stale data
// after switching between months).
let localCache = null;

export async function listBudgets(month) {
  if (month) {
    return budgetsApi.getBudgets(month); // historical — no fallback, no cache
  }
  try {
    const data = await budgetsApi.getBudgets();
    localCache = data;
    return data;
  } catch {
    if (!localCache) localCache = [...MOCK_BUDGETS];
    return localCache;
  }
}

export async function listAvailableMonths() {
  try {
    return await budgetsApi.getAvailableMonths();
  } catch {
    return []; // Budgets page falls back to showing only the current month
  }
}

// Every budget record across every month — used for the full-history
// Excel export. No offline fallback: an export without real data isn't
// useful, better to surface the failure than silently export nothing.
export async function listAllBudgetsHistory() {
  return budgetsApi.getAllBudgetsHistory();
}

export async function createBudget(payload) {
  const isCurrentMonth = !payload.month || payload.month === currentMonthGuess();

  let created;
  try {
    created = await budgetsApi.createBudget(payload);
  } catch (err) {
    if (!isCurrentMonth) throw err; // no sensible offline fallback for backfilled history
    created = { category: payload.category, month: payload.month, limit: payload.limit, spent: payload.spent || 0 };
  }

  if (isCurrentMonth) {
    localCache = [...(localCache || MOCK_BUDGETS), created];
  }
  return created;
}

export async function updateBudget(category, payload) {
  const updated = await budgetsApi.updateBudget(category, payload);
  localCache = (localCache || []).map((b) => (b.category === category ? updated : b));
  return updated;
}

export async function removeBudget(category, month) {
  const isCurrentMonth = !month || month === currentMonthGuess();
  try {
    await budgetsApi.deleteBudget(category, month);
  } catch {
    // no-op fallback — nothing persisted server-side yet
  }
  if (isCurrentMonth) {
    localCache = (localCache || []).filter((b) => b.category !== category);
  }
}
