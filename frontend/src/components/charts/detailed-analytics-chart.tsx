import { component$ } from "@builder.io/qwik";

interface AnalyticsDataPoint {
  date: string;
  totalViews: number;
  uniqueViews: number;
  totalDownloads?: number;
  uniqueDownloads?: number;
}

interface DetailedAnalyticsChartProps {
  data: AnalyticsDataPoint[];
  metric: "totalViews" | "uniqueViews" | "totalDownloads" | "uniqueDownloads";
  height?: number;
  colorTheme?: "primary" | "secondary" | "tertiary";
}

export const DetailedAnalyticsChart = component$<DetailedAnalyticsChartProps>(
  ({ data, metric, height = 200, colorTheme = "primary" }) => {
    if (!data || data.length === 0) {
      return (
        <div
          class="bg-theme-card-border/20 flex items-center justify-center rounded-lg"
          style={{ height: `${height}px` }}
        >
          <p class="text-theme-text-secondary">No data available</p>
        </div>
      );
    }

    const values = data.map((d) => d[metric] || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);

    const chartWidth = 600;
    const chartHeight = height;
    const padding = 40;
    const innerWidth = chartWidth - padding * 2;
    const innerHeight = chartHeight - padding * 2;

    // Generate line path
    const pathPoints = data
      .map((d, index) => {
        const x = padding + (index / (data.length - 1)) * innerWidth;
        const y =
          padding +
          (1 - ((d[metric] || 0) - minValue) / (maxValue - minValue)) *
            innerHeight;
        return `${x},${y}`;
      })
      .join(" ");

    // Generate area path for gradient fill
    const areaPath =
      data.length > 1
        ? `M${padding},${padding + innerHeight} L${pathPoints.replace(/,/g, " L").replace(/L/g, ",")} L${padding + innerWidth},${padding + innerHeight} Z`
        : "";

    // Generate grid lines
    const gridLines = [];
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding + (i / numGridLines) * innerHeight;
      gridLines.push(
        <line
          key={`grid-${i}`}
          x1={padding}
          y1={y}
          x2={padding + innerWidth}
          y2={y}
          stroke="currentColor"
          stroke-width="0.5"
          opacity="0.1"
        />,
      );
    }

    // Get the appropriate CSS classes for the theme
    const getThemeClasses = () => {
      switch (colorTheme) {
        case "primary":
          return {
            stroke: "stroke-theme-accent-primary",
            fill: "fill-theme-accent-primary",
            gradientId: "gradient-theme-accent-primary",
          };
        case "secondary":
          return {
            stroke: "stroke-theme-accent-secondary",
            fill: "fill-theme-accent-secondary",
            gradientId: "gradient-theme-accent-secondary",
          };
        case "tertiary":
          return {
            stroke: "stroke-theme-accent-tertiary",
            fill: "fill-theme-accent-tertiary",
            gradientId: "gradient-theme-accent-tertiary",
          };
        default:
          return {
            stroke: "stroke-theme-primary",
            fill: "fill-theme-text-primary",
            gradientId: "gradient-primary",
          };
      }
    };

    const themeClasses = getThemeClasses();

    return (
      <div class="w-full">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          class="h-auto w-full"
          style={{ height: `${height}px` }}
        >
          {/* Grid lines */}
          <g class="text-theme-text-muted">{gridLines}</g> {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${themeClasses.gradientId})`}
              opacity="0.1"
            />
          )}
          {/* Line */}
          <polyline
            points={pathPoints}
            fill="none"
            class={`${themeClasses.stroke} stroke-2`}
            stroke-linecap="round"
            stroke-linejoin="round"
          />{" "}
          {/* Data points */}
          {data.map((d, index) => {
            const x = padding + (index / (data.length - 1)) * innerWidth;
            const y =
              padding +
              (1 - ((d[metric] || 0) - minValue) / (maxValue - minValue)) *
                innerHeight;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                class={`${themeClasses.fill}  hover:r-5 transition-all duration-200`}
              >
                <title>{`${new Date(d.date).toLocaleDateString()}: ${d[metric] || 0}`}</title>
              </circle>
            );
          })}
          {/* Y-axis labels */}
          <g class="text-theme-text-muted" style="font-size: 12px;">
            {Array.from({ length: numGridLines + 1 }, (_, i) => {
              const value =
                minValue + (maxValue - minValue) * (1 - i / numGridLines);
              const y = padding + (i / numGridLines) * innerHeight;

              return (
                <text
                  key={`y-label-${i}`}
                  x={padding - 10}
                  y={y + 4}
                  text-anchor="end"
                  class="fill-current"
                >
                  {Math.round(value)}
                </text>
              );
            })}
          </g>
          {/* X-axis labels (show first, middle, last) */}
          <g class="text-theme-text-muted" style="font-size: 10px;">
            {[0, Math.floor(data.length / 2), data.length - 1].map((index) => {
              if (index >= data.length) return null;

              const x = padding + (index / (data.length - 1)) * innerWidth;
              const date = new Date(data[index].date);

              return (
                <text
                  key={`x-label-${index}`}
                  x={x}
                  y={chartHeight - 10}
                  text-anchor="middle"
                  class="fill-current"
                >
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </text>
              );
            })}
          </g>{" "}
          {/* Gradient definition */}
          <defs>
            <linearGradient
              id={themeClasses.gradientId}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" class={themeClasses.fill} stop-opacity="0.3" />
              <stop offset="100%" class={themeClasses.fill} stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Chart summary */}
        <div class="mt-4 flex justify-between text-sm">
          <div class="text-theme-text-secondary">
            <span class="font-medium">Min:</span> {minValue}
          </div>
          <div class="text-theme-text-secondary">
            <span class="font-medium">Max:</span> {maxValue}
          </div>
          <div class="text-theme-text-secondary">
            <span class="font-medium">Total:</span>{" "}
            {values.reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>
    );
  },
);
