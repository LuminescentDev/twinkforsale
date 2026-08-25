import {
  component$,
  $,
  useSignal,
  useStore,
  useComputed$,
  useVisibleTask$,
  noSerialize,
  type NoSerialize,
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  CloudUpload,
  X,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Ban,
} from "lucide-icons-qwik";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { uploadFileWithProgress, isAbortError } from "~/lib/upload-transport";
import { formatBytes } from "~/lib/utils";
import { fileTypeLabel } from "~/lib/file-kinds";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  Button,
  IconButton,
  CopyButton,
  Field,
  Input,
  Callout,
  Badge,
  ProgressBar,
  Meter,
} from "~/components/ui";

export const useUploadContext = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }
  if (!user.isApproved) {
    throw requestEvent.redirect(302, "/dashboard?error=upload_not_approved");
  }

  const [settings, summary] = await Promise.all([
    api.settings.get(auth).catch(() => null),
    api.dashboard.summary(auth).catch(() => null),
  ]);

  return {
    maxFileSize: settings?.maxFileSize ?? 10_485_760,
    maxUploads: settings?.maxUploads ?? 100,
    uploadCount: summary?.totalUploads ?? 0,
    storageUsed: summary?.storageUsed ?? settings?.storageUsed ?? 0,
    storageLimit:
      summary?.storageLimit ?? settings?.maxStorageLimit ?? 104_857_600,
    defaultExpirationDays: settings?.defaultExpirationDays ?? null,
    defaultMaxViews: settings?.defaultMaxViews ?? null,
    origin: requestEvent.url.origin,
  };
});

type QueueStatus =
  | "pending"
  | "uploading"
  | "completed"
  | "failed"
  | "retrying"
  | "cancelled";

interface QueueItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: QueueStatus;
  /** Bytes sent so far, for per-file byte progress. */
  loaded: number;
  error?: string;
  url?: string;
  /** Set once the file has been rejected before it ever reaches the network. */
  validationError?: string;
  /** Preserves the Retry status while a failed file waits for its turn. */
  queuedAsRetry?: boolean;
}

const STATUS_LABEL: Record<QueueStatus, string> = {
  pending: "Waiting",
  uploading: "Uploading",
  completed: "Uploaded",
  failed: "Failed",
  retrying: "Retrying",
  cancelled: "Cancelled",
};

