import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { api, serverAuth, type UploadListItem } from "~/lib/api-client";
import { library, type Album } from "~/lib/library-api";
import { ArrowUp, ArrowDown, X } from "lucide-icons-qwik";
import {
  Page,
  PageHeader,
  Field,
  Input,
  Textarea,
  Checkbox,
  Button,
  IconButton,
  Callout,
  CopyButton,
  Dialog,
  Select,
} from "~/components/ui";

export const useAlbums = routeLoader$(async (event) => {
  const auth = serverAuth(event);
  const ids = (event.url.searchParams.get("files") || "")
    .split(",")
    .filter(Boolean)
    .slice(0, 100);
  const [result, selected] = await Promise.all([
    library.albums(auth),
    Promise.all(ids.map((id) => library.file(id, auth))),
  ]);
  return {
    albums: result.albums,
    selected: selected.map((f) => ({ id: f.id, name: f.originalName })),
    origin: event.url.origin,
  };
});

export default component$(() => {
  const data = useAlbums();
  const albums = useSignal(data.value.albums);
  const editing = useSignal(data.value.selected.length > 0);
  const id = useSignal("");
  const form = useStore({
    title: "",
    description: "",
    expiry: "",
    showOnBio: false,
  });
  const items = useSignal(data.value.selected);
  const busy = useSignal(false);
  const error = useSignal("");
  const search = useSignal("");
  const results = useSignal<UploadListItem[]>([]);
  const resultPage = useSignal(1);
  const hasMore = useSignal(false);
  const confirmDelete = useSignal(false);
  const deleting = useSignal<Album>();
  const edit = $((album?: Album) => {
    id.value = album?.id || "";
    form.title = album?.title || "";
    form.description = album?.description || "";
    form.expiry = album?.expiresAt?.slice(0, 16) || "";
    form.showOnBio = album?.showOnBio || false;
    items.value = album?.files ? [...album.files] : [...data.value.selected];
    editing.value = true;
    error.value = "";
    results.value = [];
  });
  const find = $(async (page = 1) => {
    busy.value = true;
    error.value = "";
    try {
      const result = await api.uploads.list(undefined, {
        search: search.value,
        page,
      });
      results.value = result.uploads;
      resultPage.value = result.page;
      hasMore.value = result.page * result.pageSize < result.filteredTotal;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not find files.";
    } finally {
      busy.value = false;
    }
  });
  const save = $(async (values: FormData) => {
    busy.value = true;
    error.value = "";
    try {
      await library.saveAlbum(
        {
          title: String(values.get("title") || ""),
          description: String(values.get("description") || "") || null,
          expiresAt: values.get("expiry")
            ? new Date(String(values.get("expiry")) + "Z").toISOString()
            : null,
          showOnBio: values.has("showOnBio"),
          uploadIds: items.value.map((i) => i.id),
        },
        id.value || undefined,
      );
      albums.value = (await library.albums()).albums;
      editing.value = false;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not save album.";
    } finally {
      busy.value = false;
    }
  });
  const move = $((index: number, offset: number) => {
    const next = [...items.value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    items.value = next;
  });
  return (
    <Page width="narrow">
      <PageHeader
        title="Albums"
        description="Share an ordered collection with one link. Protected, revoked, pending, and expired files stay hidden from visitors who cannot access them."
      >
        <Button q:slot="actions" onClick$={() => edit()}>
          New album
        </Button>
      </PageHeader>
      {error.value && (
        <Callout tone="danger" title="Album error" class="mb-4">
          {error.value}
        </Callout>
      )}
      {editing.value && (
        <section class="border-edge mb-6 border-b pb-6">
          <h2 class="mb-4 text-lg font-semibold">
            {id.value ? "Edit album" : "Create album"}
          </h2>
          {data.value.selected.length > 0 &&
            !id.value &&
            albums.value.length > 0 && (
              <Field
                label="Or add selected files to an existing album"
                for="existing-album"
              >
                <Select
                  id="existing-album"
                  value=""
                  onChange$={async (_, el) => {
                    const album = albums.value.find((a) => a.id === el.value);
                    if (!album) return;
                    await edit(album);
                    items.value = [
                      ...album.files,
                      ...data.value.selected.filter(
                        (f) => !album.uploadIds.includes(f.id),
                      ),
                    ];
                  }}
                >
                  <option value="">Choose album</option>
                  {albums.value.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          <form
            preventdefault:submit
            onSubmit$={(_, el) => save(new FormData(el))}
            class="mt-4 grid gap-4"
          >
            <Field label="Title" for="album-title">
              <Input
                id="album-title"
                name="title"
                required
                maxLength={120}
                value={form.title}
                onInput$={(_, el) => (form.title = el.value)}
              />
            </Field>
            <Field label="Description" for="album-description">
              <Textarea
                id="album-description"
                name="description"
                maxLength={2000}
                value={form.description}
                onInput$={(_, el) => (form.description = el.value)}
              />
            </Field>
            <Field
              label="Expires at (UTC)"
              for="album-expiry"
              help="Leave blank for no expiration."
            >
              <Input
                id="album-expiry"
                name="expiry"
                type="datetime-local"
                value={form.expiry}
                onInput$={(_, el) => (form.expiry = el.value)}
              />
            </Field>
            <Checkbox
              showLabel
              label="Show on my published bio"
              name="showOnBio"
              checked={form.showOnBio}
              onChange$={(v) => (form.showOnBio = v)}
            />
            <div>
              <h3 class="text-sm font-medium">
                Files · {items.value.length}/500
              </h3>
              <ol class="divide-edge mt-2 divide-y">
                {items.value.map((item, index) => (
                  <li key={item.id} class="flex items-center gap-2 py-2">
                    <span class="min-w-0 flex-1 truncate text-sm">
                      {item.name}
                    </span>
                    <IconButton
                      label={`Move ${item.name} up`}
                      disabled={index === 0}
                      onClick$={() => move(index, -1)}
                    >
                      <ArrowUp class="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Move ${item.name} down`}
                      disabled={index === items.value.length - 1}
                      onClick$={() => move(index, 1)}
                    >
                      <ArrowDown class="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Remove ${item.name}`}
                      onClick$={() =>
                        (items.value = items.value.filter(
                          (i) => i.id !== item.id,
                        ))
                      }
                    >
                      <X class="h-4 w-4" />
                    </IconButton>
                  </li>
                ))}
              </ol>
            </div>
            <div class="flex gap-2">
              <Button type="submit" loading={busy.value}>
                Save album
              </Button>
              <Button
                variant="secondary"
                onClick$={() => (editing.value = false)}
              >
                Cancel
              </Button>
            </div>
          </form>
          <details class="mt-4">
            <summary class="focus-ring cursor-pointer text-sm">
              Find files to add
            </summary>
            <form
              preventdefault:submit
              onSubmit$={() => find()}
              class="mt-3 flex gap-2"
            >
              <Input
                aria-label="Find files for album"
                value={search.value}
                onInput$={(_, el) => (search.value = el.value)}
              />
              <Button type="submit" variant="secondary" loading={busy.value}>
                Search
              </Button>
            </form>
            <ul class="mt-2">
              {results.value.map((file) => (
                <li
                  key={file.id}
                  class="flex items-center justify-between gap-2 py-2"
                >
                  <span class="truncate text-sm">{file.originalName}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      items.value.some((i) => i.id === file.id) ||
                      items.value.length >= 500
                    }
                    onClick$={() =>
                      (items.value = [
                        ...items.value,
                        { id: file.id, name: file.originalName },
                      ])
                    }
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
            <div class="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={busy.value || resultPage.value <= 1}
                onClick$={() => find(resultPage.value - 1)}
              >
                Previous results
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy.value || !hasMore.value}
                onClick$={() => find(resultPage.value + 1)}
              >
                Next results
              </Button>
            </div>
          </details>
        </section>
      )}
      {!albums.value.length && !editing.value && (
        <p class="text-ink-muted text-sm">
          No albums yet. Select files in Files, or create an empty album for a
          file request.
        </p>
      )}
      <ul class="divide-edge divide-y">
        {albums.value.map((album) => (
          <li key={album.id} class="py-4">
            <h2 class="text-base font-semibold">{album.title}</h2>
            <p class="text-ink-muted mb-3 text-sm">
              {album.uploadIds.length} files
              {album.expiresAt
                ? ` · Expires ${new Date(album.expiresAt).toLocaleString()}`
                : ""}
            </p>
            <div class="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick$={() => edit(album)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                href={`/a/${album.code}`}
                external
              >
                Open gallery
              </Button>
              <CopyButton
                value={`${data.value.origin}/a/${album.code}`}
                label="Copy album link"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick$={() => {
                  deleting.value = album;
                  confirmDelete.value = true;
                }}
              >
                Delete album
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={confirmDelete} title="Delete album?" size="sm">
        <p class="text-sm">
          The album and its request links will be removed. Its files will remain
          in your library.
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (confirmDelete.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="danger"
          loading={busy.value}
          onClick$={async () => {
            if (!deleting.value) return;
            busy.value = true;
            error.value = "";
            try {
              await library.deleteAlbum(deleting.value.id);
              albums.value = albums.value.filter(
                (a) => a.id !== deleting.value!.id,
              );
              confirmDelete.value = false;
            } catch (e) {
              error.value =
                e instanceof Error ? e.message : "Could not delete album.";
            } finally {
              busy.value = false;
            }
          }}
        >
          Delete album
        </Button>
      </Dialog>
    </Page>
  );
});
