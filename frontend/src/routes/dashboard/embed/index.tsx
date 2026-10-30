import { component$, useSignal, useComputed$, $ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  usePreventNavigate$,
  z,
  zod$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Image as ImageIcon, FileText, Palette, Tags } from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { useToast } from "~/lib/toast-store";
import { EditorLayout } from "~/components/layout/editor-layout";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  PreviewPane,
  Button,
  Field,
  Input,
  Textarea,
  Switch,
  Callout,
  SaveIndicator,
  CopyButton,
  LocalNav,
  type SaveState,
} from "~/components/ui";

export const useEmbedSettings = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const settings = await api.settings.get(auth).catch(() => null);
  return {
    name: user.name,
    embedTitle: settings?.embedTitle ?? "",
    embedDescription: settings?.embedDescription ?? "",
    embedColor: settings?.embedColor ?? "#db2777",
    embedAuthor: settings?.embedAuthor ?? "",
    embedFooter: settings?.embedFooter ?? "",
    showFileInfo: Boolean(settings?.showFileInfo),
    showUploadDate: Boolean(settings?.showUploadDate),
    showUserStats: Boolean(settings?.showUserStats),
    customDomain: settings?.customDomain ?? "",
    useCustomWords: Boolean(settings?.useCustomWords),
  };
});

export const useUpdateEmbedSettings = routeAction$(
  async (values, requestEvent) => {
    const auth = serverAuth(requestEvent);
    try {
      // Embed appearance lives on the embed endpoint; `useCustomWords` is a
      // general setting, so it goes through the settings endpoint.
      await api.settings.updateEmbed(
        {
          embedTitle: values.embedTitle || null,
          embedDescription: values.embedDescription || null,
          embedColor: values.embedColor || null,
          embedAuthor: values.embedAuthor || null,
          embedFooter: values.embedFooter || null,
          showFileInfo: Boolean(values.showFileInfo),
          showUploadDate: Boolean(values.showUploadDate),
          showUserStats: Boolean(values.showUserStats),
          customDomain: values.customDomain || null,
        },
        auth,
      );
      await api.settings
        .update({ useCustomWords: Boolean(values.useCustomWords) }, auth)
        .catch(() => undefined);
      return { success: true, message: "Embed settings saved." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not save your embed settings.",
      });
    }
  },
  zod$({
    embedTitle: z.string().optional(),
    embedDescription: z.string().optional(),
    embedColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    embedAuthor: z.string().optional(),
    embedFooter: z.string().optional(),
    showFileInfo: z.boolean().optional(),
    showUploadDate: z.boolean().optional(),
    showUserStats: z.boolean().optional(),
    customDomain: z.string().optional(),
    useCustomWords: z.boolean().optional(),
  }),
);

/** Tokens the backend substitutes when it renders an embed. */
const PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: "{filename}", meaning: "the file's name" },
  { token: "{filesize}", meaning: "its size" },
  { token: "{filetype}", meaning: "its type" },
  { token: "{uploaddate}", meaning: "when it was uploaded" },
  { token: "{views}", meaning: "how many times it has been seen" },
  { token: "{username}", meaning: "your display name" },
];

const SECTIONS = [
  { href: "#embed-content", label: "Content", icon: FileText },
  { href: "#embed-appearance", label: "Appearance", icon: Palette },
  { href: "#embed-metadata", label: "Metadata", icon: Tags },
];

/** Chips that append a placeholder token to the field they belong to. */
const PlaceholderRow = component$<{ field: Signal<string>; ids: string }>(
  ({ field, ids }) => (
    <div class="mt-1.5 flex flex-wrap items-center gap-1" id={ids}>
      <span class="text-ink-muted mr-0.5 text-xs">Insert:</span>
      {PLACEHOLDERS.map((p) => (
        <button
          key={p.token}
          type="button"
          title={`Inserts ${p.meaning}`}
          onClick$={() => (field.value = `${field.value}${p.token}`)}
          class="focus-ring border-edge bg-surface-subtle text-ink-muted hover:bg-surface-hover hover:text-ink rounded-control border px-1.5 py-0.5 font-mono text-[11px] transition-colors duration-150"
        >
          {p.token}
        </button>
      ))}
    </div>
  ),
);

