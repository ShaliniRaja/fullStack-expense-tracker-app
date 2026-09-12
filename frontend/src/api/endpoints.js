// Single source of truth for every REST endpoint the app calls.
// Keeping paths here (instead of scattered inline strings) makes
// the API surface easy to audit and easy to point at a real backend.

export const ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",

  transactions: "/transactions",
  transactionById: (id) => `/transactions/${id}`,

  budgets: "/budgets",
  budgetByCategory: (category) => `/budgets/${encodeURIComponent(category)}`,

  goals: "/goals",
  goalById: (id) => `/goals/${id}`,

  schedules: "/schedules",
  scheduleById: (id) => `/schedules/${id}`,

  trends: "/trends",
};
