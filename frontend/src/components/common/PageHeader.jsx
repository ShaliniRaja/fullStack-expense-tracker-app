import React from "react";
import { THEME } from "../../constants/theme";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-6" style={{ flexWrap: "wrap" }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: THEME.text }}>{title}</h1>
        <p className="text-sm mt-1" style={{ color: THEME.sub }}>{subtitle}</p>
      </div>
      {right}
    </div>
  );
}
