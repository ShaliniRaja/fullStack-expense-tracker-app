import React, { useId } from "react";
import { areaPath, smoothLinePath, scaleToPoints } from "../../utils/chartMath";

// Compact chart used inside each category's mini-card. No axes —
// just the shape, plus a dashed line if the budget limit falls
// within (or near) the visible range.
export default function Sparkline({ values, color, budgetLine, width = 260, height = 70 }) {
  const gradientId = useId();

  const dataMax = Math.max(...values, budgetLine || 0);
  const domainMax = dataMax * 1.1 || 10;
  const domainMin = 0;

  const points = scaleToPoints(values, width, height, domainMin, domainMax);
  const line = smoothLinePath(points);
  const area = areaPath(points, height);
  const budgetY = budgetLine != null ? height - (budgetLine / domainMax) * height : null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {budgetY != null && budgetY >= 0 && (
        <line x1="0" y1={budgetY} x2={width} y2={budgetY} stroke={color} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="5 5" />
      )}
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
