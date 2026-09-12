// Local seed data used ONLY as a fallback when no backend is reachable.
// Once VITE_API_BASE_URL points at a real API, these are never used.

export const MOCK_TRANSACTIONS = [
  { id: 1, description: "Whole Foods Market", category: "Food", date: "2026-08-01", amount: -84.32 },
  { id: 2, description: "Monthly Salary", category: "Income", date: "2026-08-01", amount: 5200.0 },
  { id: 3, description: "Uber Ride", category: "Transport", date: "2026-07-31", amount: -18.5 },
  { id: 4, description: "Netflix Subscription", category: "Entertainment", date: "2026-07-30", amount: -15.99 },
  { id: 5, description: "Apartment Rent", category: "Bills", date: "2026-07-30", amount: -1800.0 },
  { id: 6, description: "Coffee & Pastry", category: "Food", date: "2026-07-29", amount: -12.4 },
];

export const MOCK_BUDGETS = [
  { category: "Food", limit: 600, spent: 164.72 },
  { category: "Transport", limit: 200, spent: 130.5 },
  { category: "Shopping", limit: 300, spent: 184.74 },
  { category: "Bills", limit: 2000, spent: 1895.2 },
  { category: "Health", limit: 150, spent: 105.0 },
  { category: "Entertainment", limit: 100, spent: 25.98 },
];

export const MOCK_GOALS = [
  { id: 1, icon: "shield", name: "Emergency Fund", saved: 6200, target: 10000, days: 151 },
  { id: 2, icon: "plane", name: "Japan Trip", saved: 1850, target: 3500, days: 211 },
  { id: 3, icon: "laptop", name: "New MacBook", saved: 800, target: 2000, days: 74 },
  { id: 4, icon: "gem", name: "Wedding Fund", saved: 4500, target: 15000, days: 303 },
];
