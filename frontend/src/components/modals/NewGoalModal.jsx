import React, { useState } from "react";
import ModalShell from "./ModalShell";
import Label from "../common/Label";
import TextInput from "../common/TextInput";
import { THEME } from "../../constants/theme";
import { GOAL_ICONS, GOAL_ICON_KEYS } from "../../constants/goalIcons";

// onCreate/onUpdate receive a plain payload — persistence is handled by
// the caller via services/savingsService. Pass `editingGoal` to open
// this in edit mode instead of create mode.
export default function NewGoalModal({ onClose, onCreate, onUpdate, editingGoal }) {
  const isEdit = Boolean(editingGoal);

  const [icon, setIcon] = useState(editingGoal?.icon || "shield");
  const [name, setName] = useState(editingGoal?.name || "");
  const [target, setTarget] = useState(editingGoal ? String(editingGoal.target) : "");
  const [saved, setSaved] = useState(editingGoal ? String(editingGoal.saved) : "");
  const [days, setDays] = useState(editingGoal ? String(editingGoal.days) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !target) {
      setError("Name and target amount are required.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      icon,
      name: name.trim(),
      target: parseFloat(target) || 0,
      saved: parseFloat(saved) || 0,
      days: Math.max(0, parseInt(days, 10) || 0),
    };

    try {
      if (isEdit) {
        await onUpdate(editingGoal.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch {
      setError("Could not save this goal — please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit Savings Goal" : "New Savings Goal"} onClose={onClose} width={420}>
      <Label>ICON</Label>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {GOAL_ICON_KEYS.map((k) => {
          const Icon = GOAL_ICONS[k];
          const active = icon === k;
          return (
            <button
              key={k}
              onClick={() => setIcon(k)}
              className="aspect-square rounded-xl flex items-center justify-center"
              style={{ background: active ? THEME.greenDim : THEME.inputBg, border: `1px solid ${active ? THEME.green : THEME.cardBorder}` }}
            >
              <Icon size={17} style={{ color: active ? THEME.green : THEME.sub }} />
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <Label>GOAL NAME</Label>
        <TextInput placeholder="e.g. Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label>TARGET AMOUNT</Label>
          <TextInput type="number" placeholder="5000" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div>
          <Label>{isEdit ? "SAVED SO FAR" : "ALREADY SAVED"}</Label>
          <TextInput type="number" placeholder="0" value={saved} onChange={(e) => setSaved(e.target.value)} />
        </div>
      </div>

      <div className="mb-6">
        <Label>DAYS LEFT</Label>
        <TextInput type="number" placeholder="151" value={days} onChange={(e) => setDays(e.target.value)} />
      </div>

      {error && <div className="text-xs font-medium mb-3" style={{ color: THEME.red }}>{error}</div>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ background: THEME.green, color: "#06280f", opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Goal"}
      </button>
    </ModalShell>
  );
}
