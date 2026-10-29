import { component$, useSignal, type QRL } from "@builder.io/qwik";
import type { ShortLinkListItem } from "~/lib/api-client";
import { library } from "~/lib/library-api";
import {
  Button,
  Dialog,
  Field,
  Input,
  Checkbox,
  Callout,
} from "~/components/ui";

export const ShortLinkEditor = component$<{
  link: ShortLinkListItem;
  onSaved$: QRL<(url: string, paused: boolean) => void>;
}>(({ link, onSaved$ }) => {
  const open = useSignal(false);
  const url = useSignal(link.url);
  const paused = useSignal(link.isPaused);
  const busy = useSignal(false);
  const error = useSignal("");
  const history = useSignal<{ id: string; url: string; changedAt: string }[]>(
    [],
  );
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick$={async () => {
          url.value = link.url;
          paused.value = link.isPaused;
          open.value = true;
          error.value = "";
          try {
            history.value = (await library.linkHistory(link.id)).history;
          } catch {
            error.value = "Could not load destination history.";
          }
        }}
      >
        Edit
      </Button>
      <Dialog open={open} title={`Edit /l/${link.code}`}>
        <form
          preventdefault:submit
          class="grid gap-4"
          onSubmit$={async (_, el) => {
            const values = new FormData(el);
            const destination = String(values.get("destination") || "");
            const isPaused = values.has("paused");
            busy.value = true;
            error.value = "";
            try {
              await library.editLink(link.id, destination, isPaused);
              await onSaved$(destination, isPaused);
              open.value = false;
            } catch (e) {
              error.value =
                e instanceof Error ? e.message : "Could not save link.";
            } finally {
              busy.value = false;
            }
          }}
        >
          {error.value && (
            <Callout tone="danger" title="Link error">
              {error.value}
            </Callout>
          )}
          <Field label="Destination" for={`target-${link.id}`}>
            <Input
              id={`target-${link.id}`}
              name="destination"
              type="url"
              required
              maxLength={4000}
              value={url.value}
              onInput$={(_, el) => (url.value = el.value)}
            />
          </Field>
          <Checkbox
            showLabel
            label="Pause this link"
            name="paused"
            checked={paused.value}
            onChange$={(v) => (paused.value = v)}
          />
          <p class="text-ink-muted text-sm">
            Your short URL stays the same. Paused links do not redirect or count
            clicks.
          </p>
          <div>
            <Button type="submit" loading={busy.value}>
              Save link
            </Button>
          </div>
        </form>
        <details class="mt-4">
          <summary class="focus-ring cursor-pointer text-sm">
            Previous destinations
          </summary>
          <ul class="divide-edge mt-2 divide-y">
            {history.value.map((h) => (
              <li key={h.id} class="py-2">
                <p class="text-ink-muted text-xs">
                  {new Date(h.changedAt).toLocaleString()}
                </p>
                <p class="text-sm break-all">{h.url}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick$={() => (url.value = h.url)}
                >
                  Use this destination
                </Button>
              </li>
            ))}
          </ul>
        </details>
      </Dialog>
    </>
  );
});