export default component$(() => {
  const ctx = useUploadContext();

  // `nextId` lives in the store because the Qwik optimizer turns a
  // module-level `let` into a `const` inside extracted QRL chunks.
  const queue = useStore<{ items: QueueItem[]; nextId: number }>({
    items: [],
    nextId: 0,
  });
  // File objects and AbortControllers cannot be serialized into Qwik state, so
  // they live in non-serializable side maps keyed by queue id. `noSerialize`
  // values are dropped when the component resumes in the browser, so the maps
  // are created on first use rather than at declaration.
  const fileMap = useSignal<NoSerialize<Map<string, File>>>();
  const controllers = useSignal<NoSerialize<Map<string, AbortController>>>();

  const fileStore = $(() => {
    if (!fileMap.value) fileMap.value = noSerialize(new Map<string, File>());
    return fileMap.value!;
  });
  const abortStore = $(() => {
    if (!controllers.value) {
      controllers.value = noSerialize(new Map<string, AbortController>());
    }
    return controllers.value!;
  });

  const dragging = useSignal(false);
  const advancedOpen = useSignal(false);
  const inputRef = useSignal<HTMLInputElement>();

  const expirationDays = useSignal<string>(
    ctx.value.defaultExpirationDays?.toString() ?? "",
  );
  const maxViews = useSignal<string>(
    ctx.value.defaultMaxViews?.toString() ?? "",
  );

  const active = useComputed$(() =>
    queue.items.some(
      (i) => i.status === "uploading" || i.status === "retrying",
    ),
  );
  const pendingCount = useComputed$(
    () => queue.items.filter((i) => i.status === "pending").length,
  );
  const doneCount = useComputed$(
    () => queue.items.filter((i) => i.status === "completed").length,
  );
  const totalBytes = useComputed$(() =>
    queue.items
      .filter((i) => i.status !== "cancelled" && !i.validationError)
      .reduce((sum, i) => sum + i.size, 0),
  );
  const sentBytes = useComputed$(() =>
    queue.items
      .filter((i) => i.status !== "cancelled" && !i.validationError)
      .reduce(
        (sum, i) => sum + (i.status === "completed" ? i.size : i.loaded),
        0,
      ),
  );
  const queueAnnouncement = useComputed$(() => {
    const transferring = queue.items.find(
      (item) => item.status === "uploading" || item.status === "retrying",
    );
    if (transferring) {
      return `${STATUS_LABEL[transferring.status]} ${transferring.name}. ${doneCount.value} of ${queue.items.length} complete.`;
    }
    const failed = queue.items.filter(
      (item) => item.status === "failed",
    ).length;
    if (failed > 0) {
      return `${doneCount.value} of ${queue.items.length} uploaded. ${failed} failed.`;
    }
    return queue.items.length
      ? `${doneCount.value} of ${queue.items.length} uploaded.`
      : "";
  });

  // Warn before leaving while transfers are in flight.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    const busy = track(() => active.value);
    if (!busy) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    cleanup(() => window.removeEventListener("beforeunload", handler));
  });

  const sendOne = $(async (id: string) => {
    const item = queue.items.find((i) => i.id === id);
    const file = (await fileStore()).get(id);
    if (!item || !file) return;

    const controller = new AbortController();
    (await abortStore()).set(id, controller);
    item.loaded = 0;
    item.error = undefined;

    const form = new FormData();
    form.append("file", file);
    if (expirationDays.value.trim()) {
      form.append("expirationDays", expirationDays.value.trim());
    }
    if (maxViews.value.trim()) {
      form.append("maxViews", maxViews.value.trim());
    }

    try {
      const result = await uploadFileWithProgress(form, {
        signal: controller.signal,
        onProgress: ({ loaded }) => {
          const live = queue.items.find((i) => i.id === id);
          if (live) live.loaded = loaded;
        },
      });
      const live = queue.items.find((i) => i.id === id);
      if (live) {
        live.status = "completed";
        live.loaded = live.size;
        live.url = result.url ?? undefined;
      }
    } catch (error) {
      const live = queue.items.find((i) => i.id === id);
      if (!live) return;
      if (isAbortError(error)) {
        live.status = "cancelled";
        live.loaded = 0;
      } else {
        live.status = "failed";
        live.error =
          error instanceof Error
            ? error.message
            : "The upload did not complete.";
      }
    } finally {
      (await abortStore()).delete(id);
    }
  });

  /**
   * Drain the queue one file at a time. Sequential transfer keeps the server's
   * load characteristics unchanged from the previous implementation.
   */
  const drain = $(async () => {
    if (active.value) return;
    for (;;) {
      const next = queue.items.find((i) => i.status === "pending");
      if (!next) break;
      next.status = next.queuedAsRetry ? "retrying" : "uploading";
      next.queuedAsRetry = false;
      await sendOne(next.id);
    }
  });

  // Takes a plain array: a live FileList is emptied as soon as the input is
  // reset, which happens before this async handler runs.
  const addFiles = $(async (selected: File[]) => {
    if (selected.length === 0) return;
    const map = await fileStore();

    for (const file of selected) {
      const duplicate = queue.items.some(
        (i) =>
          i.name === file.name &&
          i.size === file.size &&
          i.status !== "cancelled",
      );
      if (duplicate) continue;

      const id = `q${++queue.nextId}`;
      const tooLarge = file.size > ctx.value.maxFileSize;
      const empty = file.size === 0;

      map.set(id, file);
      queue.items.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        status: tooLarge || empty ? "failed" : "pending",
        loaded: 0,
        validationError: empty
          ? "This file is empty."
          : tooLarge
            ? `Larger than your ${formatBytes(ctx.value.maxFileSize, 0)} limit.`
            : undefined,
        error: empty
          ? "This file is empty."
          : tooLarge
            ? `Larger than your ${formatBytes(ctx.value.maxFileSize, 0)} limit.`
            : undefined,
      });
    }

    await drain();
  });

  const retry = $(async (id: string) => {
    const item = queue.items.find((i) => i.id === id);
    if (!item || item.validationError) return;
    item.queuedAsRetry = true;
    item.status = "pending";
    await drain();
  });

  const cancel = $(async (id: string) => {
    (await abortStore()).get(id)?.abort();
    const item = queue.items.find((i) => i.id === id);
    if (item && item.status === "pending") item.status = "cancelled";
  });

  const remove = $(async (id: string) => {
    (await abortStore()).get(id)?.abort();
    (await fileStore()).delete(id);
    queue.items = queue.items.filter((i) => i.id !== id);
  });

  const clearFinished = $(async () => {
    const map = await fileStore();
    const keep = queue.items.filter(
      (i) => i.status !== "completed" && i.status !== "cancelled",
    );
    const keepIds = new Set(keep.map((i) => i.id));
    queue.items.forEach((i) => {
      if (!keepIds.has(i.id)) map.delete(i.id);
    });
    queue.items = keep;
  });

  const storagePercent =
    ctx.value.storageLimit > 0
      ? (ctx.value.storageUsed / ctx.value.storageLimit) * 100
      : 0;

  return (
    <Page width="narrow">
      <PageHeader title="Upload" />

      {/* Context first: what you are allowed to send. */}
      <Surface class="mb-4" padding="sm">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Meter
            label="Storage used"
            used={formatBytes(ctx.value.storageUsed, 1)}
            total={formatBytes(ctx.value.storageLimit, 0)}
            percent={storagePercent}
            class="min-w-[10rem] flex-1"
          />
          <dl class="flex gap-6">
            <div>
              <dt class="text-ink-muted text-xs">Max file size</dt>
              <dd class="text-ink text-[13px] font-medium tabular-nums">
                {formatBytes(ctx.value.maxFileSize, 0)}
              </dd>
            </div>
            <div>
              <dt class="text-ink-muted text-xs">Files</dt>
              <dd class="text-ink text-[13px] font-medium tabular-nums">
                {ctx.value.uploadCount} / {ctx.value.maxUploads}
              </dd>
            </div>
          </dl>
        </div>
      </Surface>

      {storagePercent >= 95 && (
        <Callout tone="warning" title="Storage almost full" class="mb-4">
          Delete some files to free space, or uploads will start to fail.
          <Button
            q:slot="actions"
            size="sm"
            variant="secondary"
            href="/dashboard"
          >
            Manage files
          </Button>
        </Callout>
      )}

      {/* Drop / select surface */}
      <div
        onDragOver$={(event) => {
          event.preventDefault();
          dragging.value = true;
        }}
        onDragLeave$={() => (dragging.value = false)}
        onDrop$={(event) => {
          event.preventDefault();
          dragging.value = false;
          addFiles(Array.from(event.dataTransfer?.files ?? []));
        }}
        class={`rounded-surface flex flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors duration-150 ${
          dragging.value
            ? "border-accent bg-accent-soft"
            : "border-edge-strong bg-surface-subtle"
        }`}
      >
        <CloudUpload class="text-ink-muted mb-3 h-7 w-7" aria-hidden="true" />
        <p class="text-ink text-sm font-medium">
          Drag files here, or choose them from your device
        </p>
        <p class="text-ink-muted mt-1 text-[13px]">
          Multiple files are uploaded one after another.
        </p>
        <Button
          variant="primary"
          class="mt-4"
          onClick$={() => inputRef.value?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          class="sr-only"
          aria-label="Choose files to upload"
          onChange$={(_, el) => {
            const files = Array.from(el.files ?? []);
            // Reset first so re-picking the same file still fires `change`.
            el.value = "";
            addFiles(files);
          }}
        />
      </div>

      {/* Advanced options, disclosed rather than always present */}
      <div class="mt-4">
        <button
          type="button"
          onClick$={() => (advancedOpen.value = !advancedOpen.value)}
          aria-expanded={advancedOpen.value}
          aria-controls="upload-advanced"
          class="focus-ring rounded-control text-ink-muted hover:text-ink inline-flex items-center gap-1.5 py-1 text-[13px]"
        >
          {advancedOpen.value ? (
            <ChevronUp class="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown class="h-4 w-4" aria-hidden="true" />
          )}
          Expiration and view limits
        </button>

        {advancedOpen.value && (
          <div
            id="upload-advanced"
            class="border-edge rounded-surface mt-2 grid gap-4 border p-4 sm:grid-cols-2"
          >
            <Field
              label="Delete after"
              for="expiration-days"
              help={
                ctx.value.defaultExpirationDays
                  ? `Your default is ${ctx.value.defaultExpirationDays} days. Leave empty to keep files indefinitely.`
                  : "Leave empty to keep files indefinitely."
              }
            >
              <Input
                id="expiration-days"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Days"
                value={expirationDays.value}
                onInput$={(_, el) => (expirationDays.value = el.value)}
              />
            </Field>
            <Field
              label="Maximum views"
              for="max-views"
              help={
                ctx.value.defaultMaxViews
                  ? `Your default is ${ctx.value.defaultMaxViews} views. Leave empty for unlimited.`
                  : "The link stops working after this many views. Leave empty for unlimited."
              }
            >
              <Input
                id="max-views"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Unlimited"
                value={maxViews.value}
                onInput$={(_, el) => (maxViews.value = el.value)}
              />
            </Field>
            <p class="text-ink-muted text-xs sm:col-span-2">
              These apply to files still waiting in the queue. Files already
              uploaded keep the settings they were sent with.
            </p>
          </div>
        )}
      </div>

      {/* Queue */}
      {queue.items.length > 0 && (
        <Section
          title="Queue"
          class="mt-6"
          description={
            active.value
              ? `Uploading — ${doneCount.value} of ${queue.items.length} done`
              : `${doneCount.value} of ${queue.items.length} uploaded${pendingCount.value ? `, ${pendingCount.value} waiting` : ""}`
          }
        >
          <Button
            q:slot="actions"
            size="sm"
            variant="ghost"
            onClick$={clearFinished}
            disabled={
              !queue.items.some(
                (i) => i.status === "completed" || i.status === "cancelled",
              )
            }
          >
            Clear finished
          </Button>

          {active.value && (
            <div class="mb-3">
              <div class="text-ink-muted mb-1 flex justify-between text-xs tabular-nums">
                <span>Overall progress</span>
                <span>
                  {formatBytes(sentBytes.value, 1)} of{" "}
                  {formatBytes(totalBytes.value, 1)}
                </span>
              </div>
              <ProgressBar
                label="Overall upload progress"
                value={sentBytes.value}
                max={totalBytes.value || 1}
                valueText={`${formatBytes(sentBytes.value, 1)} of ${formatBytes(totalBytes.value, 1)}`}
              />
            </div>
          )}

          <Surface flush>
            <p class="sr-only" aria-live="polite" aria-atomic="true">
              {queueAnnouncement.value}
            </p>
            <ul class="divide-edge divide-y">
              {queue.items.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  onRetry$={$(() => retry(item.id))}
                  onCancel$={$(() => cancel(item.id))}
                  onRemove$={$(() => remove(item.id))}
                />
              ))}
            </ul>
          </Surface>

          {doneCount.value > 0 && !active.value && (
            <div class="mt-3">
              <Button variant="secondary" href="/dashboard">
                Go to Files
              </Button>
            </div>
          )}
        </Section>
      )}
    </Page>
  );
});

