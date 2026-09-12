// Minimal SVG chart math — no charting library dependency. Builds a
// smoothed line/area path through a series of {x, y} points already
// scaled to pixel space.

// Catmull-Rom -> cubic Bezier conversion for a smooth (not jagged) curve.
export function smoothLinePath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function areaPath(points, baselineY) {
  const line = smoothLinePath(points);
  if (!line) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

// Maps a series of raw values to pixel-space {x, y} points for an
// SVG of the given width/height, given a value domain [min, max].
export function scaleToPoints(values, width, height, domainMin, domainMax, paddingX = 0) {
  const span = domainMax - domainMin || 1;
  const innerWidth = width - paddingX * 2;
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values.map((v, i) => ({
    x: paddingX + i * step,
    y: height - ((v - domainMin) / span) * height,
  }));
}
