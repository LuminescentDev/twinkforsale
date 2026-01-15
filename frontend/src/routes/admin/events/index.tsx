import { $, component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import {
  AlertTriangle,
  Info,
  RefreshCw,
  Trash,
  Trash2,
  Play,
  CheckCircle,
  OctagonX,
  Clock,
  User,
} from "lucide-icons-qwik";
import { formatDate } from "~/lib/utils";
import { useAlert } from "~/lib/use-alert";
import { db } from "~/lib/db";
import {
  checkSystemAlerts,
  checkUserStorageAlerts,
  cleanupOldEvents,
  deleteSystemEvent,
  clearAllSystemEvents,
  clearNonCriticalEvents,
  getRecentSystemEvents,
  getSystemEventsStats,
} from "~/lib/system-events";
import { sendAdminActionNotification } from "~/lib/discord-notifications";
import { getMonitoringStatus } from "~/lib/system-monitoring";
export const useAdminCheck = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (!session?.user?.email) {
    throw requestEvent.redirect(302, "/");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    throw requestEvent.redirect(302, "/dashboard");
  }
  return { isAdmin: true };
});

// Server action to trigger system checks
export const useTriggerSystemCheck = routeAction$(
  async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get("session");
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    try {
      // Check system alerts
      await checkSystemAlerts();

      // Check all users
      const users = await db.user.findMany({
        select: { id: true },
      });

      for (const user of users) {
        await checkUserStorageAlerts(user.id);
      }

      // Send Discord notification for admin action
      await sendAdminActionNotification(
        "Manual System Check",
        session.user.email,
        `Manually triggered system check for ${users.length} users`,
        { userCount: users.length },
      );

      return {
        success: true,
        message: `System check completed for ${users.length} users`,
      };
    } catch (error) {
      console.error("System check error:", error);
      return {
        success: false,
        error: "Failed to run system check",
      };
    }
  },
);

