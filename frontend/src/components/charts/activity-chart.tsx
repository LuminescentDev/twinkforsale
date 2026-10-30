import { component$, useId } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface ActivityChartProps {
  /** Chronological points, oldest first. */
  data: SeriesPoint[];
  /** What the series measures, e.g. "Views". Used in the axis and readout. */
  seriesLabel: string;
  /** States the period explicitly, e.g. "Last 30 days". */
  rangeLabel: string;
  /** Second series drawn in a quieter tone, e.g. downloads against views. */
  compare?: SeriesPoint[];
  compareLabel?: string;
  height?: number;
  class?: string;
}

// The plot stretches horizontally (preserveAspectRatio="none"), which would
// distort SVG text, so axis labels are HTML laid over a fixed-height plot.
const PAD_T = 8;
const PAD_B = 20;
const VIEW_W = 720;

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function pathFor(
  data: SeriesPoint[],
  max: number,
  innerW: number,
  innerH: number,
): string {
  if (data.length === 0) return "";
  return data
    .map((d, i) => {
      const x =
        data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW;
      const y = PAD_T + (1 - d.value / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function shortDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * One clearly labelled time series. Axis, units and range are stated in text,
 * and the exact totals sit next to the chart rather than being read off it.
 * A table of the same values is exposed to assistive technology.
 */
export const ActivityChart = component$<ActivityChartProps>(
  ({
    data,
    seriesLabel,
    rangeLabel,
    compare,
    compareLabel,
    height = 200,
    class: className,
  }) => {
    const gradientId = useId();

    if (!data || data.length === 0) {
      return (
        <div
          class={cn(
            "border-edge rounded-surface text-ink-muted flex items-center justify-center border border-dashed text-[13px]",
            className,
          )}
          style={`height:${height}px`}
        >
          No activity recorded in this period.
        </div>
      );
    }

    const innerW = VIEW_W;
    const innerH = height - PAD_T - PAD_B;
    const peak = Math.max(
      ...data.map((d) => d.value),
      ...(compare ?? []).map((d) => d.value),
      1,
    );
    const max = niceMax(peak);

    const line = pathFor(data, max, innerW, innerH);
    const area = `${line} L${innerW},${(PAD_T + innerH).toFixed(1)} L0,${(PAD_T + innerH).toFixed(1)} Z`;
    const compareLine = compare?.length
      ? pathFor(compare, max, innerW, innerH)
      : null;

    const gridRatios = [0, 0.5, 1];

    return (
      <div class={cn("min-w-0", className)}>
        <div class="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="text-ink-muted flex items-center gap-1.5 text-xs">
            <span class="bg-accent h-0.5 w-4 rounded-full" aria-hidden="true" />
            {seriesLabel}
          </span>
          {compareLine && compareLabel && (
            <span class="text-ink-muted flex items-center gap-1.5 text-xs">
              <span
                class="bg-ink-muted h-0.5 w-4 rounded-full opacity-70"
                aria-hidden="true"
              />
              {compareLabel}
            </span>
          )}
          <span class="text-ink-muted ml-auto text-xs">{rangeLabel}</span>
        </div>

        <div
          class="text-ink-muted relative pr-2 pl-[34px] text-[10px] tabular-nums"
          style={`height:${height}px`}
        >
          {gridRatios.map((ratio) => (
            <span
              key={ratio}
              aria-hidden="true"
              class="absolute left-0 w-7 -translate-y-1/2 text-right leading-none"
              style={`top:${PAD_T + ratio * innerH}px`}
            >
              {Math.round(max * (1 - ratio))}
            </span>
          ))}
          <svg
            viewBox={`0 0 ${VIEW_W} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-label={`${seriesLabel}, ${rangeLabel}. Peak ${peak}.`}
            preserveAspectRatio="none"
            class="block overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stop-color="var(--ui-accent)"
                  stop-opacity="0.16"
                />
                <stop
                  offset="100%"
                  stop-color="var(--ui-accent)"
                  stop-opacity="0"
                />
              </linearGradient>
            </defs>

            {gridRatios.map((ratio) => {
              const y = PAD_T + ratio * innerH;
              return (
                <line
                  key={ratio}
                  x1={0}
                  y1={y}
                  x2={innerW}
                  y2={y}
                  stroke="var(--ui-edge)"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              );
            })}

            <path d={area} fill={`url(#${gradientId})`} />
            {compareLine && (
              <path
                d={compareLine}
                fill="none"
                stroke="var(--ui-ink-muted)"
                stroke-width="1.5"
                stroke-dasharray="4 3"
                stroke-opacity="0.7"
                vector-effect="non-scaling-stroke"
              />
            )}
            <path
              d={line}
              fill="none"
              stroke="var(--ui-accent)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <span aria-hidden="true" class="absolute bottom-1 left-[34px]">
            {shortDate(data[0].date)}
          </span>
          <span aria-hidden="true" class="absolute right-2 bottom-1">
            {shortDate(data[data.length - 1].date)}
          </span>
        </div>

        {/* The same numbers, reachable without reading the drawing. */}
        <details class="mt-2">
          <summary class="focus-ring text-ink-muted hover:text-ink cursor-pointer text-xs">
            Show values as a table
          </summary>
          <div class="border-edge rounded-surface mt-2 max-h-56 overflow-auto border">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-subtle border-edge sticky top-0 border-b">
                <tr>
                  <th
                    scope="col"
                    class="text-ink-muted px-2.5 py-1.5 font-medium"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="text-ink-muted px-2.5 py-1.5 font-medium"
                  >
                    {seriesLabel}
                  </th>
                  {compareLine && compareLabel && (
                    <th
                      scope="col"
                      class="text-ink-muted px-2.5 py-1.5 font-medium"
                    >
                      {compareLabel}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={d.date} class="border-edge border-b last:border-b-0">
                    <td class="text-ink-muted px-2.5 py-1">
                      {shortDate(d.date)}
                    </td>
                    <td class="text-ink px-2.5 py-1 tabular-nums">{d.value}</td>
                    {compareLine && compareLabel && (
                      <td class="text-ink px-2.5 py-1 tabular-nums">
                        {compare?.[i]?.value ?? 0}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    );
  },
);

export interface HourHistogramProps {
  data: { hour: number; count: number }[];
  class?: string;
}

/** 24-bar histogram of activity by hour of day. */
export const HourHistogram = component$<HourHistogramProps>(
  ({ data, class: className }) => {
    const byHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: data.find((d) => d.hour === hour)?.count ?? 0,
    }));
    const max = Math.max(...byHour.map((d) => d.count), 1);

    return (
      <div class={cn("min-w-0", className)}>
        <ol class="flex h-24 items-end gap-[3px]">
          {byHour.map((d) => (
            <li
              key={d.hour}
              class="flex h-full flex-1 items-end"
              title={`${String(d.hour).padStart(2, "0")}:00 — ${d.count} views`}
            >
              <span
                class={cn(
                  "w-full rounded-t-[2px]",
                  d.count > 0 ? "bg-accent" : "bg-surface-subtle",
                )}
                style={`height:${Math.max(2, (d.count / max) * 100)}%`}
              >
                <span class="sr-only">
                  {String(d.hour).padStart(2, "0")}:00 — {d.count} views
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div class="text-ink-muted mt-1 flex justify-between text-[11px]">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>
    );
  },
);
