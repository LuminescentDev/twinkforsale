import {
  component$,
  $,
  useContext,
  useSignal,
  useComputed$,
} from "@builder.io/qwik";
import { routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  setUploadsViewMode,
  getServerUploadsViewMode,
} from "~/lib/cookie-utils";
import {
  Folder,
  Eye,
  HardDrive,
  Clock,
  Trash2,
  TrendingUp,
  List,
  Grid,
  BarChart3,
  Rocket,
  CheckSquare,
  Square,
  ExternalLink,
} from "lucide-icons-qwik";
import { ImagePreviewContext } from "~/lib/image-preview-store";
import { FileTypeIcon } from "~/components/file-type-icon";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import {
  PageHeader,
  StatCard,
  Panel,
  SegmentedControl,
  SearchInput,
  Table,
  Thead,
  Th,
  SortHeader,
  Tr,
  Td,
  CopyButton,
  IconButton,
  Button,
  Badge,
  EmptyState,
} from "~/components/ui";

export const useDeleteUpload = routeAction$(async (data, requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // `deletionKeys` now carries upload ids (the backend deletes by id).
  const raw = data.deletionKeys as string[] | string;
  const ids = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
  if (!ids.length) {
    return { success: false, error: "No files provided" };
  }

  const results: { key: string; success: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await api.dashboard.deleteUpload(id, auth);
      results.push({ key: id, success: true });
    } catch (error) {
      results.push({
        key: id,
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  return {
    success: true,
    results,
    successCount,
    failureCount,
    message: `Successfully deleted ${successCount} file${successCount !== 1 ? "s" : ""}${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
  };
});

export const useUserUploads = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const [uploadsRes, summary] = await Promise.all([
    api.dashboard.uploads(auth).catch(() => ({ uploads: [] })),
    api.dashboard.summary(auth).catch(() => null),
  ]);

  // Normalize backend uploads to the shape this view expects. `deletionKey`
  // aliases the id (delete-by-id on the backend), and per-upload weekly
  // analytics are stubbed until the analytics endpoints are wired.
  const uploads = (uploadsRes.uploads ?? []).map((u) => ({
    ...u,
    deletionKey: u.id,
    maxViews: null as number | null,
    analytics: [] as { totalViews: number }[],
    weeklyViews: 0,
    weeklyUniqueViews: 0,
    weeklyDownloads: 0,
    weeklyUniqueDownloads: 0,
  }));

  const cookieHeader = requestEvent.request.headers.get("cookie");
  const savedViewMode =
    getServerUploadsViewMode(cookieHeader || undefined) || "list";

  return {
    user: {
      storageUsed: summary?.storageUsed ?? 0,
      uploads,
    },
    effectiveStorageLimit: summary?.storageLimit ?? 0,
    origin: requestEvent.url.origin,
    savedViewMode,
  };
});

type SortKey = "name" | "size" | "views" | "downloads" | "date" | "weeklyViews";

/** Compact sparkline used in the grid cards. */
const MiniChart = component$(({ data }: { data: { totalViews: number }[] }) => {
  if (!data || data.length === 0)
    return <div class="text-theme-text-muted text-xs">No data</div>;

  const maxViews = Math.max(...data.map((d) => d.totalViews), 1);
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 60;
      const y = 20 - (d.totalViews / maxViews) * 20;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg class="h-6 w-16" viewBox="0 0 60 20">
      <polyline
        fill="none"
        stroke-width="1.5"
        points={points}
        class="stroke-theme-accent-primary"
      />
    </svg>
  );
});

export default component$(() => {
  const userData = useUserUploads();
  const deleteUploadAction = useDeleteUpload();
  const imagePreview = useContext(ImagePreviewContext);

  const searchQuery = useSignal("");
  const sortBy = useSignal<SortKey>("date");
  const sortOrder = useSignal<"asc" | "desc">("desc");
  const viewMode = useSignal<string>(userData.value.savedViewMode);
  const selectedFiles = useSignal<Set<string>>(new Set());

  const deleteUpload = $(async (deletionKey: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    const result = await deleteUploadAction.submit({ deletionKeys: deletionKey });
    if (result.value.success) window.location.reload();
    else alert(result.value.error || "Failed to delete file");
  });

  const filteredAndSortedUploads = useComputed$(() => {
    let uploads = userData.value.user.uploads || [];

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      uploads = uploads.filter(
        (u) =>
          u.originalName.toLowerCase().includes(query) ||
          u.mimeType.toLowerCase().includes(query),
      );
    }

    uploads = [...uploads].sort((a, b) => {
      let comparison = 0;
      switch (sortBy.value) {
        case "name":
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "views":
          comparison = a.views - b.views;
          break;
        case "downloads":
          comparison = a.downloads - b.downloads;
          break;
        case "weeklyViews":
          comparison = (a.weeklyViews || 0) - (b.weeklyViews || 0);
          break;
        case "date":
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder.value === "asc" ? comparison : -comparison;
    });

    return uploads;
  });

  const toggleFileSelection = $((deletionKey: string) => {
    const next = new Set(selectedFiles.value);
    if (next.has(deletionKey)) next.delete(deletionKey);
    else next.add(deletionKey);
    selectedFiles.value = next;
  });

  const toggleSelectAll = $(() => {
    if (selectedFiles.value.size === filteredAndSortedUploads.value.length) {
      selectedFiles.value = new Set();
    } else {
      selectedFiles.value = new Set(
        filteredAndSortedUploads.value.map((u) => u.deletionKey),
      );
    }
  });

  const bulkDelete = $(async () => {
    const count = selectedFiles.value.size;
    if (count === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${count} selected file${count !== 1 ? "s" : ""}?`,
      )
    )
      return;
    const result = await deleteUploadAction.submit({
      deletionKeys: Array.from(selectedFiles.value),
    });
    if (result.value.success) {
      selectedFiles.value = new Set();
      window.location.reload();
    } else {
      alert(result.value.error || "Failed to delete files");
    }
  });

  const bulkCopyUrls = $(() => {
    const urls = filteredAndSortedUploads.value
      .filter((u) => selectedFiles.value.has(u.deletionKey))
      .map((u) => `${userData.value.origin}/f/${u.shortCode}`)
      .join("\n");
    navigator.clipboard.writeText(urls);
  });

  const formatFileSize = (bytes: number | bigint) => {
    const numBytes = typeof bytes === "bigint" ? Number(bytes) : bytes;
    if (numBytes === 0) return "0 Bytes";
    const isNegative = numBytes < 0;
    const formatted = formatBytes(Math.abs(numBytes));
    return isNegative ? `-${formatted}` : formatted;
  };

  const handleSort = $((column: SortKey) => {
    if (sortBy.value === column) {
      sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    } else {
      sortBy.value = column;
      sortOrder.value = "desc";
    }
  });

  const totalUploads = userData.value.user.uploads.length;
  const availableSpace =
    userData.value.effectiveStorageLimit - userData.value.user.storageUsed;

  return (
    <div>
      <PageHeader
        align="left"
        title="My Files~"
        icon={Folder}
        subtitle="Manage your files with expiration dates and view limits! (◕‿◕)♡"
      >
        <Button q:slot="actions" href="/upload">
          <Rocket class="h-4 w-4" />
          Upload
        </Button>
      </PageHeader>

      {/* Stats Summary */}
      <div class="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Folder}
          accent={0}
          pulse
          label={searchQuery.value.trim() ? "Filtered Files" : "Total Files"}
          value={
            searchQuery.value.trim()
              ? filteredAndSortedUploads.value.length
              : totalUploads
          }
        />
        <StatCard
          icon={Eye}
          accent={1}
          pulse
          label={searchQuery.value.trim() ? "Filtered Views" : "Total Views"}
          value={(searchQuery.value.trim()
            ? filteredAndSortedUploads.value
            : userData.value.user.uploads
          ).reduce((sum, u) => sum + u.views, 0)}
        />
        <StatCard
          icon={TrendingUp}
          accent={3}
          pulse
          label={
            searchQuery.value.trim() ? "Filtered Downloads" : "Total Downloads"
          }
          value={(searchQuery.value.trim()
            ? filteredAndSortedUploads.value
            : userData.value.user.uploads
          ).reduce((sum, u) => sum + u.downloads, 0)}
        />
        <StatCard
          icon={HardDrive}
          accent={2}
          pulse
          label="Storage Used"
          value={`${formatFileSize(userData.value.user.storageUsed)} / ${formatFileSize(userData.value.effectiveStorageLimit)}`}
        />
        <StatCard
          icon={Clock}
          accent={3}
          pulse
          label="Available Space"
          value={formatFileSize(availableSpace)}
        />
      </div>

      {/* Uploads panel */}
      <Panel
        title="All Files~"
        icon={Folder}
        description={
          searchQuery.value.trim()
            ? `${filteredAndSortedUploads.value.length} of ${totalUploads} files`
            : undefined
        }
        flush
      >
        <div q:slot="actions" class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={searchQuery}
            placeholder="Search files by name or type…"
            class="sm:w-72"
          />
          <SegmentedControl
            value={viewMode}
            onChange$={(v) => setUploadsViewMode(v as "grid" | "list")}
            options={[
              { value: "list", label: "List", icon: List },
              { value: "grid", label: "Grid", icon: Grid },
            ]}
          />
        </div>

        {totalUploads === 0 ? (
          <EmptyState
            icon={Folder}
            title="No files yet~"
            description="Your files will appear here once uploaded via ShareX or API! (◕‿◕)♡"
            class="px-4 sm:px-6"
          >
            <Button href="/setup/sharex">
              <Rocket class="h-4 w-4" />
              Setup ShareX to get started~
            </Button>
          </EmptyState>
        ) : filteredAndSortedUploads.value.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No files found~"
            description="Try searching with a different term! (◕‿◕)♡"
            class="px-4 sm:px-6"
          >
            <Button variant="glass" onClick$={() => (searchQuery.value = "")}>
              Clear search
            </Button>
          </EmptyState>
        ) : viewMode.value === "list" ? (
          /* LIST VIEW */
          <Table minWidth="720px">
            <Thead>
              <tr>
                <Th class="w-10">
                  <button
                    type="button"
                    onClick$={toggleSelectAll}
                    class="text-theme-accent-primary hover:text-theme-accent-secondary transition-colors"
                    aria-label="Select all"
                  >
                    {selectedFiles.value.size ===
                    filteredAndSortedUploads.value.length ? (
                      <CheckSquare class="h-4 w-4" />
                    ) : (
                      <Square class="h-4 w-4" />
                    )}
                  </button>
                </Th>
                <SortHeader
                  active={sortBy.value === "name"}
                  direction={sortOrder.value}
                  onClick$={() => handleSort("name")}
                >
                  File
                </SortHeader>
                <SortHeader
                  active={sortBy.value === "size"}
                  direction={sortOrder.value}
                  onClick$={() => handleSort("size")}
                >
                  Size
                </SortHeader>
                <SortHeader
                  active={sortBy.value === "views"}
                  direction={sortOrder.value}
                  onClick$={() => handleSort("views")}
                >
                  Views
                </SortHeader>
                <SortHeader
                  active={sortBy.value === "downloads"}
                  direction={sortOrder.value}
                  onClick$={() => handleSort("downloads")}
                >
                  Downloads
                </SortHeader>
                <SortHeader
                  active={sortBy.value === "date"}
                  direction={sortOrder.value}
                  onClick$={() => handleSort("date")}
                >
                  Uploaded
                </SortHeader>
                <Th>Limits</Th>
                <Th class="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {filteredAndSortedUploads.value.map((upload) => (
                <Tr
                  key={upload.id}
                  selected={selectedFiles.value.has(upload.deletionKey)}
                >
                  <Td>
                    <button
                      type="button"
                      onClick$={() => toggleFileSelection(upload.deletionKey)}
                      class="text-theme-accent-primary hover:text-theme-accent-secondary transition-colors"
                      aria-label="Select file"
                    >
                      {selectedFiles.value.has(upload.deletionKey) ? (
                        <CheckSquare class="h-4 w-4" />
                      ) : (
                        <Square class="h-4 w-4" />
                      )}
                    </button>
                  </Td>
                  <Td>
                    <div class="flex items-center gap-3">
                      <FileTypeIcon
                        upload={upload}
                        size="sm"
                        onClick$={() => {
                          if (upload.mimeType.startsWith("image/")) {
                            imagePreview.openPreview(
                              `/f/${upload.shortCode}`,
                              upload.originalName,
                            );
                          }
                        }}
                      />
                      <div class="min-w-0">
                        <p class="text-theme-text-primary truncate text-sm font-medium">
                          {upload.originalName}
                        </p>
                        <p class="text-theme-text-muted truncate text-xs">
                          {upload.mimeType}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>{formatFileSize(upload.size)}</Td>
                  <Td>{upload.views}</Td>
                  <Td>{upload.downloads}</Td>
                  <Td>{new Date(upload.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    {upload.expiresAt || upload.maxViews ? (
                      <div class="flex flex-col gap-1">
                        {upload.expiresAt && (
                          <Badge status="warning">
                            <Clock class="h-3 w-3" />
                            {new Date(upload.expiresAt).toLocaleDateString()}
                          </Badge>
                        )}
                        {upload.maxViews && (
                          <Badge status="info">
                            <Eye class="h-3 w-3" />
                            {upload.views}/{upload.maxViews}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span class="text-theme-text-muted text-xs">No limits</span>
                    )}
                  </Td>
                  <Td>
                    <div class="flex items-center justify-end gap-1">
                      <CopyButton
                        value={`${userData.value.origin}/f/${upload.shortCode}`}
                      />
                      <IconButton
                        href={`/f/${upload.shortCode}`}
                        external
                        size="sm"
                        title="Open file"
                      >
                        <ExternalLink class="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        href={`/dashboard/analytics/${upload.shortCode}`}
                        size="sm"
                        title="Analytics"
                      >
                        <BarChart3 class="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="danger"
                        size="sm"
                        title="Delete"
                        onClick$={() => deleteUpload(upload.deletionKey)}
                      >
                        <Trash2 class="h-4 w-4" />
                      </IconButton>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          /* GRID VIEW */
          <div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedUploads.value.map((upload) => (
              <div
                key={upload.id}
                class={`card-cute group rounded-2xl p-4 transition-colors ${
                  selectedFiles.value.has(upload.deletionKey)
                    ? "ring-theme-accent-primary ring-2"
                    : ""
                }`}
              >
                <div class="relative mb-3">
                  <button
                    type="button"
                    onClick$={() => toggleFileSelection(upload.deletionKey)}
                    class="text-theme-accent-primary hover:text-theme-accent-secondary bg-theme-bg-primary/60 absolute top-2 right-2 z-10 rounded-full p-1 backdrop-blur-sm transition-colors"
                    aria-label="Select file"
                  >
                    {selectedFiles.value.has(upload.deletionKey) ? (
                      <CheckSquare class="h-5 w-5" />
                    ) : (
                      <Square class="h-5 w-5" />
                    )}
                  </button>
                  <div class="from-theme-accent-primary/15 to-theme-accent-secondary/15 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br">
                    <FileTypeIcon
                      upload={upload}
                      size="lg"
                      onClick$={() => {
                        if (upload.mimeType.startsWith("image/")) {
                          imagePreview.openPreview(
                            `/f/${upload.shortCode}`,
                            upload.originalName,
                          );
                        }
                      }}
                    />
                  </div>
                </div>
                <h3
                  class="text-theme-text-primary truncate text-sm font-medium"
                  title={upload.originalName}
                >
                  {upload.originalName}
                </h3>
                <div class="text-theme-text-muted mt-1 flex items-center justify-between text-xs">
                  <span>{formatFileSize(upload.size)}</span>
                  <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="text-theme-text-secondary mt-2 flex items-center justify-between text-xs">
                  <span class="inline-flex items-center gap-1">
                    <Eye class="text-theme-accent-primary h-3 w-3" />
                    {upload.views}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <TrendingUp class="text-theme-accent-secondary h-3 w-3" />
                    {upload.downloads}
                  </span>
                  <MiniChart data={upload.analytics || []} />
                </div>
                <div class="border-theme-card-border/60 mt-3 flex items-center justify-between border-t pt-2">
                  <CopyButton
                    value={`${userData.value.origin}/f/${upload.shortCode}`}
                    label="Copy"
                  />
                  <div class="flex items-center gap-1">
                    <IconButton
                      href={`/f/${upload.shortCode}`}
                      external
                      size="sm"
                      title="Open file"
                    >
                      <ExternalLink class="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      href={`/dashboard/analytics/${upload.shortCode}`}
                      size="sm"
                      title="Analytics"
                    >
                      <BarChart3 class="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="danger"
                      size="sm"
                      title="Delete"
                      onClick$={() => deleteUpload(upload.deletionKey)}
                    >
                      <Trash2 class="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Floating bulk-action bar */}
      {selectedFiles.value.size > 0 && (
        <div class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div class="glass border-theme-card-border flex items-center gap-2 rounded-full border px-4 py-2 shadow-xl">
            <span class="text-theme-text-primary px-2 text-sm font-medium">
              {selectedFiles.value.size} selected
            </span>
            <div class="bg-theme-card-border h-5 w-px" />
            <Button variant="glass" size="sm" onClick$={bulkCopyUrls}>
              <ExternalLink class="h-4 w-4" />
              Copy URLs
            </Button>
            <Button variant="danger" size="sm" onClick$={bulkDelete}>
              <Trash2 class="h-4 w-4" />
              Delete
            </Button>
            <IconButton
              size="sm"
              title="Clear selection"
              onClick$={() => (selectedFiles.value = new Set())}
            >
              <span class="text-lg leading-none">×</span>
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "My Files~ - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "Manage your files with expiration dates and view limits! (◕‿◕)♡",
    },
  ],
};
