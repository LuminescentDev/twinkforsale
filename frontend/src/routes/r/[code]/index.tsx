import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { library } from "~/lib/library-api";
import { serverAuth } from "~/lib/api-client";
import { formatBytes } from "~/lib/utils";
import { Page, PageHeader, Field, Button, Callout } from "~/components/ui";

export const useRequest = routeLoader$(async (event) => {
  event.headers.set("Cache-Control", "no-store");
  try {
    return await library.publicRequest(event.params.code, serverAuth(event));
  } catch {
    throw event.error(404, "This request is closed, full, or expired.");
  }
});
export default component$(() => {
  const data = useRequest();
  const location = useLocation();
  const input = useSignal<HTMLInputElement>();
  const busy = useSignal(false);
  const error = useSignal("");
  const message = useSignal("");
  const remaining = useSignal(data.value.remainingFiles);
  const submit = $(async () => {
    const file = input.value?.files?.[0];
    error.value = "";
    message.value = "";
    if (!file || file.size === 0 || file.size > data.value.maxFileSize) {
      error.value = `Choose a non-empty file under ${formatBytes(data.value.maxFileSize)}.`;
      return;
    }
    busy.value = true;
    try {
      await library.submitRequest(location.params.code, file);
      remaining.value--;
      if (input.value) input.value.value = "";
      message.value = "Your file was submitted for owner approval.";
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Submission failed.";
    } finally {
      busy.value = false;
    }
  });
  return (
    <Page width="narrow">
      <PageHeader
        title={data.value.title}
        description={data.value.description || undefined}
      />
      <p class="text-ink-muted mb-4 text-sm">
        Up to {formatBytes(data.value.maxFileSize)} per file · {remaining.value}{" "}
        submissions remaining · Expires{" "}
        {new Date(data.value.expiresAt).toLocaleString()}
      </p>
      <p class="mb-4 text-sm">
        Files are sent privately to the owner for review. You cannot browse
        their collection.
      </p>
      {error.value && (
        <Callout tone="danger" title="Could not submit" class="mb-4">
          {error.value}
        </Callout>
      )}
      {message.value && (
        <p role="status" class="text-success mb-4 text-sm">
          {message.value}
        </p>
      )}
      <form preventdefault:submit onSubmit$={submit} class="grid gap-4">
        <Field label="File" for="request-file">
          <input
            ref={input}
            id="request-file"
            type="file"
            required
            disabled={busy.value || remaining.value <= 0}
            class="focus-ring text-sm"
          />
        </Field>
        <div>
          <Button
            type="submit"
            loading={busy.value}
            disabled={remaining.value <= 0}
          >
            Submit for approval
          </Button>
        </div>
      </form>
    </Page>
  );
});
