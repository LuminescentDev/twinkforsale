import { component$, useSignal } from "@builder.io/qwik";
import { library } from "~/lib/library-api";
import { Button, Callout } from "~/components/ui";

export const BioRevisions = component$<{
  dirty: boolean;
  hasDraft: boolean;
  revisions: { id: string; createdAt: string }[];
}>((props) => {
  const busy = useSignal(false);
  const error = useSignal("");
  return (
    <section class="border-edge mb-5 border-b pb-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-ink-muted text-sm">
          {props.hasDraft
            ? "A saved draft is waiting to be published."
            : "Your saved bio matches the published version."}{" "}
          Save changes to your draft before publishing.
        </p>
        <Button
          disabled={props.dirty || !props.hasDraft}
          loading={busy.value}
          onClick$={async () => {
            busy.value = true;
            error.value = "";
            try {
              await library.publishBio();
              window.location.reload();
            } catch (e) {
              error.value =
                e instanceof Error ? e.message : "Could not publish bio.";
            } finally {
              busy.value = false;
            }
          }}
        >
          Publish saved draft
        </Button>
      </div>
      {error.value && (
        <Callout tone="danger" title="Bio history error" class="mt-3">
          {error.value}
        </Callout>
      )}
      <details class="mt-3">
        <summary class="focus-ring cursor-pointer text-sm">
          Revision history ({props.revisions.length})
        </summary>
        <p class="text-ink-muted mt-2 text-xs">
          The last 50 versions replaced by publishing are kept. Restoring
          replaces your saved draft; your live page stays unchanged until you
          publish.
        </p>
        <ul class="divide-edge divide-y">
          {props.revisions.map((r) => (
            <li key={r.id} class="flex items-center justify-between gap-2 py-2">
              <time class="text-sm" dateTime={r.createdAt}>
                {new Date(r.createdAt).toLocaleString()}
              </time>
              <Button
                size="sm"
                variant="secondary"
                disabled={props.dirty || busy.value}
                onClick$={async () => {
                  if (
                    !window.confirm(
                      "Replace your saved draft with this revision? Your live page will stay unchanged.",
                    )
                  )
                    return;
                  busy.value = true;
                  error.value = "";
                  try {
                    await library.restoreBio(r.id);
                    window.location.reload();
                  } catch (e) {
                    error.value =
                      e instanceof Error
                        ? e.message
                        : "Could not restore revision.";
                  } finally {
                    busy.value = false;
                  }
                }}
              >
                Restore to draft
              </Button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
});
