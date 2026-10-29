import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { serverAuth } from "~/lib/api-client";
import { library, type UploadSettings } from "~/lib/library-api";
import {
  Page,
  PageHeader,
  Field,
  Input,
  Select,
  Checkbox,
  Button,
  Callout,
  CopyButton,
} from "~/components/ui";

export const useFile = routeLoader$(async (event) => {
  try {
    return await library.file(event.params.id, serverAuth(event));
  } catch {
    throw event.error(404, "File not found");
  }
});

export default component$(() => {
  const file = useFile();
  const form = useStore({
    name: file.value.originalName,
    tags: file.value.tags.join(", "),
    access: file.value.accessMode,
    favorite: file.value.isFavorite,
    revoked: file.value.isRevoked,
    expiry: file.value.expiresAt?.slice(0, 16) ?? "",
    maxViews: file.value.maxViews?.toString() ?? "",
    password: "",
  });
  const busy = useSignal(false);
  const error = useSignal("");
  const saved = useSignal(false);
  const save = $(async (values: FormData) => {
    busy.value = true;
    error.value = "";
    saved.value = false;
    try {
      const body: UploadSettings = {
        displayName: String(values.get("name") || ""),
        tags: String(values.get("tags") || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        isFavorite: values.has("favorite"),
        isRevoked: values.has("revoked"),
        accessMode: String(values.get("access") || "public"),
        expiresAt: values.get("expiry")
          ? new Date(String(values.get("expiry")) + "Z").toISOString()
          : null,
        maxViews: values.get("maxViews")
          ? Number(values.get("maxViews"))
          : null,
        password: String(values.get("password") || "") || undefined,
      };
      await library.updateFile(file.value.id, body);
      form.password = "";
      saved.value = true;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Could not save the file settings.";
    } finally {
      busy.value = false;
    }
  });
  return (
    <Page width="narrow">
      <PageHeader title="File settings" description={file.value.originalName} />
      <div class="mb-6 flex flex-wrap gap-2">
        <Button variant="secondary" href="/dashboard">
          Back to files
        </Button>
        <CopyButton value={file.value.url} label="Copy link" />
        <Button
          variant="secondary"
          href={`/f/${file.value.shortCode}?preview=true`}
          external
        >
          Preview
        </Button>
      </div>
      {error.value && (
        <Callout tone="danger" title="Could not save">
          {error.value}
        </Callout>
      )}
      {saved.value && (
        <p role="status" class="text-success mb-4 text-sm">
          File settings saved.
        </p>
      )}
      {file.value.deletedAt ? (
        <Callout tone="warning" title="This file is in trash">
          Restore it from Storage cleanup before changing its settings.
        </Callout>
      ) : (
        <form
          preventdefault:submit
          onSubmit$={(_, el) => save(new FormData(el))}
          class="grid gap-4"
        >
          <Field label="Display name" for="file-name">
            <Input
              id="file-name"
              name="name"
              value={form.name}
              maxLength={255}
              onInput$={(_, el) => (form.name = el.value)}
            />
          </Field>
          <Field
            label="Tags"
            for="file-tags"
            help="Separate tags with commas. Up to 20 tags, 40 characters each."
          >
            <Input
              id="file-tags"
              name="tags"
              value={form.tags}
              onInput$={(_, el) => (form.tags = el.value)}
            />
          </Field>
          <Checkbox
            showLabel
            label="Favorite"
            name="favorite"
            checked={form.favorite}
            onChange$={(v) => (form.favorite = v)}
          />
          <Field label="Access" for="file-access">
            <Select
              id="file-access"
              name="access"
              value={form.access}
              onChange$={(_, el) => (form.access = el.value)}
            >
              <option value="public">Anyone with the link</option>
              <option value="members">Signed-in approved members</option>
              <option value="password">Password protected</option>
            </Select>
          </Field>
          {form.access === "password" && (
            <Field
              label="Password"
              for="file-password"
              help="At least 8 characters. Leave blank to keep an existing password."
            >
              <Input
                id="file-password"
                name="password"
                type="password"
                autoComplete="new-password"
                maxLength={200}
                value={form.password}
                onInput$={(_, el) => (form.password = el.value)}
              />
            </Field>
          )}
          <Field
            label="Expires at (UTC)"
            for="file-expiry"
            help="Leave blank for no expiration."
          >
            <Input
              id="file-expiry"
              name="expiry"
              type="datetime-local"
              value={form.expiry}
              onInput$={(_, el) => (form.expiry = el.value)}
            />
          </Field>
          <Field
            label="Maximum total views"
            for="file-max-views"
            help={`${file.value.views} views already used. Leave blank for unlimited.`}
          >
            <Input
              id="file-max-views"
              name="maxViews"
              type="number"
              min={1}
              value={form.maxViews}
              onInput$={(_, el) => (form.maxViews = el.value)}
            />
          </Field>
          <Checkbox
            showLabel
            label="Revoke public link"
            name="revoked"
            checked={form.revoked}
            onChange$={(v) => (form.revoked = v)}
          />
          <p class="text-ink-muted text-sm">
            Revoking the link keeps the stored file. Clear this setting to
            reactivate it. Your private preview remains available.
          </p>
          <div>
            <Button type="submit" loading={busy.value}>
              Save settings
            </Button>
          </div>
        </form>
      )}
    </Page>
  );
});
