import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { api, serverAuth, type UploadListItem } from "~/lib/api-client";
import { library } from "~/lib/library-api";
import { formatBytes } from "~/lib/utils";
import {
  Page,
  PageHeader,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  CopyButton,
  Callout,
} from "~/components/ui";

export const useRequests = routeLoader$(async (event) => {
  const auth = serverAuth(event);
  const [requests, albums, pending, settings] = await Promise.all([
    library.requests(auth),
    library.albums(auth),
    api.uploads.list(auth, { state: "pending" }),
    api.settings.get(auth),
  ]);
  return {
    requests: requests.requests,
    albums: albums.albums,
    pending,
    maxFileSize: settings.maxFileSize,
    origin: event.url.origin,
  };
});
export default component$(() => {
  const data = useRequests();
  const requests = useSignal(data.value.requests);
  const pending = useSignal(data.value.pending);
  const form = useStore({
    title: "",
    description: "",
    albumId: "",
    days: "7",
    maxFiles: "20",
    size: String(Math.min(data.value.maxFileSize, 25 * 1024 * 1024)),
  });
  const busy = useSignal(false);
  const error = useSignal("");
  const refresh = $(async (page = 1) => {
    const [r, p] = await Promise.all([
      library.requests(),
      api.uploads.list(undefined, { state: "pending", page }),
    ]);
    requests.value = r.requests;
    pending.value = p;
  });
  const create = $(async (values: FormData) => {
    busy.value = true;
    error.value = "";
    try {
      await library.createRequest({
        title: String(values.get("title") || ""),
        description: String(values.get("description") || "") || null,
        albumId: String(values.get("albumId") || ""),
        expiresAt: new Date(
          Date.now() + Number(values.get("days")) * 86400000,
        ).toISOString(),
        maxFiles: Number(values.get("maxFiles")),
        maxFileSize: Number(values.get("size")),
      });
      await refresh();
      form.title = "";
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Could not create request.";
    } finally {
      busy.value = false;
    }
  });
  const review = $(async (file: UploadListItem, approve: boolean) => {
    busy.value = true;
    error.value = "";
    try {
      if (approve) await library.approve(file.id);
      else await library.remove(file.id);
      await refresh(pending.value.page);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Could not review submission.";
    } finally {
      busy.value = false;
    }
  });
  return (
    <Page width="narrow">
      <PageHeader
        title="File requests"
        description="Friends can submit files without seeing your collection. Submissions use your quota and stay private until you approve them."
      />
      {error.value && (
        <Callout tone="danger" title="Request error" class="mb-4">
          {error.value}
        </Callout>
      )}
      <details class="border-edge mb-6 border-b pb-4">
        <summary class="focus-ring cursor-pointer font-medium">
          Create a request link
        </summary>
        {data.value.albums.length === 0 ? (
          <p class="mt-3 text-sm">
            <a class="text-accent-text underline" href="/dashboard/albums">
              Create an album
            </a>{" "}
            for incoming files first.
          </p>
        ) : (
          <form
            preventdefault:submit
            onSubmit$={(_, el) => create(new FormData(el))}
            class="mt-4 grid gap-4"
          >
            <Field label="Title" for="request-title">
              <Input
                id="request-title"
                name="title"
                required
                maxLength={120}
                value={form.title}
                onInput$={(_, el) => (form.title = el.value)}
              />
            </Field>
            <Field label="Instructions" for="request-description">
              <Textarea
                id="request-description"
                name="description"
                maxLength={2000}
                value={form.description}
                onInput$={(_, el) => (form.description = el.value)}
              />
            </Field>
            <Field label="Destination album" for="request-album">
              <Select
                id="request-album"
                name="albumId"
                required
                value={form.albumId}
                onChange$={(_, el) => (form.albumId = el.value)}
              >
                <option value="">Choose album</option>
                {data.value.albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div class="grid gap-4 sm:grid-cols-3">
              <Field label="Expires in days" for="request-days">
                <Input
                  id="request-days"
                  name="days"
                  type="number"
                  min={1}
                  max={365}
                  required
                  value={form.days}
                  onInput$={(_, el) => (form.days = el.value)}
                />
              </Field>
              <Field label="Maximum submissions" for="request-count">
                <Input
                  id="request-count"
                  name="maxFiles"
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={form.maxFiles}
                  onInput$={(_, el) => (form.maxFiles = el.value)}
                />
              </Field>
              <Field
                label="Max bytes per file"
                for="request-size"
                help={`Your limit: ${formatBytes(data.value.maxFileSize)}`}
              >
                <Input
                  id="request-size"
                  name="size"
                  type="number"
                  min={1}
                  max={data.value.maxFileSize}
                  required
                  value={form.size}
                  onInput$={(_, el) => (form.size = el.value)}
                />
              </Field>
            </div>
            <div>
              <Button type="submit" loading={busy.value}>
                Create request link
              </Button>
            </div>
          </form>
        )}
      </details>
      <section class="mb-8">
        <h2 class="mb-2 text-lg font-semibold">
          Awaiting approval · {pending.value.filteredTotal}
        </h2>
        <ul class="divide-edge divide-y">
          {pending.value.uploads.map((file) => (
            <li
              key={file.id}
              class="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{file.originalName}</p>
                <p class="text-ink-muted text-xs">{formatBytes(file.size)}</p>
              </div>
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  href={`/f/${file.shortCode}?preview=true`}
                  external
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  disabled={busy.value}
                  onClick$={() => review(file, true)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy.value}
                  onClick$={() => review(file, false)}
                >
                  Reject to trash
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {pending.value.filteredTotal === 0 && (
          <p class="text-ink-muted text-sm">
            No submissions waiting for review.
          </p>
        )}
        {pending.value.filteredTotal > pending.value.pageSize && (
          <div class="mt-3 flex gap-2">
            <Button
              variant="secondary"
              disabled={busy.value || pending.value.page <= 1}
              onClick$={async () => {
                try {
                  await refresh(pending.value.page - 1);
                } catch {
                  error.value = "Could not load submissions.";
                }
              }}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={
                busy.value ||
                pending.value.page * pending.value.pageSize >=
                  pending.value.filteredTotal
              }
              onClick$={async () => {
                try {
                  await refresh(pending.value.page + 1);
                } catch {
                  error.value = "Could not load submissions.";
                }
              }}
            >
              Next
            </Button>
          </div>
        )}
      </section>
      <h2 class="text-lg font-semibold">Request links</h2>
      <ul class="divide-edge divide-y">
        {requests.value.map((r) => (
          <li key={r.id} class="py-4">
            <h3 class="text-sm font-medium">{r.title}</h3>
            <p class="text-ink-muted mb-2 text-xs">
              {r.submittedCount}/{r.maxFiles} submitted ·{" "}
              {r.isClosed
                ? "Closed"
                : `Expires ${new Date(r.expiresAt).toLocaleString()}`}
            </p>
            <div class="flex gap-2">
              <CopyButton
                value={`${data.value.origin}/r/${r.code}`}
                label="Copy request link"
              />
              {!r.isClosed && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy.value}
                  onClick$={async () => {
                    busy.value = true;
                    error.value = "";
                    try {
                      await library.closeRequest(r.id);
                      await refresh();
                    } catch (e) {
                      error.value =
                        e instanceof Error
                          ? e.message
                          : "Could not close request.";
                    } finally {
                      busy.value = false;
                    }
                  }}
                >
                  Close submissions
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
});
