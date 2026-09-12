import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, Trash2, Pencil, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import TextInput from "../components/common/TextInput";
import Label from "../components/common/Label";
import DateRangePicker from "../components/common/DateRangePicker";
import AddTransactionModal from "../components/modals/AddTransactionModal";
import { THEME } from "../constants/theme";
import { CATEGORIES } from "../constants/categories";
import { fmt, fmtDate } from "../utils/formatters";
import { useVisibility } from "../context/VisibilityContext";
import * as transactionService from "../services/transactionService";

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 350;

// Every bit of narrowing here — search, date range, type, category,
// which page you're on — is a request to the backend
// (TransactionService.search), not a client-side filter over an
// already-fetched list. That's what makes search actually cover every
// record, and what keeps "6 rows per page" honest even when combined
// with the Income/Expense filter.
export default function Transactions({ onUpdateTransaction, onDeleteTransaction, isVisitor, initialFilter, onFilterConsumed }) {
  const { hidden } = useVisibility();
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all"); // "all" | "income" | "expense"
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const [result, setResult] = useState({ content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 1, totalAmount: null });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // A budget card elsewhere can hand this page a starting filter
  // (category + that month's date range) — applied once, then cleared
  // in the parent so navigating away and back doesn't reapply it.
  useEffect(() => {
    if (!initialFilter) return;
    setCategory(initialFilter.category || "");
    setFromDate(initialFilter.fromDate || "");
    setToDate(initialFilter.toDate || "");
    setShowFilters(true);
    onFilterConsumed?.();
  }, [initialFilter]);

  const load = useCallback(() => {
    setLoading(true);
    transactionService
      .searchTransactions({
        search: query || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        minAmount: minAmount || undefined,
        category: category || undefined,
        type: type !== "all" ? type : undefined,
        page,
        size: PAGE_SIZE,
      })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [query, fromDate, toDate, minAmount, category, type, page]);

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [load]);

  // Any filter change resets to page 0 — staying on page 4 of a now-shorter result is confusing.
  useEffect(() => { setPage(0); }, [query, fromDate, toDate, minAmount, category, type]);

  const handleDelete = (t) => {
    if (window.confirm(`Delete "${t.description}"? This can't be undone.`)) {
      onDeleteTransaction(t.id).then(load);
    }
  };

  const handleUpdate = async (id, payload) => {
    await onUpdateTransaction(id, payload);
    load();
  };

  const hasActiveFilters = Boolean(query || fromDate || toDate || minAmount || category);
  const clearAll = () => { setQuery(""); setFromDate(""); setToDate(""); setMinAmount(""); setCategory(""); };

  const gridClass = isVisitor ? "grid-cols-tx" : "grid-cols-tx7";

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${result.totalElements} record${result.totalElements === 1 ? "" : "s"}${hasActiveFilters ? " · filtered" : ""}`}
        right={
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
            style={{ background: showFilters || hasActiveFilters ? THEME.greenDim : THEME.inputBg, color: showFilters || hasActiveFilters ? THEME.green : THEME.text, border: `1px solid ${THEME.cardBorder}` }}
          >
            <Filter size={14} /> Filters
          </button>
        }
      />

      {category && (
        <div className="flex items-center gap-3 mb-4" style={{ flexWrap: "wrap" }}>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: THEME.greenDim, color: THEME.green, width: "fit-content" }}>
            Category: {category}
            <button onClick={() => setCategory("")}><X size={12} /></button>
          </div>
          {result.totalAmount != null && (
            <div className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.cardBorder}` }}>
              Sum for this filter: <span className="font-bold">{hidden ? "••••" : fmt(Math.abs(result.totalAmount))}</span>
            </div>
          )}
        </div>
      )}

      {showFilters && (
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3 mb-1" style={{ flexWrap: "wrap" }}>
            <DateRangePicker fromDate={fromDate} toDate={toDate} onChange={({ fromDate: f, toDate: t }) => { setFromDate(f); setToDate(t); }} />
            <div style={{ width: 160 }}>
              <Label>ABOVE AMOUNT</Label>
              <TextInput type="number" placeholder="e.g. 100" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </div>
            <div style={{ width: 180 }}>
              <Label>CATEGORY</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.text }}
              >
                <option value="">Any category</option>
                {Object.keys(CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 self-end"
                style={{ background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.cardBorder}` }}
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>
          <div className="text-xs mt-2" style={{ color: THEME.faint }}>Search and filters run on the server, across every record — not just what's loaded on this page.</div>
        </Card>
      )}

      <div className="tx-toolbar flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: THEME.card, border: `1px solid ${THEME.cardBorder}` }}>
          <Search size={15} style={{ color: THEME.faint }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by description or category — searches every record..."
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: THEME.text }}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${THEME.cardBorder}` }}>
          {[{ key: "all", label: "All" }, { key: "income", label: "Income" }, { key: "expense", label: "Expense" }].map((f) => (
            <button
              key={f.key}
              onClick={() => setType(f.key)}
              className="px-4 py-2.5 text-sm font-medium"
              style={{ background: type === f.key ? THEME.inputBg : THEME.card, color: type === f.key ? THEME.text : THEME.sub }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <div className={`grid ${gridClass} tx-header text-11 font-semibold tracking-wider pb-3`} style={{ color: THEME.faint, borderBottom: `1px solid ${THEME.cardBorder}` }}>
          <div>DESCRIPTION</div>
          <div>CATEGORY</div>
          <div>DATE</div>
          {!isVisitor && <div>ADDED BY</div>}
          <div className="text-right">AMOUNT</div>
          {!isVisitor && <div></div>}
          {!isVisitor && <div></div>}
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm" style={{ color: THEME.faint }}>Loading…</div>
        ) : (
          <>
            {result.content.map((t) => {
              const cat = CATEGORIES[t.category] || CATEGORIES.Food;
              const Icon = cat.icon;
              const isMasked = t.amount == null || hidden;
              const positive = t.amount >= 0;
              return (
                <div key={t.id} className={`grid ${gridClass} items-center py-3.5`} style={{ borderBottom: `1px solid ${THEME.cardBorder}` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: cat.bg }}>
                      <Icon size={14} style={{ color: cat.color }} />
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: THEME.text }}>{t.description}</span>
                  </div>
                  <div className="text-sm" style={{ color: THEME.sub }}>{t.category}</div>
                  <div className="text-sm" style={{ color: THEME.sub }}>{fmtDate(t.date)}</div>
                  {!isVisitor && <div className="text-sm" style={{ color: THEME.sub }}>{t.createdByRole || "—"}</div>}
                  <div className="text-sm font-bold text-right tx-amount-mobile" style={{ color: isMasked ? THEME.faint : positive ? THEME.green : THEME.red }}>
                    {isMasked ? "••••" : `${positive ? "+" : "-"}${fmt(Math.abs(t.amount))}`}
                  </div>
                  {!isVisitor && (
                    <div className="text-right">
                      <button onClick={() => setEditingTransaction(t)} title="Edit transaction" style={{ color: THEME.faint }}>
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                  {!isVisitor && (
                    <div className="text-right">
                      <button onClick={() => handleDelete(t)} title="Delete transaction" style={{ color: THEME.faint }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {result.content.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: THEME.faint }}>No transactions match your search.</div>
            )}
          </>
        )}

        {result.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: `1px solid ${THEME.cardBorder}` }}>
            <span className="text-xs" style={{ color: THEME.faint }}>Page {result.page + 1} of {result.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={result.page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: THEME.inputBg, color: THEME.text, opacity: result.page === 0 ? 0.4 : 1, border: `1px solid ${THEME.cardBorder}` }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(result.totalPages - 1, p + 1))}
                disabled={result.page >= result.totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: THEME.inputBg, color: THEME.text, opacity: result.page >= result.totalPages - 1 ? 0.4 : 1, border: `1px solid ${THEME.cardBorder}` }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {editingTransaction && (
        <AddTransactionModal
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
