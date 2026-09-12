import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wallet, TrendingUp, Home as HomeIcon, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Label from "../components/common/Label";
import TextInput from "../components/common/TextInput";
import DateRangePicker from "../components/common/DateRangePicker";
import AddTransactionModal from "../components/modals/AddTransactionModal";
import { THEME } from "../constants/theme";
import { ALLOCATIONS } from "../constants/allocations";
import { SEND_MONEY_CATEGORY } from "../constants/categories";
import { fmt, fmtDate } from "../utils/formatters";
import { useVisibility } from "../context/VisibilityContext";
import * as transactionService from "../services/transactionService";

const BUCKET_ICONS = {
  "Cash in Hand": Wallet,
  Investment: TrendingUp,
  "House Expenses": HomeIcon,
};
const BUCKET_COLORS = {
  "Cash in Hand": "#22d67c",
  Investment: "#3b82f6",
  "House Expenses": "#f59e0b",
};
const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 350;

// Header totals are computed from `transactions` (the app's already-
// loaded full list) — that's genuinely all Send Money transactions, so
// no extra fetch needed. The per-bucket detail list below is different:
// it's a real backend search/filter/pagination (TransactionService.search
// with category="Send Money"&allocation=<bucket>), the same pattern as
// the Transactions page, not a client-side slice of an already-fetched list.
export default function SendMoney({ transactions, onUpdateTransaction, onDeleteTransaction, isVisitor }) {
  const { hidden } = useVisibility();
  const mask = (text) => (hidden ? "••••" : text);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedBucket, setSelectedBucket] = useState(ALLOCATIONS[0]);

  const sendMoneyTx = useMemo(
    () => transactions.filter((t) => t.category === SEND_MONEY_CATEGORY),
    [transactions]
  );

  const byBucket = useMemo(() => {
    const map = {};
    ALLOCATIONS.forEach((a) => { map[a] = []; });
    sendMoneyTx.forEach((t) => {
      if (t.allocation && map[t.allocation]) map[t.allocation].push(t);
    });
    return map;
  }, [sendMoneyTx]);

  const inrOf = (t) => (t.conversionRate ? Math.abs(t.amount) * t.conversionRate : 0);
  const aedOf = (bucket) => byBucket[bucket].reduce((s, t) => s + Math.abs(t.amount), 0);
  const inrOfBucket = (bucket) => byBucket[bucket].reduce((s, t) => s + inrOf(t), 0);

  // House Expenses is money already spent, not money still held or
  // growing — so it comes OUT of the total instead of adding to it,
  // unlike Cash in Hand and Investment which both still count as assets.
  const totalAed = aedOf("Cash in Hand") + aedOf("Investment") - aedOf("House Expenses");
  const totalInr = inrOfBucket("Cash in Hand") + inrOfBucket("Investment") - inrOfBucket("House Expenses");
  const anyRateMissing = sendMoneyTx.some((t) => !t.conversionRate);

  // --- per-bucket detail list: real backend search/filter/pagination ---
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    transactionService
      .searchTransactions({
        category: SEND_MONEY_CATEGORY,
        allocation: selectedBucket,
        search: query || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        minAmount: minAmount || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [selectedBucket, query, fromDate, toDate, minAmount, page]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [load]);

  useEffect(() => { setPage(0); }, [selectedBucket, query, fromDate, toDate, minAmount]);

  const handleDelete = (t) => {
    if (window.confirm(`Delete "${t.description}"? This can't be undone.`)) {
      onDeleteTransaction(t.id).then(load);
    }
  };

  const handleUpdate = async (id, payload) => {
    await onUpdateTransaction(id, payload);
    load();
  };

  const hasActiveFilters = Boolean(query || fromDate || toDate || minAmount);
  const clearAll = () => { setQuery(""); setFromDate(""); setToDate(""); setMinAmount(""); };

  return (
    <div>
      <PageHeader title="Send Money to Ramnad" subtitle="Each transfer keeps its own AED → INR rate" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>NET TOTAL (CASH + INVESTMENT − HOUSE EXPENSES)</div>
          <div className="text-2xl font-bold mt-2" style={{ color: totalAed >= 0 ? THEME.text : THEME.red }}>{mask(`AED ${fmt(totalAed)}`)}</div>
          <div className="text-xs mt-1.5 font-medium" style={{ color: THEME.faint }}>{sendMoneyTx.length} transfer{sendMoneyTx.length === 1 ? "" : "s"} total</div>
        </Card>
        <Card className="p-5">
          <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>NET TOTAL IN INR</div>
          <div className="text-2xl font-bold mt-2" style={{ color: totalInr >= 0 ? THEME.text : THEME.red }}>{mask(`₹${fmt(totalInr)}`)}</div>
          <div className="text-xs mt-1.5" style={{ color: THEME.faint }}>
            {anyRateMissing ? "Some transfers have no rate set" : "Sum of each transfer's own rate"}
          </div>
        </Card>
      </div>

      {/* Bucket selector — a single choice, not three static boxes */}
      <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: `1px solid ${THEME.cardBorder}` }}>
        {ALLOCATIONS.map((bucket) => {
          const Icon = BUCKET_ICONS[bucket];
          const color = BUCKET_COLORS[bucket];
          const active = selectedBucket === bucket;
          return (
            <button
              key={bucket}
              onClick={() => setSelectedBucket(bucket)}
              className="flex-1 py-3 flex flex-col items-center gap-1"
              style={{ background: active ? THEME.inputBg : "transparent", borderBottom: active ? `2px solid ${color}` : "2px solid transparent" }}
            >
              <Icon size={16} style={{ color: active ? color : THEME.faint }} />
              <span className="text-xs font-semibold" style={{ color: active ? THEME.text : THEME.faint }}>{bucket}</span>
              <span className="text-sm font-bold" style={{ color: active ? THEME.text : THEME.faint }}>{mask(`AED ${fmt(aedOf(bucket))}`)}</span>
            </button>
          );
        })}
      </div>

      {/* Detail list for the selected bucket — backend search/filter/pagination */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl flex-1" style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, minWidth: 200 }}>
            <Search size={15} style={{ color: THEME.faint }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search within ${selectedBucket}...`}
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: THEME.text }}
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5"
            style={{ background: showFilters || hasActiveFilters ? THEME.greenDim : THEME.card, color: showFilters || hasActiveFilters ? THEME.green : THEME.text, border: `1px solid ${THEME.cardBorder}` }}
          >
            <Filter size={14} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 mb-4" style={{ flexWrap: "wrap" }}>
            <DateRangePicker fromDate={fromDate} toDate={toDate} onChange={({ fromDate: f, toDate: t }) => { setFromDate(f); setToDate(t); }} />
            <div style={{ width: 160 }}>
              <Label>ABOVE AMOUNT</Label>
              <TextInput type="number" placeholder="e.g. 100" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 self-end"
                style={{ background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.cardBorder}` }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: THEME.faint }}>Loading…</div>
        ) : result.content.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: THEME.faint }}>Nothing sent to {selectedBucket} yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {result.content.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-2.5" style={{ borderBottom: `1px solid ${THEME.cardBorder}` }}>
                <div className="min-w-0">
                  <div className="truncate font-medium" style={{ color: THEME.text }}>{t.description}</div>
                  <div className="text-xs" style={{ color: THEME.faint }}>
                    {fmtDate(t.date)}{t.conversionRate ? ` · @ ${t.conversionRate}` : " · no rate set"}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="font-semibold" style={{ color: THEME.text }}>{mask(`AED ${fmt(Math.abs(t.amount ?? 0))}`)}</div>
                  {!isVisitor && (
                    <>
                      <button onClick={() => setEditingTransaction(t)} title="Edit transfer" style={{ color: THEME.faint }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(t)} title="Delete transfer" style={{ color: THEME.faint }}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
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
