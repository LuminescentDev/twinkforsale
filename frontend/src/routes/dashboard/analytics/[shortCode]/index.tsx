import { component$, $ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import {
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
} from "lucide-icons-qwik";
import {
  ActivityChart,
  HourHistogram,
} from "~/components/charts/activity-chart";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import { fileTypeLabel, formatAbsoluteDate } from "~/lib/file-kinds";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  Button,
  CopyButton,
  SummaryList,
  DefinitionRow,
  EmptyState,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  TdMeta,
} from "~/components/ui";

export const useFileAnalytics = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const shortCode = requestEvent.params.shortCode;

  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  // The endpoint enforces ownership and 404s for files the user does not own.
  const detail = await api.analytics.upload(shortCode, auth).catch(() => null);
  if (!detail) {
    throw requestEvent.redirect(302, "/dashboard");
  }

  return {
    upload: detail.upload,
    analytics: detail.analytics,
    viewLogs: detail.viewLogs,
    downloadLogs: detail.downloadLogs,
    referrerStats: detail.referrerStats,
    deviceStats: detail.deviceStats,
    hourlyActivity: detail.hourlyActivity,
    totalViews: detail.totalViews,
    totalDownloads: detail.totalDownloads,
    origin: detail.origin || requestEvent.url.origin,
  };
});

const deviceIcon = (device: string) => {
  switch (device) {
    case "Mobile":
      return Smartphone;
    case "Tablet":
      return Tablet;
    case "Desktop":
      return Monitor;
    default:
      return Globe;
  }
};

