import * as transactionsApi from "../api/transactionsApi";
import { MOCK_TRANSACTIONS } from "../constants/mockData";

// In-memory fallback cache — only used while no backend is reachable.
let localCache = null;

// Bulk/"give me everything" usage (Dashboard totals, Trends, Send Money
// aggregates, exports). The backend always returns a paged response now,
// but omitting page/size gets effectively everything in one page — this
// just unwraps .content so existing callers keep working with a plain array.
export async function listTransactions() {
  try {
    const res = await transactionsApi.getTransactions();
    localCache = res.content;
    return res.content;
  } catch {
    if (!localCache) localCache = [...MOCK_TRANSACTIONS];
    return localCache;
  }
}

// Real pagination + backend search/filters — used by the Transactions
// page and the Send Money detail list. Returns the full paged shape
// ({ content, page, size, totalElements, totalPages }), not just an array.
export async function searchTransactions(params) {
  return transactionsApi.getTransactions(params);
}

export async function addTransaction(payload) {
  try {
    return await transactionsApi.createTransaction(payload);
  } catch {
    const created = { id: Date.now(), ...payload };
    localCache = [created, ...(localCache || MOCK_TRANSACTIONS)];
    return created;
  }
}

export async function updateTransaction(id, payload) {
  let updated;
  try {
    updated = await transactionsApi.updateTransaction(id, payload);
  } catch {
    updated = { id, ...payload };
  }
  localCache = (localCache || []).map((t) => (t.id === id ? updated : t));
  return updated;
}

export async function removeTransaction(id) {
  try {
    await transactionsApi.deleteTransaction(id);
  } catch {
    // no-op fallback — nothing persisted server-side yet
  }
  localCache = (localCache || []).filter((t) => t.id !== id);
}
