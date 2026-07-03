import { component$, useSignal, $, useTask$ } from "@builder.io/qwik";
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

export default component$(() => {
  const userData = useUserLoader();
  const updateAction = useUpdateEmbedSettings();
  const previewCode = useSignal(""); // Reactive form state
  const showFileInfo = useSignal(userData.value.user.showFileInfo);
  const showUploadDate = useSignal(userData.value.user.showUploadDate);
  const showUserStats = useSignal(userData.value.user.showUserStats);
  const useCustomWords = useSignal(userData.value.user.useCustomWords);

  // Form field signals to track current values
  const titleValue = useSignal(userData.value.user.embedTitle || "");
  const descriptionValue = useSignal(
    userData.value.user.embedDescription || "",
  );
  const colorValue = useSignal(userData.value.user.embedColor || "#8B5CF6");
  const authorValue = useSignal(userData.value.user.embedAuthor || "");
  const footerValue = useSignal(userData.value.user.embedFooter || ""); // Initialize preview code with user data (non-reactive)
  const user = userData.value.user;
  const inputClasses =
    "w-full px-3 sm:px-4 py-2 sm:py-3 glass rounded-full placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 transition-all duration-300 text-sm sm:text-base text-theme-primary";
  const toggleClasses =
    "flex gap-2 items-center p-3 glass rounded-full hover:bg-theme-accent-primary/10 transition-all duration-300 cursor-pointer";
  // Use useTask$ to set initial preview without violating Qwik's reactivity rules
  useTask$(() => {
    const title = user.embedTitle || "File Upload";
    const description = user.embedDescription || "Uploaded via twink.forsale";
    const color = user.embedColor || "#8B5CF6";
    const author = user.embedAuthor || user.name || "User";
    const footer = user.embedFooter || "twink.forsale";    // Replace placeholders with example values for initial preview
    const replacedTitle = title
      .replace(/\{filename\}/g, "example-image.png")
      .replace(/\{filesize\}/g, "2.34 MB")
      .replace(/\{filetype\}/g, "image/png")
      .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
      .replace(/\{views\}/g, "42")
      .replace(/\{username\}/g, user.name || "User")
      .replace(/\{totalfiles\}/g, "127")
      .replace(/\{totalstorage\}/g, "2.1 GB")
      .replace(/\{totalviews\}/g, "5,432");

    let initialDesc = description
      .replace(/\{filename\}/g, "example-image.png")
      .replace(/\{filesize\}/g, "2.34 MB")
      .replace(/\{filetype\}/g, "image/png")
      .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
      .replace(/\{views\}/g, "42")
      .replace(/\{username\}/g, user.name || "User")
      .replace(/\{totalfiles\}/g, "127")
      .replace(/\{totalstorage\}/g, "2.1 GB")
      .replace(/\{totalviews\}/g, "5,432");

    const replacedAuthor = author
      .replace(/\{filename\}/g, "example-image.png")
      .replace(/\{filesize\}/g, "2.34 MB")
      .replace(/\{filetype\}/g, "image/png")
      .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
      .replace(/\{views\}/g, "42")
      .replace(/\{username\}/g, user.name || "User")
      .replace(/\{totalfiles\}/g, "127")
      .replace(/\{totalstorage\}/g, "2.1 GB")
      .replace(/\{totalviews\}/g, "5,432");

    if (user.showFileInfo) {
      initialDesc += "\\n\\n📁 **example-image.png**\\n📏 2.34 MB • image/png";
    }
    if (user.showUploadDate) {
      initialDesc += "\\n📅 Uploaded " + new Date().toLocaleDateString();
    }    // Set initial footer based on user stats setting
    let initialFooter = footer;
    if (user.showUserStats) {
      initialFooter = "📁 127 files   💾 2.1 GB   👁️ 5,432 views";
    } else {
      // Apply placeholder replacements to footer if not using user stats
      initialFooter = footer
        .replace(/\{filename\}/g, "example-image.png")
        .replace(/\{filesize\}/g, "2.34 MB")
        .replace(/\{filetype\}/g, "image/png")
        .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
        .replace(/\{views\}/g, "42")
        .replace(/\{username\}/g, user.name || "User")
        .replace(/\{totalfiles\}/g, "127")
        .replace(/\{totalstorage\}/g, "2.1 GB")
        .replace(/\{totalviews\}/g, "5,432");
    }

    previewCode.value = `{
      "type": "rich",
      "title": "${replacedTitle}",
      "description": "${initialDesc}",
      "color": ${parseInt(color.slice(1), 16)},
      "author": {
        "name": "${replacedAuthor}"
      },
      "header": {
        "text": "${initialFooter}"
      },
      "image": {
        "url": "https://twink.forsale/f/abc123"
      }
    }`;
  });
  const generatePreview = $(() => {
    const title = titleValue.value || "File Upload";
    const description = descriptionValue.value || "Uploaded via twink.forsale";
    const color = colorValue.value || "#8B5CF6";
    const author = authorValue.value || userData.value.user.name || "User";
    const footer = footerValue.value || "twink.forsale";    // Replace placeholders with example values
    const replacedTitle = title
      .replace(/\{filename\}/g, "example-image.png")
      .replace(/\{filesize\}/g, "2.34 MB")
      .replace(/\{filetype\}/g, "image/png")
      .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
      .replace(/\{views\}/g, "42")
      .replace(/\{username\}/g, userData.value.user.name || "User")
      .replace(/\{totalfiles\}/g, "127")
      .replace(/\{totalstorage\}/g, "2.1 GB")
      .replace(/\{totalviews\}/g, "5,432");

    let desc = description
      .replace(/\{filename\}/g, "example-image.png")
      .replace(/\{filesize\}/g, "2.34 MB")
      .replace(/\{filetype\}/g, "image/png")
      .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
      .replace(/\{views\}/g, "42")
      .replace(/\{username\}/g, userData.value.user.name || "User")
      .replace(/\{totalfiles\}/g, "127")
      .replace(/\{totalstorage\}/g, "2.1 GB")
      .replace(/\{totalviews\}/g, "5,432");

    const replacedAuthor = author
      .replace(/\{filename\}/g, "example-image.png")
      .replace(/\{filesize\}/g, "2.34 MB")
      .replace(/\{filetype\}/g, "image/png")
      .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
      .replace(/\{views\}/g, "42")
      .replace(/\{username\}/g, userData.value.user.name || "User")
      .replace(/\{totalfiles\}/g, "127")
      .replace(/\{totalstorage\}/g, "2.1 GB")
      .replace(/\{totalviews\}/g, "5,432");
    if (showFileInfo.value) {
      desc += "\\n\\n📁 **example-image.png**\\n📏 2.34 MB • image/png";
    }
    if (showUploadDate.value) {
      desc += "\\n📅 Uploaded " + new Date().toLocaleDateString();
    }    // Update footer based on user stats setting
    let finalFooter = footer;
    if (showUserStats.value) {
      finalFooter = "📁 127 files   💾 2.1 GB   👁️ 5,432 views";
    } else {
      // Apply placeholder replacements to footer if not using user stats
      finalFooter = footer
        .replace(/\{filename\}/g, "example-image.png")
        .replace(/\{filesize\}/g, "2.34 MB")
        .replace(/\{filetype\}/g, "image/png")
        .replace(/\{uploaddate\}/g, new Date().toLocaleDateString())
        .replace(/\{views\}/g, "42")
        .replace(/\{username\}/g, userData.value.user.name || "User")
        .replace(/\{totalfiles\}/g, "127")
        .replace(/\{totalstorage\}/g, "2.1 GB")
        .replace(/\{totalviews\}/g, "5,432");
    }

    previewCode.value = `{
      "type": "rich",
      "title": "${replacedTitle}",
      "description": "${desc}",
      "color": ${parseInt(color.slice(1), 16)},
      "author": {
        "name": "${replacedAuthor}"
      },
      "footer": {
        "text": "${finalFooter}"
      },
      "image": {
        "url": "https://twink.forsale/f/abc123"
      }
    }`;
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
          <Form action={updateAction} onSubmit$={generatePreview}>
            <div class="space-y-4 sm:space-y-6">
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Embed Title~
                </label>
                <input
                  type="text"
                  name="embedTitle"
                  value={titleValue.value}
                  placeholder="File Upload~"
                  class={inputClasses}
                  onInput$={(event) => {
                    titleValue.value = (event.target as HTMLInputElement).value;
                    generatePreview();
                  }}
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  Use placeholders: {"{filename}"}, {"{filesize}"},
                  {"{filetype}"}, {"{uploaddate}"}, {"{views}"}, {"{username}"},
                  {"{totalfiles}"}, {"{totalstorage}"}, {"{totalviews}"}~
                </p>
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Description~
                </label>
                <textarea
                  name="embedDescription"
                  value={descriptionValue.value}
                  placeholder="Uploaded via twink.forsale~ (◕‿◕)♡"
                  rows={3}
                  class="glass placeholder:theme-text-muted focus:ring-theme-accent-primary/50 text-theme-text-primary w-full resize-none rounded-2xl px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:outline-none sm:px-4 sm:py-3 sm:text-base"
                  onInput$={(event) => {
                    descriptionValue.value = (
                      event.target as HTMLTextAreaElement
                    ).value;
                    generatePreview();
                  }}
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  Use placeholders: {"{filename}"}, {"{filesize}"},
                  {"{filetype}"}, {"{uploaddate}"}, {"{views}"}, {"{username}"},
                  {"{totalfiles}"}, {"{totalstorage}"}, {"{totalviews}"}~
                </p>
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
                    generatePreview();
                  }}
                />
              </div>              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Author Name~
                </label>
                <input
                  type="text"
                  name="embedAuthor"
                  value={authorValue.value}
                  placeholder={userData.value.user.name || "Cute User~"}
                  class={inputClasses}
                  onInput$={(event) => {
                    authorValue.value = (
                      event.target as HTMLInputElement
                    ).value;
                    generatePreview();
                  }}
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  Use placeholders: {"{filename}"}, {"{filesize}"},
                  {"{filetype}"}, {"{uploaddate}"}, {"{views}"}, {"{username}"},
                  {"{totalfiles}"}, {"{totalstorage}"}, {"{totalviews}"}~
                </p>
              </div>              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Header Text~
                </label>
                <input
                  type="text"
                  name="embedFooter"
                  value={footerValue.value}
                  placeholder="twink.forsale~"
                  class={inputClasses}
                  onInput$={(event) => {
                    footerValue.value = (
                      event.target as HTMLInputElement
                    ).value;
                    generatePreview();
                  }}
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  Use placeholders: {"{filename}"}, {"{filesize}"},
                  {"{filetype}"}, {"{uploaddate}"}, {"{views}"}, {"{username}"},
                  {"{totalfiles}"}, {"{totalstorage}"}, {"{totalviews}"}~
                </p>
              </div>
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Custom Domain (Optional)~
                </label>
                <input
                  type="text"
                  name="customDomain"
                  value={userData.value.user.customDomain || ""}
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
                      generatePreview();
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
                      generatePreview();
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
                      generatePreview();
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
                      generatePreview();
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
          <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
            <Share class="h-5 w-5" />
            Discord Embed Preview~
          </h2>
          <div class="glass rounded-2xl border-l-4 p-3 sm:p-4">
            <div class="text-theme-text-muted mb-3 flex items-center text-xs">
              Example embed structure~
            </div>
            <pre class="text-theme-text-secondary bg-theme-bg-tertiary/20 overflow-x-auto rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
              {previewCode.value}
            </pre>
          </div>
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