export default component$(() => {
  const data = useFileAnalytics();
  const { upload } = data.value;

  const uniqueVisitors = new Set(
    data.value.viewLogs.map((log) => log.ipAddress).filter(Boolean),
  ).size;

  const fileUrl = `${data.value.origin}/f/${upload.shortCode}`;

  const exportJson = $(() => {
    const payload = {
      file: {
        name: upload.originalName,
        size: upload.size,
        type: upload.mimeType,
        uploadedAt: upload.createdAt,
        shortCode: upload.shortCode,
      },
      summary: {
        totalViews: data.value.totalViews,
        totalDownloads: data.value.totalDownloads,
        uniqueVisitors,
        lastViewed: upload.lastViewed,
      },
      dailyAnalytics: data.value.analytics,
      referrerStats: data.value.referrerStats,
      deviceStats: data.value.deviceStats,
      hourlyActivity: data.value.hourlyActivity,
      recentViews: data.value.viewLogs,
      recentDownloads: data.value.downloadLogs,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${upload.shortCode}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const views = data.value.analytics.map((d) => ({
    date: d.date,
    value: d.totalViews,
  }));
  const downloads = data.value.analytics.map((d) => ({
    date: d.date,
    value: d.totalDownloads,
  }));

  const referrers = Object.entries(data.value.referrerStats).sort(
    (a, b) => b[1] - a[1],
  );
  const devices = Object.entries(data.value.deviceStats).sort(
    (a, b) => b[1] - a[1],
  );
  const deviceTotal = devices.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <Page>
      <PageHeader title={upload.originalName} plainTitle>
        <div q:slot="actions" class="flex flex-wrap gap-2">
          <CopyButton
            value={fileUrl}
            label="Copy link"
            variant="secondary"
            size="md"
          />
          <Button variant="secondary" href={`/f/${upload.shortCode}`} external>
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
            Open file
          </Button>
          <Button variant="ghost" onClick$={exportJson}>
            Export JSON
          </Button>
        </div>
      </PageHeader>

      <SummaryList
        label="File totals"
        class="mb-5"
        items={[
          { label: "Views", value: data.value.totalViews.toLocaleString() },
          {
            label: "Downloads",
            value: data.value.totalDownloads.toLocaleString(),
          },
          {
            label: "Unique visitors",
            value: uniqueVisitors.toLocaleString(),
            note: "by IP address",
          },
          {
            label: "Last viewed",
            value: upload.lastViewed
              ? formatAbsoluteDate(upload.lastViewed)
              : "Never",
          },
        ]}
      />

      <Section title="Views over time" class="mb-6">
        <Surface>
          <ActivityChart
            data={views}
            compare={downloads}
            compareLabel="Downloads"
            seriesLabel="Views"
            rangeLabel="Last 30 days"
            height={220}
          />
        </Surface>
      </Section>

      <div class="mb-6 grid gap-5 lg:grid-cols-3">
        <Section title="File details" class="lg:col-span-1">
          <Surface>
            <dl class="divide-edge divide-y">
              <DefinitionRow term="Type">
                {fileTypeLabel(upload.mimeType)}
              </DefinitionRow>
              <DefinitionRow term="Size">
                {formatBytes(upload.size, 1)}
              </DefinitionRow>
              <DefinitionRow term="Short code">
                <span class="font-mono">/{upload.shortCode}</span>
              </DefinitionRow>
              <DefinitionRow term="Uploaded">
                {formatAbsoluteDate(upload.createdAt)}
              </DefinitionRow>
              <DefinitionRow term="Last downloaded">
                {upload.lastDownloaded
                  ? formatAbsoluteDate(upload.lastDownloaded)
                  : "Never"}
              </DefinitionRow>
            </dl>
          </Surface>
        </Section>

        <Section title="Activity by hour" class="lg:col-span-2">
          <Surface>
            <HourHistogram data={data.value.hourlyActivity} />
          </Surface>
        </Section>
      </div>

      <div class="grid gap-5 lg:grid-cols-2">
        <Section title="Referrers">
          <Surface flush class="overflow-hidden">
            {referrers.length === 0 ? (
              <EmptyState
                size="inline"
                title="No referrers recorded"
                description="Views arrived without a referring page."
              />
            ) : (
              <ul class="divide-edge divide-y">
                {referrers.slice(0, 8).map(([referrer, count]) => (
                  <li
                    key={referrer}
                    class="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span class="text-ink min-w-0 truncate text-[13px]">
                      {referrer || "Direct"}
                    </span>
                    <span class="text-ink-muted shrink-0 text-xs tabular-nums">
                      {count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </Section>

        <Section title="Devices">
          <Surface flush class="overflow-hidden">
            {devices.length === 0 ? (
              <EmptyState size="inline" title="No device data recorded" />
            ) : (
              <ul class="divide-edge divide-y">
                {devices.map(([device, count]) => {
                  const Icon = deviceIcon(device);
                  const pct = Math.round((count / deviceTotal) * 100);
                  return (
                    <li key={device} class="flex items-center gap-3 px-3 py-2">
                      <Icon
                        class="text-ink-muted h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span class="text-ink min-w-0 flex-1 truncate text-[13px]">
                        {device}
                      </span>
                      <span class="text-ink-muted shrink-0 text-xs tabular-nums">
                        {count.toLocaleString()} · {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Surface>
        </Section>
      </div>

      <Section title="Recent views" class="mt-6">
        <Surface flush class="overflow-hidden">
          {data.value.viewLogs.length === 0 ? (
            <EmptyState
              size="inline"
              title="No views yet"
              description="Share the link and views will appear here."
            />
          ) : (
            <Table label="Recent views" minWidth="680px">
              <Thead>
                <Tr hover={false}>
                  <Th class="w-40">When</Th>
                  <Th class="w-36">IP address</Th>
                  <Th>Browser</Th>
                  <Th class="w-48">Referrer</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.value.viewLogs.slice(0, 25).map((log, i) => (
                  <Tr key={i}>
                    <TdMeta>{formatAbsoluteDate(log.viewedAt)}</TdMeta>
                    <TdMeta class="font-mono">{log.ipAddress}</TdMeta>
                    <Td class="max-w-0">
                      <span class="block truncate" title={log.userAgent ?? ""}>
                        {log.userAgent || "Unknown"}
                      </span>
                    </Td>
                    <TdMeta class="max-w-0">
                      <span class="block truncate">
                        {log.referer || "Direct"}
                      </span>
                    </TdMeta>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Surface>
      </Section>
    </Page>
  );
});

export const head: DocumentHead = ({ params }) => ({
  title: `Analytics for /${params.shortCode} - twink.forsale`,
  meta: [
    {
      name: "description",
      content: "Views, downloads and referrers for a single file.",
    },
  ],
});
