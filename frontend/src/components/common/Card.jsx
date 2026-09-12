import React from "react";
import { THEME } from "../../constants/theme";

export default function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`card rounded-2xl ${className}`}
      style={{ background: THEME.card, border: `1px solid ${THEME.cardBorder}`, ...style }}
    >
      {children}
    </div>
  );
}
