import { component$, useSignal, useComputed$, $ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Bell, SearchX, Trash2, ServerCrash } from "lucide-icons-qwik";
import { api, serverAuth, type EventDto } from "~/lib/api-client";
import {
  formatRelativeDate,
  formatAbsoluteDate,
  normalizeSeverity,
  severityLabel,
  type Severity,
} from "~/lib/file-kinds";
import { useToast } from "~/lib/toast-store";
import {
  PageHeader,
  Surface,
  Button,
  IconButton,
  Badge,
  Select,
  SearchField,
  CollectionToolbar,
  SummaryList,
  EmptyState,
  Dialog,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  TdMeta,
  type BadgeTone,
} from "~/components/ui";

/** Best-effort bulk delete: one failure does not abort the rest. */
async function deleteEventsWhere(
  cookie: string | null,
  predicate: (e: EventDto) => boolean,
): Promise<number> {
  const { events } = await api.admin.events({ cookie }).catch(() => ({
    events: [] as EventDto[],
  }));
  let deleted = 0;
  for (const event of events.filter(predicate)) {
    try {
      await api.admin.deleteEvent(event.id, { cookie });
      deleted++;
    } catch {
      // Counted as not deleted; the summary reflects what actually happened.
    }
  }
  return deleted;
}

export const useDeleteEvent = routeAction$(async (data, requestEvent) => {
  const eventId = data.eventId as string;
  if (!eventId) return { success: false, error: "No event selected." };
  try {
    await api.admin.deleteEvent(eventId, serverAuth(requestEvent));
    return { success: true, deleted: 1 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "The delete failed.",
    };
  }
});

/** Removes INFO and WARNING events older than 30 days. */
export const useCleanupEvents = routeAction$(async (_data, requestEvent) => {
  try {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const deleted = await deleteEventsWhere(
      requestEvent.request.headers.get("cookie"),
      (e) =>
        new Date(e.createdAt).getTime() < cutoff &&
        normalizeSeverity(e.severity) !== "critical" &&
        normalizeSeverity(e.severity) !== "error",
    );
    return { success: true, deleted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "The cleanup failed.",
    };
  }
});

export const useClearNonCriticalEvents = routeAction$(
  async (_data, requestEvent) => {
    try {
      const deleted = await deleteEventsWhere(
        requestEvent.request.headers.get("cookie"),
        (e) =>
          normalizeSeverity(e.severity) === "info" ||
          normalizeSeverity(e.severity) === "warning",
      );
      return { success: true, deleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "The clear failed.",
      };
    }
  },
);

export const useClearAllEvents = routeAction$(async (_data, requestEvent) => {
  try {
    const deleted = await deleteEventsWhere(
      requestEvent.request.headers.get("cookie"),
      () => true,
    );
    return { success: true, deleted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "The clear failed.",
    };
  }
});

