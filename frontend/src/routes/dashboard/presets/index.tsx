import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { serverAuth } from "~/lib/api-client";
import { library } from "~/lib/library-api";
import {
  Page,
  PageHeader,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Button,
  Callout,
} from "~/components/ui";

export const usePresets = routeLoader$((event) =>
  library.presets(serverAuth(event)),
);
export default component$(() => {
  const data = usePresets();
  const presets = useSignal(data.value.presets);
  const busy = useSignal(false);
  const error = useSignal("");
  const form = useStore({
    name: "",
    domain: "",
    days: "",
    views: "",
    title: "",
    description: "",
    color: "",
    strip: false,
  });
  const save = $(async (values: FormData) => {
    busy.value = true;
    error.value = "";
    try {
      await library.savePreset({
        name: String(values.get("name") || ""),
        uploadDomainId: String(values.get("domain") || "") || null,
        expirationDays: values.get("days") ? Number(values.get("days")) : null,
        maxViews: values.get("views") ? Number(values.get("views")) : null,
        embedTitle: String(values.get("title") || "") || null,
        embedDescription: String(values.get("description") || "") || null,
        embedColor: String(values.get("color") || "") || null,
        stripMetadata: values.has("strip"),
      });
      presets.value = (await library.presets()).presets;
      form.name = "";
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Could not save preset.";
    } finally {
      busy.value = false;
    }
  });
  return (
    <Page width="narrow">
      <PageHeader
        title="Upload presets"
        description="Choose a preset on Upload to apply its domain, expiration, view limit, and embed settings."
      />
      {error.value && (
        <Callout tone="danger" title="Preset error" class="mb-4">
          {error.value}
        </Callout>
      )}
      <form
        preventdefault:submit
        onSubmit$={(_, el) => save(new FormData(el))}
        class="grid gap-4"
      >
        <Field label="Name" for="preset-name">
          <Input
            id="preset-name"
            name="name"
            required
            maxLength={80}
            value={form.name}
            onInput$={(_, el) => (form.name = el.value)}
          />
        </Field>
        <Field label="Upload domain" for="preset-domain">
          <Select
            id="preset-domain"
            name="domain"
            value={form.domain}
            onChange$={(_, el) => (form.domain = el.value)}
          >
            <option value="">Account default</option>
            {data.value.domains.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >{`${d.name} (${d.domain})`}</option>
            ))}
          </Select>
        </Field>
        <div class="grid gap-4 sm:grid-cols-2">
          <Field
            label="Expiration in days"
            for="preset-days"
            help="Blank means no expiration."
          >
            <Input
              id="preset-days"
              name="days"
              type="number"
              min={1}
              max={36500}
              value={form.days}
              onInput$={(_, el) => (form.days = el.value)}
            />
          </Field>
          <Field
            label="Maximum views"
            for="preset-views"
            help="Blank means unlimited."
          >
            <Input
              id="preset-views"
              name="views"
              type="number"
              min={1}
              value={form.views}
              onInput$={(_, el) => (form.views = el.value)}
            />
          </Field>
        </div>
        <Field
          label="Embed title"
          for="preset-title"
          help="Blank uses your account embed settings."
        >
          <Input
            id="preset-title"
            name="title"
            maxLength={200}
            value={form.title}
            onInput$={(_, el) => (form.title = el.value)}
          />
        </Field>
        <Field label="Embed description" for="preset-description">
          <Textarea
            id="preset-description"
            name="description"
            maxLength={2000}
            value={form.description}
            onInput$={(_, el) => (form.description = el.value)}
          />
        </Field>
        <Field
          label="Embed color"
          for="preset-color"
          help="Hex color such as #ec4899, or blank for your default."
        >
          <Input
            id="preset-color"
            name="color"
            pattern="#[0-9a-fA-F]{6}"
            value={form.color}
            onInput$={(_, el) => (form.color = el.value)}
          />
        </Field>
        <Checkbox
          showLabel
          label="Remove image metadata before browser uploads"
          name="strip"
          checked={form.strip}
          onChange$={(v) => (form.strip = v)}
        />
        <p class="text-ink-muted text-xs">
          Metadata removal is applied in this browser for PNG, JPEG, and WebP
          images, exporting them as PNG. Animated images become still.
        </p>
        <div>
          <Button type="submit" loading={busy.value}>
            Save new preset
          </Button>
        </div>
      </form>
      <h2 class="mt-8 text-lg font-semibold">Saved presets</h2>
      <ul class="divide-edge divide-y">
        {presets.value.map((p) => (
          <li
            key={p.id}
            class="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span class="text-sm">{p.name}</span>
            <div class="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick$={() => {
                  form.name = `${p.name} copy`;
                  form.domain = p.uploadDomainId || "";
                  form.days = p.expirationDays?.toString() || "";
                  form.views = p.maxViews?.toString() || "";
                  form.title = p.embedTitle || "";
                  form.description = p.embedDescription || "";
                  form.color = p.embedColor || "";
                  form.strip = p.stripMetadata;
                }}
              >
                Use as template
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy.value}
                onClick$={async () => {
                  busy.value = true;
                  error.value = "";
                  try {
                    await library.deletePreset(p.id);
                    presets.value = presets.value.filter((x) => x.id !== p.id);
                  } catch (e) {
                    error.value =
                      e instanceof Error
                        ? e.message
                        : "Could not delete preset.";
                  } finally {
                    busy.value = false;
                  }
                }}
              >
                Delete preset
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
});
