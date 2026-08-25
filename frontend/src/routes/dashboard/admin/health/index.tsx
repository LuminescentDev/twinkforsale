import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { ServerCrash, CheckCircle2, AlertTriangle } from "lucide-icons-qwik";
import { api, serverAuth, type EventDto } from "~/lib/api-client";
import { formatBytes } from "~/lib/utils";
import {
  formatRelativeDate,
  formatAbsoluteDate,
  normalizeSeverity,
  severityLabel,
  type Severity,
} from "~/lib/file-kinds";
import {
  PageHeader,
  Section,
  Surface,
  Button,
  Switch,
  Badge,
  Callout,
  EmptyState,
  SummaryList,
  DefinitionRow,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  TdMeta,
  type BadgeTone,
} from "~/components/ui";

export const useHealthData = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  try {
    const [health, usersRes, eventsRes] = await Promise.all([
      api.admin.health(auth).catch(() => null),
      api.admin.users(auth).catch(() => ({ users: [] })),
      api.admin.events(auth).catch(() => ({ events: [] as EventDto[] })),
    ]);

    const users = usersRes.users ?? [];
    const totalUsers = users.length;
    const approvedUsers = users.filter((u) => u.isApproved).length;
    const totalSize = users.reduce((s, u) => s + Number(u.storageUsed), 0);
    const totalFiles = users.reduce((s, u) => s + u.uploads, 0);

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stats = { critical: 0, error: 0, warning: 0, info: 0, other: 0 };
    for (const e of eventsRes.events) {
      if (new Date(e.createdAt).getTime() >= cutoff) {
        stats[normalizeSeverity(e.severity)]++;
      }
    }

    const topUsers = [...users]
      .sort((a, b) => b.uploads - a.uploads)
      .slice(0, 5)
      .map((u) => ({
        name: u.name || "Unnamed",
        email: u.email,
        totalUploads: u.uploads,
        storageUsed: Number(u.storageUsed),
      }));

    return {
      failed: false,
      databaseReachable: Boolean(health?.databaseReachable),
      checkedAt: health?.checkedAtUtc ?? new Date().toISOString(),
      storage: { totalFiles, totalSize },
      users: {
        total: totalUsers,
        approved: approvedUsers,
        pending: totalUsers - approvedUsers,
      },
      severity: stats,
      recentEvents: eventsRes.events.slice(0, 12),
      topUsers,
    };
  } catch {
    return {
      failed: true,
      databaseReachable: false,
      checkedAt: new Date().toISOString(),
      storage: { totalFiles: 0, totalSize: 0 },
      users: { total: 0, approved: 0, pending: 0 },
      severity: { critical: 0, error: 0, warning: 0, info: 0, other: 0 },
      recentEvents: [] as EventDto[],
      topUsers: [] as {
        name: string;
        email: string;
        totalUploads: number;
        storageUsed: number;
      }[],
    };
  }
});

const severityTone: Record<Severity, BadgeTone> = {
  critical: "error",
  error: "error",
  warning: "warning",
  info: "info",
  other: "neutral",
};

