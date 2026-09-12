import React from "react";
import { THEME } from "../../constants/theme";

export default function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
      style={{ background: THEME.inputBg, border: `1px solid ${THEME.cardBorder}`, color: THEME.text }}
    />
  );
}
