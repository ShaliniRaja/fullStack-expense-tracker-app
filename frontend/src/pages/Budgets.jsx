import React, { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2, Pencil, Lock, ChevronDown, ArrowUpRight } from "lucide-react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import NewBudgetModal from "../components/modals/NewBudgetModal";
import { THEME } from "../constants/theme";
import { CATEGORIES } from "../constants/categories";
import { fmt, fmtMonthLabel, currentMonthGuess } from "../utils/formatters";
import { useVisibility } from "../context/VisibilityContext";
import * as budgetService from "../services/budgetService";

export default function Budgets({ budgets: currentBudgets, onBudgetsChanged, onDeleteBudget, onViewTransactions, isVisitor }) {
  const { hidden } = useVisibility();
  const mask = (text) => (hidden ? "••••" : text);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(""); // "" = current (live) month
  const [historicalBudgets, setHistoricalBudgets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const thisMonth = currentMonthGuess();

  // Populate the month filter once on mount — this is real backend
  // history, not something the frontend invents.
  useEffect(() => {
    budgetService.listAvailableMonths().then(setAvailableMonths);
  }, []);

  useEffect(() => {
    if (!selectedMonth || selectedMonth === thisMonth) return;
    setLoadingHistory(true);
    budgetService
      .listBudgets(selectedMonth)
      .then(setHistoricalBudgets)
      .finally(() => setLoadingHistory(false));
  }, [selectedMonth]);

  const isViewingCurrent = !selectedMonth || selectedMonth === thisMonth;
  const budgets = isViewingCurrent ? currentBudgets : historicalBudgets;

  // History can genuinely be removed now, not just the current month —
  // the backend hard-deletes a past-month record instead of soft-deleting it.
  const handleDelete = (b) => {
    const scope = isViewingCurrent ? "this month's" : `the ${fmtMonthLabel(b.month)}`;
    if (window.confirm(`Delete ${scope} "${b.category}" budget? This can't be undone.`)) {
      onDeleteBudget(b.category, isViewingCurrent ? undefined : b.month);
      if (!isViewingCurrent) {
        setHistoricalBudgets((prev) => prev.filter((x) => x.category !== b.category));
      }
    }
  };

  // Creating always targets whichever month is currently being viewed —
  // routes the result to the right place: the live shared state if it's
  // this month, or just this page's own historical view if it's a
  // backfilled past month.
  const handleCreate = async (payload) => {
    const created = await budgetService.createBudget(payload);
    if (!payload.month || payload.month === thisMonth) {
      onBudgetsChanged([...currentBudgets, created]);
    } else {
      setHistoricalBudgets((prev) => [...prev, created]);
      setAvailableMonths((prev) => (prev.includes(created.month) ? prev : [created.month, ...prev]));
    }
  };

  // Editing only ever applies to the current month (enforced server-side
  // too) — so it always updates the live shared state, never the
  // historical view.
  const handleUpdate = async (category, payload) => {
    const updated = await budgetService.updateBudget(category, payload);
    onBudgetsChanged(currentBudgets.map((b) => (b.category === category ? updated : b)));
  };

  const handleCardClick = (b) => {
    if (b.limit == null) return; // masked for VISITOR — nothing meaningful to drill into
    onViewTransactions({ ...b, month: b.month || selectedMonth || thisMonth });
  };

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle={isViewingCurrent ? "Category spending limits — this month · click a card to see its transactions" : "Viewing history · click a card to see its transactions"}
        right={
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2.5 pr-8 rounded-xl text-sm outline-none appearance-none"
                style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.text }}
              >
                <option value="">📍 {fmtMonthLabel(thisMonth)} — current month</option>
                {availableMonths.filter((m) => m !== thisMonth).map((m) => (
                  <option key={m} value={m}>{fmtMonthLabel(m)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-half translate-up-half pointer-events-none" style={{ color: THEME.faint }} />
            </div>
            {!isVisitor && (
              <button
                onClick={() => setShowNewBudget(true)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5"
                style={{ background: THEME.green, color: "#06280f" }}
              >
                <Plus size={15} strokeWidth={2.5} /> New Budget
              </button>
            )}
          </div>
        }
      />

      {!isViewingCurrent && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-xs font-medium"
          style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.faint }}
        >
          <Lock size={13} /> Past months can't be edited, but can still be deleted, or backfilled with a missing category via "New Budget".
        </div>
      )}

      {loadingHistory ? (
        <div className="text-center py-10 text-sm" style={{ color: THEME.faint }}>Loading {fmtMonthLabel(selectedMonth)}…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {budgets.map((b) => {
              const cat = CATEGORIES[b.category] || CATEGORIES.Food;
              const Icon = cat.icon;
              const hasRealNumbers = b.limit != null && b.spent != null;
              const pct = hasRealNumbers ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0;
              const left = hasRealNumbers ? b.limit - b.spent : 0;
              const near = hasRealNumbers && pct >= 90;
              const barColor = near ? THEME.red : pct >= 60 ? "#f59e0b" : cat.color;
              return (
                <Card
                  key={b.category}
                  className="p-5"
                  style={{ cursor: hasRealNumbers ? "pointer" : "default" }}
                >
                  <div onClick={() => handleCardClick(b)}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: cat.bg }}>
                          <Icon size={16} style={{ color: cat.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-1" style={{ color: THEME.text }}>
                            {b.category}
                            {hasRealNumbers && <ArrowUpRight size={13} style={{ color: THEME.faint }} />}
                          </div>
                          <div className="text-xs" style={{ color: THEME.faint }}>Limit: {mask(fmt(b.limit ?? 0))}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: near ? THEME.red : THEME.text }}>{mask(fmt(b.spent ?? 0))}</div>
                          {near ? (
                            <div className="text-xs font-medium flex items-center gap-1 justify-end" style={{ color: THEME.red }}>
                              <AlertTriangle size={11} /> Near limit
                            </div>
                          ) : (
                            <div className="text-xs" style={{ color: THEME.faint }}>{mask(fmt(left))} left</div>
                          )}
                        </div>
                        {!isVisitor && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {isViewingCurrent && (
                              <button onClick={() => setEditingBudget(b)} title="Edit budget" style={{ color: THEME.faint }}>
                                <Pencil size={15} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(b)} title="Delete budget" style={{ color: THEME.faint }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: THEME.inputBg }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <div className="text-xs mt-2" style={{ color: THEME.faint }}>{pct}% used</div>
                  </div>
                </Card>
              );
            })}
            {budgets.length === 0 && (
              <div className="text-sm py-6" style={{ color: THEME.faint }}>No budgets recorded for this month.</div>
            )}
          </div>

          <Card className="p-5">
            <div className="grid grid-cols-4 text-11 font-semibold tracking-wider pb-3" style={{ color: THEME.faint, borderBottom: `1px solid ${THEME.cardBorder}` }}>
              <div>CATEGORY</div><div>BUDGETED</div><div>SPENT</div><div>% USED</div>
            </div>
            {budgets.map((b) => {
              const cat = CATEGORIES[b.category] || CATEGORIES.Food;
              const hasRealNumbers = b.limit != null && b.spent != null;
              const pct = hasRealNumbers ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0;
              const near = hasRealNumbers && pct >= 90;
              return (
                <div key={b.category} className="grid grid-cols-4 items-center py-3.5 text-sm" style={{ borderBottom: `1px solid ${THEME.cardBorder}` }}>
                  <div className="flex items-center gap-2" style={{ color: THEME.text }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                    {b.category}
                  </div>
                  <div style={{ color: THEME.faint }}>{mask(fmt(b.limit ?? 0))}</div>
                  <div style={{ color: near ? THEME.red : THEME.text }}>{mask(fmt(b.spent ?? 0))}</div>
                  <div style={{ color: THEME.green }}>{hasRealNumbers ? `${pct}%` : "—"}</div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {showNewBudget && (
        <NewBudgetModal
          onClose={() => setShowNewBudget(false)}
          onCreate={handleCreate}
          defaultMonth={selectedMonth || thisMonth}
        />
      )}

      {editingBudget && (
        <NewBudgetModal
          editingBudget={editingBudget}
          onClose={() => setEditingBudget(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