export default component$(() => {
  const data = useHealthData();
  const autoRefresh = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    if (!track(() => autoRefresh.value)) return;
    const interval = setInterval(() => window.location.reload(), 30_000);
    cleanup(() => clearInterval(interval));
  });

  if (data.value.failed) {
    return (
      <>
        <PageHeader title="Health" />
        <Surface flush>
          <EmptyState
            icon={ServerCrash}
            title="Health data unavailable"
            description="The server did not respond. Reload the page to try again."
          >
            <Button variant="secondary" onClick$={() => location.reload()}>
              Reload
            </Button>
          </EmptyState>
        </Surface>
      </>
    );
  }

  const problems = data.value.severity.critical + data.value.severity.error;

  return (
    <>
      <PageHeader
        title="Health"
        description={`Last checked ${formatAbsoluteDate(data.value.checkedAt)}.`}
      >
        <div q:slot="actions" class="flex items-center gap-3">
          <Switch
            checked={autoRefresh.value}
            label="Refresh every 30s"
            onChange$={(checked) => (autoRefresh.value = checked)}
          />
          <Button variant="secondary" onClick$={() => location.reload()}>
            Refresh now
          </Button>
        </div>
      </PageHeader>

      {data.value.databaseReachable ? (
        problems > 0 ? (
          <Callout
            tone="warning"
            title="Service reachable, with recent problems"
            class="mb-4"
          >
            {problems} error or critical event{problems === 1 ? "" : "s"} in the
            last 24 hours. Check the event log for details.
            <Button
              q:slot="actions"
              size="sm"
              variant="secondary"
              href="/dashboard/admin/events"
            >
              View events
            </Button>
          </Callout>
        ) : (
          <Callout tone="success" title="All checks passing" class="mb-4">
            The database is reachable and no errors were recorded in the last 24
            hours.
          </Callout>
        )
      ) : (
        <Callout tone="danger" title="Database unreachable" class="mb-4">
          The API could not reach the database. Uploads, sign-in and analytics
          will be failing.
        </Callout>
      )}

      <SummaryList
        label="Service totals"
        class="mb-5"
        items={[
          { label: "Accounts", value: data.value.users.total },
          {
            label: "Awaiting approval",
            value: data.value.users.pending,
          },
          {
            label: "Files stored",
            value: data.value.storage.totalFiles.toLocaleString(),
          },
          {
            label: "Storage used",
            value: formatBytes(data.value.storage.totalSize, 1),
          },
        ]}
      />

      <div class="mb-6 grid gap-5 lg:grid-cols-2">
        <Section title="Checks">
          <Surface>
            <dl class="divide-edge divide-y">
              <DefinitionRow term="Database">
                <span class="flex items-center gap-1.5">
                  {data.value.databaseReachable ? (
                    <>
                      <CheckCircle2
                        class="text-success h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Reachable
                    </>
                  ) : (
                    <>
                      <AlertTriangle
                        class="text-danger h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Unreachable
                    </>
                  )}
                </span>
              </DefinitionRow>
              <DefinitionRow term="Approved accounts">
                {data.value.users.approved} of {data.value.users.total}
              </DefinitionRow>
              <DefinitionRow term="Errors (24h)">
                {data.value.severity.error + data.value.severity.critical}
              </DefinitionRow>
              <DefinitionRow term="Warnings (24h)">
                {data.value.severity.warning}
              </DefinitionRow>
            </dl>
            <p class="text-ink-muted mt-3 text-xs">
              Host-level metrics such as CPU, memory and disk are not exposed by
              the API, so they are not reported here.
            </p>
          </Surface>
        </Section>

        <Section title="Busiest accounts" description="By total files stored.">
          <Surface flush class="overflow-hidden">
            {data.value.topUsers.length === 0 ? (
              <EmptyState size="inline" title="No accounts yet" />
            ) : (
              <Table label="Busiest accounts" minWidth="380px">
                <Thead>
                  <Tr hover={false}>
                    <Th>Account</Th>
                    <Th class="w-20">Files</Th>
                    <Th class="w-24">Storage</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.value.topUsers.map((user) => (
                    <Tr key={user.email}>
                      <Td class="max-w-0">
                        <p class="text-ink truncate font-medium">{user.name}</p>
                        <p class="text-ink-muted truncate text-xs">
                          {user.email}
                        </p>
                      </Td>
                      <Td class="tabular-nums">{user.totalUploads}</Td>
                      <TdMeta>{formatBytes(user.storageUsed, 1)}</TdMeta>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Surface>
        </Section>
      </div>

      <Section title="Recent events">
        <Button
          q:slot="actions"
          size="sm"
          variant="secondary"
          href="/dashboard/admin/events"
        >
          View all
        </Button>
        <Surface flush class="overflow-hidden">
          {data.value.recentEvents.length === 0 ? (
            <EmptyState size="inline" title="No events recorded" />
          ) : (
            <ul class="divide-edge divide-y">
              {data.value.recentEvents.map((event) => (
                <li
                  key={event.id}
                  class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
                >
                  <Badge tone={severityTone[normalizeSeverity(event.severity)]}>
                    {severityLabel[normalizeSeverity(event.severity)]}
                  </Badge>
                  <span class="text-ink min-w-0 flex-1 truncate text-[13px]">
                    {event.title}
                  </span>
                  <span
                    class="text-ink-muted shrink-0 text-xs"
                    title={formatAbsoluteDate(event.createdAt)}
                  >
                    {formatRelativeDate(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </Section>
    </>
  );
});

export const head: DocumentHead = {
  title: "Health - Admin - twink.forsale",
};
