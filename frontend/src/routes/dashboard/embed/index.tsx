import { component$, useSignal, $, useComputed$ } from "@builder.io/qwik";
import type { QRL, Signal } from "@builder.io/qwik";
import {
  routeLoader$,
  Form,
  routeAction$,
  z,
  zod$,
} from "@builder.io/qwik-city";
import { ColorPicker, Toggle } from "@luminescent/ui-qwik";
import {
  Share,
  Settings,
  Save,
  CheckCircle,
  CircleX,
  Info,
  Code,
  Image as ImageIcon,
  Eye,
} from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { PageHeader } from "~/components/ui";

export const useUserLoader = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const settings = await api.settings.get(auth).catch(() => null);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      embedTitle: settings?.embedTitle ?? null,
      embedDescription: settings?.embedDescription ?? null,
      embedColor: settings?.embedColor ?? null,
      embedAuthor: settings?.embedAuthor ?? null,
      embedFooter: settings?.embedFooter ?? null,
      showFileInfo: Boolean(settings?.showFileInfo),
      showUploadDate: Boolean(settings?.showUploadDate),
      showUserStats: Boolean(settings?.showUserStats),
      customDomain: settings?.customDomain ?? null,
      useCustomWords: Boolean(settings?.useCustomWords),
    },
  };
});

