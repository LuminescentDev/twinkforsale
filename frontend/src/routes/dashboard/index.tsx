import {
  component$,
  $,
  useContext,
  useSignal,
  useComputed$,
  useStore,
  useTask$,
} from "@builder.io/qwik";
import { isServer } from "@builder.io/qwik/build";
import { routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  FolderOpen,
  SearchX,
  ExternalLink,
  BarChart3,
  Trash2,
  EllipsisVertical,
  List,
  LayoutGrid,
  Eye,
  Download,
} from "lucide-icons-qwik";
import { ImagePreviewContext } from "~/lib/image-preview-store";
import { SavedFilters } from "~/components/files/saved-filters";
import { library } from "~/lib/library-api";
import { FileTypeIcon } from "~/components/file-type-icon";
import { api, serverAuth, type UploadListItem } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import {
  setUploadsViewMode,
  getServerUploadsViewMode,
} from "~/lib/cookie-utils";
import {
  fileKindLabels,
  fileTypeLabel,
  formatRelativeDate,
  formatAbsoluteDate,
  describeExpiry,
  type FileKind,
} from "~/lib/file-kinds";
import { useToast } from "~/lib/toast-store";
import {
  Page,
  PageHeader,
  Surface,
  Button,
  IconButton,
  CopyButton,
  SearchField,
  CollectionToolbar,
  SelectionBar,
  SegmentedControl,
  Select,
  Table,
  Thead,
  Tbody,
  Th,
  SortHeader,
  Tr,
  Td,
  TdMeta,
  Checkbox,
  EmptyState,
  Callout,
  Badge,
  Meter,
  DropdownMenu,
  MenuItem,
  Dialog,
} from "~/components/ui";

export const useDeleteUploads = routeAction$(async (data, requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    return { ok: false as const, error: "Not signed in." };
  }

  const raw = data.ids as string[] | string;
  const ids = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
  if (!ids.length) {
    return { ok: false as const, error: "No files selected." };
  }

  const failed: string[] = [];
  for (const id of ids) {
    try {
      await api.dashboard.deleteUpload(id, auth);
    } catch {
      failed.push(id);
    }
  }

  return {
    ok: true as const,
    deleted: ids.filter((id) => !failed.includes(id)),
    failed,
  };
});

export const useFiles = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  // The collection endpoints require an approved account, so an unapproved
  // user is not shown a network error for something that is working correctly.
  const [uploadsRes, summary] = user.isApproved
    ? await Promise.all([
        api.dashboard.uploads(auth).then(
          (r) => ({ ...r, failed: false }),
          () => ({
            uploads: [] as UploadListItem[],
            total: 0,
            filteredTotal: 0,
            page: 1,
            pageSize: 50,
            failed: true,
          }),
        ),
        api.dashboard.summary(auth).catch(() => null),
      ])
    : [
        {
          uploads: [] as UploadListItem[],
          total: 0,
          filteredTotal: 0,
          page: 1,
          pageSize: 50,
          failed: false,
        },
        null,
      ];

  return {
    files: uploadsRes,
    savedFilters: user.isApproved ? (await library.filters(auth)).filters : [],
    loadFailed: uploadsRes.failed,
    isApproved: user.isApproved,
    // Set when a guarded route bounced the user back here.
    approvalError: requestEvent.url.searchParams.get("error"),
    storageUsed: summary?.storageUsed ?? 0,
    storageLimit: summary?.storageLimit ?? 0,
    origin: requestEvent.url.origin,
    viewMode:
      getServerUploadsViewMode(
        requestEvent.request.headers.get("cookie") || undefined,
      ) || "list",
  };
});

type SortKey = "date" | "name" | "size" | "views" | "downloads";