export default component$(() => {
  const data = useEmbedSettings();
  const action = useUpdateEmbedSettings();
  const toast = useToast();

  const mode = useSignal("edit");
  const activeSection = useSignal(SECTIONS[0].href);

  const title = useSignal(data.value.embedTitle);
  const description = useSignal(data.value.embedDescription);
  const color = useSignal(data.value.embedColor || "#db2777");
  const author = useSignal(data.value.embedAuthor);
  const footer = useSignal(data.value.embedFooter);
  const showFileInfo = useSignal(data.value.showFileInfo);
  const showUploadDate = useSignal(data.value.showUploadDate);
  const showUserStats = useSignal(data.value.showUserStats);
  const customDomain = useSignal(data.value.customDomain);
  const useCustomWords = useSignal(data.value.useCustomWords);

  const saveState = useSignal<SaveState>("idle");

  usePreventNavigate$((target) => {
    const hasUnsavedChanges =
      saveState.value === "dirty" ||
      saveState.value === "saving" ||
      saveState.value === "error";
    if (!hasUnsavedChanges) return false;
    if (target !== undefined) {
      return !window.confirm(
        "You have unsaved embed changes. Leave without saving them?",
      );
    }
    return true;
  });

  const markDirty = $(() => {
    if (saveState.value !== "saving") saveState.value = "dirty";
  });

  const save = $(async () => {
    saveState.value = "saving";
    const result = await action.submit({
      embedTitle: title.value,
      embedDescription: description.value,
      embedColor: color.value,
      embedAuthor: author.value,
      embedFooter: footer.value,
      showFileInfo: showFileInfo.value,
      showUploadDate: showUploadDate.value,
      showUserStats: showUserStats.value,
      customDomain: customDomain.value,
      useCustomWords: useCustomWords.value,
    });
    if (result.value.failed) {
      saveState.value = "error";
      toast.error("Could not save", result.value.message);
    } else {
      saveState.value = "saved";
      toast.success("Embed settings saved");
    }
  });

  // The preview resolves placeholders against representative sample values so
  // the effect of a change is visible immediately, from local state only.
  const preview = useComputed$(() => {
    const name = data.value.name || "You";
    const sample: Record<string, string> = {
      filename: "example-image.png",
      filesize: "2.34 MB",
      filetype: "image/png",
      uploaddate: new Date().toLocaleDateString(),
      views: "42",
      username: name,
      totalfiles: "127",
      totalstorage: "2.1 GB",
      totalviews: "5,432",
    };
    const fill = (s: string) =>
      s.replace(/\{(\w+)\}/g, (match, key) => sample[key] ?? match);

    const lines = [fill(description.value || "Uploaded via twink.forsale")];
    if (showFileInfo.value) {
      lines.push("", "example-image.png", "2.34 MB · image/png");
    }
    if (showUploadDate.value) {
      lines.push(`Uploaded ${sample.uploaddate}`);
    }

    return {
      title: fill(title.value || "File upload"),
      author: fill(author.value || name),
      description: lines,
      footer: showUserStats.value
        ? "127 files · 2.1 GB · 5,432 views"
        : fill(footer.value || customDomain.value || "twink.forsale"),
      color: /^#[0-9A-Fa-f]{6}$/.test(color.value) ? color.value : "#db2777",
    };
  });

  const previewJson = useComputed$(() => {
    const p = preview.value;
    return JSON.stringify(
      {
        type: "rich",
        title: p.title,
        description: p.description.join("\n"),
        color: parseInt(p.color.slice(1), 16),
        author: { name: p.author },
        footer: { text: p.footer },
        image: { url: "https://twink.forsale/f/abc123" },
      },
      null,
      2,
    );
  });

  return (
    <Page>
      <PageHeader
        title="Discord embeds"
        description="How your file links look when someone posts them in Discord."
      >
        <div q:slot="actions" class="flex items-center gap-3">
          <SaveIndicator state={saveState.value} />
          <Button
            variant="primary"
            loading={saveState.value === "saving"}
            disabled={saveState.value === "idle" || saveState.value === "saved"}
            onClick$={save}
          >
            Save changes
          </Button>
        </div>
      </PageHeader>

      <EditorLayout previewLabel="Discord embed" hasNav mode={mode}>
        <LocalNav
          q:slot="nav"
          label="Embed sections"
          items={SECTIONS}
          current={activeSection.value}
          stackAt="xl"
        />

        <div q:slot="settings" class="grid max-w-2xl gap-6">
          <Section
            id="embed-content"
            title="Content"
            description="The text Discord shows above and below your file."
          >
            <Surface>
              <div class="grid gap-4">
                <div>
                  <Field
                    label="Title"
                    for="embed-title"
                    help="The blue headline on the embed. Leave empty to use the file name."
                  >
                    <Input
                      id="embed-title"
                      value={title.value}
                      maxLength={256}
                      placeholder="{filename}"
                      onInput$={(_, el) => {
                        title.value = el.value;
                        markDirty();
                      }}
                    />
                  </Field>
                  <PlaceholderRow field={title} ids="embed-title-tokens" />
                </div>

                <div>
                  <Field
                    label="Description"
                    for="embed-description"
                    help="Shown under the title. Line breaks are preserved."
                  >
                    <Textarea
                      id="embed-description"
                      rows={3}
                      maxLength={2048}
                      value={description.value}
                      placeholder="Uploaded {uploaddate} · {filesize}"
                      onInput$={(_, el) => {
                        description.value = el.value;
                        markDirty();
                      }}
                    />
                  </Field>
                  <PlaceholderRow
                    field={description}
                    ids="embed-description-tokens"
                  />
                </div>

                <Field
                  label="Author line"
                  for="embed-author"
                  help="Small text above the title."
                >
                  <Input
                    id="embed-author"
                    value={author.value}
                    maxLength={256}
                    placeholder={data.value.name || "Your name"}
                    onInput$={(_, el) => {
                      author.value = el.value;
                      markDirty();
                    }}
                  />
                </Field>

                <Field
                  label="Footer"
                  for="embed-footer"
                  help="Small text at the bottom. Ignored when account totals are shown."
                >
                  <Input
                    id="embed-footer"
                    value={footer.value}
                    maxLength={2048}
                    placeholder="twink.forsale"
                    onInput$={(_, el) => {
                      footer.value = el.value;
                      markDirty();
                    }}
                  />
                </Field>
              </div>
            </Surface>
          </Section>

          <Section
            id="embed-appearance"
            title="Appearance"
            description="Discord draws a coloured bar down the left edge of the embed."
          >
            <Surface>
              <Field
                label="Accent colour"
                for="embed-color"
                help="A six-digit hex colour, for example #db2777."
                class="max-w-xs"
              >
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick accent colour"
                    value={preview.value.color}
                    onInput$={(_, el) => {
                      color.value = el.value;
                      markDirty();
                    }}
                    class="focus-ring border-edge rounded-control h-9 w-10 shrink-0 cursor-pointer border bg-transparent p-1"
                  />
                  <Input
                    id="embed-color"
                    value={color.value}
                    maxLength={7}
                    spellcheck={false}
                    class="font-mono"
                    onInput$={(_, el) => {
                      color.value = el.value;
                      markDirty();
                    }}
                  />
                </div>
              </Field>
            </Surface>
          </Section>

          <Section
            id="embed-metadata"
            title="Metadata"
            description="Extra details appended to the embed, and how your links are named."
          >
            <Surface>
              <div class="grid gap-3.5">
                <Switch
                  checked={showFileInfo.value}
                  label="Show file name, size and type"
                  help="Appends the file's details under your description."
                  onChange$={(checked) => {
                    showFileInfo.value = checked;
                    markDirty();
                  }}
                />
                <Switch
                  checked={showUploadDate.value}
                  label="Show upload date"
                  help="Appends the date the file was uploaded."
                  onChange$={(checked) => {
                    showUploadDate.value = checked;
                    markDirty();
                  }}
                />
                <Switch
                  checked={showUserStats.value}
                  label="Show your account totals in the footer"
                  help="Replaces the footer text with your file count, storage used and total views."
                  onChange$={(checked) => {
                    showUserStats.value = checked;
                    markDirty();
                  }}
                />
                <Switch
                  checked={useCustomWords.value}
                  label="Use word-based link codes"
                  help="New links read like /f/soft-peach-glow instead of /f/a7Kd2x."
                  onChange$={(checked) => {
                    useCustomWords.value = checked;
                    markDirty();
                  }}
                />

                <Field
                  label="Site name override"
                  for="embed-domain"
                  help="Shown by Discord as the source. Leave empty to use twink.forsale."
                  class="max-w-sm"
                >
                  <Input
                    id="embed-domain"
                    value={customDomain.value}
                    maxLength={100}
                    placeholder="your-site.com"
                    onInput$={(_, el) => {
                      customDomain.value = el.value;
                      markDirty();
                    }}
                  />
                </Field>
              </div>
            </Surface>
          </Section>

          <Callout tone="info">
            Discord and other link previewers see this metadata. Anyone opening
            the link in a browser is sent straight to the file itself.
          </Callout>
        </div>

        <div q:slot="preview" class="grid gap-3">
          <PreviewPane
            label="Discord embed"
            note={saveState.value === "dirty" ? "Not saved yet" : undefined}
            bodyClass="p-3"
          >
            {/* Discord's own surface colours, so the preview is representative
                rather than themed like the surrounding editor. */}
            <div class="rounded-[6px] bg-[#313338] p-3">
              <div class="text-xs text-[#949ba4]">Today at 16:20</div>
              <div
                class="mt-1.5 flex flex-col rounded-[4px] border-l-4 bg-[#2b2d31] p-3"
                style={`border-color:${preview.value.color}`}
              >
                <div class="text-xs font-semibold text-white/90">
                  {preview.value.author}
                </div>
                <div class="mt-1 text-sm font-semibold text-[#00a8fc]">
                  {preview.value.title}
                </div>
                <div class="mt-1 text-sm leading-5 whitespace-pre-wrap text-[#dbdee1]">
                  {preview.value.description.join("\n")}
                </div>
                <div class="mt-3 flex h-28 items-center justify-center rounded-[4px] bg-black/30 text-[#949ba4]">
                  <div class="flex flex-col items-center gap-1">
                    <ImageIcon class="h-5 w-5" aria-hidden="true" />
                    <span class="text-xs">example-image.png</span>
                  </div>
                </div>
                {preview.value.footer && (
                  <div class="mt-2 text-xs text-[#949ba4]">
                    {preview.value.footer}
                  </div>
                )}
              </div>
            </div>
          </PreviewPane>

          <details>
            <summary class="focus-ring text-ink-muted hover:text-ink cursor-pointer text-xs">
              Show the raw embed payload
            </summary>
            <div class="border-edge rounded-surface bg-surface-subtle relative mt-2 border">
              <CopyButton
                value={previewJson.value}
                label="Copy"
                variant="secondary"
                class="absolute top-2 right-2"
              />
              <pre class="text-ink max-h-64 overflow-auto p-3 pr-20 font-mono text-xs leading-5">
                {previewJson.value}
              </pre>
            </div>
          </details>
        </div>
      </EditorLayout>
    </Page>
  );
});

export const head: DocumentHead = {
  title: "Discord embeds - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Customise how your file links look in Discord.",
    },
  ],
};
