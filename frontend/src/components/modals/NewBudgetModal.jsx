import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import ModalShell from "./ModalShell";
import Label from "../common/Label";
import TextInput from "../common/TextInput";
import { THEME } from "../../constants/theme";
import { EXPENSE_CATEGORY_NAMES } from "../../constants/categories";
import { currentMonthGuess, fmtMonthLabel } from "../../utils/formatters";

// onCreate/onUpdate receive a plain payload — persistence is handled by
// the caller via services/budgetService. Pass `editingBudget` to open
// this in edit mode instead of create mode (category/month become fixed —
// editing corrects the current month's numbers, it doesn't move the record).
// defaultMonth lets a create open pre-set to whichever month is currently
// being viewed (e.g. backfilling history), while still letting the user change it.
export default function NewBudgetModal({ onClose, onCreate, onUpdate, defaultMonth, editingBudget }) {
  const isEdit = Boolean(editingBudget);
  const thisMonth = currentMonthGuess();

  const [category, setCategory] = useState(editingBudget?.category || EXPENSE_CATEGORY_NAMES[0]);
  const [limit, setLimit] = useState(editingBudget ? String(editingBudget.limit) : "");
  const [spent, setSpent] = useState(editingBudget ? String(editingBudget.spent) : "");
  const [month, setMonth] = useState(defaultMonth || thisMonth);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isHistorical = !isEdit && month !== thisMonth;

  const submit = async () => {
    const limitValue = parseFloat(limit);
    if (!limitValue || limitValue <= 0) {
      setError("Enter a limit greater than 0.");
      return;
    }
    const spentValue = spent ? parseFloat(spent) : 0;
    if (spentValue < 0) {
      setError("Spent amount can't be negative.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        await onUpdate(editingBudget.category, { limit: limitValue, spent: spentValue });
      } else {
        await onCreate({ category, limit: limitValue, spent: spentValue, month });
      }
      onClose();
    } catch {
      setError(isEdit ? "Could not save changes — please try again." : "Could not create this budget — it may already exist for that month.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit Budget" : "New Budget"} onClose={onClose} width={420}>
      <div className="mb-4">
        <Label>CATEGORY</Label>
        {isEdit ? (
          <div className="px-3.5 py-2.5 rounded-xl text-sm" style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.faint }}>
            {category}
          </div>
        ) : (
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
        )}
      </div>

      <div className="mb-4">
        <Label>MONTH</Label>
        {isEdit ? (
          <div className="px-3.5 py-2.5 rounded-xl text-sm" style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.faint }}>
            {fmtMonthLabel(thisMonth)} (current)
          </div>
        ) : (
          <TextInput type="month" max={thisMonth} value={month} onChange={(e) => setMonth(e.target.value)} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <Label>MONTHLY LIMIT</Label>
          <TextInput type="number" placeholder="500" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        <div>
          <Label>{isHistorical ? "ALREADY SPENT" : "SPENT SO FAR"}</Label>
          <TextInput type="number" placeholder="0" value={spent} onChange={(e) => setSpent(e.target.value)} />
        </div>
      </div>

      {isHistorical && (
        <div className="text-xs mt-2" style={{ color: THEME.faint }}>
          Backfilling a past month — this becomes a permanent record and can't be edited later.
        </div>
      )}

      {error && <div className="text-xs font-medium mt-2 mb-2" style={{ color: THEME.red }}>{error}</div>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-sm mt-4"
        style={{ background: THEME.green, color: "#06280f", opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Budget"}
      </button>
    </ModalShell>
  );
}
