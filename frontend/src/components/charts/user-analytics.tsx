import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { getUserAnalytics } from "~/lib/analytics";
interface UserAnalyticsProps {
  userId: string;
  userName: string;
}

const fetchUserAnalytics = server$(async function (
  userId: string,
  days: number = 7,
) {
  try {
    return await getUserAnalytics(userId, days);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return [];
  }
});

export const UserAnalytics = component$<UserAnalyticsProps>(
  ({ userId, userName }) => {
    const analyticsData = useSignal<any[]>([]);
    const isLoading = useSignal(true);
    const isExpanded = useSignal(false);

    useTask$(async ({ track }) => {
      track(() => isExpanded.value);

      if (isExpanded.value && analyticsData.value.length === 0) {
        try {
          const data = await fetchUserAnalytics(userId, 7);
          analyticsData.value = data;
        } catch (error) {
          console.error("Error fetching user analytics:", error);
          analyticsData.value = [];
        } finally {
          isLoading.value = false;
        }
      }
    });

    const chartWidth = 80;
    const chartHeight = 24;
    const padding = 2;

    const generateMiniChart = (
      metric: "totalViews" | "uniqueViews" | "uploadsCount",
    ) => {
      if (analyticsData.value.length === 0) return "";

      const values = analyticsData.value.map((d) => d[metric]);
      const maxValue = Math.max(...values, 1);
      const innerWidth = chartWidth - padding * 2;
      const innerHeight = chartHeight - padding * 2;

      const points = analyticsData.value
        .map((d, index) => {
          const x =
            padding + (index / (analyticsData.value.length - 1)) * innerWidth;
          const y = padding + (1 - d[metric] / maxValue) * innerHeight;
          return `${x},${y}`;
        })
        .join(" ");

      return points;
    };

    return (
      <details class="group mt-3" open={isExpanded.value}>
        {" "}
        <summary
          class="text-theme-accent-primary hover:text-theme-text-primary flex cursor-pointer items-center gap-1 text-xs font-medium"
          onClick$={() => {
            isExpanded.value = !isExpanded.value;
          }}
        >
          <span class="transition-transform group-open:rotate-90">▶</span>
          📊 Analytics for {userName}
        </summary>
        <div class="glass border-theme-card-border mt-3 rounded-xl border p-3">
          {" "}
          {isLoading.value ? (
            <div class="py-4 text-center">
              <div class="border-theme-accent mx-auto mb-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              <p class="text-theme-text-secondary text-xs">Loading analytics...</p>
            </div>
          ) : analyticsData.value.length > 0 ? (
            <div class="space-y-3">
              {/* Mini Charts */}
              <div class="grid grid-cols-3 gap-2">
                {" "}
                {/* Views Chart */}
                <div class="text-center">
                  <div class="text-theme-accent-primary mb-1 text-xs">Views</div>
                  <svg
                    width={chartWidth}
                    height={chartHeight}
                    class="border-theme-card-border w-full rounded border bg-black/20"
                  >
                    <polyline
                      points={generateMiniChart("totalViews")}
                      fill="none"
                      stroke="var(--theme-primary)"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    {analyticsData.value.map((d, index) => {
                      const values = analyticsData.value.map(
                        (item) => item.totalViews,
                      );
                      const maxValue = Math.max(...values, 1);
                      const x =
                        padding +
                        (index / (analyticsData.value.length - 1)) *
                          (chartWidth - padding * 2);
                      const y =
                        padding +
                        (1 - d.totalViews / maxValue) *
                          (chartHeight - padding * 2);
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="1"
                          fill="var(--theme-primary)"
                        />
                      );
                    })}
                  </svg>
                  <div class="text-theme-text-primary text-xs font-medium">
                    {analyticsData.value[analyticsData.value.length - 1]
                      ?.totalViews || 0}
                  </div>
                </div>
                {/* Unique Views Chart */}
                <div class="text-center">
                  <div class="text-theme-accent-primary mb-1 text-xs">Unique</div>
                  <svg
                    width={chartWidth}
                    height={chartHeight}
                    class="border-theme-card-border w-full rounded border bg-black/20"
                  >
                    <polyline
                      points={generateMiniChart("uniqueViews")}
                      fill="none"
                      stroke="var(--theme-secondary)"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    {analyticsData.value.map((d, index) => {
                      const values = analyticsData.value.map(
                        (item) => item.uniqueViews,
                      );
                      const maxValue = Math.max(...values, 1);
                      const x =
                        padding +
                        (index / (analyticsData.value.length - 1)) *
                          (chartWidth - padding * 2);
                      const y =
                        padding +
                        (1 - d.uniqueViews / maxValue) *
                          (chartHeight - padding * 2);
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="1"
                          fill="var(--theme-secondary)"
                        />
                      );
                    })}
                  </svg>
                  <div class="text-theme-text-primary text-xs font-medium">
                    {analyticsData.value[analyticsData.value.length - 1]
                      ?.uniqueViews || 0}
                  </div>
                </div>
                {/* Uploads Chart */}
                <div class="text-center">
                  <div class="text-theme-accent-primary mb-1 text-xs">Uploads</div>
                  <svg
                    width={chartWidth}
                    height={chartHeight}
                    class="border-theme-card-border w-full rounded border bg-black/20"
                  >
                    {" "}
                    <polyline
                      points={generateMiniChart("uploadsCount")}
                      fill="none"
                      stroke="var(--theme-accent)"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    {analyticsData.value.map((d, index) => {
                      const values = analyticsData.value.map(
                        (item) => item.uploadsCount,
                      );
                      const maxValue = Math.max(...values, 1);
                      const x =
                        padding +
                        (index / (analyticsData.value.length - 1)) *
                          (chartWidth - padding * 2);
                      const y =
                        padding +
                        (1 - d.uploadsCount / maxValue) *
                          (chartHeight - padding * 2);
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="1"
                          fill="var(--theme-accent)"
                        />
                      );
                    })}
                  </svg>
                  <div class="text-theme-text-primary text-xs font-medium">
                    {analyticsData.value[analyticsData.value.length - 1]
                      ?.uploadsCount || 0}
                  </div>
                </div>
              </div>{" "}
              {/* Summary Stats */}
              <div class="border-theme-card-border border-t pt-2">
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <div class="text-center">
                    <div class="text-theme-accent-primary">Total (7d)</div>
                    <div class="text-theme-text-primary font-medium">
                      {analyticsData.value.reduce(
                        (sum, d) => sum + d.totalViews,
                        0,
                      )}{" "}
                      views
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-theme-accent-primary">Avg Daily</div>
                    <div class="text-theme-text-primary font-medium">
                      {Math.round(
                        analyticsData.value.reduce(
                          (sum, d) => sum + d.totalViews,
                          0,
                        ) / 7,
                      )}{" "}
                      views
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-theme-accent-primary">Peak Day</div>
                    <div class="text-theme-text-primary font-medium">
                      {Math.max(
                        ...analyticsData.value.map((d) => d.totalViews),
                      )}{" "}
                      views
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div class="py-4 text-center">
              <div class="text-theme-accent-primary mb-2">📊</div>
              <p class="text-theme-text-secondary text-xs">
                No recent activity for {userName}
              </p>
            </div>
          )}
        </div>
      </details>
    );
  },
);
