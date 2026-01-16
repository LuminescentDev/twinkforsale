import {
  component$,
  $,
  useContext,
  useSignal,
  useComputed$,
} from "@builder.io/qwik";
import { routeLoader$, routeAction$, Link } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { setUploadsViewMode } from "~/lib/cookie-utils";
import {
  Folder,
  Eye,
  HardDrive,
  Clock,
  Copy,
  Trash2,
  Sparkle,
  FileText,
  Ruler,
  Calendar,
  Zap,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  TrendingUp,
  BarChart3,
  CheckSquare,
  Square,
} from "lucide-icons-qwik";
import { ImagePreviewContext } from "~/lib/image-preview-store";
import { FileTypeIcon } from "~/components/file-type-icon";
import { createServerApi } from "~/lib/api/server";
import { getServerUploadsViewMode } from "~/lib/cookie-utils";
import { formatBytes } from "~/lib/utils";
export const useDeleteUpload = routeAction$(async (data, requestEvent) => {
  const user = requestEvent.sharedMap.get("user");

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const uploadIds = data.uploadIds as string[] | string;
  const idsArray = Array.isArray(uploadIds) ? uploadIds : [uploadIds];

  if (!idsArray.length) {
    return { success: false, error: "No upload IDs provided" };
  }

  try {
    const results = [];
    const API_URL = process.env.API_URL || "http://localhost:5000/api";
    const cookies = requestEvent.request.headers.get("cookie") || "";

    // Process each upload ID
    for (const uploadId of idsArray) {
      try {
        const response = await fetch(`${API_URL}/uploads/${uploadId}`, {
          method: "DELETE",
          headers: {
            Cookie: cookies,
          },
        });

        if (response.ok) {
          results.push({ id: uploadId, success: true });
        } else {
          const errorText = await response.text();
          results.push({
            id: uploadId,
            success: false,
            error: errorText || "Failed to delete",
          });
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        results.push({
          id: uploadId,
          success: false,
          error: "Network error",
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
  } catch (error) {
    console.error("Deletion error:", error);
    return { success: false, error: "Failed to delete files" };
  }
});

export const useUserUploads = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");

  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  try {
    const api = createServerApi(requestEvent);
    const uploadsResponse = await api.uploads.list({ pageSize: 1000 });

    // Map uploads to the expected format
    const uploads = uploadsResponse.items.map((upload) => ({
      id: upload.id,
      filename: upload.fileName,
      originalName: upload.originalName,
      shortCode: upload.shortCode,
      mimeType: upload.contentType,
      size: upload.size,
      width: upload.width,
      height: upload.height,
      views: upload.viewCount,
      downloads: 0, // Not tracked in new API yet
      createdAt: upload.createdAt,
      expiresAt: null,
      maxViews: null,
      isPublic: upload.isPublic,
      weeklyViews: 0,
      weeklyDownloads: 0,
      analytics: [],
    }));

    // Get view mode preference from cookies server-side
    const cookieHeader = requestEvent.request.headers.get("cookie");
    const savedViewMode =
      getServerUploadsViewMode(cookieHeader || undefined) || "list";

    // Calculate storage info from user settings
    const storageUsed = user.settings?.storageUsed || 0;
    const maxStorageLimit = user.settings?.maxStorageLimit || 10737418240; // 10GB default

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        maxFileSize: user.settings?.maxFileSize || 104857600, // 100MB default
        maxStorageLimit: maxStorageLimit,
        storageUsed: storageUsed,
        uploads: uploads,
      },
      effectiveStorageLimit: maxStorageLimit,
      origin: requestEvent.url.origin,
      savedViewMode,
    };
  } catch (error) {
    console.error("Failed to load uploads:", error);
    throw requestEvent.redirect(302, "/");
  }
});

export default component$(() => {
  const userData = useUserUploads();
  const deleteUploadAction = useDeleteUpload();
  const imagePreview = useContext(ImagePreviewContext);

  const searchQuery = useSignal("");
  const sortBy = useSignal<
    "name" | "size" | "views" | "downloads" | "date" | "weeklyViews"
  >("date");
  const sortOrder = useSignal<"asc" | "desc">("desc");
  // Initialize viewMode from server-side data
  const viewMode = useSignal<"grid" | "list">(
    userData.value.savedViewMode as "grid" | "list",
  );
  // Bulk selection state
  const selectedFiles = useSignal<Set<string>>(new Set());

  const copyToClipboard = $((text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  });
  const deleteUpload = $(async (uploadId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    const result = await deleteUploadAction.submit({
      uploadIds: uploadId,
    });

    if (result.value.success) {
      // Reload the page to refresh the upload list
      window.location.reload();
    } else {
      alert(result.value.error || "Failed to delete file");
    }
  });

  // Filter and sort uploads
  const filteredAndSortedUploads = useComputed$(() => {
    let uploads = userData.value.user.uploads || [];

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      uploads = uploads.filter(
        (upload: any) =>
          upload.originalName.toLowerCase().includes(query) ||
          upload.mimeType.toLowerCase().includes(query),
      );
    }

    // Sort uploads
    uploads = [...uploads].sort((a: any, b: any) => {
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

  // Bulk action functions
  const toggleFileSelection = $((uploadId: string) => {
    const newSelection = new Set(selectedFiles.value);
    if (newSelection.has(uploadId)) {
      newSelection.delete(uploadId);
    } else {
      newSelection.add(uploadId);
    }
    selectedFiles.value = newSelection;
  });

  const selectAllVisibleFiles = $(() => {
    const allIds = filteredAndSortedUploads.value.map(
      (upload) => upload.id,
    );
    selectedFiles.value = new Set(allIds);
  });

  const deselectAllFiles = $(() => {
    selectedFiles.value = new Set();
  });
  const bulkDelete = $(async () => {
    const selectedCount = selectedFiles.value.size;
    if (selectedCount === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCount} selected file${selectedCount !== 1 ? "s" : ""}?`,
      )
    ) {
      return;
    }

    const result = await deleteUploadAction.submit({
      uploadIds: Array.from(selectedFiles.value),
    });

    if (result.value.success) {
      selectedFiles.value = new Set();
      // Reload the page to refresh the upload list
      window.location.reload();
    } else {
      alert(result.value.error || "Failed to delete files");
    }
  });
  const bulkCopyUrls = $(() => {
    const selectedUploads = filteredAndSortedUploads.value.filter((upload) =>
      selectedFiles.value.has(upload.id),
    );

    const urls = selectedUploads
      .map((upload) => `${userData.value.origin}/f/${upload.shortCode}`)
      .join("\n");

    navigator.clipboard.writeText(urls);
    // Could show a toast notification here
  });
  const formatFileSize = (bytes: number | bigint) => {
    // Convert BigInt to number for calculations
    const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    
    if (numBytes === 0) return "0 Bytes";

    // Handle negative numbers (over quota)
    const isNegative = numBytes < 0;
    const absoluteBytes = Math.abs(numBytes);

    const formattedSize = formatBytes(absoluteBytes);
    return isNegative ? `-${formattedSize}` : formattedSize;
  };
  const handleSort = $(
    (
      column: "name" | "size" | "views" | "downloads" | "date" | "weeklyViews",
    ) => {
      if (sortBy.value === column) {
        // Toggle sort order if clicking the same column
        sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
      } else {
        // Set new column and default to descending
        sortBy.value = column;
        sortOrder.value = "desc";
      }
    },
  );
  const getSortIcon = (
    column: "name" | "size" | "views" | "downloads" | "date" | "weeklyViews",
  ) => {
    if (sortBy.value !== column) {
      return (
        <ArrowUpDown class="text-theme-text-muted ml-1 inline h-3 w-3 opacity-50" />
      );
    }
    return sortOrder.value === "asc" ? (
      <ArrowUp class="text-theme-text-muted ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown class="text-theme-text-muted ml-1 inline h-3 w-3" />
    );
  }; // Mini analytics chart component for grid view
  const MiniChart = component$(({ data }: { data: any[] }) => {
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

  return (
    <div>
      {/* Page Header */}
      <div class="mb-6 text-center sm:mb-8">
        <h1 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-3xl font-bold sm:text-4xl">
          My Files~
        </h1>
        <p class="text-theme-text-secondary px-4 text-base sm:text-lg">
          Manage your files with expiration dates and view limits! (◕‿◕)♡
        </p>
      </div>

      {/* Stats Summary */}
      <div class="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-4">
        <div class="card-cute pulse-soft rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="from-theme-accent-primary to-theme-accent-secondary rounded-full bg-gradient-to-br p-2 sm:p-3">
              <Folder class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium sm:text-sm">
                {searchQuery.value.trim() ? "Filtered Files~" : "Total Files~"}
                <Sparkle class="h-3 w-3 sm:h-4 sm:w-4" />
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {searchQuery.value.trim()
                  ? filteredAndSortedUploads.value.length
                  : userData.value.user.uploads.length}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute pulse-soft rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="from-theme-accent-secondary to-theme-accent-tertiary rounded-full bg-gradient-to-br p-2 sm:p-3">
              <Eye class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium sm:text-sm">
                {searchQuery.value.trim() ? "Filtered Views~" : "Total Views~"}
                <Sparkle class="h-3 w-3 sm:h-4 sm:w-4" />
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {searchQuery.value.trim()
                  ? filteredAndSortedUploads.value.reduce(
                      (sum, upload) => sum + upload.views,
                      0,
                    )
                  : userData.value.user.uploads.reduce(
                      (sum, upload) => sum + upload.views,
                      0,
                    )}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute pulse-soft rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="from-theme-accent-quaternary to-theme-accent-primary rounded-full bg-gradient-to-br p-2 sm:p-3">
              <TrendingUp class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium sm:text-sm">
                {searchQuery.value.trim()
                  ? "Filtered Downloads~"
                  : "Total Downloads~"}
                <Sparkle class="h-3 w-3 sm:h-4 sm:w-4" />
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {searchQuery.value.trim()
                  ? filteredAndSortedUploads.value.reduce(
                      (sum, upload) => sum + upload.downloads,
                      0,
                    )
                  : userData.value.user.uploads.reduce(
                      (sum, upload) => sum + upload.downloads,
                      0,
                    )}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute pulse-soft rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="from-theme-accent-tertiary to-theme-accent-quaternary rounded-full bg-gradient-to-br p-2 sm:p-3">
              <HardDrive class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium sm:text-sm">
                Storage Used~
                <Sparkle class="h-3 w-3 sm:h-4 sm:w-4" />
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-xl">
                {formatFileSize(userData.value.user.storageUsed)} /{" "}
                {formatFileSize(userData.value.effectiveStorageLimit)}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute pulse-soft rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="from-theme-accent-quaternary to-theme-accent-primary rounded-full bg-gradient-to-br p-2 sm:p-3">
              <Clock class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium sm:text-sm">
                Available Space~
                <Sparkle class="h-3 w-3 sm:h-4 sm:w-4" />
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {formatFileSize(
                  userData.value.effectiveStorageLimit -
                    userData.value.user.storageUsed,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploads Section */}
      <div class="card-cute overflow-hidden rounded-3xl">
        <div class="border-theme-card-border border-b px-4 py-4 sm:px-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-gradient-cute flex flex-wrap items-center text-lg font-bold sm:text-xl">
              All Files~ 📋 <span class="sparkle ml-2">✨</span>
              {searchQuery.value.trim() && (
                <span class="text-theme-text-muted ml-2 text-sm font-normal">
                  ({filteredAndSortedUploads.value.length} of{" "}
                  {userData.value.user.uploads.length} files)
                </span>
              )}
            </h2>
            <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {/* View Mode Toggle */}
              <div class="bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-card-border flex rounded-full border p-1">
                <button
                  onClick$={() => {
                    viewMode.value = "list";
                    setUploadsViewMode("list");
                  }}
                  class={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    viewMode.value === "list"
                      ? "text-theme-text-primary from-theme-accent-primary to-theme-accent-secondary bg-gradient-to-br shadow-lg"
                      : "text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary/10"
                  }`}
                >
                  <List class="h-4 w-4" />
                  List
                </button>
                <button
                  onClick$={() => {
                    viewMode.value = "grid";
                    setUploadsViewMode("grid");
                  }}
                  class={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    viewMode.value === "grid"
                      ? "text-theme-text-primary from-theme-accent-primary to-theme-accent-secondary bg-gradient-to-br shadow-lg"
                      : "text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary/10"
                  }`}
                >
                  <Grid class="h-4 w-4" />
                  Grid
                </button>
              </div>
              {/* Search Input */}
              <div class="group relative w-full max-w-md sm:w-auto">
                <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                  <div class="text-theme-accent-primary drop-shadow-md drop-shadow-theme-accent-primary">
                    <Search class="h-4 w-4 transition-colors duration-300" />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search files by name or type..."
                  value={searchQuery.value}
                  onInput$={(e) => {
                    searchQuery.value = (e.target as HTMLInputElement).value;
                  }}
                  class="border-theme-card-border text-theme-text-primary from-theme-accent-tertiary/10 via-theme-accent-primary/10 to-theme-accent-secondary/10 w-full rounded-full border bg-gradient-to-br py-2 pr-4 pl-10 text-sm backdrop-blur-sm transition-all duration-500"
                />
                <div class="from-theme-accent-quaternary/5 via-theme-accent-tertiary/5 to-theme-accent-secondary/5 pointer-events-none absolute inset-0 rounded-full bg-linear-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </div>
          </div>
          {/* Bulk Selection Controls */}
          <div class="border-theme-card-border border-t px-4 pt-3 sm:px-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <div
                  class={`transition-all duration-300 ${selectedFiles.value.size > 0 ? "opacity-100" : "opacity-50"}`}
                >
                  <div class="bg-gradient-theme-secondary/20 text-theme-accent-primary flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm">
                    <Sparkle class="h-3 w-3" />
                    <span class="text-sm font-medium">
                      {selectedFiles.value.size} file
                      {selectedFiles.value.size !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                </div>
              </div>

              <div
                class={`flex items-center gap-2 transition-all duration-300 ${selectedFiles.value.size > 0 ? "opacity-100" : "pointer-events-none opacity-30"}`}
              >
                <button
                  onClick$={bulkCopyUrls}
                  class="text-theme-accent-tertiary flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10"
                >
                  <Copy class="h-4 w-4" />
                  Copy URLs ({selectedFiles.value.size})
                </button>
                <button
                  onClick$={bulkDelete}
                  class="text-theme-accent-primary flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10"
                >
                  <Trash2 class="h-4 w-4" />
                  Delete ({selectedFiles.value.size})
                </button>
              </div>
            </div>
          </div>
        </div>
        {userData.value.user.uploads.length > 0 ? (
          viewMode.value === "list" ? (
            /* LIST VIEW */
            <div class="overflow-x-auto">
              <table class="w-full min-w-[600px]">
                <thead class="glass">
                  <tr>
                    <th class="text-theme-text-muted px-3 py-3 text-left text-xs font-medium tracking-wider uppercase sm:px-6">
                      <button
                        onClick$={() => {
                          if (
                            selectedFiles.value.size ===
                            filteredAndSortedUploads.value.length
                          ) {
                            deselectAllFiles();
                          } else {
                            selectAllVisibleFiles();
                          }
                        }}
                        class="text-theme-accent-primary hover:text-theme-accent-secondary transition-colors"
                      >
                        {selectedFiles.value.size ===
                        filteredAndSortedUploads.value.length ? (
                          <CheckSquare class="h-4 w-4" />
                        ) : (
                          <Square class="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th
                      class="text-theme-text-muted hover:text-theme-text-secondary cursor-pointer px-3 py-3 text-left text-xs font-medium tracking-wider uppercase transition-colors sm:px-6"
                      onClick$={() => handleSort("name")}
                    >
                      File~ <FileText class="inline h-4 w-4" />
                      {getSortIcon("name")}
                    </th>
                    <th
                      class="text-theme-text-muted hover:text-theme-text-secondary cursor-pointer px-3 py-3 text-left text-xs font-medium tracking-wider uppercase transition-colors sm:px-6"
                      onClick$={() => handleSort("size")}
                    >
                      Size~ <Ruler class="inline h-4 w-4" />
                      {getSortIcon("size")}
                    </th>
                    <th
                      class="text-theme-text-muted hover:text-theme-text-secondary cursor-pointer px-3 py-3 text-left text-xs font-medium tracking-wider uppercase transition-colors sm:px-6"
                      onClick$={() => handleSort("views")}
                    >
                      Views~ <Eye class="inline h-4 w-4" />
                      {getSortIcon("views")}
                    </th>{" "}
                    <th
                      class="text-theme-text-muted hover:text-theme-text-secondary cursor-pointer px-3 py-3 text-left text-xs font-medium tracking-wider uppercase transition-colors sm:px-6"
                      onClick$={() => handleSort("downloads")}
                    >
                      Downloads~ <TrendingUp class="inline h-4 w-4" />
                      {getSortIcon("downloads")}
                    </th>
                    <th
                      class="text-theme-text-muted hover:text-theme-text-secondary cursor-pointer px-3 py-3 text-left text-xs font-medium tracking-wider uppercase transition-colors sm:px-6"
                      onClick$={() => handleSort("weeklyViews")}
                    >
                      7d Views~ <BarChart3 class="inline h-4 w-4" />
                      {getSortIcon("weeklyViews")}
                    </th>
                    <th
                      class="text-theme-text-muted hover:text-theme-text-secondary cursor-pointer px-3 py-3 text-left text-xs font-medium tracking-wider uppercase transition-colors sm:px-6"
                      onClick$={() => handleSort("date")}
                    >
                      Uploaded~ <Calendar class="inline h-4 w-4" />
                      {getSortIcon("date")}
                    </th>
                    <th class="text-theme-text-muted px-3 py-3 text-left text-xs font-medium tracking-wider uppercase sm:px-6">
                      Limits~ <Clock class="inline h-4 w-4" />
                    </th>
                    <th class="text-theme-text-muted px-3 py-3 text-left text-xs font-medium tracking-wider uppercase sm:px-6">
                      Actions~ <Zap class="inline h-4 w-4" />
                    </th>
                  </tr>
                </thead>
                <tbody class="border-theme-card">
                  {filteredAndSortedUploads.value.map((upload) => (
                    <tr
                      key={upload.id}
                      class={`border-theme-card-border transition-all duration-300 hover:bg-white/5 ${
                        selectedFiles.value.has(upload.id)
                          ? "from-theme-accent-quaternary/10 to-theme-accent-primary/10 border-theme-accent-primary/20 bg-gradient-to-br"
                          : ""
                      }`}
                    >
                      <td class="px-3 py-4 sm:px-6">
                        <button
                          onClick$={() =>
                            toggleFileSelection(upload.id)
                          }
                          class="text-theme-accent-primary hover:text-theme-accent-secondary transition-colors"
                        >
                          {selectedFiles.value.has(upload.id) ? (
                            <CheckSquare class="h-4 w-4" />
                          ) : (
                            <Square class="h-4 w-4" />
                          )}
                        </button>
                      </td>{" "}
                      <td class="px-3 py-4 sm:px-6">
                        <div class="flex items-center space-x-2 sm:space-x-3">
                          <div class="flex-shrink-0">
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
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-theme-text-primary truncate text-sm font-medium sm:text-base">
                              {upload.originalName}
                            </p>
                            <p class="text-theme-text-secondary truncate text-xs sm:text-sm">
                              {upload.mimeType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="text-theme-text-secondary px-3 py-4 text-sm sm:px-6">
                        {formatFileSize(upload.size)}
                      </td>
                      <td class="text-theme-text-secondary px-3 py-4 text-sm sm:px-6">
                        <div class="flex items-center gap-2">
                          <span>{upload.views}</span>
                          <div class="text-theme-accent-primary">
                            <TrendingUp class="h-4 w-4" />
                          </div>
                        </div>
                      </td>{" "}
                      <td class="text-theme-text-secondary px-3 py-4 text-sm sm:px-6">
                        <div class="flex items-center gap-2">
                          <span>{upload.downloads}</span>
                          <div class="text-theme-accent-primary">
                            <TrendingUp class="h-4 w-4" />
                          </div>
                        </div>
                      </td>
                      <td class="text-theme-text-secondary px-3 py-4 text-sm sm:px-6">
                        <div class="flex items-center gap-2">
                          <span class="text-theme-accent-primary font-bold">
                            {upload.weeklyViews || 0}
                          </span>
                          <div class="text-theme-accent-primary">
                            <BarChart3 class="h-4 w-4" />
                          </div>
                        </div>
                      </td>
                      <td class="text-theme-text-secondary px-3 py-4 text-sm sm:px-6">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </td>
                      <td class="text-theme-text-secondary px-3 py-4 text-sm sm:px-6">
                        <div class="space-y-1">
                          {upload.expiresAt && (
                            <div class="flex items-center gap-1 text-xs">
                              <Clock class="h-3 w-3" />
                              <span>
                                Expires:{" "}
                                {new Date(
                                  upload.expiresAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {upload.maxViews && (
                            <div class="flex items-center gap-1 text-xs">
                              <Eye class="h-3 w-3" />
                              <span>
                                {upload.views}/{upload.maxViews} views
                              </span>
                            </div>
                          )}
                          {!upload.expiresAt && !upload.maxViews && (
                            <span class="text-theme-text-muted text-xs">
                              No limits
                            </span>
                          )}
                        </div>
                      </td>{" "}
                      <td class="px-3 py-4 sm:px-6">
                        <div class="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                          <button
                            onClick$={() =>
                              copyToClipboard(
                                `${userData.value.origin}/f/${upload.shortCode}`,
                              )
                            }
                            class="text-theme-accent-tertiary rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:bg-white/10 sm:px-2"
                          >
                            Copy <Copy class="inline h-3 w-3" />
                          </button>
                          <a
                            href={`/f/${upload.shortCode}`}
                            target="_blank"
                            class="text-theme-accent-secondary rounded-full px-2 py-1 text-center text-xs font-medium whitespace-nowrap transition-all duration-300 hover:bg-white/10 sm:px-2"
                          >
                            View <Eye class="inline h-3 w-3" />
                          </a>
                          <a
                            href={`/dashboard/analytics/${upload.shortCode}`}
                            class="text-theme-accent-secondary rounded-full px-2 py-1 text-center text-xs font-medium whitespace-nowrap transition-all duration-300 hover:bg-white/10 sm:px-2"
                          >
                            Analytics <BarChart3 class="inline h-3 w-3" />
                          </a>
                          <button
                            onClick$={() => deleteUpload(upload.id)}
                            class="text-theme-accent-primary rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:bg-white/10 sm:px-2"
                          >
                            Delete <Trash2 class="inline h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW */
            <div class="p-4 sm:p-6">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedUploads.value.map((upload) => (
                  <div
                    key={upload.id}
                    class={`card-cute group rounded-2xl p-4 transition-all duration-300 hover:scale-105 ${
                      selectedFiles.value.has(upload.id)
                        ? "ring-theme-accent-primary from-theme-accent-quaternary/10 to-theme-accent-primary/10 bg-gradient-to-br ring-2"
                        : ""
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div class="relative mb-2">
                      <button
                        onClick$={() => toggleFileSelection(upload.id)}
                        class="text-theme-accent-primary hover:text-theme-accent-secondary absolute top-0 right-0 z-10 rounded-full bg-white/20 p-1 backdrop-blur-sm transition-all duration-300"
                      >
                        {selectedFiles.value.has(upload.id) ? (
                          <CheckSquare class="h-5 w-5" />
                        ) : (
                          <Square class="h-5 w-5" />
                        )}
                      </button>
                    </div>{" "}
                    {/* File Preview */}
                    <div class="bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20 mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl">
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
                    {/* File Info */}
                    <div class="space-y-2">
                      <h3
                        class="text-theme-text-primary truncate text-sm font-medium"
                        title={upload.originalName}
                      >
                        {upload.originalName}
                      </h3>
                      <div class="text-theme-text-secondary flex items-center justify-between text-xs">
                        <span>{formatFileSize(upload.size)}</span>
                        <span>
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Analytics */}{" "}
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1">
                            <div class="text-theme-accent-primary">
                              <Eye class="h-3 w-3" />
                            </div>
                            <span class="text-theme-text-secondary text-xs">
                              {upload.views} views
                            </span>
                          </div>
                          <div class="flex items-center gap-1">
                            <div class="text-theme-accent-secondary">
                              <TrendingUp class="h-3 w-3" />
                            </div>
                            <span class="text-theme-text-secondary text-xs">
                              {upload.downloads} downloads
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-theme-text-muted text-xs">
                            7 days: {upload.weeklyViews || 0} views
                          </span>
                          <span class="text-theme-text-muted text-xs">
                            {upload.weeklyDownloads || 0} downloads
                          </span>
                        </div>
                        {/* Mini chart */}
                        <div class="flex items-center gap-2">
                          <span class="text-theme-text-muted text-xs">
                            7 days:
                          </span>
                          <MiniChart data={upload.analytics || []} />
                        </div>
                      </div>
                      {/* Expiration and View Limits */}
                      {(upload.expiresAt || upload.maxViews) && (
                        <div class="border-theme-card-border mt-2 border-t pt-2">
                          <div class="text-theme-text-muted mb-1 text-xs font-medium">
                            Limits:
                          </div>
                          <div class="space-y-1">
                            {upload.expiresAt && (
                              <div class="flex items-center gap-1 text-xs">
                                <Clock class="text-theme-accent-tertiary h-3 w-3" />
                                <span class="text-theme-text-secondary">
                                  Expires:{" "}
                                  {new Date(
                                    upload.expiresAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {upload.maxViews && (
                              <div class="flex items-center gap-1 text-xs">
                                <Eye class="text-theme-accent-quaternary h-3 w-3" />
                                <span class="text-theme-text-secondary">
                                  {upload.views}/{upload.maxViews} views
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Actions */}
                      <div class="flex gap-1 pt-2">
                        <button
                          onClick$={() =>
                            copyToClipboard(
                              `${userData.value.origin}/f/${upload.shortCode}`,
                            )
                          }
                          class="text-theme-accent-tertiary flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-300 hover:bg-white/10"
                        >
                          <Copy class="mr-1 inline h-3 w-3" />
                          Copy
                        </button>{" "}
                        <a
                          href={`/f/${upload.shortCode}`}
                          target="_blank"
                          class="text-theme-accent-secondary flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition-all duration-300 hover:bg-white/10"
                        >
                          <Eye class="mr-1 inline h-3 w-3" />
                          View
                        </a>
                        <a
                          href={`/dashboard/analytics/${upload.shortCode}`}
                          class="text-theme-accent-secondary flex-1 rounded-lg px-2 py-1 text-center text-xs font-medium transition-all duration-300 hover:bg-white/10"
                        >
                          <BarChart3 class="mr-1 inline h-3 w-3" />
                          Analytics
                        </a>
                        <button
                          onClick$={() => deleteUpload(upload.id)}
                          class="text-theme-accent-primary flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-300 hover:bg-white/10"
                        >
                          <Trash2 class="mr-1 inline h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : userData.value.user.uploads.length === 0 ? (
          <div class="py-12 text-center">
            <div class="glass mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <div class="text-3xl">📁</div>
            </div>
            <h3 class="text-theme-text-primary mb-2 text-lg font-medium">
              No files yet~ ✨
            </h3>
            <p class="text-theme-text-secondary mb-4">
              Your files will appear here once uploaded via ShareX or API!
              (◕‿◕)♡
            </p>
            <Link
              href="/setup/sharex"
              class="btn-cute text-theme-text-primary inline-block rounded-full px-6 py-3 font-medium"
            >
              Setup ShareX to get started~ 🚀
            </Link>
          </div>
        ) : (
          <div class="py-12 text-center">
            <div class="glass mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <div class="text-theme-accent-primary">
                <Search class="h-8 w-8" />
              </div>
            </div>
            <h3 class="text-theme-text-primary mb-2 text-lg font-medium">
              No files found~ 🔍
            </h3>
            <p class="text-theme-text-secondary mb-4">
              Try searching with a different term! (◕‿◕)♡
            </p>
            <button
              onClick$={() => {
                searchQuery.value = "";
              }}
              class="btn-cute text-theme-text-primary inline-block rounded-full px-6 py-3 font-medium"
            >
              Clear Search~ ✨
            </button>
          </div>
        )}
      </div>
      {/* Floating Action Bar */}
      {selectedFiles.value.size > 0 && (
        <div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
          <div class="card-cute flex items-center gap-3 rounded-full px-6 py-3 shadow-xl backdrop-blur-sm">
            <span class="text-theme-text-primary text-sm font-medium">
              {selectedFiles.value.size} file
              {selectedFiles.value.size !== 1 ? "s" : ""} selected
            </span>
            <div class="h-4 w-px bg-white/20"></div>
            <button
              onClick$={bulkCopyUrls}
              class="text-theme-accent-tertiary flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10"
            >
              <Copy class="h-4 w-4" />
              Copy URLs
            </button>
            <button
              onClick$={bulkDelete}
              class="text-theme-accent-primary flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10"
            >
              <Trash2 class="h-4 w-4" />
              Delete
            </button>
            <button
              onClick$={() => {
                selectedFiles.value = new Set();
              }}
              class="text-theme-text-muted hover:text-theme-text-secondary flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10"
            >
              ✕ Clear
            </button>
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