export const useUpdateEmbedSettings = routeAction$(
  async (values, requestEvent) => {
    const auth = serverAuth(requestEvent);
    try {
      // Embed appearance lives on the embed endpoint; `useCustomWords` is a
      // general setting, so persist it via the settings endpoint.
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
      return { success: true, message: "Embed settings updated successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update embed settings",
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
    showFileInfo: z.preprocess(
      (val) => val === "on" || val === true,
      z.boolean().default(false),
    ),
    showUploadDate: z.preprocess(
      (val) => val === "on" || val === true,
      z.boolean().default(false),
    ),
    showUserStats: z.preprocess(
      (val) => val === "on" || val === true,
      z.boolean().default(false),
    ),
    customDomain: z.string().optional(),
    useCustomWords: z.preprocess(
      (val) => val === "on" || val === true,
      z.boolean().default(false),
    ),
  }),
);

// Placeholders users can drop into any of the text fields. Kept in one place so
// the chip row below stays in sync with the example values used for the preview.
const PLACEHOLDERS = [
  "filename",
  "filesize",
  "filetype",
  "uploaddate",
  "views",
  "username",
  "totalfiles",
  "totalstorage",
  "totalviews",
] as const;

// Small row of clickable tokens that append into the field the chips belong to.
// Inserting beats making people memorise the `{token}` syntax from a hint blob.
const PlaceholderChips = component$<{ onInsert$: QRL<(token: string) => void> }>(
  ({ onInsert$ }) => (
    <div class="mt-2 flex flex-wrap gap-1.5 pl-1">
      {PLACEHOLDERS.map((token) => (
        <button
          key={token}
          type="button"
          onClick$={() => onInsert$(`{${token}}`)}
          class="glass text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-accent-primary/15 rounded-full px-2.5 py-1 font-mono text-[11px] transition-all duration-200"
        >
          {`{${token}}`}
        </button>
      ))}
    </div>
  ),
);

export default component$(() => {
  const userData = useUserLoader();
  const updateAction = useUpdateEmbedSettings();
  const user = userData.value.user;

  // Reactive form state — everything the preview reads lives in a signal so the
  // preview stays in lockstep without hand-rolled regenerate calls.
  const showFileInfo = useSignal(user.showFileInfo);
  const showUploadDate = useSignal(user.showUploadDate);
  const showUserStats = useSignal(user.showUserStats);
  const useCustomWords = useSignal(user.useCustomWords);

  const titleValue = useSignal(user.embedTitle || "");
  const descriptionValue = useSignal(user.embedDescription || "");
  const colorValue = useSignal(user.embedColor || "#8B5CF6");
  const authorValue = useSignal(user.embedAuthor || "");
  const footerValue = useSignal(user.embedFooter || "");

  const showJson = useSignal(false);

  const inputClasses =
    "w-full px-3 sm:px-4 py-2 sm:py-3 glass rounded-full placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 transition-all duration-300 text-sm sm:text-base text-theme-primary";
  const toggleClasses =
    "flex gap-2 items-center p-3 glass rounded-full hover:bg-theme-accent-primary/10 transition-all duration-300 cursor-pointer";

  // Helper to append a placeholder token to a given field signal.
  const insertInto = (field: Signal<string>) =>
    $((token: string) => {
      field.value = `${field.value}${token}`;
    });

  // Derived preview model — resolves placeholders to example values and folds in
  // the optional file-info / upload-date / user-stats blocks.
  const preview = useComputed$(() => {
    const name = user.name || "User";
    const values: Record<string, string> = {
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
      s.replace(/\{(\w+)\}/g, (m, key) => values[key] ?? m);

    const descLines = [fill(descriptionValue.value || "Uploaded via twink.forsale")];
    if (showFileInfo.value) {
      descLines.push("", "📁 example-image.png", "📏 2.34 MB • image/png");
    }
    if (showUploadDate.value) {
      descLines.push("📅 Uploaded " + values.uploaddate);
    }

    const footer = showUserStats.value
      ? "📁 127 files   💾 2.1 GB   👁️ 5,432 views"
      : fill(footerValue.value || "twink.forsale");

    return {
      title: fill(titleValue.value || "File Upload"),
      author: fill(authorValue.value || name),
      description: descLines,
      footer,
      color: colorValue.value || "#8B5CF6",
    };
  });

  // JSON view of the same model, for people who want the literal embed payload.
  const previewJson = useComputed$(() => {
    const p = preview.value;
    const payload = {
      type: "rich",
      title: p.title,
      description: p.description.join("\n"),
      color: parseInt(p.color.slice(1), 16),
      author: { name: p.author },
      footer: { text: p.footer },
      image: { url: "https://twink.forsale/f/abc123" },
    };
    return JSON.stringify(payload, null, 2);
  });

  return (
    <div>
      <PageHeader
        align="left"
        title="Discord Embed Settings~"
        icon={Share}
        subtitle="Customize how your cute uploads appear when shared on Discord and other platforms! (◕‿◕)♡"
      />
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Settings Form */}
        <div class="card-cute rounded-2xl p-4 sm:p-6">
          <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
            <Settings class="h-5 w-5" />
            Embed Configuration~
          </h2>
          <Form action={updateAction}>
            <div class="space-y-4 sm:space-y-6">
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Embed Title~
                </label>
                <input
                  type="text"
                  name="embedTitle"
                  bind:value={titleValue}
                  placeholder="File Upload~"
                  class={inputClasses}
                />
                <PlaceholderChips onInsert$={insertInto(titleValue)} />
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Description~
                </label>
                <textarea
                  name="embedDescription"
                  bind:value={descriptionValue}
                  placeholder="Uploaded via twink.forsale~ (◕‿◕)♡"
                  rows={3}
                  class="glass placeholder:theme-text-muted focus:ring-theme-accent-primary/50 text-theme-text-primary w-full resize-none rounded-2xl px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:outline-none sm:px-4 sm:py-3 sm:text-base"
                />
                <PlaceholderChips onInsert$={insertInto(descriptionValue)} />
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Embed Color~
                </label>
                <ColorPicker
                  id="color-picker"
                  horizontal
                  value={colorValue.value}
                  onInput$={(newColor) => {
                    colorValue.value = newColor;
                  }}
                />
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Author Name~
                </label>
                <input
                  type="text"
                  name="embedAuthor"
                  bind:value={authorValue}
                  placeholder={user.name || "Cute User~"}
                  class={inputClasses}
                />
                <PlaceholderChips onInsert$={insertInto(authorValue)} />
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Header Text~
                </label>
                <input
                  type="text"
                  name="embedFooter"
                  bind:value={footerValue}
                  placeholder="twink.forsale~"
                  class={inputClasses}
                />
                <PlaceholderChips onInsert$={insertInto(footerValue)} />
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Custom Domain (Optional)~
                </label>
                <input
                  type="text"
                  name="customDomain"
                  value={user.customDomain || ""}
                  placeholder="your-domain.com"
                  class={inputClasses}
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  Override the domain shown in embeds (for custom domains)~
                </p>
              </div>
              <div class="space-y-3 sm:space-y-4">
                <label class={toggleClasses}>
                  <Toggle
                    checkbox
                    name="showFileInfo"
                    onColor="purple"
                    checked={showFileInfo.value}
                    onChange$={(e, el) => {
                      showFileInfo.value = el.checked;
                    }}
                  />
                  <span class="text-theme-text-secondary text-xs sm:text-sm">
                    Show file information (name, size, type)~
                  </span>
                </label>
                <label class={toggleClasses}>
                  <Toggle
                    checkbox
                    name="showUploadDate"
                    onColor="purple"
                    checked={showUploadDate.value}
                    onChange$={(e, el) => {
                      showUploadDate.value = el.checked;
                    }}
                  />
                  <span class="text-theme-text-secondary text-xs sm:text-sm">
                    Show upload date~
                  </span>
                </label>
                <label class={toggleClasses}>
                  <Toggle
                    checkbox
                    name="showUserStats"
                    onColor="purple"
                    checked={showUserStats.value}
                    onChange$={(e, el) => {
                      showUserStats.value = el.checked;
                    }}
                  />
                  <span class="text-theme-text-secondary text-xs sm:text-sm">
                    Show user statistics (files uploaded, storage used, total
                    views)~
                  </span>
                </label>
                <label class={toggleClasses}>
                  <Toggle
                    checkbox
                    name="useCustomWords"
                    onColor="purple"
                    checked={useCustomWords.value}
                    onChange$={(e, el) => {
                      useCustomWords.value = el.checked;
                    }}
                  />
                  <span class="text-theme-text-secondary text-xs sm:text-sm">
                    Use cute words for file URLs~
                  </span>
                </label>
                <p class="text-theme-text-muted -mt-2 ml-8 text-xs">
                  Generate adorable URLs like "bunny-sparkle-123" instead of
                  random characters~ (◕‿◕)♡
                </p>
              </div>
              {/* Hidden inputs to ensure checkbox values are always submitted */}
              <input
                type="hidden"
                name="showFileInfo"
                value={showFileInfo.value ? "on" : "off"}
              />
              <input
                type="hidden"
                name="showUploadDate"
                value={showUploadDate.value ? "on" : "off"}
              />
              <input
                type="hidden"
                name="showUserStats"
                value={showUserStats.value ? "on" : "off"}
              />
              <input
                type="hidden"
                name="useCustomWords"
                value={useCustomWords.value ? "on" : "off"}
              />
              <button
                type="submit"
                class="btn-cute text-theme-text-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-6 sm:py-3 sm:text-base"
              >
                <Save class="h-4 w-4" />
                Save Settings~
              </button>
            </div>
          </Form>

          {updateAction.value?.success && (
            <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
              <p class="text-theme-accent-secondary flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle class="h-4 w-4 flex-shrink-0" />
                {updateAction.value.message}~
              </p>
            </div>
          )}

          {updateAction.value?.failed && (
            <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-accent-primary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
              <p class="text-theme-accent-primary flex items-center gap-2 text-xs sm:text-sm">
                <CircleX class="h-4 w-4 flex-shrink-0" />
                {updateAction.value.message}~
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div class="card-cute rounded-2xl p-4 sm:p-6">
          <div class="mb-4 flex items-center justify-between sm:mb-6">
            <h2 class="text-gradient-cute flex items-center gap-2 text-lg font-bold sm:text-xl">
              <Eye class="h-5 w-5" />
              Discord Embed Preview~
            </h2>
            <button
              type="button"
              onClick$={() => (showJson.value = !showJson.value)}
              class="glass text-theme-text-muted hover:text-theme-text-primary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-300"
            >
              <Code class="h-3.5 w-3.5" />
              {showJson.value ? "Hide JSON" : "View JSON"}
            </button>
          </div>

          {/* Discord-style embed card mock */}
          <div class="rounded-lg bg-[#2b2d31] p-3 shadow-inner sm:p-4">
            <div class="text-xs text-[#949ba4]">Today at 4:20 PM</div>
            <div
              class="mt-1.5 flex flex-col rounded border-l-4 bg-[#313338] p-3"
              style={{ borderColor: preview.value.color }}
            >
              <div class="text-xs font-semibold text-white/90">
                {preview.value.author}
              </div>
              <div class="mt-1 text-sm font-semibold text-[#00a8fc]">
                {preview.value.title}
              </div>
              <div class="mt-1 text-sm whitespace-pre-wrap text-[#dbdee1]">
                {preview.value.description.join("\n")}
              </div>
              {/* Inline image preview placeholder */}
              <div class="mt-3 flex h-32 items-center justify-center rounded bg-black/30 text-[#949ba4]">
                <div class="flex flex-col items-center gap-1">
                  <ImageIcon class="h-6 w-6" />
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

          {/* Optional raw JSON payload */}
          {showJson.value && (
            <div class="glass mt-4 rounded-2xl p-3 sm:p-4">
              <div class="text-theme-text-muted mb-2 flex items-center gap-1.5 text-xs">
                <Code class="h-3.5 w-3.5" />
                Raw embed payload~
              </div>
              <pre class="text-theme-text-secondary bg-theme-bg-tertiary/20 overflow-x-auto rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                {previewJson.value}
              </pre>
            </div>
          )}

          <div class="glass border-theme-accent-quaternary/20 mt-6 rounded-2xl border p-4">
            <h3 class="text-theme-accent-quaternary mb-3 flex items-center gap-2 text-sm font-medium">
              <Info class="h-4 w-4" />
              How it works~
            </h3>
            <ul class="text-theme-text-secondary space-y-2 text-xs">
              <li class="flex items-center">
                • Discord bots/crawlers see the embed metadata~
              </li>
              <li class="flex items-center">
                • Regular users are redirected to the actual file~
              </li>
              <li class="flex items-center">
                • Images show inline previews in Discord~
              </li>
              <li class="flex items-center">
                • Custom domains override the site name~
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