// Server action to cleanup old events
export const useCleanupEvents = routeAction$(async (data, requestEvent) => {
  const session = requestEvent.sharedMap.get("session");
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const deletedCount = await cleanupOldEvents();

    // Send Discord notification for admin action
    await sendAdminActionNotification(
      "Event Cleanup",
      session.user.email,
      `Cleaned up ${deletedCount} old system events`,
      { deletedCount },
    );

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old events`,
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      success: false,
      error: "Failed to cleanup events",
    };
  }
});

// Server action to delete a specific event
export const useDeleteEvent = routeAction$(async (data, requestEvent) => {
  const session = requestEvent.sharedMap.get("session");
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return { success: false, error: "Admin access required" };
  }

  const eventId = data.eventId as string;
  if (!eventId) {
    return { success: false, error: "Event ID is required" };
  }

  try {
    const success = await deleteSystemEvent(eventId);
    if (success) {
      // Send Discord notification for admin action
      await sendAdminActionNotification(
        "Event Deletion",
        session.user.email,
        `Deleted system event with ID: ${eventId}`,
        { eventId },
      );

      return {
        success: true,
        message: "Event deleted successfully",
      };
    } else {
      return {
        success: false,
        error: "Failed to delete event",
      };
    }
  } catch (error) {
    console.error("Delete event error:", error);
    return {
      success: false,
      error: "Failed to delete event",
    };
  }
});

// Server action to clear all events
export const useClearAllEvents = routeAction$(async (data, requestEvent) => {
  const session = requestEvent.sharedMap.get("session");
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const deletedCount = await clearAllSystemEvents();

    // Send Discord notification for admin action
    await sendAdminActionNotification(
      "Clear All Events",
      session.user.email,
      `Cleared ALL system events (${deletedCount} events deleted)`,
      { deletedCount, severity: "ALL" },
    );

    return {
      success: true,
      message: `Cleared ${deletedCount} events`,
    };
  } catch (error) {
    console.error("Clear all events error:", error);
    return {
      success: false,
      error: "Failed to clear events",
    };
  }
});

// Server action to clear non-critical events
export const useClearNonCriticalEvents = routeAction$(
  async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get("session");
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    try {
      const deletedCount = await clearNonCriticalEvents();

      // Send Discord notification for admin action
      await sendAdminActionNotification(
        "Clear Non-Critical Events",
        session.user.email,
        `Cleared non-critical events (${deletedCount} INFO/WARNING events deleted)`,
        { deletedCount, severity: "INFO, WARNING" },
      );

      return {
        success: true,
        message: `Cleared ${deletedCount} non-critical events`,
      };
    } catch (error) {
      console.error("Clear non-critical events error:", error);
      return {
        success: false,
        error: "Failed to clear non-critical events",
      };
    }
  },
);

export const useSystemEventsData = routeLoader$(async () => {
  try {
    const recentEvents = await getRecentSystemEvents(100); // Get more events for management
    const eventStats = await getSystemEventsStats(24);
    const monitoringStatus = getMonitoringStatus();

    return {
      events: recentEvents,
      stats: eventStats,
      monitoring: monitoringStatus,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("System events data error:", error);
    return {
      error: "Failed to load system events data",
      lastUpdated: new Date(),
    };
  }
});

export default component$(() => {
  const eventsData = useSystemEventsData();
  const triggerSystemCheckAction = useTriggerSystemCheck();
  const cleanupEventsAction = useCleanupEvents();
  const deleteEventAction = useDeleteEvent();
  const clearAllEventsAction = useClearAllEvents();
  const clearNonCriticalEventsAction = useClearNonCriticalEvents();
  const { success, error, confirmAsync } = useAlert();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-600 bg-red-100";
      case "ERROR":
        return "text-orange-600 bg-orange-100";
      case "WARNING":
        return "text-yellow-600 bg-yellow-100";
      case "INFO":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <OctagonX class="h-4 w-4" />;
      case "ERROR":
        return <AlertTriangle class="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle class="h-4 w-4" />;
      case "INFO":
        return <Info class="h-4 w-4" />;
      default:
        return <Info class="h-4 w-4" />;
    }
  };
  const triggerSystemCheck = $(async () => {
    const result = await triggerSystemCheckAction.submit();
    if (result.value?.success) {
      await success(
        "System Check Complete",
        result.value.message || "System check completed successfully",
      );
      window.location.reload();
    } else {
      await error(
        "System Check Failed",
        result.value?.error || "Failed to trigger system check",
      );
    }
  });
  const cleanupEvents = $(async () => {
    const confirmed = await confirmAsync(
      "Cleanup Old Events",
      "Are you sure you want to cleanup old system events? This will delete events older than 30 days (except CRITICAL and ERROR events).",
    );

    if (!confirmed) {
      return;
    }

    const result = await cleanupEventsAction.submit();
    if (result.value?.success) {
      await success(
        "Cleanup Complete",
        result.value.message || "Old events cleaned up successfully",
      );
      window.location.reload();
    } else {
      await error(
        "Cleanup Failed",
        result.value?.error || "Failed to cleanup events",
      );
    }
  });
  const deleteEvent = $(async (eventId: string) => {
    const confirmed = await confirmAsync(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    const result = await deleteEventAction.submit({ eventId });

    if (result.value?.success) {
      await success(
        "Event Deleted",
        result.value.message || "Event deleted successfully",
      );
      window.location.reload();
    } else {
      await error(
        "Delete Failed",
        result.value?.error || "Failed to delete event",
      );
    }
  });

  const clearAllEvents = $(async () => {
    const confirmed = await confirmAsync(
      "Clear All Events",
      "Are you sure you want to clear ALL system events? This action cannot be undone and will delete all events including critical ones.",
    );

    if (!confirmed) {
      return;
    }

    const result = await clearAllEventsAction.submit();
    if (result.value?.success) {
      await success(
        "Events Cleared",
        result.value.message || "All events cleared successfully",
      );
      window.location.reload();
    } else {
      await error(
        "Clear Failed",
        result.value?.error || "Failed to clear all events",
      );
    }
  });

  const clearNonCriticalEvents = $(async () => {
    const confirmed = await confirmAsync(
      "Clear Non-Critical Events",
      "Are you sure you want to clear all non-critical events? This will delete all INFO and WARNING events.",
    );

    if (!confirmed) {
      return;
    }

    const result = await clearNonCriticalEventsAction.submit();
    if (result.value?.success) {
      await success(
        "Non-Critical Events Cleared",
        result.value.message || "Non-critical events cleared successfully",
      );
      window.location.reload();
    } else {
      await error(
        "Clear Failed",
        result.value?.error || "Failed to clear non-critical events",
      );
    }
  });

  if (eventsData.value.error) {
    return (
      <div class="min-h-screen p-4 sm:p-6">
        <div class="mx-auto max-w-7xl">
          <div class="text-center">
            <AlertTriangle class="mx-auto h-12 w-12 text-red-500" />
            <h1 class="mt-4 text-2xl font-bold text-red-500">
              Failed to Load System Events
            </h1>
            <p class="mt-2 text-gray-600">{eventsData.value.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const data = eventsData.value;

  return (
    <div class="min-h-screen p-4 sm:p-6">
      <div class="mx-auto max-w-7xl">
        {" "}
        {/* Header */}
        <div class="mb-6">
          <div class="mb-4">
            <h1 class="text-gradient-cute flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <Clock class="h-6 w-6 sm:h-8 sm:w-8" />
              System Events Management
            </h1>
            <p class="text-theme-text-secondary mt-2 text-sm sm:text-base">
              Monitor and manage system events and alerts~ 🔔
            </p>
          </div>

          {/* Mobile Action Buttons */}
          <div class="block space-y-3 sm:hidden">
            <button
              onClick$={triggerSystemCheck}
              class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
            >
              <Play class="h-4 w-4" />
              Trigger System Check
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                onClick$={cleanupEvents}
                class="card-cute flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
                title="Cleanup old events (30+ days)"
              >
                <Trash class="h-4 w-4 text-gray-500" />
                Cleanup
              </button>
              <button
                onClick$={clearNonCriticalEvents}
                class="card-cute flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
                title="Clear INFO and WARNING events"
              >
                <Trash2 class="h-4 w-4 text-blue-500" />
                Clear Safe
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                onClick$={clearAllEvents}
                class="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-3 py-3 text-xs font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-lg active:scale-95"
                title="Clear ALL events (including critical)"
              >
                <Trash class="h-4 w-4" />
                Clear All
              </button>
              <button
                onClick$={() => window.location.reload()}
                class="card-cute flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
              >
                <RefreshCw class="h-4 w-4 text-green-500" />
                Refresh
              </button>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div class="hidden items-center justify-end gap-3 sm:flex">
            <button
              onClick$={triggerSystemCheck}
              class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
            >
              <Play class="h-4 w-4" />
              Trigger Check
            </button>
            <div class="flex items-center gap-2">
              <button
                onClick$={cleanupEvents}
                class="card-cute flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
                title="Cleanup old events (30+ days)"
              >
                <Trash class="h-4 w-4 text-gray-500" />
                Cleanup Old
              </button>
              <button
                onClick$={clearNonCriticalEvents}
                class="card-cute flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
                title="Clear INFO and WARNING events"
              >
                <Trash2 class="h-4 w-4 text-blue-500" />
                Clear Safe
              </button>
              <button
                onClick$={clearAllEvents}
                class="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-lg active:scale-95"
                title="Clear ALL events (including critical)"
              >
                <Trash class="h-4 w-4" />
                Clear All
              </button>
            </div>
            <button
              onClick$={() => window.location.reload()}
              class="card-cute flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
            >
              <RefreshCw class="h-4 w-4 text-green-500" />
              Refresh
            </button>
          </div>
        </div>{" "}
        {/* Monitoring Status */}
        <div class="mb-6">
          <div class="card-cute rounded-2xl p-4 sm:rounded-3xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <Clock class="h-4 w-4 sm:h-5 sm:w-5" />
              Monitoring Status
            </h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Monitoring Service
                </span>
                <div class="flex items-center gap-2">
                  {data.monitoring?.isRunning ? (
                    <>
                      <CheckCircle class="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
                      <span class="text-sm font-medium text-green-600 sm:text-base">
                        Running
                      </span>
                    </>
                  ) : (
                    <>
                      <OctagonX class="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
                      <span class="text-sm font-medium text-red-600 sm:text-base">
                        Stopped
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Last Updated
                </span>
                <span class="text-sm font-medium sm:text-base">
                  {data.lastUpdated?.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Event Statistics */}
        <div class="mb-6">
          <div class="card-cute rounded-2xl p-4 sm:rounded-3xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <Info class="h-4 w-4 sm:h-5 sm:w-5" />
              Event Statistics (Last 24h)
            </h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div class="rounded-xl p-3 text-center">
                <div class="text-xl font-bold text-red-600 sm:text-2xl">
                  {data.stats?.CRITICAL || 0}
                </div>
                <div class="text-xs text-gray-600 sm:text-sm">Critical</div>
              </div>
              <div class="rounded-xl p-3 text-center">
                <div class="text-xl font-bold text-orange-600 sm:text-2xl">
                  {data.stats?.ERROR || 0}
                </div>
                <div class="text-xs text-gray-600 sm:text-sm">Errors</div>
              </div>
              <div class="rounded-xl p-3 text-center">
                <div class="text-xl font-bold text-yellow-600 sm:text-2xl">
                  {data.stats?.WARNING || 0}
                </div>
                <div class="text-xs text-gray-600 sm:text-sm">Warnings</div>
              </div>
              <div class="rounded-xl p-3 text-center">
                <div class="text-xl font-bold text-blue-600 sm:text-2xl">
                  {data.stats?.INFO || 0}
                </div>
                <div class="text-xs text-gray-600 sm:text-sm">Info</div>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Events List */}
        <div class="mb-6">
          <div class="card-cute rounded-2xl p-4 sm:rounded-3xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <AlertTriangle class="h-4 w-4 sm:h-5 sm:w-5" />
              Recent Events
            </h3>
            {data.events && data.events.length > 0 ? (
              <div class="max-h-80 space-y-3 overflow-y-auto sm:max-h-96">
                {data.events.map((event, index) => (
                  <div
                    key={index}
                    class="border-theme-card-border rounded-lg border p-3 sm:p-4"
                  >
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="flex flex-1 items-start gap-2 sm:gap-3">
                        <span
                          class={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(event.severity)}`}
                        >
                          {getSeverityIcon(event.severity)}
                          <span class="hidden sm:inline">{event.severity}</span>
                        </span>
                        <div class="min-w-0 flex-1">
                          <div class="text-theme-text-primary text-sm font-medium break-words sm:text-base">
                            {event.title}
                          </div>
                          <div class="text-theme-text-secondary mt-1 text-xs break-words sm:text-sm">
                            {event.message}
                          </div>
                          {event.user && (
                            <div class="text-theme-text-secondary mt-2 flex items-center gap-2 text-xs">
                              <User class="h-3 w-3 flex-shrink-0" />
                              <span class="truncate">{event.user.email}</span>
                            </div>
                          )}
                          {event.metadata && (
                            <details class="mt-2">
                              <summary class="text-theme-text-secondary hover:text-theme-text-primary cursor-pointer text-xs">
                                View metadata
                              </summary>
                              <pre class="mt-2 max-w-full overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                          {(event.cpuUsage ||
                            event.memoryUsage ||
                            event.diskUsage) && (
                            <div class="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                              {event.cpuUsage && (
                                <div>
                                  <span class="text-theme-text-secondary">
                                    CPU:
                                  </span>
                                  <span class="ml-1 font-medium">
                                    {event.cpuUsage.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              {event.memoryUsage && (
                                <div>
                                  <span class="text-theme-text-secondary">
                                    Memory:
                                  </span>
                                  <span class="ml-1 font-medium">
                                    {event.memoryUsage.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              {event.diskUsage && (
                                <div>
                                  <span class="text-theme-text-secondary">
                                    Disk:
                                  </span>
                                  <span class="ml-1 font-medium">
                                    {event.diskUsage.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div class="flex items-center justify-between gap-3 sm:items-start sm:justify-end">
                        <div class="text-theme-text-secondary text-xs sm:text-right sm:text-sm">
                          <div class="font-medium">
                            {formatDate(new Date(event.createdAt))}
                          </div>
                          <div class="text-xs opacity-75">{event.type}</div>
                        </div>
                        <button
                          onClick$={() => deleteEvent(event.id)}
                          class="flex-shrink-0 rounded p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Delete this event"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="py-8 text-center sm:py-12">
                <CheckCircle class="mx-auto h-8 w-8 text-green-500 sm:h-12 sm:w-12" />
                <h3 class="text-theme-text-primary mt-4 text-base font-medium sm:text-lg">
                  No Events Found
                </h3>
                <p class="text-theme-text-secondary mt-2 text-sm sm:text-base">
                  System is running smoothly with no events to report! 🎉
                </p>
              </div>
            )}
          </div>
        </div>{" "}
        {/* Footer */}
        <div class="px-4 text-center text-xs text-gray-500 sm:text-sm">
          <p>Last updated: {data.lastUpdated?.toLocaleString()}</p>
          <p class="mt-1">
            System events are automatically monitored every 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "System Events - Admin - twink.forsale",
  meta: [
    {
      name: "description",
      content: "System events monitoring and management for twink.forsale",
    },
  ],
};
