"use client";

import { useMemo } from "react";

type ChartDatum = {
  label: string;
  value: number;
};

type AreaBarChartProps = {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  accent?: {
    stroke: string;
    fill: string;
  };
  height?: number;
  showGrid?: boolean;
};

const buildAreaPath = (points: { x: number; y: number }[], height: number) => {
  if (!points.length) {
    return "";
  }

  const commands = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`);
  const closing = `L${points[points.length - 1].x},${height} L0,${height} Z`;
  return `${commands.join(" ")} ${closing}`;
};

const buildLinePath = (points: { x: number; y: number }[]) => {
  if (!points.length) {
    return "";
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
};

export const AreaBarChart = ({
  title,
  subtitle,
  data,
  accent = {
    stroke: "#205493",
    fill: "url(#chart-fill-default)",
  },
  height = 280,
  showGrid = true,
}: AreaBarChartProps) => {
  const { areaPath, linePath, bars, labels, maxValue } = useMemo(() => {
    if (!data.length) {
      return { areaPath: "", linePath: "", bars: [], labels: [], maxValue: 0 };
    }

    const max = Math.max(...data.map((d) => d.value), 1);
    const width = Math.max(data.length - 1, 1);
    const horizontalStep = width ? 100 / width : 0;

    const points = data.map((datum, index) => {
      const x = horizontalStep * index;
      const y = 100 - (datum.value / max) * 88 - 6; // provide top padding
      return { x, y };
    });

    const bars = data.map((datum, index) => {
      const barWidth = horizontalStep * 0.6;
      const x = horizontalStep * index - barWidth / 2;
      const heightRatio = datum.value / max;
      return {
        x,
        width: barWidth,
        height: heightRatio * 88,
        value: datum.value,
      };
    });

    return {
      areaPath: buildAreaPath(points, 100),
      linePath: buildLinePath(points),
      bars,
      labels: data.map((d) => d.label),
      maxValue: max,
    };
  }, [data]);

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "28px",
        boxShadow: "0 34px 68px rgba(11, 31, 51, 0.15)",
        border: "1px solid rgba(24, 76, 140, 0.08)",
        padding: "2.4rem",
        display: "grid",
        gap: "1.9rem",
      }}
    >
      <header style={{ display: "grid", gap: "0.45rem" }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "1.85rem",
            letterSpacing: "-0.01em",
            color: "#0b1f33",
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{subtitle}</p>
        ) : null}
      </header>

      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg
          role="img"
          aria-label={`${title} chart`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="chart-fill-default" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#205493" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#205493" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {showGrid &&
            new Array(4).fill(null).map((_, index) => {
              const position = 100 - (index + 1) * 20;
              return (
                <line
                  key={`grid-${index}`}
                  x1={0}
                  y1={position}
                  x2={100}
                  y2={position}
                  stroke="rgba(24, 76, 140, 0.08)"
                  strokeWidth={0.5}
                />
              );
            })}

          <g>
            {bars.map((bar, index) => (
              <rect
                key={`bar-${index}`}
                x={Math.max(bar.x, 0)}
                y={100 - bar.height - 6}
                width={Math.max(bar.width, 2)}
                height={bar.height}
                rx={1.8}
                fill="rgba(31,157,119,0.32)"
              />
            ))}
          </g>

          <path d={areaPath} fill={accent.fill} />
          <path d={linePath} fill="none" stroke={accent.stroke} strokeWidth={1.6} />
        </svg>
      </div>

      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
          {labels.map((label, index) => (
            <div key={label + index} style={{ display: "grid", gap: "0.3rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(12, 34, 56, 0.6)",
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
              <span style={{ fontWeight: 600, color: "#0b1f33" }}>{data[index]?.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Peak value: <strong style={{ color: "#0b1f33" }}>{maxValue.toLocaleString()}</strong>
        </div>
      </footer>
    </section>
  );
};

export default AreaBarChart;
