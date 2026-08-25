import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { BarChart3, ServerCrash } from "lucide-icons-qwik";
import { ActivityChart } from "~/components/charts/activity-chart";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import { formatRelativeDate, fileTypeLabel } from "~/lib/file-kinds";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  Button,
  SummaryList,
  EmptyState,
  Callout,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  TdMeta,
} from "~/components/ui";

export const useAnalyticsOverview = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const overview = await api.analytics.overview(auth).catch(() => null);

  return {
    loadFailed: overview === null,
    userAnalytics: overview?.userAnalytics ?? [],
    topUploads: overview?.topUploadsAnalytics ?? [],
    summary: {
      totalFiles: overview?.summary.totalFiles ?? 0,
      totalViews: overview?.summary.totalViews ?? 0,
      totalDownloads: overview?.summary.totalDownloads ?? 0,
    },
  };
});

export default component$(() => {
  const data = useAnalyticsOverview();
  const { summary, userAnalytics, topUploads } = data.value;

  const series = userAnalytics.map((d) => ({
    date: d.date,
    value: d.totalViews,
  }));
  const downloadSeries = userAnalytics.map((d) => ({
    date: d.date,
    value: d.totalDownloads,
  }));

  const periodViews = userAnalytics.reduce((sum, d) => sum + d.totalViews, 0);

  return (
    <Page>
      <PageHeader title="Analytics" />

      {data.value.loadFailed ? (
        <Surface flush>
          <EmptyState
            icon={ServerCrash}
            title="Analytics unavailable"
            description="We could not reach the server. Reload the page to try again."
          >
            <Button variant="secondary" onClick$={() => location.reload()}>
              Reload
            </Button>
          </EmptyState>
        </Surface>
      ) : (
        <>
          <SummaryList
            label="Account totals"
            class="mb-5"
            items={[
              { label: "Files", value: summary.totalFiles.toLocaleString() },
              {
                label: "Views",
                value: summary.totalViews.toLocaleString(),
                note: "all time",
              },
              {
                label: "Downloads",
                value: summary.totalDownloads.toLocaleString(),
                note: "all time",
              },
              {
                label: "Views per file",
                value:
                  summary.totalFiles > 0
                    ? Math.round(
                        summary.totalViews / summary.totalFiles,
                      ).toLocaleString()
                    : "0",
                note: "average",
              },
            ]}
          />

          <Section
            title="Views over time"
            description={`${periodViews.toLocaleString()} views in the last 30 days.`}
            class="mb-6"
          >
            <Surface>
              <ActivityChart
                data={series}
                compare={downloadSeries}
                compareLabel="Downloads"
                seriesLabel="Views"
                rangeLabel="Last 30 days"
                height={220}
              />
            </Surface>
          </Section>

          <Section title="Top files" description="Ordered by total views.">
            {topUploads.length === 0 ? (
              <Surface flush>
                <EmptyState
                  icon={BarChart3}
                  size="inline"
                  title="Nothing to compare yet"
                  description="Once your files start receiving views, the busiest ones appear here."
                >
                  <Button variant="secondary" href="/dashboard">
                    Go to Files
                  </Button>
                </EmptyState>
              </Surface>
            ) : (
              <Surface flush class="overflow-hidden">
                <Table label="Top files by views" minWidth="720px">
                  <Thead>
                    <Tr hover={false}>
                      <Th class="w-8 text-right">#</Th>
                      <Th>File</Th>
                      <Th class="w-24">Size</Th>
                      <Th class="w-24">Views</Th>
                      <Th class="w-24">Last 7 days</Th>
                      <Th class="w-28">Downloads</Th>
                      <Th class="w-28">Uploaded</Th>
                      <Th class="w-24 text-right">Details</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {topUploads.map((upload, index) => (
                      <Tr key={upload.id}>
                        <TdMeta class="text-right tabular-nums">
                          {index + 1}
                        </TdMeta>
                        <Td>
                          <p
                            class="text-ink truncate font-medium"
                            title={upload.originalName}
                          >
                            {upload.originalName}
                          </p>
                          <p class="text-ink-muted truncate text-xs">
                            {fileTypeLabel(upload.mimeType)} ·{" "}
                            <span class="font-mono">/{upload.shortCode}</span>
                          </p>
                        </Td>
                        <TdMeta>{formatBytes(upload.size, 1)}</TdMeta>
                        <Td class="tabular-nums">
                          {upload.views.toLocaleString()}
                        </Td>
                        <TdMeta class="tabular-nums">
                          {upload.weeklyViews.toLocaleString()}
                        </TdMeta>
                        <Td class="tabular-nums">
                          {upload.downloads.toLocaleString()}
                        </Td>
                        <TdMeta>{formatRelativeDate(upload.createdAt)}</TdMeta>
                        <Td class="text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            href={`/dashboard/analytics/${upload.shortCode}`}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Surface>
            )}
          </Section>

          {summary.totalFiles === 0 && (
            <Callout tone="info" class="mt-5">
              Analytics start collecting as soon as your first file is viewed.
            </Callout>
          )}
        </>
      )}
    </Page>
  );
});

export const head: DocumentHead = {
  title: "Analytics - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Views and downloads across your files.",
    },
  ],
};
