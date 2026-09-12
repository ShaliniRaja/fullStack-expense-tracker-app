import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowRight, Download, ChevronDown } from "lucide-react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import TrendAreaChart from "../components/charts/TrendAreaChart";
import Sparkline from "../components/charts/Sparkline";
import { THEME } from "../constants/theme";
import { CATEGORIES } from "../constants/categories";
import { TREND_CATEGORY_NAMES } from "../constants/trendData";
import { fmt, fmtMonthLabel, currentMonthGuess } from "../utils/formatters";
import { downloadWorkbook } from "../utils/excelExport";
import { useVisibility } from "../context/VisibilityContext";
import * as budgetService from "../services/budgetService";

const TIMEFRAMES = { "3M": 3, "6M": 6, "12M": 12 };

// trends.months / trends.series come from the backend (real transaction
// aggregation) — see services/trendService.js. This page never invents
// spending history on its own; it only slices whatever real data it was
// given down to the selected timeframe.
//
// Budget figures (limit, spent, status, carryover) are a SEPARATE concept
// from the spend trend above — they're a specific month's snapshot (see
// the monthly-budget-history backend work), fetched fresh from the
// backend whenever the month filter changes, never derived from the
// trend series. The chart's trailing months and the budget filter's
// selected month are independent by design: the chart always shows
// "how spending has moved over time," the filter picks "which month's
// budget snapshot to inspect."
export default function Trends({ budgets: currentBudgets, transactions, trends, totalSavings = 0, isVisitor }) {
  const { hidden } = useVisibility();
  const mask = (text) => (hidden ? "••••" : text);
  const [timeframe, setTimeframe] = useState("6M");
  const [selected, setSelected] = useState("Food");

  const thisMonth = currentMonthGuess();
  const [budgetMonth, setBudgetMonth] = useState(""); // "" = current (live) month
  const [availableMonths, setAvailableMonths] = useState([]);
  const [historicalBudgets, setHistoricalBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  useEffect(() => {
    budgetService.listAvailableMonths().then(setAvailableMonths);
  }, []);

  useEffect(() => {
    if (!budgetMonth || budgetMonth === thisMonth) return;
    setLoadingBudgets(true);
    budgetService
      .listBudgets(budgetMonth)
      .then(setHistoricalBudgets)
      .finally(() => setLoadingBudgets(false));
  }, [budgetMonth]);

  const isViewingCurrentBudget = !budgetMonth || budgetMonth === thisMonth;
  const activeBudgets = isViewingCurrentBudget ? currentBudgets : historicalBudgets;

  const budgetByCategory = useMemo(() => {
    const map = {};
    activeBudgets.forEach((b) => { map[b.category] = b; });
    return map;
  }, [activeBudgets]);

  const totalMonths = trends.months.length || 12;
  const months = Math.min(TIMEFRAMES[timeframe], totalMonths);
  const sliceStart = totalMonths - months;
  const labels = trends.months.slice(sliceStart);
  const seriesFor = (cat) => (trends.series[cat] || []).slice(sliceStart);

  const heroValues = seriesFor(selected);
  const heroBudget = budgetByCategory[selected];
  const avgPerMonth = heroValues.length ? heroValues.reduce((s, v) => s + v, 0) / heroValues.length : 0;
  const peak = heroValues.length ? Math.max(...heroValues) : 0;
  const heroThisMonth = heroValues[heroValues.length - 1] ?? 0;
  const heroCat = CATEGORIES[selected];

  const [downloading, setDownloading] = useState(false);

  // Pulls every month's budgets (not just what's currently on screen)
  // right before building the workbook — same reasoning as ExportShareModal.
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const allBudgets = await budgetService.listAllBudgetsHistory();
      downloadWorkbook(transactions, allBudgets, trends.series, trends.months, totalSavings);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Category Trends"
        subtitle="Spending patterns over time · click a card for detail"
        right={
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
            <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${THEME.cardBorder}` }}>
              {Object.keys(TIMEFRAMES).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className="px-4 py-2 text-sm font-semibold"
                  style={{ background: timeframe === tf ? THEME.inputBg : "transparent", color: timeframe === tf ? THEME.text : THEME.sub }}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5"
              style={{ background: THEME.green, color: "#06280f", opacity: downloading ? 0.7 : 1 }}
            >
              <Download size={15} /> {downloading ? "Preparing…" : "Download Report"}
            </button>
          </div>
        }
      />

      {/* Hero chart */}
      <Card className="p-5 mb-6">
        <div className="flex items-start justify-between mb-4" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: heroCat.bg }}>
              <heroCat.icon size={16} style={{ color: heroCat.color }} />
            </div>
            <div>
              <div className="text-15 font-bold" style={{ color: THEME.text }}>{selected} — {timeframe} Trend</div>
              <div className="text-xs mt-0.5" style={{ color: THEME.faint }}>
                {heroBudget ? `Budget: ${mask(fmt(heroBudget.limit))}/mo · ` : ""}Dashed line = budget limit
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>AVG/MONTH</div>
              <div className="text-sm font-bold" style={{ color: THEME.text }}>{mask(fmt(avgPerMonth))}</div>
            </div>
            <div>
              <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>PEAK</div>
              <div className="text-sm font-bold" style={{ color: THEME.text }}>{mask(fmt(peak))}</div>
            </div>
            <div>
              <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>THIS MONTH</div>
              <div className="text-sm font-bold" style={{ color: THEME.text }}>{mask(fmt(heroThisMonth))}</div>
            </div>
          </div>
        </div>

        <TrendAreaChart
          labels={labels}
          values={heroValues}
          color={heroCat.color}
          budgetLine={heroBudget?.limit}
          hidden={hidden}
        />
      </Card>

      {/* Budget month filter — controls the sections below, not the chart above */}
      <div className="flex items-center gap-3 mb-4" style={{ flexWrap: "wrap" }}>
        <span className="text-xs font-semibold" style={{ color: THEME.faint }}>BUDGET DATA FOR</span>
        <div className="relative">
          <select
            value={budgetMonth}
            onChange={(e) => setBudgetMonth(e.target.value)}
            className="px-3.5 py-2 pr-8 rounded-xl text-sm outline-none appearance-none"
            style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.text }}
          >
            <option value="">{fmtMonthLabel(thisMonth)} (current)</option>
            {availableMonths.filter((m) => m !== thisMonth).map((m) => (
              <option key={m} value={m}>{fmtMonthLabel(m)}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-half translate-up-half pointer-events-none" style={{ color: THEME.faint }} />
        </div>
        {!isViewingCurrentBudget && (
          <span className="text-xs" style={{ color: THEME.faint }}>Read-only historical snapshot</span>
        )}
      </div>

      {loadingBudgets ? (
        <div className="text-center py-10 text-sm" style={{ color: THEME.faint }}>Loading {fmtMonthLabel(budgetMonth)}…</div>
      ) : (
        <>
          {/* Category grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {TREND_CATEGORY_NAMES.map((cat) => {
              const catInfo = CATEGORIES[cat];
              const budget = budgetByCategory[cat];
              const values = seriesFor(cat);
              const trendLast = values[values.length - 1] ?? 0;
              const delta = values.length >= 2 ? trendLast - values[values.length - 2] : 0;
              const flat = Math.abs(delta) < 1;
              const worse = delta > 0; // spending more than last month is the "bad" direction
              const deltaColor = flat ? THEME.faint : worse ? THEME.red : THEME.green;
              const ArrowIcon = flat ? ArrowRight : worse ? ArrowUp : ArrowDown;

              // Budget-based figures (spent/limit/status/carryover) come from
              // the selected month's real budget record, not the trend series.
              const hasRealBudgetNumbers = budget && budget.limit != null && budget.spent != null;
              const spentForMonth = budget?.spent ?? 0;
              const pct = hasRealBudgetNumbers ? Math.min(100, Math.round((spentForMonth / budget.limit) * 100)) : 0;
              const near = hasRealBudgetNumbers && pct >= 90;
              const carryover = hasRealBudgetNumbers ? budget.limit - spentForMonth : 0;

              const isSelected = selected === cat;

              return (
                <Card
                  key={cat}
                  className="p-5"
                  style={{ cursor: "pointer", border: `1px solid ${isSelected ? catInfo.color : THEME.cardBorder}` }}
                >
                  <div onClick={() => setSelected(cat)}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: catInfo.bg }}>
                          <catInfo.icon size={15} style={{ color: catInfo.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: THEME.text }}>{cat}</div>
                          <div className="text-xs" style={{ color: THEME.faint }}>
                            Avg {mask(fmt(values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0))}/mo
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <ArrowIcon size={14} style={{ color: deltaColor }} />
                        <span className="text-xs font-semibold" style={{ color: deltaColor }}>
                          {flat ? "flat" : mask(`${worse ? "+" : "-"}${fmt(Math.abs(delta))}`)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 mb-2">
                      <Sparkline values={values} color={catInfo.color} budgetLine={budget?.limit} />
                    </div>

                    {budget ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs" style={{ color: THEME.faint }}>{isViewingCurrentBudget ? "This month" : fmtMonthLabel(budgetMonth)}</div>
                            <div className="text-sm font-bold" style={{ color: THEME.text }}>
                              {mask(fmt(spentForMonth))} <span className="text-xs font-normal" style={{ color: THEME.faint }}>/ {mask(fmt(budget.limit ?? 0))}</span>
                            </div>
                          </div>
                          {hasRealBudgetNumbers && (
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: near ? "rgba(244,72,95,0.15)" : "rgba(34,214,124,0.15)", color: near ? THEME.red : THEME.green }}
                            >
                              {near ? "Near limit" : "On track"}
                            </span>
                          )}
                        </div>
                        {hasRealBudgetNumbers && (
                          <div className="text-xs mt-1.5" style={{ color: carryover >= 0 ? THEME.green : THEME.red }}>
                            Carryover: {mask(`${carryover >= 0 ? "+" : "-"}${fmt(Math.abs(carryover))}`)}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs mt-2" style={{ color: THEME.faint }}>No budget set for this month</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary table — driven by the selected month's real backend budget data */}
          <Card className="p-5">
            <div className="text-15 font-bold mb-1" style={{ color: THEME.text }}>Monthly Budget Summary</div>
            <div className="text-xs mb-4" style={{ color: THEME.faint }}>
              {fmtMonthLabel(budgetMonth || thisMonth)} · Positive carryover = unspent · Negative = over budget
            </div>

            <div className="grid grid-cols-6 summary-header text-11 font-semibold tracking-wider pb-3" style={{ color: THEME.faint, borderBottom: `1px solid ${THEME.cardBorder}` }}>
              <div>CATEGORY</div><div>BUDGET</div><div>SPENT</div><div>STATUS</div><div>CARRYOVER</div><div>% USED</div>
            </div>
            {activeBudgets.map((budget) => {
              const catInfo = CATEGORIES[budget.category] || CATEGORIES.Food;
              const hasRealNumbers = budget.limit != null && budget.spent != null;
              const pct = hasRealNumbers ? Math.min(100, Math.round((budget.spent / budget.limit) * 100)) : 0;
              const near = hasRealNumbers && pct >= 90;
              const carryover = hasRealNumbers ? budget.limit - budget.spent : 0;
              const barColor = near ? THEME.red : pct >= 60 ? "#f59e0b" : catInfo.color;

              return (
                <div key={budget.category} className="grid grid-cols-6 items-center py-3.5 text-sm" style={{ borderBottom: `1px solid ${THEME.cardBorder}` }}>
                  <div className="flex items-center gap-2" style={{ color: THEME.text }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: catInfo.color }} />
                    {budget.category}
                  </div>
                  <div style={{ color: THEME.faint }}>{mask(fmt(budget.limit ?? 0))}</div>
                  <div style={{ color: near ? THEME.red : THEME.text }}>{mask(fmt(budget.spent ?? 0))}</div>
                  <div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: near ? "rgba(244,72,95,0.15)" : "rgba(34,214,124,0.15)", color: near ? THEME.red : THEME.green }}
                    >
                      {near ? "Near Limit" : "On Track"}
                    </span>
                  </div>
                  <div style={{ color: carryover >= 0 ? THEME.green : THEME.red }}>
                    {mask(`${carryover >= 0 ? "+" : "-"}${fmt(Math.abs(carryover))}`)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: THEME.inputBg, width: 60 }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <span style={{ color: THEME.faint }}>{hasRealNumbers ? `${pct}%` : "—"}</span>
                  </div>
                </div>
              );
            })}
            {activeBudgets.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: THEME.faint }}>No budgets recorded for this month.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
