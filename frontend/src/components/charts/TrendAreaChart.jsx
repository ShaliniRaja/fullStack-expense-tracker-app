import React, { useId, useRef, useState } from "react";
import { areaPath, smoothLinePath, scaleToPoints } from "../../utils/chartMath";
import { THEME } from "../../constants/theme";
import { fmt } from "../../utils/formatters";

// The large "hero" chart — full axis labels, dot markers, an optional
// dashed reference line (the monthly budget limit), and a hover
// tooltip showing that exact month's spend. The values themselves
// always come from the backend (see services/trendService.js) — this
// component only ever renders whatever it's handed, it never computes
// or guesses a number itself.
export default function TrendAreaChart({ labels, values, color, budgetLine, height = 220, hidden = false }) {
  const gradientId = useId();
  const width = 1000; // viewBox units; scales to container via CSS width:100%
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const dataMax = Math.max(...values, budgetLine || 0);
  const domainMax = Math.ceil((dataMax * 1.08) / 5) * 5 || 10;
  const domainMin = 0;

  const points = scaleToPoints(values, width, height, domainMin, domainMax);
  const line = smoothLinePath(points);
  const area = areaPath(points, height);

  const budgetY = budgetLine != null ? height - (budgetLine / domainMax) * height : null;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((domainMax / yTicks) * i));

  const handleMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * width;

    let nearest = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relativeX);
      if (d < bestDist) { bestDist = d; nearest = i; }
    });
    setHoverIndex(nearest);
  };

  const hoverPoint = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div>
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height, paddingRight: 8 }}>
          {yLabels.slice().reverse().map((v) => (
            <span key={v} className="text-xs" style={{ color: THEME.faint, whiteSpace: "nowrap" }}>
              {hidden ? "•••" : v}
            </span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ width: "100%", height, display: "block", cursor: "crosshair" }}
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {budgetY != null && (
              <line x1="0" y1={budgetY} x2={width} y2={budgetY} stroke={THEME.faint} strokeWidth="1.5" strokeDasharray="6 6" />
            )}

            <path d={area} fill={`url(#${gradientId})`} stroke="none" />
            <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

            {hoverPoint && (
              <line x1={hoverPoint.x} y1="0" x2={hoverPoint.x} y2={height} stroke={THEME.faint} strokeWidth="1" strokeDasharray="3 3" />
            )}

            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? "6" : "4"}
                fill={color}
                stroke={THEME.card}
                strokeWidth="2"
              />
            ))}
          </svg>

          {hoverPoint && (
            <div
              style={{
                position: "absolute",
                left: `${(hoverPoint.x / width) * 100}%`,
                top: Math.max(0, hoverPoint.y - 54),
                transform: "translateX(-50%)",
                background: THEME.card,
                border: `1px solid ${THEME.cardBorder}`,
                borderRadius: 8,
                padding: "6px 10px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <div className="text-xs font-semibold" style={{ color: THEME.text }}>{labels[hoverIndex]}</div>
              <div className="text-xs" style={{ color }}>{hidden ? "••••" : fmt(values[hoverIndex])}</div>
            </div>
          )}

          <div className="flex justify-between mt-1">
            {labels.map((l) => (
              <span key={l} className="text-xs" style={{ color: THEME.faint }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
