import React, { useState, useRef } from 'react';

// Generates smooth cubic bezier SVG path from data points
function getBezierPath(rawData, width, height, padding = 10) {
  if (!Array.isArray(rawData)) return { path: '', area: '', points: [] };

  // Sanitize data points: filter non-values and map to finite numbers
  const sanitized = rawData
    .filter(v => v !== null && v !== undefined && v !== '')
    .map(v => (typeof v === 'number' ? v : Number(v)))
    .filter(v => Number.isFinite(v));

  if (sanitized.length < 2) return { path: '', area: '', points: [] };

  const minVal = Math.min(...sanitized);
  const maxVal = Math.max(...sanitized);
  const range = (maxVal - minVal) || 1;

  const points = sanitized.map((val, i) => {
    const x = padding + (i / (sanitized.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0, val, index: i };
  });

  // Construct smooth cubic bezier path
  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const areaD = `${pathD} L ${last.x},${height} L ${first.x},${height} Z`;

  return { path: pathD, area: areaD, points };
}

export default function InteractiveEquityCurve({ 
  data = [0, 25, 20, 35, 40, 55, 50, 75, 70, 95], 
  color = "#58CC02", 
  id = "chart",
  formatValue 
}) {
  const [hoverPoint, setHoverPoint] = useState(null);
  const svgRef = useRef(null);

  const width = 420;
  const height = 85;
  const sanitizedInput = Array.isArray(data)
    ? data.filter(v => v !== null && v !== undefined && v !== '').map(v => (typeof v === 'number' ? v : Number(v))).filter(v => Number.isFinite(v))
    : [];
  const safeData = sanitizedInput.length >= 2 ? sanitizedInput : [0, 0];
  const { path, area, points } = getBezierPath(safeData, width, height);

  const isPositive = safeData[safeData.length - 1] >= (safeData[0] || 0);
  const strokeColor = isPositive ? color : "#FF4B4B";

  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const mouseX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const chartX = mouseX * scaleX;

    // Find nearest data point
    let closest = points[0];
    let minDist = Math.abs(points[0].x - chartX);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - chartX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }
    setHoverPoint(closest);
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  return (
    <div className="relative w-full group select-none">
      <div className="h-20 w-full relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={`area-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          {area && <path d={area} fill={`url(#area-grad-${id})`} />}

          {/* Smooth Bezier Curve Line */}
          {path && (
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Crosshair Line & Point Marker */}
          {hoverPoint && (
            <g>
              <line
                x1={hoverPoint.x}
                y1="0"
                x2={hoverPoint.x}
                y2={height}
                stroke="#1CB0F6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.y}
                r="6"
                fill={hoverPoint.val >= (safeData[0] || 0) ? "#58CC02" : "#FF4B4B"}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="animate-pulse"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Callout */}
        {hoverPoint && (
          <div
            className="absolute -top-11 -translate-x-1/2 bg-[#182830] border-2 border-[#1CB0F6] px-3 py-1 rounded-xl shadow-2xl z-30 pointer-events-none flex items-center gap-2 whitespace-nowrap animate-fade-in"
            style={{
              left: `${Math.max(10, Math.min(90, (hoverPoint.x / width) * 100))}%`,
            }}
          >
            <span className="text-[10px] font-black text-[#52656D] uppercase">
              {hoverPoint.index === 0 ? 'Baseline' : `Trade #${hoverPoint.index}`}
            </span>
            <span className={`text-xs font-black ${hoverPoint.val >= (safeData[0] || 0) ? 'text-[#58CC02]' : 'text-rose-400'}`}>
              {formatValue 
                ? formatValue(hoverPoint.val, hoverPoint.index) 
                : (hoverPoint.val >= 0 
                    ? `+$${Math.round(hoverPoint.val).toLocaleString()}` 
                    : `-$${Math.abs(Math.round(hoverPoint.val)).toLocaleString()}`
                  )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