export const useSystemEventsData = routeLoader$(async (requestEvent) => {
  try {
    const { events } = await api.admin.events(serverAuth(requestEvent));

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stats = { critical: 0, error: 0, warning: 0, info: 0, other: 0 };
    for (const e of events) {
      if (new Date(e.createdAt).getTime() >= cutoff) {
        stats[normalizeSeverity(e.severity)]++;
      }
    }

    return { events, stats, failed: false };
  } catch {
    return {
      events: [] as EventDto[],
      stats: { critical: 0, error: 0, warning: 0, info: 0, other: 0 },
      failed: true,
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
  const data = useSystemEventsData();
  const deleteEvent = useDeleteEvent();
  const cleanup = useCleanupEvents();
  const clearNonCritical = useClearNonCriticalEvents();
  const clearAll = useClearAllEvents();
  const toast = useToast();

  const search = useSignal("");
  const severityFilter = useSignal("all");
  const removed = useSignal<string[]>([]);

  const bulkAction = useSignal<"cleanup" | "non-critical" | "all" | null>(null);
  const bulkOpen = useSignal(false);
  const bulkBusy = useSignal(false);

  const events = useComputed$(() =>
    data.value.events.filter((e) => !removed.value.includes(e.id)),
  );

  const visible = useComputed$(() => {
    const query = search.value.trim().toLowerCase();
    let list = events.value;
    if (severityFilter.value !== "all") {
      list = list.filter(
        (e) => normalizeSeverity(e.severity) === severityFilter.value,
      );
    }
    if (query) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.message.toLowerCase().includes(query) ||
          e.type.toLowerCase().includes(query),
      );
    }
    return list;
  });

  const removeOne = $(async (event: EventDto) => {
    const result = await deleteEvent.submit({ eventId: event.id });
    if (result.value.success) {
      removed.value = [...removed.value, event.id];
    } else {
      toast.error("Could not delete the event", result.value.error);
    }
  });

  const BULK_COPY = {
    cleanup: {
      title: "Delete old routine events?",
      body: "Removes informational and warning events older than 30 days. Errors and critical events are kept.",
      confirm: "Delete old events",
    },
    "non-critical": {
      title: "Delete all routine events?",
      body: "Removes every informational and warning event, regardless of age. Errors and critical events are kept.",
      confirm: "Delete routine events",
    },
    all: {
      title: "Delete the entire event log?",
      body: "Removes every event, including errors and critical events. Nothing is kept, and this cannot be undone.",
      confirm: "Delete everything",
    },
  } as const;

  const runBulk = $(async () => {
    const which = bulkAction.value;
    if (!which) return;
    bulkBusy.value = true;
    const result =
      which === "cleanup"
        ? await cleanup.submit({})
        : which === "non-critical"
          ? await clearNonCritical.submit({})
          : await clearAll.submit({});
    bulkBusy.value = false;
    bulkOpen.value = false;

    if (result.value.success) {
      const count = result.value.deleted ?? 0;
      toast.success(`Deleted ${count} event${count === 1 ? "" : "s"}`);
      // The list is reloaded by the action's navigation; clear local removals.
      removed.value = [];
    } else {
      toast.error("Could not delete the events", result.value.error);
    }
  });

  const openBulk = $((which: "cleanup" | "non-critical" | "all") => {
    bulkAction.value = which;
    bulkOpen.value = true;
  });

  return (
    <>
      <PageHeader
        title="Events"
        description="System activity from the last retention window, newest first."
      >
        <div q:slot="actions" class="flex flex-wrap gap-2">
          <Button variant="secondary" onClick$={() => openBulk("cleanup")}>
            Delete old routine events
          </Button>
          <Button
            variant="secondary"
            class="text-danger hover:text-danger"
            onClick$={() => openBulk("all")}
          >
            Clear log
          </Button>
        </div>
      </PageHeader>

      {data.value.failed && (
        <Surface flush>
          <EmptyState
            icon={ServerCrash}
            title="Events unavailable"
            description="The server did not respond. Reload the page to try again."
          >
            <Button variant="secondary" onClick$={() => location.reload()}>
              Reload
            </Button>
          </EmptyState>
        </Surface>
      )}

      {!data.value.failed && (
        <>
          <SummaryList
            label="Severity in the last 24 hours"
            class="mb-4"
            items={[
              {
                label: "Critical",
                value: data.value.stats.critical,
                note: "last 24h",
              },
              {
                label: "Errors",
                value: data.value.stats.error,
                note: "last 24h",
              },
              {
                label: "Warnings",
                value: data.value.stats.warning,
                note: "last 24h",
              },
              {
                label: "Informational",
                value: data.value.stats.info,
                note: "last 24h",
              },
            ]}
          />

          <CollectionToolbar class="mb-3">
            <SearchField
              value={search}
              label="Search events"
              placeholder="Title, message or type"
              class="min-w-[11rem] flex-1"
              resultSummary={`${visible.value.length} of ${events.value.length} events shown`}
            />
            <div class="w-[10rem] shrink-0">
              <label class="sr-only" for="severity-filter">
                Filter by severity
              </label>
              <Select
                id="severity-filter"
                value={severityFilter.value}
                onChange$={(_, el) => (severityFilter.value = el.value)}
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Informational</option>
              </Select>
            </div>
            <Button
              variant="ghost"
              class="ml-auto"
              onClick$={() => openBulk("non-critical")}
            >
              Delete routine events
            </Button>
          </CollectionToolbar>

          {visible.value.length === 0 ? (
            <Surface flush>
              <EmptyState
                icon={events.value.length === 0 ? Bell : SearchX}
                title={
                  events.value.length === 0
                    ? "No events recorded"
                    : "No events match"
                }
                description={
                  events.value.length === 0
                    ? "System activity will appear here as it happens."
                    : `${events.value.length} events are hidden by the current search and filter.`
                }
              >
                {events.value.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick$={() => {
                      search.value = "";
                      severityFilter.value = "all";
                    }}
                  >
                    Clear search and filter
                  </Button>
                )}
              </EmptyState>
            </Surface>
          ) : (
            <>
              <Surface flush class="hidden overflow-hidden md:block">
                <Table label="System events" minWidth="820px">
                  <Thead>
                    <Tr hover={false}>
                      <Th class="w-28">Severity</Th>
                      <Th class="w-40">Type</Th>
                      <Th>Event</Th>
                      <Th class="w-32">When</Th>
                      <Th class="w-16 text-right">Delete</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {visible.value.map((event) => (
                      <Tr key={event.id}>
                        <Td>
                          <Badge
                            tone={
                              severityTone[normalizeSeverity(event.severity)]
                            }
                          >
                            {severityLabel[normalizeSeverity(event.severity)]}
                          </Badge>
                        </Td>
                        <TdMeta class="font-mono">{event.type}</TdMeta>
                        <Td class="max-w-0">
                          <p class="text-ink truncate font-medium">
                            {event.title}
                          </p>
                          <p
                            class="text-ink-muted truncate text-xs"
                            title={event.message}
                          >
                            {event.message}
                          </p>
                        </Td>
                        <TdMeta title={formatAbsoluteDate(event.createdAt)}>
                          {formatRelativeDate(event.createdAt)}
                        </TdMeta>
                        <Td class="text-right">
                          <IconButton
                            size="sm"
                            variant="danger"
                            label={`Delete event: ${event.title}`}
                            onClick$={() => removeOne(event)}
                          >
                            <Trash2 class="h-4 w-4" />
                          </IconButton>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Surface>

              <Surface flush class="overflow-hidden md:hidden">
                <ul class="divide-edge divide-y">
                  {visible.value.map((event) => (
                    <li
                      key={event.id}
                      class="flex items-start gap-2.5 px-3 py-2.5"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <Badge
                            tone={
                              severityTone[normalizeSeverity(event.severity)]
                            }
                          >
                            {severityLabel[normalizeSeverity(event.severity)]}
                          </Badge>
                          <span class="text-ink-muted text-xs">
                            {formatRelativeDate(event.createdAt)}
                          </span>
                        </div>
                        <p class="text-ink mt-1 text-[13px] font-medium">
                          {event.title}
                        </p>
                        <p class="text-ink-muted line-clamp-2 text-xs">
                          {event.message}
                        </p>
                      </div>
                      <IconButton
                        size="sm"
                        variant="danger"
                        label={`Delete event: ${event.title}`}
                        onClick$={() => removeOne(event)}
                      >
                        <Trash2 class="h-4 w-4" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              </Surface>
            </>
          )}
        </>
      )}

      <Dialog
        open={bulkOpen}
        title={bulkAction.value ? BULK_COPY[bulkAction.value].title : ""}
        size="sm"
      >
        <p class="text-ink-muted text-[13px] leading-5">
          {bulkAction.value ? BULK_COPY[bulkAction.value].body : ""}
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (bulkOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="danger"
          loading={bulkBusy.value}
          onClick$={runBulk}
        >
          {bulkAction.value ? BULK_COPY[bulkAction.value].confirm : "Delete"}
        </Button>
      </Dialog>
    </>
  );
});

export const head: DocumentHead = {
  title: "Events - Admin - twink.forsale",
};
