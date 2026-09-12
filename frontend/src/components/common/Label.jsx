import React from "react";
import { THEME } from "../../constants/theme";

export default function Label({ children }) {
  return (
    <div className="text-11 font-semibold tracking-wider mb-1.5" style={{ color: THEME.faint }}>
      {children}
    </div>
  );
}
