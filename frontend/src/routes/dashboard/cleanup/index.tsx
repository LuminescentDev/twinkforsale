import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { api, serverAuth, type UploadListItem } from "~/lib/api-client";
import { library } from "~/lib/library-api";
import { formatBytes } from "~/lib/utils";
import {
  Page,
  PageHeader,
  Button,
  Select,
  Callout,
  Dialog,
  EmptyState,
} from "~/components/ui";

export const useCleanup = routeLoader$((event) =>
  api.uploads.list(serverAuth(event), {
    state: "trash",
    sort: "size",
    direction: "desc",
  }),
);
export default component$(() => {
  const data = useCleanup();
  const files = useSignal(data.value);
  const state = useSignal("trash");
  const busy = useSignal(false);
  const error = useSignal("");
  const confirm = useSignal(false);
  const target = useSignal<UploadListItem>();
  const reload = $(async (page = 1) => {
    busy.value = true;
    error.value = "";
    try {
      files.value = await api.uploads.list(undefined, {
        state: state.value,
        sort: "size",
        direction: "desc",
        page,
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not load files.";
    } finally {
      busy.value = false;
    }
  });
  const act = $(
    async (file: UploadListItem, action: "restore" | "trash" | "delete") => {
      busy.value = true;
      error.value = "";
      try {
        if (action === "restore") await library.restore(file.id);
        else await library.remove(file.id, action === "delete");
        confirm.value = false;
        await reload(files.value.page);
      } catch (e) {
        error.value = e instanceof Error ? e.message : "Could not change file.";
      } finally {
        busy.value = false;
      }
    },
  );
  return (
    <Page>
      <PageHeader
        title="Storage cleanup"
        description="Trash is kept for 30 days and still uses storage. Permanent deletion frees space immediately."
      />
      <div class="mb-4 max-w-xs">
        <Select
          aria-label="Cleanup view"
          value={state.value}
          disabled={busy.value}
          onChange$={(_, el) => {
            state.value = el.value;
            reload();
          }}
        >
          <option value="trash">Trash</option>
          <option value="expired">Expired files</option>
          <option value="active">Largest files</option>
        </Select>
      </div>
      {error.value && (
        <Callout tone="danger" title="Cleanup failed">
          {error.value}
          <Button q:slot="actions" onClick$={() => reload(files.value.page)}>
            Retry
          </Button>
        </Callout>
      )}
      <div aria-busy={busy.value}>
        {files.value.uploads.length === 0 ? (
          <EmptyState
            title="No files in this view"
            description="Files will appear here when they match this view."
          />
        ) : (
          <ul class="divide-edge divide-y">
            {files.value.uploads.map((file) => (
              <li
                key={file.id}
                class="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-ink truncate text-sm font-medium">
                    {file.originalName}
                  </p>
                  <p class="text-ink-muted text-xs">
                    {formatBytes(file.size)}
                    {file.deletedAt
                      ? ` · Trashed ${new Date(file.deletedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    href={`/f/${file.shortCode}?preview=true`}
                    external
                  >
                    Preview
                  </Button>
                  {state.value === "trash" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy.value}
                      onClick$={() => act(file, "restore")}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy.value}
                      onClick$={() => act(file, "trash")}
                    >
                      Move to trash
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy.value}
                    onClick$={() => {
                      target.value = file;
                      confirm.value = true;
                    }}
                  >
                    Delete permanently
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <nav
        aria-label="Cleanup pages"
        class="mt-4 flex items-center justify-between gap-3"
      >
        <Button
          variant="secondary"
          disabled={busy.value || files.value.page <= 1}
          onClick$={() => reload(files.value.page - 1)}
        >
          Previous
        </Button>
        <span class="text-ink-muted text-sm">
          {files.value.filteredTotal} files · Page {files.value.page}
        </span>
        <Button
          variant="secondary"
          disabled={
            busy.value ||
            files.value.page * files.value.pageSize >= files.value.filteredTotal
          }
          onClick$={() => reload(files.value.page + 1)}
        >
          Next
        </Button>
      </nav>
      <Dialog open={confirm} title="Permanently delete this file?" size="sm">
        <p class="text-sm">
          {target.value?.originalName} will be removed from storage and all
          albums. This cannot be undone.
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (confirm.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="danger"
          loading={busy.value}
          onClick$={() => target.value && act(target.value, "delete")}
        >
          Delete permanently
        </Button>
      </Dialog>
    </Page>
  );
});
