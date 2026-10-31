"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Single-value ring with the number in the middle. */
export function Donut({
  value,
  label,
  size = 76,
  stroke = 13,
  color = "var(--ink)",
  track = "rgb(0 0 0 / 12%)",
}: {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}) {
  const radius = 50 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = ((Math.min(100, value) / 100) * circumference).toFixed(2);

  return (
    <div
      role="img"
      aria-label={`${label}: ${value}%`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx={50} cy={50} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference.toFixed(2)}`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-base font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  );
}

type TrendPoint = { label: string; value: number };

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(coords: { x: number; y: number }[]) {
  return coords.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    const p0 = coords[index - 2] ?? coords[index - 1]!;
    const p1 = coords[index - 1]!;
    const p3 = coords[index + 1] ?? point;
    const c1x = p1.x + (point.x - p0.x) / 6;
    const c1y = p1.y + (point.y - p0.y) / 6;
    const c2x = point.x - (p3.x - p1.x) / 6;
    const c2y = point.y - (p3.y - p1.y) / 6;
    return `${path}C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, "");
}

/**
 * One-series line chart in ink, for use on any pastel. Axis text is HTML so it stays
 * legible while the plot stretches. Every point can be hovered, tapped or tabbed to.
 */
export function TrendChart({
  points,
  label,
  min,
  max,
  ticks,
  format = (value) => `${value}%`,
  className,
}: {
  points: TrendPoint[];
  label: string;
  min: number;
  max: number;
  ticks: number[];
  format?: (value: number) => string;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const shown = active ?? points.length - 1;

  const xAt = (index: number) => (index / (points.length - 1)) * 100;
  const yAt = (value: number) => 100 - ((value - min) / (max - min)) * 100;
  const coords = points.map((point, index) => ({ x: xAt(index), y: yAt(point.value) }));
  const line = smoothPath(coords);
  const area = `${line}L100 100L0 100Z`;
  const current = points[shown]!;
  const nearRight = xAt(shown) > 72;
  const nearLeft = xAt(shown) < 20;

  return (
    <figure
      aria-label={label}
      className={cn("relative h-full min-h-44 w-full", className)}
      onMouseLeave={() => setActive(null)}
    >
      <figcaption className="sr-only">
        {label}: {points.map((point) => `${point.label} ${format(point.value)}`).join(", ")}
      </figcaption>

      <div className="absolute inset-x-0 bottom-6 left-8 right-2 top-2">
        {ticks.map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute -left-8 w-6 -translate-y-1/2 text-right text-[11px] font-medium tabular-nums text-ink/70"
            style={{ top: `${yAt(tick)}%` }}
          >
            {tick}
          </span>
        ))}

        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          {ticks.map((tick) => (
            <line
              key={tick}
              x1={0}
              x2={100}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="rgb(0 0 0 / 14%)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill="rgb(27 27 34 / 10%)" />
          <path
            d={line}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Crosshair, marker and readout for the active point */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-ink/50"
          style={{ left: `${xAt(shown)}%` }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink"
          style={{ left: `${xAt(shown)}%`, top: `${yAt(current.value)}%` }}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-10 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white tabular-nums",
            nearRight ? "-translate-x-full" : nearLeft ? "" : "-translate-x-1/2"
          )}
          style={{
            left: `${xAt(shown)}%`,
            top: `calc(${yAt(current.value)}% ${yAt(current.value) < 25 ? "+ 12px" : "- 34px"})`,
          }}
        >
          {current.label} · {format(current.value)}
        </div>

        {points.map((point, index) => {
          const width = 100 / (points.length - 1);
          return (
            <button
              key={point.label}
              type="button"
              aria-label={`${point.label}: ${format(point.value)}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              className="absolute inset-y-0 cursor-crosshair rounded-lg focus-visible:outline-2 focus-visible:outline-ink"
              style={{ left: `${Math.max(0, xAt(index) - width / 2)}%`, width: `${width}%` }}
            />
          );
        })}

        {points.map((point, index) => (
          <span
            key={point.label}
            aria-hidden
            className={cn(
              "absolute -bottom-6 -translate-x-1/2 text-[11px] font-medium text-ink/70",
              index === 0 && "translate-x-0",
              index === points.length - 1 && "-translate-x-full"
            )}
            style={{ left: `${xAt(index)}%` }}
          >
            {point.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

export type BarItem = { label: string; value: number; display?: string };

/** Horizontal bars with the value at the tip. */
export function BarList({
  items,
  label,
  max = 100,
  barClassName = "bg-ink",
}: {
  items: BarItem[];
  label: string;
  max?: number;
  barClassName?: string;
}) {
  return (
    <ul aria-label={label} className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3 text-sm">
          <span className="truncate font-medium">{item.label}</span>
          <span className="h-3.5 overflow-hidden rounded-full bg-black/[0.07]">
            <span
              className={cn("block h-full rounded-full transition-[width] duration-500", barClassName)}
              style={{ width: `${Math.max(2, Math.min(100, (item.value / max) * 100))}%` }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{item.display ?? item.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns with the value on the cap. */
export function ColumnChart({
  items,
  label,
  columnClassName = "bg-ink",
}: {
  items: BarItem[];
  label: string;
  columnClassName?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div
      role="img"
      aria-label={`${label}: ${items.map((item) => `${item.label} ${item.value}`).join(", ")}`}
      className="flex h-48 items-end gap-2 sm:gap-3"
    >
      {items.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-semibold tabular-nums">{item.display ?? item.value}</span>
          <div
            className={cn("w-full max-w-6 rounded-t-full transition-[height] duration-500", columnClassName)}
            style={{ height: `${Math.max(3, (item.value / max) * 78)}%` }}
          />
          <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
