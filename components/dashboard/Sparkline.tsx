"use client";

import { useId, useMemo } from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  thickness?: number;
  gradient?: {
    from: string;
    to: string;
  };
  ariaLabel?: string;
  smooth?: boolean;
};

const buildPath = (data: number[], width: number, height: number, smooth: boolean) => {
  if (data.length === 0) {
    return { linePath: "", areaPath: "" };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const verticalRange = max - min || 1;
  const horizontalStep = data.length === 1 ? 0 : width / (data.length - 1);

  const points = data.map((value, index) => {
    const x = index * horizontalStep;
    const normalized = (value - min) / verticalRange;
    const y = height - normalized * height;
    return { x, y };
  });

  if (!smooth || points.length < 3) {
    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");

    const areaPath = `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z`;

    return { linePath, areaPath };
  }

  const createSegment = (current: { x: number; y: number }, previous: { x: number; y: number }, next: { x: number; y: number }, next2: { x: number; y: number }) => {
    const tension = 0.2;
    const controlPoint1X = current.x + ((next.x - previous.x) / 6) * tension;
    const controlPoint1Y = current.y + ((next.y - previous.y) / 6) * tension;
    const controlPoint2X = next.x - ((next2.x - current.x) / 6) * tension;
    const controlPoint2Y = next.y - ((next2.y - current.y) / 6) * tension;

    return `C${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${next.x},${next.y}`;
  };

  let linePath = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const previous = points[i - 1] ?? current;
    const next2 = points[i + 2] ?? next;

    linePath += ` ${createSegment(current, previous, next, next2)}`;
  }

  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z`;

  return { linePath, areaPath };
};

export const Sparkline = ({
  data,
  width = 140,
  height = 56,
  stroke = "#184c8c",
  thickness = 3,
  gradient,
  ariaLabel,
  smooth = true,
}: SparklineProps) => {
  const gradientId = useId();

  const { linePath, areaPath } = useMemo(() => buildPath(data, width, height, smooth), [data, height, smooth, width]);

  if (!linePath) {
    return null;
  }

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradient?.from ?? `${stroke}55`} />
          <stop offset="100%" stopColor={gradient?.to ?? `${stroke}00`} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.9} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={thickness} strokeLinecap="round" />
    </svg>
  );
};

export default Sparkline;
