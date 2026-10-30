import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { library } from "~/lib/library-api";
import { serverAuth } from "~/lib/api-client";
import { formatBytes } from "~/lib/utils";
import { Page, PageHeader, Button } from "~/components/ui";

export const useAlbum = routeLoader$(async (event) => {
  event.headers.set("Cache-Control", "no-store");
  try {
    return await library.publicAlbum(event.params.code, serverAuth(event));
  } catch {
    throw event.error(404, "This album is unavailable or has expired.");
  }
});
export default component$(() => {
  const data = useAlbum();
  return (
    <Page>
      <PageHeader
        title={data.value.title}
        plainTitle
        description={data.value.description || undefined}
      />
      {data.value.items.length === 0 && (
        <p class="text-ink-muted text-sm">
          No files are available to you in this album.
        </p>
      )}
      <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.value.items.map((file) => (
          <li key={file.id} class="min-w-0">
            {file.mimeType.startsWith("image/") && (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                class="focus-ring block"
              >
                <img
                  src={file.url}
                  alt={file.name}
                  width={file.width || 480}
                  height={file.height || 320}
                  loading="lazy"
                  class="bg-surface-subtle mb-2 h-64 w-full object-contain"
                />
              </a>
            )}
            <h2 class="text-ink truncate text-sm font-medium">{file.name}</h2>
            <p class="text-ink-muted text-xs">{formatBytes(file.size)}</p>
            <Button variant="ghost" size="sm" href={file.url} external>
              Open file
            </Button>
          </li>
        ))}
      </ul>
    </Page>
  );
});