export default component$(() => {
  const data = useFiles();
  const deleteAction = useDeleteUploads();
  const imagePreview = useContext(ImagePreviewContext);
  const toast = useToast();

  const search = useSignal("");
  const kindFilter = useSignal<FileKind | "all">("all");
  const sortKey = useSignal<SortKey>("date");
  const sortDir = useSignal<"asc" | "desc">("desc");
  const viewMode = useSignal(data.value.viewMode);
  const tag = useSignal("");
  const favorites = useSignal(false);
  const period = useSignal("all");
  const files = useSignal(data.value.files);
  const page = useSignal(1);
  const loading = useSignal(false);
  const loadFailed = useSignal(data.value.loadFailed);
  const refresh = useSignal(0);
  const previousFilters = useSignal('["","all","date","desc","",false,"all"]');
  const loadedRequest = useSignal(
    '["","all","date","desc","",false,"all",1,0]',
  );

  const selection = useStore<{ ids: string[] }>({ ids: [] });
  const deleteOpen = useSignal(false);
  const deleteBusy = useSignal(false);
  /** Ids removed locally after a successful delete, so the list updates at once. */
  const removed = useStore<{ ids: string[] }>({ ids: [] });
  const partialFailure = useSignal<number>(0);

  const allFiles = useComputed$(() =>
    files.value.uploads.filter((u) => !removed.ids.includes(u.id)),
  );

  const visible = allFiles;
  const pageLabel = useComputed$(
    () =>
      `Page ${files.value.page} of ${Math.ceil(files.value.filteredTotal / files.value.pageSize)}`,
  );

  useTask$(({ track, cleanup }) => {
    const query = track(() => search.value.trim());
    const kind = track(() => kindFilter.value);
    const sort = track(() => sortKey.value);
    const direction = track(() => sortDir.value);
    const currentTag = track(() => tag.value.trim());
    const favoritesOnly = track(() => favorites.value);
    const currentPeriod = track(() => period.value);
    let currentPage = track(() => page.value);
    const revision = track(() => refresh.value);
    if (isServer || !data.value.isApproved) return;

    const filters = JSON.stringify([
      query,
      kind,
      sort,
      direction,
      currentTag,
      favoritesOnly,
      currentPeriod,
    ]);
    if (previousFilters.value !== filters) {
      previousFilters.value = filters;
      currentPage = 1;
      page.value = 1;
    }
    const request = JSON.stringify([
      query,
      kind,
      sort,
      direction,
      currentTag,
      favoritesOnly,
      currentPeriod,
      currentPage,
      revision,
    ]);
    if (loadedRequest.value === request) {
      loading.value = false;
      loadFailed.value = files.value.failed;
      return;
    }

    const controller = new AbortController();
    loading.value = true;
    selection.ids = [];
    const timer = setTimeout(async () => {
      try {
        const result = await api.uploads.list(
          { signal: controller.signal },
          {
            search: query,
            kind,
            sort,
            direction,
            page: currentPage,
            tag: currentTag,
            favoritesOnly,
            period: currentPeriod,
          },
        );
        if (controller.signal.aborted) return;
        files.value = { ...result, failed: false };
        removed.ids = [];
        loadFailed.value = false;
        loadedRequest.value = JSON.stringify([
          query,
          kind,
          sort,
          direction,
          currentTag,
          favoritesOnly,
          currentPeriod,
          result.page,
          revision,
        ]);
        page.value = result.page;
      } catch {
        if (!controller.signal.aborted) loadFailed.value = true;
      } finally {
        if (!controller.signal.aborted) loading.value = false;
      }
    }, 250);
    cleanup(() => {
      clearTimeout(timer);
      controller.abort();
    });
  });

  const isFiltered = useComputed$(
    () =>
      search.value.trim().length > 0 ||
      kindFilter.value !== "all" ||
      !!tag.value ||
      favorites.value ||
      period.value !== "all",
  );

  const selectedFiles = useComputed$(() =>
    allFiles.value.filter((u) => selection.ids.includes(u.id)),
  );

  const toggleSort = $((key: SortKey) => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    } else {
      sortKey.value = key;
      // Text reads best A→Z; numbers and dates read best largest/newest first.
      sortDir.value = key === "name" ? "asc" : "desc";
    }
  });

  const toggleOne = $((id: string, checked: boolean) => {
    if (checked) {
      if (!selection.ids.includes(id)) selection.ids.push(id);
    } else {
      selection.ids = selection.ids.filter((x) => x !== id);
    }
  });

  const toggleAllVisible = $(() => {
    const visibleIds = visible.value.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selection.ids.includes(id));
    selection.ids = allSelected
      ? selection.ids.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...selection.ids, ...visibleIds]));
  });

  const copySelectedLinks = $(async () => {
    const links = selectedFiles.value
      .map((u) => `${data.value.origin}/f/${u.shortCode}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(links);
      toast.success(
        `Copied ${selectedFiles.value.length} link${selectedFiles.value.length === 1 ? "" : "s"}`,
      );
    } catch {
      toast.error(
        "Could not copy to the clipboard",
        "Your browser blocked clipboard access. Copy a link from its row instead.",
      );
    }
  });

  const confirmDelete = $(async () => {
    deleteBusy.value = true;
    partialFailure.value = 0;
    const result = await deleteAction.submit({ ids: [...selection.ids] });
    deleteBusy.value = false;

    if (!result.value.ok) {
      toast.error("Could not delete", result.value.error);
      return;
    }

    const { deleted, failed } = result.value;
    files.value = {
      ...files.value,
      total: Math.max(0, files.value.total - deleted.length),
      filteredTotal: Math.max(0, files.value.filteredTotal - deleted.length),
    };
    removed.ids = [...removed.ids, ...deleted];
    // Anything that failed stays selected so it can be retried directly.
    selection.ids = failed;
    deleteOpen.value = false;
    if (failed.length === 0) refresh.value++;

    if (failed.length === 0) {
      toast.success(
        `Deleted ${deleted.length} file${deleted.length === 1 ? "" : "s"}`,
      );
    } else {
      partialFailure.value = failed.length;
      toast.error(
        `${failed.length} of ${deleted.length + failed.length} files could not be deleted`,
        "They are still selected. Try again, or delete them one at a time.",
      );
    }
  });

  const openImage = $((upload: UploadListItem) => {
    if (upload.mimeType.startsWith("image/")) {
      imagePreview.openPreview(`/f/${upload.shortCode}`, upload.originalName);
    }
  });

  const hasSelection = selection.ids.length > 0;
  const visibleIds = visible.value.map((u) => u.id);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selection.ids.includes(id));

  return (
    <Page>
      <PageHeader title="Files">
        {data.value.storageLimit > 0 && (
          <Meter
            q:slot="actions"
            label="Storage used"
            used={formatBytes(data.value.storageUsed, 1)}
            total={formatBytes(data.value.storageLimit, 0)}
            percent={(data.value.storageUsed / data.value.storageLimit) * 100}
            class="w-48"
          />
        )}
      </PageHeader>

      {!data.value.isApproved && (
        <Callout tone="warning" title="Account pending approval" class="mb-4">
          {data.value.approvalError === "upload_not_approved"
            ? "Uploading needs an approved account. You can sign in and configure everything else in the meantime."
            : data.value.approvalError === "bio_not_approved"
              ? "Bio pages need an approved account. You can sign in and configure everything else in the meantime."
              : "You can sign in and configure your account, but uploads, bio pages and API keys stay disabled until an administrator approves it."}
        </Callout>
      )}

      {loadFailed.value && (
        <Callout tone="danger" title="Could not load your files" class="mb-4">
          The server did not respond. Reload the page to try again — nothing has
          been deleted.
          <Button
            q:slot="actions"
            size="sm"
            variant="secondary"
            onClick$={() => refresh.value++}
          >
            Reload
          </Button>
        </Callout>
      )}

      {partialFailure.value > 0 && (
        <Callout tone="danger" title="Some files were not deleted" class="mb-4">
          {partialFailure.value} file
          {partialFailure.value === 1 ? "" : "s"} could not be deleted and
          {partialFailure.value === 1 ? " remains" : " remain"} selected below.
        </Callout>
      )}

      {/* Toolbar, or the selection bar while a selection exists. */}
      <SavedFilters
        initial={data.value.savedFilters}
        search={search}
        kind={kindFilter}
        sort={sortKey}
        direction={sortDir}
        tag={tag}
        favorites={favorites}
        period={period}
      />
      <div class="mb-3">
        {hasSelection ? (
          <SelectionBar
            count={selection.ids.length}
            total={allFiles.value.length}
            allSelected={selection.ids.length === allFiles.value.length}
            onSelectAll$={$(() => {
              selection.ids =
                selection.ids.length === allFiles.value.length
                  ? []
                  : allFiles.value.map((u) => u.id);
            })}
            onClear$={$(() => (selection.ids = []))}
          >
            <Button size="sm" variant="secondary" onClick$={copySelectedLinks}>
              Copy links
            </Button>
            <Button
              size="sm"
              variant="secondary"
              href={`/dashboard/albums?files=${selection.ids.join(",")}`}
            >
              Add to album
            </Button>
            {selection.ids.length === 1 && (
              <Button
                size="sm"
                variant="secondary"
                href={`/dashboard/files/${selection.ids[0]}`}
              >
                File settings
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick$={() => (deleteOpen.value = true)}
              class="text-danger hover:text-danger"
            >
              <Trash2 class="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </SelectionBar>
        ) : (
          <CollectionToolbar>
            <SearchField
              value={search}
              label="Search files"
              placeholder="Search by name, code or type"
              class="min-w-[11rem] flex-1"
              resultSummary={
                loading.value
                  ? "Loading files"
                  : `${files.value.filteredTotal} matching files`
              }
            />

            <div class="w-[8.5rem] shrink-0">
              <label class="sr-only" for="kind-filter">
                Filter by type
              </label>
              <Select
                id="kind-filter"
                value={kindFilter.value}
                onChange$={(_, el) =>
                  (kindFilter.value = el.value as FileKind | "all")
                }
              >
                <option value="all">All types</option>
                {(Object.keys(fileKindLabels) as FileKind[]).map((k) => (
                  <option key={k} value={k}>
                    {fileKindLabels[k]}
                  </option>
                ))}
              </Select>
            </div>

            <div class="w-[10.5rem] shrink-0">
              <label class="sr-only" for="sort-order">
                Sort by
              </label>
              <Select
                id="sort-order"
                value={`${sortKey.value}:${sortDir.value}`}
                onChange$={(_, el) => {
                  const [key, dir] = el.value.split(":");
                  sortKey.value = key as SortKey;
                  sortDir.value = dir as "asc" | "desc";
                }}
              >
                <option value="date:desc">Newest first</option>
                <option value="date:asc">Oldest first</option>
                <option value="name:asc">Name A–Z</option>
                <option value="name:desc">Name Z–A</option>
                <option value="size:desc">Largest first</option>
                <option value="views:desc">Most viewed</option>
                <option value="downloads:desc">Most downloaded</option>
              </Select>
            </div>

            <div class="ml-auto flex shrink-0 items-center gap-4">
              <SegmentedControl
                label="File view"
                value={viewMode}
                onChange$={$((v: string) =>
                  setUploadsViewMode(v as "grid" | "list"),
                )}
                size="sm"
                options={[
                  { value: "list", label: "List", icon: List, iconOnly: true },
                  {
                    value: "grid",
                    label: "Grid",
                    icon: LayoutGrid,
                    iconOnly: true,
                  },
                ]}
              />
            </div>
          </CollectionToolbar>
        )}
      </div>

      {loading.value && (
        <p role="status" class="text-ink-muted mb-2 text-sm">
          Loading files?
        </p>
      )}
      <div aria-busy={loading.value} inert={loading.value || loadFailed.value}>
        {/* Collection */}
        {files.value.total === 0 ? (
          <Surface flush>
            <EmptyState
              icon={FolderOpen}
              title={
                loadFailed.value
                  ? "Files unavailable"
                  : data.value.isApproved
                    ? "No files yet"
                    : "Uploads not available yet"
              }
              description={
                loadFailed.value
                  ? "We could not reach the server, so your files could not be listed."
                  : data.value.isApproved
                    ? "Upload a file from here, or set up ShareX to send screenshots straight from your desktop."
                    : "Once an administrator approves your account, the files you upload appear here."
              }
            >
              {!loadFailed.value && data.value.isApproved && (
                <>
                  <Button variant="primary" href="/upload">
                    Upload a file
                  </Button>
                  <Button variant="secondary" href="/setup/sharex">
                    Set up ShareX
                  </Button>
                </>
              )}
            </EmptyState>
          </Surface>
        ) : visible.value.length === 0 ? (
          <Surface flush>
            <EmptyState
              icon={SearchX}
              title="No files match"
              description={
                search.value.trim()
                  ? `Nothing matches “${search.value.trim()}”${kindFilter.value !== "all" ? ` in ${fileKindLabels[kindFilter.value as FileKind].toLowerCase()}` : ""}. ${files.value.total} files are hidden by the current search and filter.`
                  : kindFilter.value === "all"
                    ? "No files match the selected favorites, tag, or period."
                    : `No ${fileKindLabels[kindFilter.value as FileKind].toLowerCase()} in your ${files.value.total} files.`
              }
            >
              <Button
                variant="secondary"
                onClick$={() => {
                  search.value = "";
                  kindFilter.value = "all";
                  tag.value = "";
                  favorites.value = false;
                  period.value = "all";
                }}
              >
                Clear search and filters
              </Button>
            </EmptyState>
          </Surface>
        ) : (
          <>
            {isFiltered.value && (
              <p class="text-ink-muted mb-2 text-xs" aria-live="polite">
                {files.value.filteredTotal} matching files
              </p>
            )}

            {viewMode.value === "grid" ? (
              <GridView
                files={visible.value}
                origin={data.value.origin}
                selectedIds={selection.ids}
                onToggle$={toggleOne}
                onPreview$={openImage}
              />
            ) : (
              <>
                {/* Desktop table */}
                <Surface flush class="hidden overflow-hidden md:block">
                  <Table label="Your files" minWidth="880px">
                    <Thead>
                      <Tr hover={false}>
                        <Th class="w-9 pr-0">
                          <Checkbox
                            checked={allVisibleSelected}
                            indeterminate={
                              !allVisibleSelected &&
                              visibleIds.some((id) =>
                                selection.ids.includes(id),
                              )
                            }
                            label="Select all shown files"
                            onChange$={toggleAllVisible}
                          />
                        </Th>
                        <SortHeader
                          active={sortKey.value === "name"}
                          direction={sortDir.value}
                          onClick$={() => toggleSort("name")}
                        >
                          File
                        </SortHeader>
                        <SortHeader
                          class="w-24"
                          active={sortKey.value === "size"}
                          direction={sortDir.value}
                          onClick$={() => toggleSort("size")}
                        >
                          Size
                        </SortHeader>
                        <SortHeader
                          class="w-28"
                          active={sortKey.value === "views"}
                          direction={sortDir.value}
                          onClick$={() => toggleSort("views")}
                        >
                          Activity
                        </SortHeader>
                        <SortHeader
                          class="w-28"
                          active={sortKey.value === "date"}
                          direction={sortDir.value}
                          onClick$={() => toggleSort("date")}
                        >
                          Uploaded
                        </SortHeader>
                        <Th class="w-36">Limits</Th>
                        <Th class="w-44 text-right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {visible.value.map((upload) => {
                        const selected = selection.ids.includes(upload.id);
                        const expiry = describeExpiry(upload.expiresAt);
                        return (
                          <Tr key={upload.id} selected={selected}>
                            <Td class="pr-0">
                              <Checkbox
                                checked={selected}
                                label={`Select ${upload.originalName}`}
                                onChange$={(checked) =>
                                  toggleOne(upload.id, checked)
                                }
                              />
                            </Td>
                            <Td>
                              <div class="flex min-w-0 items-center gap-2.5">
                                <FileTypeIcon
                                  upload={upload}
                                  size="sm"
                                  onClick$={$(() => openImage(upload))}
                                />
                                <div class="min-w-0">
                                  <p
                                    class="text-ink truncate font-medium"
                                    title={upload.originalName}
                                  >
                                    {upload.originalName}
                                  </p>
                                  <p class="text-ink-muted truncate text-xs">
                                    {fileTypeLabel(upload.mimeType)} ·{" "}
                                    <span class="font-mono">
                                      /{upload.shortCode}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </Td>
                            <TdMeta>{formatBytes(upload.size, 1)}</TdMeta>
                            <TdMeta>
                              <span class="flex items-center gap-2.5">
                                <span
                                  class="flex items-center gap-1"
                                  title={`${upload.views} views`}
                                >
                                  <Eye class="h-3 w-3" aria-hidden="true" />
                                  {upload.views}
                                </span>
                                <span
                                  class="flex items-center gap-1"
                                  title={`${upload.downloads} downloads`}
                                >
                                  <Download
                                    class="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {upload.downloads}
                                </span>
                              </span>
                            </TdMeta>
                            <TdMeta>
                              <span
                                title={formatAbsoluteDate(upload.createdAt)}
                              >
                                {formatRelativeDate(upload.createdAt)}
                              </span>
                            </TdMeta>
                            <Td>
                              <div class="flex flex-wrap gap-1">
                                {expiry && (
                                  <Badge
                                    tone={
                                      expiry === "Expired" ? "error" : "warning"
                                    }
                                  >
                                    {expiry}
                                  </Badge>
                                )}
                                {upload.maxViews !== null && (
                                  <Badge
                                    tone={
                                      upload.views >= upload.maxViews
                                        ? "error"
                                        : "neutral"
                                    }
                                  >
                                    {upload.views}/{upload.maxViews} views
                                  </Badge>
                                )}
                                {!expiry && upload.maxViews === null && (
                                  <span class="text-ink-muted text-xs">
                                    None
                                  </span>
                                )}
                              </div>
                            </Td>
                            <Td class="text-right">
                              <div class="flex items-center justify-end gap-1">
                                <CopyButton
                                  value={`${data.value.origin}/f/${upload.shortCode}`}
                                  label="Copy link"
                                  variant="secondary"
                                />
                                <IconButton
                                  size="sm"
                                  variant="outline"
                                  label={`Open ${upload.originalName}`}
                                  href={`/f/${upload.shortCode}`}
                                  external
                                >
                                  <ExternalLink class="h-4 w-4" />
                                </IconButton>
                                <RowMenu
                                  upload={upload}
                                  onDelete$={$(() => {
                                    selection.ids = [upload.id];
                                    deleteOpen.value = true;
                                  })}
                                />
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Surface>

                {/* Compact rows below md */}
                <Surface flush class="overflow-hidden md:hidden">
                  <ul class="divide-edge divide-y">
                    {visible.value.map((upload) => {
                      const selected = selection.ids.includes(upload.id);
                      const expiry = describeExpiry(upload.expiresAt);
                      return (
                        <li
                          key={upload.id}
                          class={selected ? "bg-accent-soft" : undefined}
                        >
                          <div class="flex flex-wrap items-start gap-x-2.5 gap-y-2 px-3 py-2.5">
                            <Checkbox
                              checked={selected}
                              label={`Select ${upload.originalName}`}
                              onChange$={(checked) =>
                                toggleOne(upload.id, checked)
                              }
                              class="mt-2.5"
                            />
                            <FileTypeIcon
                              upload={upload}
                              size="sm"
                              onClick$={$(() => openImage(upload))}
                            />
                            <div class="min-w-[9rem] flex-1">
                              <p class="text-ink truncate text-[13px] font-medium">
                                {upload.originalName}
                              </p>
                              <p class="text-ink-muted mt-0.5 text-xs">
                                {formatBytes(upload.size, 1)} ·{" "}
                                {formatRelativeDate(upload.createdAt)}
                              </p>
                              <p class="text-ink-muted mt-0.5 flex items-center gap-2.5 text-xs">
                                <span class="flex items-center gap-1">
                                  <Eye class="h-3 w-3" aria-hidden="true" />
                                  {upload.views}
                                </span>
                                <span class="flex items-center gap-1">
                                  <Download
                                    class="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {upload.downloads}
                                </span>
                                {expiry && (
                                  <span
                                    class={
                                      expiry === "Expired"
                                        ? "text-danger"
                                        : "text-warning"
                                    }
                                  >
                                    {expiry}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div class="ml-auto flex shrink-0 items-center gap-1">
                              <CopyButton
                                value={`${data.value.origin}/f/${upload.shortCode}`}
                                title={`Copy link to ${upload.originalName}`}
                                variant="secondary"
                              />
                              <IconButton
                                size="sm"
                                variant="outline"
                                label={`Open ${upload.originalName}`}
                                href={`/f/${upload.shortCode}`}
                                external
                              >
                                <ExternalLink class="h-4 w-4" />
                              </IconButton>
                              <RowMenu
                                upload={upload}
                                onDelete$={$(() => {
                                  selection.ids = [upload.id];
                                  deleteOpen.value = true;
                                })}
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Surface>
              </>
            )}
          </>
        )}
      </div>
      {files.value.filteredTotal > files.value.pageSize && (
        <nav
          aria-label="File pages"
          class="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            variant="secondary"
            disabled={loading.value || page.value <= 1}
            onClick$={() => page.value--}
          >
            Previous
          </Button>
          <span class="text-ink-muted text-sm" aria-live="polite">
            {pageLabel.value}
          </span>
          <Button
            variant="secondary"
            disabled={
              loading.value ||
              page.value * files.value.pageSize >= files.value.filteredTotal
            }
            onClick$={() => page.value++}
          >
            Next
          </Button>
        </nav>
      )}

      <Dialog
        open={deleteOpen}
        title={
          selection.ids.length === 1
            ? "Delete this file?"
            : `Delete ${selection.ids.length} files?`
        }
        size="sm"
      >
        <p class="text-ink-muted text-[13px] leading-5">
          {selection.ids.length === 1
            ? "The link stops working immediately. You can restore this file from trash for 30 days."
            : `These ${selection.ids.length} links stop working immediately. You can restore the files from trash for 30 days.`}
        </p>
        <ul class="border-edge rounded-surface bg-surface-subtle mt-3 max-h-40 overflow-y-auto border px-3 py-2">
          {selectedFiles.value.slice(0, 50).map((u) => (
            <li key={u.id} class="text-ink truncate py-0.5 text-[13px]">
              {u.originalName}
            </li>
          ))}
          {selectedFiles.value.length > 50 && (
            <li class="text-ink-muted py-0.5 text-xs">
              and {selectedFiles.value.length - 50} more
            </li>
          )}
        </ul>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (deleteOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="danger"
          loading={deleteBusy.value}
          onClick$={confirmDelete}
        >
          Delete{" "}
          {selection.ids.length === 1
            ? "file"
            : `${selection.ids.length} files`}
        </Button>
      </Dialog>
    </Page>
  );
});

/** Overflow actions for a file row. Delete lives here, clearly labelled. */
const RowMenu = component$<{
  upload: UploadListItem;
  onDelete$: any;
}>(({ upload, onDelete$ }) => (
  <DropdownMenu
    triggerLabel={`More actions for ${upload.originalName}`}
    triggerClass="border-edge bg-surface hover:bg-surface-hover text-ink h-8 w-8 justify-center border"
  >
    <EllipsisVertical q:slot="trigger" class="h-4 w-4" />
    <MenuItem
      href={`/dashboard/analytics/${upload.shortCode}`}
      icon={BarChart3}
    >
      View analytics
    </MenuItem>
    <MenuItem href={`/f/${upload.shortCode}`} external icon={ExternalLink}>
      Open in new tab
    </MenuItem>
    <MenuItem href={`/dashboard/files/${upload.id}`}>File settings</MenuItem>
    <MenuItem onClick$={onDelete$} icon={Trash2} tone="danger">
      Delete file
    </MenuItem>
  </DropdownMenu>
));

/** Thumbnail-led view for recognising images at a glance. */
const GridView = component$<{
  files: UploadListItem[];
  origin: string;
  selectedIds: string[];
  onToggle$: any;
  onPreview$: any;
}>(({ files, origin, selectedIds, onToggle$, onPreview$ }) => (
  <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
    {files.map((upload) => {
      const selected = selectedIds.includes(upload.id);
      return (
        <li
          key={upload.id}
          class={`border-edge rounded-surface bg-surface overflow-hidden border ${
            selected ? "ring-accent ring-2" : ""
          }`}
        >
          <div class="relative">
            <FileTypeIcon
              upload={upload}
              size="lg"
              onClick$={$(() => onPreview$(upload))}
            />
            <span class="bg-surface/90 rounded-control absolute top-1.5 left-1.5 p-0.5">
              <Checkbox
                checked={selected}
                label={`Select ${upload.originalName}`}
                onChange$={(checked) => onToggle$(upload.id, checked)}
              />
            </span>
          </div>
          <div class="px-2.5 py-2">
            <p
              class="text-ink truncate text-[13px] font-medium"
              title={upload.originalName}
            >
              {upload.originalName}
            </p>
            <p class="text-ink-muted mt-0.5 truncate text-xs">
              {formatBytes(upload.size, 1)} · {upload.views} views ·{" "}
              {formatRelativeDate(upload.createdAt)}
            </p>
            <div class="mt-1.5 flex items-center gap-1">
              <CopyButton
                value={`${origin}/f/${upload.shortCode}`}
                label="Copy link"
                variant="secondary"
                class="flex-1"
              />
              <IconButton
                size="sm"
                variant="outline"
                label={`Open ${upload.originalName}`}
                href={`/f/${upload.shortCode}`}
                external
              >
                <ExternalLink class="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </li>
      );
    })}
  </ul>
));

export const head: DocumentHead = {
  title: "Files - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Find, copy and manage the files you have uploaded.",
    },
  ],
};