const statusTone: Record<
  QueueStatus,
  "success" | "error" | "warning" | "info" | "neutral"
> = {
  pending: "neutral",
  uploading: "info",
  retrying: "info",
  completed: "success",
  failed: "error",
  cancelled: "neutral",
};

const statusIcon: Record<QueueStatus, any> = {
  pending: undefined,
  uploading: undefined,
  retrying: undefined,
  completed: CheckCircle2,
  failed: AlertCircle,
  cancelled: Ban,
};

const QueueRow = component$<{
  item: QueueItem;
  onRetry$: any;
  onCancel$: any;
  onRemove$: any;
}>(({ item, onRetry$, onCancel$, onRemove$ }) => {
  const inFlight = item.status === "uploading" || item.status === "retrying";
  return (
    <li class="px-3 py-2.5">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p class="text-ink min-w-0 flex-1 truncate text-[13px] font-medium">
              {item.name}
            </p>
            <Badge
              tone={statusTone[item.status]}
              icon={statusIcon[item.status]}
            >
              {STATUS_LABEL[item.status]}
            </Badge>
          </div>

          <p class="text-ink-muted mt-0.5 text-xs tabular-nums">
            {inFlight
              ? `${formatBytes(item.loaded, 1)} of ${formatBytes(item.size, 1)}`
              : `${formatBytes(item.size, 1)} · ${fileTypeLabel(item.type)}`}
          </p>

          {inFlight && (
            <ProgressBar
              label={`Uploading ${item.name}`}
              value={item.loaded}
              max={item.size || 1}
              size="sm"
              class="mt-1.5"
              valueText={`${formatBytes(item.loaded, 1)} of ${formatBytes(item.size, 1)}`}
            />
          )}

          {item.status === "failed" && item.error && (
            <p class="text-danger mt-1 text-xs leading-4">{item.error}</p>
          )}

          {item.status === "completed" && item.url && (
            <p class="text-ink-muted mt-1 truncate font-mono text-xs">
              {item.url}
            </p>
          )}
        </div>

        <div class="flex shrink-0 items-center gap-1">
          {item.status === "completed" && item.url && (
            <>
              <CopyButton
                value={item.url}
                label="Copy link"
                variant="secondary"
              />
              <IconButton
                size="sm"
                variant="outline"
                label={`Open ${item.name}`}
                href={item.url}
                external
              >
                <ExternalLink class="h-4 w-4" />
              </IconButton>
            </>
          )}
          {item.status === "failed" && !item.validationError && (
            <Button size="sm" variant="secondary" onClick$={onRetry$}>
              <RotateCcw class="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          )}
          {inFlight ? (
            <Button size="sm" variant="secondary" onClick$={onCancel$}>
              Cancel
            </Button>
          ) : (
            <IconButton
              size="sm"
              label={`Remove ${item.name} from the queue`}
              onClick$={onRemove$}
            >
              <X class="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>
    </li>
  );
});

export const head: DocumentHead = {
  title: "Upload - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Upload files with expiration and view limits.",
    },
  ],
};
