import React from "react";
import { THEME } from "../../constants/theme";
import { getDateRangePresets } from "../../utils/dateRanges";
import Label from "./Label";
import TextInput from "./TextInput";

// Same plain native date input as Add Transaction uses — that already
// opens the browser's own calendar when clicked, which is all this
// needs. Presets cover the common cases in one click; the two date
// fields are there for anything custom, no custom-built calendar widget.
export default function DateRangePicker({ fromDate, toDate, onChange }) {
  const presets = getDateRangePresets();
  const activePresetLabel = presets.find((p) => p.fromDate === fromDate && p.toDate === toDate)?.label;
  const hasRange = Boolean(fromDate || toDate);

  return (
    <div className="flex items-end gap-3" style={{ flexWrap: "wrap" }}>
      <div>
        <Label>FROM</Label>
        <TextInput type="date" value={fromDate} onChange={(e) => onChange({ fromDate: e.target.value, toDate })} />
      </div>
      <div>
        <Label>TO</Label>
        <TextInput type="date" value={toDate} onChange={(e) => onChange({ fromDate, toDate: e.target.value })} />
      </div>
      <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ fromDate: p.fromDate, toDate: p.toDate })}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: activePresetLabel === p.label ? THEME.greenDim : THEME.inputBg, color: activePresetLabel === p.label ? THEME.green : THEME.sub, border: `1px solid ${THEME.cardBorder}` }}
          >
            {p.label}
          </button>
        ))}
        {hasRange && (
          <button
            onClick={() => onChange({ fromDate: "", toDate: "" })}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: THEME.red }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
