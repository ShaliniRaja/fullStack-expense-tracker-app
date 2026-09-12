import React, { useState } from "react";
import { ChevronDown, ClipboardPaste } from "lucide-react";
import ModalShell from "./ModalShell";
import Label from "../common/Label";
import TextInput from "../common/TextInput";
import { THEME } from "../../constants/theme";
import { EXPENSE_CATEGORY_NAMES, SEND_MONEY_CATEGORY } from "../../constants/categories";
import { ALLOCATIONS } from "../../constants/allocations";
import { parseTransactionSms } from "../../utils/smsParser";

// onAdd/onUpdate receive a plain payload — persistence is handled by the
// caller via services/transactionService. Pass `editingTransaction` to
// open this in edit mode instead of create mode.
export default function AddTransactionModal({ onClose, onAdd, onUpdate, editingTransaction }) {
  const isEdit = Boolean(editingTransaction);
  const initialType = editingTransaction ? (editingTransaction.amount >= 0 ? "Income" : "Expense") : "Expense";

  const [smsText, setSmsText] = useState("");
  const [type, setType] = useState(initialType);
  const [description, setDescription] = useState(editingTransaction?.description || "");
  const [amount, setAmount] = useState(editingTransaction ? String(Math.abs(editingTransaction.amount)) : "");
  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(
    editingTransaction && editingTransaction.category !== "Income" ? editingTransaction.category : "Food"
  );
  const [allocation, setAllocation] = useState(editingTransaction?.allocation || ALLOCATIONS[0]);
  const [conversionRate, setConversionRate] = useState(editingTransaction?.conversionRate ? String(editingTransaction.conversionRate) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSendMoney = type === "Expense" && category === SEND_MONEY_CATEGORY;

  const handleParseSms = () => {
    const parsed = parseTransactionSms(smsText);
    if (parsed.amount) setAmount(parsed.amount);
    if (parsed.description) setDescription(parsed.description);
    setSmsText(""); // never keep the raw pasted text around longer than needed
  };

  const submit = async () => {
    if (!description.trim() || !amount) {
      setError("Description and amount are required.");
      return;
    }
    const value = Math.abs(parseFloat(amount) || 0);
    if (!value) {
      setError("Enter a valid amount.");
      return;
    }
    if (isSendMoney && !allocation) {
      setError("Choose where this sent money is going.");
      return;
    }

    setError("");
    setSubmitting(true);
    const payload = {
      description: description.trim(),
      category: type === "Income" ? "Income" : category,
      date,
      amount: type === "Income" ? value : -value,
      allocation: isSendMoney ? allocation : null,
      conversionRate: isSendMoney && conversionRate ? parseFloat(conversionRate) : null,
    };

    try {
      if (isEdit) {
        await onUpdate(editingTransaction.id, payload);
      } else {
        await onAdd(payload);
      }
      onClose();
    } catch {
      setError("Could not save this transaction — please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit Transaction" : "Add Transaction"} onClose={onClose}>
      {!isEdit && (
        <div className="mb-5 p-3 rounded-xl" style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}` }}>
          <Label>PASTE FROM SMS / RECEIPT (OPTIONAL)</Label>
          <textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Paste a bank purchase message here to auto-fill amount and description…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-xs outline-none mb-2"
            style={{ background: THEME.card, border: `1px solid ${THEME.cardBorder}`, color: THEME.text, resize: "none" }}
          />
          <button
            onClick={handleParseSms}
            disabled={!smsText.trim()}
            className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: THEME.card, color: THEME.text, border: `1px solid ${THEME.cardBorder}`, opacity: smsText.trim() ? 1 : 0.5 }}
          >
            <ClipboardPaste size={12} /> Fill amount & description
          </button>
          <div className="text-xs mt-2" style={{ color: THEME.faint }}>
            Category is always your own choice — nothing here selects it for you.
          </div>
        </div>
      )}

      <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: `1px solid ${THEME.cardBorder}` }}>
        <button
          onClick={() => { setType("Expense"); setCategory("Food"); }}
          className="flex-1 py-2.5 text-sm font-semibold"
          style={{ background: type === "Expense" ? THEME.red : "transparent", color: type === "Expense" ? "#fff" : THEME.sub }}
        >
          Expense
        </button>
        <button
          onClick={() => setType("Income")}
          className="flex-1 py-2.5 text-sm font-semibold"
          style={{ background: type === "Income" ? THEME.inputBg : "transparent", color: type === "Income" ? THEME.text : THEME.sub }}
        >
          Income
        </button>
      </div>

      <div className="mb-4">
        <Label>DESCRIPTION</Label>
        <TextInput placeholder="e.g. Coffee at Blue Bottle" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label>AMOUNT</Label>
          <TextInput type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>DATE</Label>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {type === "Expense" && (
        <div className="mb-4">
          <Label>CATEGORY</Label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none appearance-none"
              style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.text }}
            >
              {EXPENSE_CATEGORY_NAMES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-half translate-up-half pointer-events-none" style={{ color: THEME.faint }} />
          </div>
        </div>
      )}

      {isSendMoney && (
        <div className="mb-6">
          <Label>SENDING TO (RAMNAD) — ALLOCATE TO</Label>
          <div className="relative">
            <select
              value={allocation}
              onChange={(e) => setAllocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none appearance-none"
              style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.text }}
            >
              {ALLOCATIONS.map((a) => <option key={a}>{a}</option>)}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-half translate-up-half pointer-events-none" style={{ color: THEME.faint }} />
          </div>
          <div className="text-xs mt-1.5" style={{ color: THEME.faint }}>Shows up on the "Send Money to Ramnad" page under this bucket.</div>

          <div className="mt-4">
            <Label>AED → INR RATE FOR THIS TRANSFER (OPTIONAL)</Label>
            <TextInput type="number" step="0.01" placeholder="e.g. 23.10" value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} />
            <div className="text-xs mt-1.5" style={{ color: THEME.faint }}>
              Each transfer keeps its own rate — not a shared app-wide setting.
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-xs font-medium mb-3" style={{ color: THEME.red }}>{error}</div>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ background: THEME.green, color: "#06280f", opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Transaction"}
      </button>
    </ModalShell>
  );
}
