import React, { useEffect, useState } from "react";
import Sidebar, { MobileTopBar, BottomNav, MobileMenu } from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Savings from "./pages/Savings";
import Trends from "./pages/Trends";
import SendMoney from "./pages/SendMoney";
import Login from "./pages/Login";
import AddTransactionModal from "./components/modals/AddTransactionModal";
import ExportShareModal from "./components/modals/ExportShareModal";
import NewGoalModal from "./components/modals/NewGoalModal";
import { THEME } from "./constants/theme";
import { useAuth } from "./context/AuthContext";

import * as transactionService from "./services/transactionService";
import * as budgetService from "./services/budgetService";
import * as savingsService from "./services/savingsService";
import * as trendService from "./services/trendService";

// VISITOR sees every page now — just with amounts masked (enforced
// server-side, see BudgetController/GoalController/TrendController/
// TransactionController). Only the create/edit/delete actions are
// hidden for VISITOR, since those endpoints stay HUSBAND/WIFE-only.
export default function App() {
  const { email, isVisitor, isAuthenticated, logout } = useAuth();

  const [view, setView] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [trends, setTrends] = useState({ months: [], series: {} });
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactionsInitialFilter, setTransactionsInitialFilter] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    (async () => {
      const [tx, bg, gl, tr] = await Promise.all([
        transactionService.listTransactions(),
        budgetService.listBudgets(),
        savingsService.listGoals(),
        trendService.listTrends(12),
      ]);
      setTransactions(tx);
      setBudgets(bg);
      setGoals(gl);
      setTrends(tr);
      setLoading(false);
    })();
  }, [isAuthenticated]);

  const handleAddTransaction = async (payload) => {
    const created = await transactionService.addTransaction(payload);
    setTransactions((prev) => [created, ...prev]);

    // Budget "spent" is now reconciled server-side from real transactions
    // on every fetch — refetching here is what keeps it exactly correct,
    // not a local running-total guess that can drift.
    budgetService.listBudgets().then(setBudgets);
    trendService.listTrends(12).then(setTrends);
  };

  const handleUpdateTransaction = async (id, payload) => {
    const updated = await transactionService.updateTransaction(id, payload);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    budgetService.listBudgets().then(setBudgets);
    trendService.listTrends(12).then(setTrends);
    return updated;
  };

  const handleAddGoal = async (payload) => {
    const created = await savingsService.addGoal(payload);
    setGoals((prev) => [...prev, created]);
  };

  const handleUpdateGoal = async (id, payload) => {
    const updated = await savingsService.updateGoal(id, payload);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const handleContributeToGoal = async (id, amount) => {
    const updated = await savingsService.contributeToGoal(id, amount);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const handleDeleteGoal = async (id) => {
    await savingsService.removeGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDeleteTransaction = async (id) => {
    await transactionService.removeTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    budgetService.listBudgets().then(setBudgets);
    trendService.listTrends(12).then(setTrends);
  };

  const handleDeleteBudget = async (category, month) => {
    await budgetService.removeBudget(category, month);
    if (!month) {
      setBudgets((prev) => prev.filter((b) => b.category !== category));
    }
  };

  // Clicking a budget card jumps to Transactions, pre-filtered to that
  // category and that budget's month — handled by the backend's own
  // category/fromDate/toDate query params, not a client-side slice.
  const handleViewBudgetTransactions = (budget) => {
    const [year, monthNum] = budget.month.split("-").map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    setTransactionsInitialFilter({
      category: budget.category,
      fromDate: `${budget.month}-01`,
      toDate: `${budget.month}-${String(lastDay).padStart(2, "0")}`,
    });
    setView("transactions");
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const totalSavings = goals.reduce((s, g) => s + g.saved, 0);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center" style={{ minHeight: "100vh", background: THEME.bg, color: THEME.sub }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="app-shell flex flex-col" style={{ background: THEME.bg }}>
      <MobileTopBar onOpenMenu={() => setMobileMenuOpen(true)} onAdd={() => setShowAdd(true)} isVisitor={isVisitor} />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <Sidebar
          view={view}
          setView={setView}
          onAdd={() => setShowAdd(true)}
          onExport={() => setShowExport(true)}
          userEmail={email}
          isVisitor={isVisitor}
          onLogout={logout}
        />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="content-area">
            {view === "dashboard" && <Dashboard transactions={transactions} totalSavings={totalSavings} setView={setView} />}
            {view === "transactions" && (
              <Transactions
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isVisitor={isVisitor}
                initialFilter={transactionsInitialFilter}
                onFilterConsumed={() => setTransactionsInitialFilter(null)}
              />
            )}
            {view === "budgets" && (
              <Budgets
                budgets={budgets}
                onBudgetsChanged={setBudgets}
                onDeleteBudget={handleDeleteBudget}
                onViewTransactions={handleViewBudgetTransactions}
                isVisitor={isVisitor}
              />
            )}
            {view === "savings" && (
              <Savings
                goals={goals}
                onNewGoal={() => setShowNewGoal(true)}
                onUpdateGoal={handleUpdateGoal}
                onContribute={handleContributeToGoal}
                onDeleteGoal={handleDeleteGoal}
                isVisitor={isVisitor}
              />
            )}
            {view === "trends" && <Trends transactions={transactions} budgets={budgets} trends={trends} totalSavings={totalSavings} isVisitor={isVisitor} />}
            {view === "sendmoney" && (
              <SendMoney
                transactions={transactions}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isVisitor={isVisitor}
              />
            )}
            <div className="bottom-nav-spacer" />
          </div>
        </div>
      </div>

      <BottomNav view={view} setView={setView} isVisitor={isVisitor} />
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onExport={() => setShowExport(true)}
        onLogout={logout}
        userEmail={email}
        isVisitor={isVisitor}
      />

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdd={handleAddTransaction} />}
      {showExport && <ExportShareModal onClose={() => setShowExport(false)} transactions={transactions} trends={trends} totalSavings={totalSavings} />}
      {showNewGoal && <NewGoalModal onClose={() => setShowNewGoal(false)} onCreate={handleAddGoal} />}
    </div>
  );
}
