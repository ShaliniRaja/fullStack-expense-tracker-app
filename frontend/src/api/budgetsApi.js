import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

// GET /budgets?month=yyyy-MM (month optional — server defaults to its own current month)
export const getBudgets = (month) =>
  httpClient.get(month ? `${ENDPOINTS.budgets}?month=${encodeURIComponent(month)}` : ENDPOINTS.budgets);

// GET /budgets/months — list of months that have any budget data, newest first
export const getAvailableMonths = () => httpClient.get(`${ENDPOINTS.budgets}/months`);

// GET /budgets/all — every budget record, every month — used only for
// the full-history Excel export, not for any page's normal display.
export const getAllBudgetsHistory = () => httpClient.get(`${ENDPOINTS.budgets}/all`);

// POST /budgets — always applies to the current month server-side
export const createBudget = (payload) => httpClient.post(ENDPOINTS.budgets, payload);

// PUT /budgets/:category — edit limit/spent, current month only
export const updateBudget = (category, payload) =>
  httpClient.put(ENDPOINTS.budgetByCategory(category), payload);

// PATCH /budgets/:category — always applies to the current month server-side
export const updateBudgetSpent = (category, spent) =>
  httpClient.patch(ENDPOINTS.budgetByCategory(category), { spent });

// DELETE /budgets/:category?month=yyyy-MM — month optional (defaults to
// current, which is soft-deleted); a past month is actually removed.
export const deleteBudget = (category, month) =>
  httpClient.delete(month ? `${ENDPOINTS.budgetByCategory(category)}?month=${encodeURIComponent(month)}` : ENDPOINTS.budgetByCategory(category));
