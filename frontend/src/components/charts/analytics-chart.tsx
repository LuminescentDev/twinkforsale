import { component$ } from "@builder.io/qwik";

interface AnalyticsData {
  date: string;
  totalViews: number;
  uniqueViews: number;
  uploadsCount: number;
  usersRegistered: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  metric: "totalViews" | "uniqueViews" | "uploadsCount" | "usersRegistered";
  title: string;
  color: string;
}

export const AnalyticsChart = component$<AnalyticsChartProps>(
  ({ data, metric, title, color }) => {
    if (!data || data.length === 0) {
      return (
        <div class="py-8 text-center">
          <div class="text-theme-accent-tertiary mb-2">📈</div>
          <p class="text-theme-text-secondary text-sm">No data available</p>
        </div>
      );
    }

    const values = data.map((d) => d[metric]);
    const maxValue = Math.max(...values, 1); // Avoid division by zero
    const chartWidth = 300;
    const chartHeight = 120;
    const padding = 20;
    const innerWidth = chartWidth - padding * 2;
    const innerHeight = chartHeight - padding * 2;

    // Generate path for the line chart
    const points = data
      .map((d, index) => {
        const x = padding + (index / (data.length - 1)) * innerWidth;
        const y = padding + (1 - d[metric] / maxValue) * innerHeight;
        return `${x},${y}`;
      })
      .join(" ");

    // Generate area path (same as line but closed)
    const areaPoints =
      data.length > 0
        ? `M ${padding},${padding + innerHeight} L ${points.split(" ").join(" L ")} L ${padding + innerWidth},${padding + innerHeight} Z`
        : "";

    return (
      <div class="card-cute rounded-2xl p-4">
        <h3 class="text-theme-text-secondary mb-3 flex items-center gap-2 text-sm font-medium">
          <span class="text-lg">📊</span>
          {title}
        </h3>
        <svg width={chartWidth} height={chartHeight} class="w-full">
          {/* Grid lines */}
          <defs>
            <linearGradient
              id={`gradient-${metric}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={`stop-color:${color};stop-opacity:0.3`}
              />
              <stop
                offset="100%"
                style={`stop-color:${color};stop-opacity:0.05`}
              />
            </linearGradient>
          </defs>{" "}
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding}
              y1={padding + ratio * innerHeight}
              x2={padding + innerWidth}
              y2={padding + ratio * innerHeight}
              stroke="var(--theme-card-border)"
              stroke-width="1"
            />
          ))}
          {/* X-axis grid lines */}
          {data.map((_, index) => (
            <line
              key={index}
              x1={padding + (index / (data.length - 1)) * innerWidth}
              y1={padding}
              x2={padding + (index / (data.length - 1)) * innerWidth}
              y2={padding + innerHeight}
              stroke="var(--theme-glass-border)"
              stroke-width="1"
            />
          ))}
          {/* Area fill */}
          {areaPoints && (
            <path d={areaPoints} fill={`url(#gradient-${metric})`} />
          )}
          {/* Line */}
          {data.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke={color}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          )}
          {/* Data points */}
          {data.map((d, index) => {
            const x = padding + (index / (data.length - 1)) * innerWidth;
            const y = padding + (1 - d[metric] / maxValue) * innerHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                stroke="var(--theme-text-primary)"
                stroke-width="2"
                class="hover:r-4 cursor-pointer transition-all duration-200"
              >
                <title>{`${d.date}: ${d[metric]}`}</title>
              </circle>
            );
          })}{" "}
          {/* Y-axis labels */}
          <text
            x={padding - 5}
            y={padding + 5}
            text-anchor="end"
            class="fill-theme-accent-tertiary text-xs"
          >
            {maxValue}
          </text>
          <text
            x={padding - 5}
            y={padding + innerHeight + 5}
            text-anchor="end"
            class="fill-theme-accent-tertiary text-xs"
          >
            0
          </text>
        </svg>{" "}
        {/* Date labels */}
        <div class="mt-2 flex justify-between px-2">
          <span class="text-theme-accent-tertiary text-xs">
            {new Date(data[0]?.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span class="text-theme-accent-tertiary text-xs">
            {new Date(data[data.length - 1]?.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {/* Current value */}
        <div class="mt-2 text-center">
          <span class="text-theme-text-primary text-lg font-bold">
            {data[data.length - 1]?.[metric] || 0}
          </span>
          <span class="text-theme-accent-tertiary ml-1 text-xs">today</span>
        </div>
      </div>
    );
  },
);
