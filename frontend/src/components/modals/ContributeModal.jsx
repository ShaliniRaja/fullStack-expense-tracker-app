import React, { useState } from "react";
import ModalShell from "./ModalShell";
import Label from "../common/Label";
import TextInput from "../common/TextInput";
import { THEME } from "../../constants/theme";
import { fmt } from "../../utils/formatters";

export default function ContributeModal({ goal, onClose, onContribute }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onContribute(goal.id, value);
      onClose();
    } catch {
      setError("Could not add funds — please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={`Add funds — ${goal.name}`} onClose={onClose} width={380}>
      <div className="text-xs mb-4" style={{ color: THEME.faint }}>
        Currently {fmt(goal.saved)} of {fmt(goal.target)} saved
      </div>

      <div className="mb-2">
        <Label>AMOUNT TO ADD</Label>
        <TextInput type="number" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </div>

      {error && <div className="text-xs font-medium mt-2 mb-2" style={{ color: THEME.red }}>{error}</div>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-sm mt-4"
        style={{ background: THEME.green, color: "#06280f", opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? "Adding…" : "Add Funds"}
      </button>
    </ModalShell>
  );
}
