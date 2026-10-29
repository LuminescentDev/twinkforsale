import {
  component$,
  useSignal,
  useComputed$,
  useTask$,
  $,
  type Signal,
} from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  usePreventNavigate$,
  Form,
  z,
  zod$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import {
  User,
  Link as LinkIcon,
  Palette,
  Plug,
  Sparkles,
  Code,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-icons-qwik";
import { BioRevisions } from "~/components/bio/revisions";
import { library } from "~/lib/library-api";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { DEFAULT_BIO_LIMITS } from "~/lib/bio-limits";
import {
  BioPageDisplay,
  type BioPageData,
} from "~/components/bio/bio-page-display";
import { BioLinkIcon } from "~/components/bio/bio-link-icon";
import { getIconDef, suggestIconForUrl } from "~/lib/bio-icons";
import {
  defaultParticleConfigs,
  type ParticleConfig,
} from "~/components/effects/particle-background";
import { ParticleConfigPanel } from "~/components/ui/particle-config-panel";
import {
  GradientConfigPanel,
  getGradientCSS,
  type GradientConfig,
} from "~/components/ui/gradient-config-panel";
import { getLanyardData } from "~/lib/discord";
import { sanitizeCSS, hasDangerousCSS } from "~/lib/css-sanitizer";
import { contrastVerdict } from "~/lib/contrast";
import { EditorLayout } from "~/components/layout/editor-layout";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  PreviewPane,
  Divider,
  Button,
  IconButton,
  CopyButton,
  Field,
  Fieldset,
  Input,
  CodeInput,
  Textarea,
  Switch,
  Badge,
  Callout,
  EmptyState,
  Dialog,
  SaveIndicator,
  LocalNav,
  IconSelector,
  type SaveState,
} from "~/components/ui";

export const useBioData = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }
  if (!user.isApproved) {
    throw requestEvent.redirect(302, "/dashboard?error=bio_not_approved");
  }

  const bio = await api.bio.me(auth).catch(() => null);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isApproved: user.isApproved,
      bioUsername: bio?.username ?? null,
      bioDisplayName: bio?.displayName ?? null,
      bioDescription: bio?.description ?? null,
      bioProfileImage: bio?.profileImage ?? null,
      bioBackgroundImage: bio?.backgroundImage ?? null,
      bioBackgroundColor: bio?.backgroundColor || "#8B5CF6",
      bioTextColor: bio?.textColor || "#FFFFFF",
      bioAccentColor: bio?.accentColor || "#F59E0B",
      bioCustomCss: bio?.customCss ?? null,
      bioSpotifyTrack: bio?.spotifyTrack ?? null,
      bioIsPublic: bio?.isPublic ?? false,
      bioViews: bio?.views ?? 0,
      bioGradientConfig: bio?.gradientConfig ?? null,
      bioParticleConfig: bio?.particleConfig ?? null,
      bioDiscordUserId: bio?.discordUserId ?? null,
      bioShowDiscord: bio?.showDiscord ?? false,
      bioDiscordConfig: bio?.discordConfig ?? null,
    },
    history: await library.revisions(auth),
    bioLinks: bio?.links ?? [],
    bioLimits: bio?.limits ?? DEFAULT_BIO_LIMITS,
    baseUrl: requestEvent.url.origin,
  };
});

export const useUpdateBio = routeAction$(
  async (values, requestEvent) => {
    const auth = serverAuth(requestEvent);

    // Publishing without an address would produce an unreachable page.
    if (values.bioIsPublic && !(values.bioUsername || "").trim()) {
      return requestEvent.fail(400, {
        message: "Set a username before publishing your page.",
      });
    }

    // Custom CSS is user-authored, so it is sanitized before it is stored.
    let sanitizedCSS: string | null = null;
    if (values.bioCustomCss) {
      sanitizedCSS = sanitizeCSS(values.bioCustomCss);
      if (hasDangerousCSS(values.bioCustomCss)) {
        console.warn("Dangerous CSS detected and sanitized before submit");
      }
    }

    // The backend overwrites the Discord user id on every update, so the
    // current (auto-populated) value has to be round-tripped.
    const current = await api.bio.me(auth).catch(() => null);

    try {
      const res = await api.bio.update(
        {
          username: values.bioUsername || null,
          displayName: values.bioDisplayName || null,
          description: values.bioDescription || null,
          profileImage: values.bioProfileImage || null,
          backgroundImage: values.bioBackgroundImage || null,
          backgroundColor: values.bioBackgroundColor || "#8B5CF6",
          textColor: values.bioTextColor || "#FFFFFF",
          accentColor: values.bioAccentColor || "#F59E0B",
          customCss: sanitizedCSS,
          spotifyTrack: values.bioSpotifyTrack || null,
          isPublic: values.bioIsPublic || false,
          gradientConfig: values.bioGradientConfig || null,
          particleConfig: values.bioParticleConfig || null,
          discordUserId: current?.discordUserId ?? null,
          showDiscord: values.bioShowDiscord || false,
          discordConfig: values.bioDiscordConfig || null,
        },
        auth,
      );
      if (res && res.success === false) {
        return requestEvent.fail(409, {
          message: res.error || "Could not save your bio page.",
        });
      }
      return { success: true, message: "Bio draft saved." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not save your bio page.",
      });
    }
  },
  zod$({
    bioUsername: z.string().optional(),
    bioDisplayName: z.string().optional(),
    bioDescription: z.string().optional(),
    bioProfileImage: z.string().optional(),
    bioBackgroundImage: z.string().optional(),
    bioBackgroundColor: z.string().optional(),
    bioTextColor: z.string().optional(),
    bioAccentColor: z.string().optional(),
    bioCustomCss: z.string().optional(),
    bioSpotifyTrack: z.string().optional(),
    bioGradientConfig: z.string().optional(),
    bioParticleConfig: z.string().optional(),
    bioShowDiscord: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean().optional(),
    ),
    bioDiscordConfig: z.string().optional(),
    bioIsPublic: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean().optional(),
    ),
  }),
);

export const useCreateBioLink = routeAction$(
  async (values, requestEvent) => {
    try {
      const res = await api.bio.createLink(
        { title: values.title, url: values.url, icon: values.icon || null },
        serverAuth(requestEvent),
      );
      if (res && res.success === false) {
        return requestEvent.fail(400, {
          message: res.error || "Could not add the link.",
        });
      }
      return { success: true, message: "Link added." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Could not add the link.",
      });
    }
  },
  zod$({
    title: z.string().min(1),
    url: z.string().url(),
    icon: z.string().optional(),
  }),
);

export const useUpdateBioLink = routeAction$(
  async (values, requestEvent) => {
    try {
      const res = await api.bio.updateLink(
        values.id,
        {
          title: values.title,
          url: values.url,
          icon: values.icon || null,
          // The backend overwrites order on every update, so it has to be
          // round-tripped or the link jumps to the top of the list.
          order: values.order,
          isActive: values.isActive,
        },
        serverAuth(requestEvent),
      );
      if (res && res.success === false) {
        return requestEvent.fail(400, {
          message: res.error || "Could not save the link.",
        });
      }
      return { success: true, message: "Link saved." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Could not save the link.",
      });
    }
  },
  zod$({
    id: z.string(),
    title: z.string().min(1),
    url: z.string().url(),
    icon: z.string().optional(),
    order: z.coerce.number().int().min(0),
    isActive: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean(),
    ),
  }),
);

/**
 * Swaps a link with its neighbour and renumbers the list so the saved order
 * stays a contiguous 0..n-1 sequence.
 */
export const useReorderBioLink = routeAction$(
  async (values, requestEvent) => {
    const auth = serverAuth(requestEvent);
    const bio = await api.bio.me(auth).catch(() => null);
    const links = [...(bio?.links ?? [])].sort((a, b) => a.order - b.order);

    const index = links.findIndex((link) => link.id === values.id);
    const target = values.direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= links.length) {
      return requestEvent.fail(400, { message: "That link cannot move." });
    }
    [links[index], links[target]] = [links[target], links[index]];

    try {
      await Promise.all(
        links.map((link, order) =>
          link.order === order
            ? null
            : api.bio.updateLink(
                link.id,
                {
                  title: link.title,
                  url: link.url,
                  icon: link.icon,
                  order,
                  isActive: link.isActive,
                },
                auth,
              ),
        ),
      );
      return { success: true, message: "Order updated." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not reorder the links.",
      });
    }
  },
  zod$({
    id: z.string(),
    direction: z.enum(["up", "down"]),
  }),
);

export const useDeleteBioLink = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.bio.deleteLink(values.id, serverAuth(requestEvent));
      return { success: true, message: "Link deleted." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Could not delete the link.",
      });
    }
  },
  zod$({ id: z.string() }),
);

const SECTIONS = [
  { href: "#bio-profile", label: "Profile", icon: User },
  { href: "#bio-links", label: "Links", icon: LinkIcon },
  { href: "#bio-appearance", label: "Appearance", icon: Palette },
  { href: "#bio-integrations", label: "Integrations", icon: Plug },
  { href: "#bio-effects", label: "Effects", icon: Sparkles },
  { href: "#bio-advanced", label: "Advanced", icon: Code },
];

const DEFAULT_DISCORD_CONFIG: Record<string, boolean | number> = {
  showAvatar: true,
  showStatus: true,
  showActivity: true,
  showSpotify: true,
  showBadges: true,
  showGuild: true,
  refreshInterval: 30,
};

const DEFAULT_GRADIENT: GradientConfig = {
  type: "linear",
  direction: "to right",
  colors: ["#8B5CF6", "#EC4899"],
  enabled: false,
};

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Colour swatch and hex field kept in step with one another. */
const ColorField = component$<{
  label: string;
  id: string;
  value: Signal<string>;
}>(({ label, id, value }) => (
  <Field label={label} for={id}>
    <div class="flex items-center gap-1.5">
      <input
        type="color"
        aria-label={`Pick ${label.toLowerCase()} colour`}
        value={/^#[0-9A-Fa-f]{6}$/.test(value.value) ? value.value : "#000000"}
        onInput$={(_, el) => (value.value = el.value)}
        class="focus-ring border-edge rounded-control h-9 w-9 shrink-0 cursor-pointer border bg-transparent p-1"
      />
      <CodeInput
        id={id}
        value={value.value}
        maxLength={7}
        onInput$={(_, el) => (value.value = el.value)}
      />
    </div>
  </Field>
));

export default component$(() => {
  const bioData = useBioData();
  const updateBio = useUpdateBio();
  const createBioLink = useCreateBioLink();
  const updateBioLink = useUpdateBioLink();
  const deleteBioLink = useDeleteBioLink();
  const reorderBioLink = useReorderBioLink();

  const user = bioData.value.user;
  const limits = bioData.value.bioLimits;

  const mode = useSignal("edit");

  // Profile and publishing
  const username = useSignal(user.bioUsername || "");
  const displayName = useSignal(user.bioDisplayName || "");
  const description = useSignal(user.bioDescription || "");
  const profileImage = useSignal(user.bioProfileImage || "");
  const isPublic = useSignal(user.bioIsPublic);

  // Appearance
  const backgroundImage = useSignal(user.bioBackgroundImage || "");
  const backgroundColor = useSignal(user.bioBackgroundColor);
  const textColor = useSignal(user.bioTextColor);
  const accentColor = useSignal(user.bioAccentColor);
  const gradientConfig = useSignal<GradientConfig>(
    parseJson(user.bioGradientConfig, DEFAULT_GRADIENT),
  );

  // Integrations
  const showDiscord = useSignal(user.bioShowDiscord);
  const discordConfig = useSignal<Record<string, boolean | number>>(
    parseJson(user.bioDiscordConfig, DEFAULT_DISCORD_CONFIG),
  );
  const discordError = useSignal<string | null>(null);
  const discordTesting = useSignal(false);
  const spotifyTrack = useSignal(user.bioSpotifyTrack || "");

  // Effects
  const particleConfig = useSignal<ParticleConfig>(
    parseJson(user.bioParticleConfig, defaultParticleConfigs.hearts),
  );

  // Advanced
  const customCss = useSignal(user.bioCustomCss || "");
  const cssWarning = useSignal<string | null>(null);

  // Link editing
  const showNewLinkForm = useSignal(false);
  const newLinkTitle = useSignal("");
  const newLinkUrl = useSignal("");
  const newLinkIcon = useSignal("");
  const newLinkIconTouched = useSignal(false);
  const newLinkTitleTouched = useSignal(false);
  const editingLink = useSignal<string | null>(null);
  const editingLinkIcons = useSignal<Record<string, string>>({});
  const pendingDeleteLink = useSignal<{ id: string; title: string } | null>(
    null,
  );
  const deleteLinkOpen = useSignal(false);

  const newLinkSuggestion = useComputed$(() =>
    newLinkUrl.value ? suggestIconForUrl(newLinkUrl.value) : null,
  );

  // Paste a link and the icon and title fill themselves in for known sites,
  // until the person types their own.
  useTask$(({ track }) => {
    const url = track(() => newLinkUrl.value);
    const suggestion = url ? suggestIconForUrl(url) : null;
    if (!suggestion) return;
    if (!newLinkIconTouched.value) newLinkIcon.value = suggestion;
    if (!newLinkTitleTouched.value) {
      newLinkTitle.value = getIconDef(suggestion)?.label ?? newLinkTitle.value;
    }
  });

  const resetNewLinkForm = $(() => {
    newLinkTitle.value = "";
    newLinkUrl.value = "";
    newLinkIcon.value = "";
    newLinkIconTouched.value = false;
    newLinkTitleTouched.value = false;
    showNewLinkForm.value = false;
  });

  useTask$(({ track }) => {
    track(() => createBioLink.value);
    if (createBioLink.value?.success) resetNewLinkForm();
  });

  useTask$(({ track }) => {
    track(() => updateBioLink.value);
    if (updateBioLink.value?.success) {
      editingLink.value = null;
      editingLinkIcons.value = {};
    }
  });

  useTask$(({ track }) => {
    track(() => deleteBioLink.value);
    if (deleteBioLink.value?.success) {
      deleteLinkOpen.value = false;
      pendingDeleteLink.value = null;
    }
  });

  const saveState = useSignal<SaveState>("idle");

  const isDirty = useComputed$(
    () =>
      username.value !== (user.bioUsername || "") ||
      displayName.value !== (user.bioDisplayName || "") ||
      description.value !== (user.bioDescription || "") ||
      profileImage.value !== (user.bioProfileImage || "") ||
      backgroundImage.value !== (user.bioBackgroundImage || "") ||
      backgroundColor.value !== user.bioBackgroundColor ||
      textColor.value !== user.bioTextColor ||
      accentColor.value !== user.bioAccentColor ||
      customCss.value !== (user.bioCustomCss || "") ||
      spotifyTrack.value !== (user.bioSpotifyTrack || "") ||
      isPublic.value !== user.bioIsPublic ||
      showDiscord.value !== user.bioShowDiscord ||
      JSON.stringify(particleConfig.value) !==
        JSON.stringify(
          parseJson(user.bioParticleConfig, defaultParticleConfigs.hearts),
        ) ||
      JSON.stringify(gradientConfig.value) !==
        JSON.stringify(parseJson(user.bioGradientConfig, DEFAULT_GRADIENT)) ||
      JSON.stringify(discordConfig.value) !==
        JSON.stringify(
          parseJson(user.bioDiscordConfig, DEFAULT_DISCORD_CONFIG),
        ),
  );

  usePreventNavigate$((target) => {
    if (!isDirty.value || saveState.value === "saved") return false;
    if (target !== undefined) {
      return !window.confirm(
        "You have unsaved bio changes. Leave without saving them?",
      );
    }
    return true;
  });

  useTask$(({ track }) => {
    const dirty = track(() => isDirty.value);
    if (dirty) saveState.value = "dirty";
    else if (saveState.value === "dirty") saveState.value = "idle";
  });

  useTask$(({ track }) => {
    track(() => updateBio.value);
    if (updateBio.value?.success) saveState.value = "saved";
    else if (updateBio.value?.failed) saveState.value = "error";
  });

  // Custom CSS is sanitized on save; warn here so the reason is visible first.
  useTask$(({ track }) => {
    track(() => customCss.value);
    cssWarning.value =
      customCss.value && hasDangerousCSS(customCss.value)
        ? "Parts of this CSS can load remote content, so they will be removed when you save."
        : null;
  });

  const testDiscordConnection = $(async () => {
    if (!user.bioDiscordUserId) {
      discordError.value =
        "No Discord account is linked. Sign in with Discord to link one.";
      return;
    }
    discordTesting.value = true;
    discordError.value = null;
    try {
      const result = await getLanyardData(user.bioDiscordUserId);
      discordError.value = result.success
        ? null
        : result.error ||
          "Discord did not respond. Presence needs you to be in a server running the Lanyard bot — join discord.gg/RJ9Cedxvqe.";
    } catch {
      discordError.value = "Could not reach Discord. Try again in a moment.";
    } finally {
      discordTesting.value = false;
    }
  });

  useTask$(async () => {
    if (showDiscord.value && user.bioDiscordUserId) {
      await testDiscordConnection();
    }
  });

  const resetToSaved = $(() => {
    username.value = user.bioUsername || "";
    displayName.value = user.bioDisplayName || "";
    description.value = user.bioDescription || "";
    profileImage.value = user.bioProfileImage || "";
    backgroundImage.value = user.bioBackgroundImage || "";
    backgroundColor.value = user.bioBackgroundColor;
    textColor.value = user.bioTextColor;
    accentColor.value = user.bioAccentColor;
    customCss.value = user.bioCustomCss || "";
    spotifyTrack.value = user.bioSpotifyTrack || "";
    isPublic.value = user.bioIsPublic;
    showDiscord.value = user.bioShowDiscord;
    particleConfig.value = parseJson(
      user.bioParticleConfig,
      defaultParticleConfigs.hearts,
    );
    gradientConfig.value = parseJson(user.bioGradientConfig, DEFAULT_GRADIENT);
    discordConfig.value = parseJson(
      user.bioDiscordConfig,
      DEFAULT_DISCORD_CONFIG,
    );
    discordError.value = null;
    cssWarning.value = null;
    saveState.value = "idle";
  });

  // The preview renders from local state, so a change is visible before saving.
  const previewBioData = useComputed$<BioPageData>(() => ({
    displayName: displayName.value || user.name,
    description: description.value,
    profileImage: profileImage.value,
    backgroundImage: backgroundImage.value,
    backgroundColor: gradientConfig.value.enabled
      ? getGradientCSS(gradientConfig.value, backgroundColor.value)
      : backgroundColor.value,
    textColor: textColor.value,
    accentColor: accentColor.value,
    customCss: customCss.value,
    spotifyTrack: spotifyTrack.value,
    bioLinks: bioData.value.bioLinks,
    gradientConfig: JSON.stringify(gradientConfig.value),
    particleConfig: JSON.stringify(particleConfig.value),
    discordUserId: user.bioDiscordUserId,
    showDiscord: showDiscord.value,
    discordConfig: JSON.stringify(discordConfig.value),
  }));

  const textContrast = useComputed$(() =>
    contrastVerdict(textColor.value, backgroundColor.value),
  );
  const accentContrast = useComputed$(() =>
    contrastVerdict(accentColor.value, backgroundColor.value),
  );

  const publicUrl = username.value
    ? `${bioData.value.baseUrl}/${username.value}`
    : null;
  const atLinkLimit = bioData.value.bioLinks.length >= limits.maxBioLinks;
  const sortedLinks = [...bioData.value.bioLinks].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <Page>
      <PageHeader title="Bio page">
        <div q:slot="actions" class="flex flex-wrap items-center gap-3">
          <SaveIndicator state={saveState.value} />
          {isDirty.value && (
            <Button variant="ghost" onClick$={resetToSaved}>
              Discard
            </Button>
          )}
          <Form action={updateBio}>
            <input type="hidden" name="bioUsername" value={username.value} />
            <input
              type="hidden"
              name="bioDisplayName"
              value={displayName.value}
            />
            <input
              type="hidden"
              name="bioDescription"
              value={description.value}
            />
            <input
              type="hidden"
              name="bioProfileImage"
              value={profileImage.value}
            />
            <input
              type="hidden"
              name="bioBackgroundImage"
              value={backgroundImage.value}
            />
            <input
              type="hidden"
              name="bioBackgroundColor"
              value={backgroundColor.value}
            />
            <input type="hidden" name="bioTextColor" value={textColor.value} />
            <input
              type="hidden"
              name="bioAccentColor"
              value={accentColor.value}
            />
            <input type="hidden" name="bioCustomCss" value={customCss.value} />
            <input
              type="hidden"
              name="bioSpotifyTrack"
              value={spotifyTrack.value}
            />
            <input
              type="hidden"
              name="bioIsPublic"
              value={isPublic.value ? "true" : "false"}
            />
            <input
              type="hidden"
              name="bioGradientConfig"
              value={JSON.stringify(gradientConfig.value)}
            />
            <input
              type="hidden"
              name="bioParticleConfig"
              value={JSON.stringify(particleConfig.value)}
            />
            <input
              type="hidden"
              name="bioShowDiscord"
              value={showDiscord.value ? "true" : "false"}
            />
            <input
              type="hidden"
              name="bioDiscordConfig"
              value={JSON.stringify(discordConfig.value)}
            />
            <Button
              type="submit"
              variant="primary"
              loading={updateBio.isRunning}
              disabled={!isDirty.value}
            >
              Save draft
            </Button>
          </Form>
        </div>
      </PageHeader>

      {updateBio.value?.failed && (
        <Callout tone="danger" title="Could not save" class="mb-4">
          {updateBio.value.message}
        </Callout>
      )}

      <BioRevisions
        dirty={isDirty.value && saveState.value !== "saved"}
        hasDraft={bioData.value.history.hasDraft}
        revisions={bioData.value.history.revisions}
      />
      <EditorLayout previewLabel="bio page" hasNav mode={mode}>
        <LocalNav
          q:slot="nav"
          label="Bio sections"
          items={SECTIONS}
          current={SECTIONS[0].href}
          stackAt="xl"
        />

        <div q:slot="settings" class="grid max-w-2xl gap-6">
          <Section
            id="bio-profile"
            title="Profile and publishing"
            description="Your address, name and introduction."
          >
            <Surface>
              <div class="grid gap-4">
                <Field
                  label="Username"
                  for="bio-username"
                  required
                  help={
                    publicUrl
                      ? `Your page will live at ${publicUrl}`
                      : "This becomes the address of your page."
                  }
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-ink-muted shrink-0 font-mono text-[13px]">
                      /
                    </span>
                    <CodeInput
                      id="bio-username"
                      value={username.value}
                      maxLength={limits.maxUsernameLength}
                      placeholder="your-name"
                      onInput$={(_, el) =>
                        (username.value = el.value.toLowerCase())
                      }
                    />
                  </div>
                </Field>

                <Field
                  label="Display name"
                  for="bio-display-name"
                  help={`Shown at the top of the page. ${displayName.value.length}/${limits.maxDisplayNameLength}`}
                >
                  <Input
                    id="bio-display-name"
                    value={displayName.value}
                    maxLength={limits.maxDisplayNameLength}
                    placeholder={user.name || "Your name"}
                    onInput$={(_, el) => (displayName.value = el.value)}
                  />
                </Field>

                <Field
                  label="Introduction"
                  for="bio-description"
                  help={`${description.value.length}/${limits.maxDescriptionLength}`}
                >
                  <Textarea
                    id="bio-description"
                    rows={3}
                    value={description.value}
                    maxLength={limits.maxDescriptionLength}
                    placeholder="A sentence or two about you."
                    onInput$={(_, el) => (description.value = el.value)}
                  />
                </Field>

                <Field
                  label="Profile image URL"
                  for="bio-profile-image"
                  help="A square image works best. Leave empty to show no picture."
                >
                  <Input
                    id="bio-profile-image"
                    type="url"
                    value={profileImage.value}
                    maxLength={limits.maxUrlLength}
                    placeholder="https://example.com/me.png"
                    onInput$={(_, el) => (profileImage.value = el.value)}
                  />
                </Field>

                <Divider />

                <Switch
                  checked={isPublic.value}
                  label="Make the published page public"
                  help={
                    username.value
                      ? "When you publish this draft, anyone with the address can see the page. Turn this off and publish to take it offline."
                      : "Set a username first — a page cannot be published without an address."
                  }
                  disabled={!username.value}
                  onChange$={(checked) => (isPublic.value = checked)}
                />

                {publicUrl && (
                  <div class="border-edge bg-surface-subtle rounded-control flex flex-wrap items-center gap-2 border px-2 py-1.5">
                    <Badge tone={isPublic.value ? "success" : "neutral"}>
                      {isPublic.value ? "Draft: public" : "Draft: private"}
                    </Badge>
                    <code class="text-ink min-w-0 flex-1 truncate font-mono text-xs">
                      {publicUrl}
                    </code>
                    <CopyButton
                      value={publicUrl}
                      label="Copy"
                      variant="secondary"
                    />
                    {isPublic.value && (
                      <IconButton
                        size="sm"
                        variant="outline"
                        label="Open your bio page"
                        href={`/${username.value}`}
                        external
                      >
                        <ExternalLink class="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                )}
              </div>
            </Surface>
          </Section>

          <Section
            id="bio-links"
            title="Links"
            description={`${bioData.value.bioLinks.length} of ${limits.maxBioLinks} used. They appear in the order shown here.`}
          >
            {!showNewLinkForm.value && (
              <Button
                q:slot="actions"
                variant="secondary"
                disabled={atLinkLimit}
                title={
                  atLinkLimit ? "You have reached your link limit." : undefined
                }
                onClick$={() => (showNewLinkForm.value = true)}
              >
                <Plus class="h-4 w-4" aria-hidden="true" />
                Add link
              </Button>
            )}

            {showNewLinkForm.value && !atLinkLimit && (
              <Surface class="mb-3">
                <Form action={createBioLink} class="grid gap-4">
                  <Field
                    label="Address"
                    for="new-link-url"
                    required
                    help="Paste a link — the icon and title fill themselves in for sites we recognise."
                  >
                    <Input
                      id="new-link-url"
                      type="url"
                      name="url"
                      value={newLinkUrl.value}
                      maxLength={limits.maxUrlLength}
                      required
                      placeholder="https://twitch.tv/yourname"
                      onInput$={(_, el) => (newLinkUrl.value = el.value)}
                    />
                  </Field>

                  <Field
                    label="Title"
                    for="new-link-title"
                    required
                    help={`${newLinkTitle.value.length}/${limits.maxLinkTitleLength}`}
                  >
                    <Input
                      id="new-link-title"
                      name="title"
                      value={newLinkTitle.value}
                      maxLength={limits.maxLinkTitleLength}
                      required
                      placeholder="Twitch"
                      onInput$={(_, el) => {
                        newLinkTitle.value = el.value;
                        newLinkTitleTouched.value = true;
                      }}
                    />
                  </Field>

                  <div>
                    <span class="text-ink mb-1.5 block text-[13px] font-medium">
                      Icon
                    </span>
                    <IconSelector
                      selectedIcon={newLinkIcon.value}
                      suggestedIcon={newLinkSuggestion.value}
                      onIconSelect={$((icon: string) => {
                        newLinkIcon.value = icon;
                        newLinkIconTouched.value = true;
                      })}
                    />
                    <input
                      type="hidden"
                      name="icon"
                      value={newLinkIcon.value}
                    />
                  </div>

                  {createBioLink.value?.failed && (
                    <Callout tone="danger">
                      {createBioLink.value.message}
                    </Callout>
                  )}

                  <div class="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={createBioLink.isRunning}
                    >
                      Add link
                    </Button>
                    <Button variant="ghost" onClick$={resetNewLinkForm}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Surface>
            )}

            {sortedLinks.length === 0 ? (
              <Surface flush>
                <EmptyState
                  icon={LinkIcon}
                  size="inline"
                  title="No links yet"
                  description="Add the places people should find you."
                >
                  {!showNewLinkForm.value && (
                    <Button
                      variant="primary"
                      onClick$={() => (showNewLinkForm.value = true)}
                    >
                      Add your first link
                    </Button>
                  )}
                </EmptyState>
              </Surface>
            ) : (
              <Surface flush class="overflow-hidden">
                <ul class="divide-edge divide-y">
                  {sortedLinks.map((link, index) => {
                    const isEditing = editingLink.value === link.id;
                    const editIcon =
                      editingLinkIcons.value[link.id] ?? link.icon ?? "";
                    return (
                      <li key={link.id} class="px-3 py-2.5">
                        {isEditing ? (
                          <Form action={updateBioLink} class="grid gap-3">
                            <input type="hidden" name="id" value={link.id} />
                            <input
                              type="hidden"
                              name="order"
                              value={link.order}
                            />
                            <input
                              type="hidden"
                              name="isActive"
                              value={link.isActive ? "true" : "false"}
                            />
                            <Field label="Title" for={`edit-title-${link.id}`}>
                              <Input
                                id={`edit-title-${link.id}`}
                                name="title"
                                value={link.title}
                                maxLength={limits.maxLinkTitleLength}
                                required
                              />
                            </Field>
                            <Field label="Address" for={`edit-url-${link.id}`}>
                              <Input
                                id={`edit-url-${link.id}`}
                                name="url"
                                type="url"
                                value={link.url}
                                maxLength={limits.maxUrlLength}
                                required
                              />
                            </Field>
                            <div>
                              <span class="text-ink mb-1.5 block text-[13px] font-medium">
                                Icon
                              </span>
                              <IconSelector
                                selectedIcon={editIcon}
                                onIconSelect={$((icon: string) => {
                                  editingLinkIcons.value = {
                                    ...editingLinkIcons.value,
                                    [link.id]: icon,
                                  };
                                })}
                              />
                              <input
                                type="hidden"
                                name="icon"
                                value={editIcon}
                              />
                            </div>
                            {updateBioLink.value?.failed && (
                              <Callout tone="danger">
                                {updateBioLink.value.message}
                              </Callout>
                            )}
                            <div class="flex flex-wrap gap-2">
                              <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                loading={updateBioLink.isRunning}
                              >
                                Save link
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick$={() => (editingLink.value = null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </Form>
                        ) : (
                          <div class="flex items-center gap-2.5">
                            <span
                              class="border-edge flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                              style={`background:${accentColor.value}22;border-color:${accentColor.value}`}
                            >
                              <BioLinkIcon
                                icon={link.icon ?? ""}
                                size={18}
                                class="text-ink"
                              />
                            </span>
                            <div class="min-w-0 flex-1">
                              <p class="text-ink truncate text-[13px] font-medium">
                                {link.title}
                              </p>
                              <p class="text-ink-muted truncate text-xs">
                                {link.url}
                              </p>
                            </div>
                            <span class="text-ink-muted hidden shrink-0 text-xs sm:block">
                              {link.clicks.toLocaleString()} clicks
                            </span>
                            {!link.isActive && (
                              <Badge tone="neutral">Hidden</Badge>
                            )}
                            <div class="flex shrink-0 items-center gap-0.5">
                              <Form action={reorderBioLink} class="contents">
                                <input
                                  type="hidden"
                                  name="id"
                                  value={link.id}
                                />
                                <input
                                  type="hidden"
                                  name="direction"
                                  value="up"
                                />
                                <IconButton
                                  size="sm"
                                  type="submit"
                                  label={`Move ${link.title} up`}
                                  disabled={index === 0}
                                >
                                  <ArrowUp class="h-4 w-4" />
                                </IconButton>
                              </Form>
                              <Form action={reorderBioLink} class="contents">
                                <input
                                  type="hidden"
                                  name="id"
                                  value={link.id}
                                />
                                <input
                                  type="hidden"
                                  name="direction"
                                  value="down"
                                />
                                <IconButton
                                  size="sm"
                                  type="submit"
                                  label={`Move ${link.title} down`}
                                  disabled={index === sortedLinks.length - 1}
                                >
                                  <ArrowDown class="h-4 w-4" />
                                </IconButton>
                              </Form>
                              <IconButton
                                size="sm"
                                label={`Edit ${link.title}`}
                                onClick$={() => (editingLink.value = link.id)}
                              >
                                <Edit class="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                size="sm"
                                variant="danger"
                                label={`Delete ${link.title}`}
                                onClick$={() => {
                                  pendingDeleteLink.value = {
                                    id: link.id,
                                    title: link.title,
                                  };
                                  deleteLinkOpen.value = true;
                                }}
                              >
                                <Trash2 class="h-4 w-4" />
                              </IconButton>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Surface>
            )}
          </Section>

          <Section
            id="bio-appearance"
            title="Appearance"
            description="Colours and background of your public page."
          >
            <Surface>
              <div class="grid gap-4">
                <div class="grid gap-4 sm:grid-cols-3">
                  <ColorField
                    label="Background"
                    id="bio-bg-color"
                    value={backgroundColor}
                  />
                  <ColorField
                    label="Text"
                    id="bio-text-color"
                    value={textColor}
                  />
                  <ColorField
                    label="Accent"
                    id="bio-accent-color"
                    value={accentColor}
                  />
                </div>

                {!gradientConfig.value.enabled &&
                  (textContrast.value.verdict === "unreadable" ||
                    textContrast.value.verdict === "low") && (
                    <Callout
                      tone={
                        textContrast.value.verdict === "unreadable"
                          ? "danger"
                          : "warning"
                      }
                      title="Text may be hard to read"
                    >
                      Your text colour has a contrast ratio of{" "}
                      {textContrast.value.ratio?.toFixed(1)}:1 against the
                      background. Aim for at least 4.5:1 so visitors can read
                      your introduction.
                    </Callout>
                  )}

                {!gradientConfig.value.enabled &&
                  accentContrast.value.verdict === "unreadable" && (
                    <Callout tone="warning" title="Accent may be hard to see">
                      Your accent colour sits very close to the background, so
                      link buttons will be difficult to make out.
                    </Callout>
                  )}

                <Divider />

                <GradientConfigPanel
                  config={gradientConfig}
                  fallbackColor={backgroundColor.value}
                />

                <Divider />

                <Field
                  label="Background image URL"
                  for="bio-bg-image"
                  help="Sits behind the colour or gradient. Leave empty for none."
                >
                  <Input
                    id="bio-bg-image"
                    type="url"
                    value={backgroundImage.value}
                    maxLength={limits.maxUrlLength}
                    placeholder="https://example.com/background.jpg"
                    onInput$={(_, el) => (backgroundImage.value = el.value)}
                  />
                </Field>
              </div>
            </Surface>
          </Section>

          <Section
            id="bio-integrations"
            title="Integrations"
            description="Show what you are doing or listening to."
          >
            <Surface>
              <div class="grid gap-4">
                <Switch
                  checked={showDiscord.value}
                  label="Show Discord presence"
                  help="Displays your Discord status, activity and listening state. Requires the Lanyard bot to be able to see you."
                  onChange$={(checked) => {
                    showDiscord.value = checked;
                    if (checked) testDiscordConnection();
                  }}
                />

                {showDiscord.value &&
                  (discordError.value ? (
                    <Callout
                      tone="warning"
                      title="Discord presence unavailable"
                    >
                      {discordError.value}
                      <Button
                        q:slot="actions"
                        size="sm"
                        variant="secondary"
                        loading={discordTesting.value}
                        onClick$={testDiscordConnection}
                      >
                        Test again
                      </Button>
                    </Callout>
                  ) : (
                    <Callout tone="success" title="Discord presence connected">
                      Your status will appear on your page.
                      <Button
                        q:slot="actions"
                        size="sm"
                        variant="secondary"
                        loading={discordTesting.value}
                        onClick$={testDiscordConnection}
                      >
                        Test again
                      </Button>
                    </Callout>
                  ))}

                {showDiscord.value && (
                  <Fieldset legend="What to show">
                    <div class="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["showAvatar", "Avatar"],
                          ["showStatus", "Online status"],
                          ["showActivity", "Current activity"],
                          ["showSpotify", "Spotify listening"],
                          ["showBadges", "Profile badges"],
                          ["showGuild", "Server tag"],
                        ] as const
                      ).map(([key, label]) => (
                        <Switch
                          key={key}
                          checked={Boolean(discordConfig.value[key])}
                          label={label}
                          onChange$={(checked) =>
                            (discordConfig.value = {
                              ...discordConfig.value,
                              [key]: checked,
                            })
                          }
                        />
                      ))}
                    </div>
                  </Fieldset>
                )}

                <Divider />

                <Field
                  label="Spotify track"
                  for="bio-spotify"
                  help="A Spotify track link, embedded as a player. Leave empty for none."
                >
                  <Input
                    id="bio-spotify"
                    value={spotifyTrack.value}
                    maxLength={limits.maxUrlLength}
                    placeholder="https://open.spotify.com/track/..."
                    onInput$={(_, el) => (spotifyTrack.value = el.value)}
                  />
                </Field>
              </div>
            </Surface>
          </Section>

          <Section
            id="bio-effects"
            title="Effects"
            description="Optional movement behind your page."
          >
            <Surface>
              <ParticleConfigPanel
                config={particleConfig}
                label="Particles on your bio page"
              />
            </Surface>
          </Section>

          <Section
            id="bio-advanced"
            title="Advanced"
            description="Custom CSS, for full control of the published page."
          >
            <Surface>
              <Field
                label="Custom CSS"
                for="bio-css"
                error={cssWarning.value ?? undefined}
                help="Applied to your public page only. Rules that can load remote content are removed when you save."
              >
                <Textarea
                  id="bio-css"
                  rows={8}
                  spellcheck={false}
                  value={customCss.value}
                  class="font-mono text-xs"
                  placeholder=".bio-link { border-radius: 4px; }"
                  onInput$={(_, el) => (customCss.value = el.value)}
                />
              </Field>
            </Surface>
          </Section>
        </div>

        <div q:slot="preview">
          <PreviewPane
            label="Bio page"
            note={isDirty.value ? "Not saved yet" : undefined}
          >
            <BioPageDisplay
              bioData={previewBioData.value}
              isPreview={true}
              class="relative z-10 !min-h-[28rem]"
            />
          </PreviewPane>
          {!username.value && (
            <Callout tone="warning" class="mt-3">
              Set a username so your page has an address people can visit.
            </Callout>
          )}
        </div>
      </EditorLayout>

      <Dialog open={deleteLinkOpen} title="Delete this link?" size="sm">
        <p class="text-ink-muted text-[13px] leading-5">
          <span class="text-ink font-medium">
            {pendingDeleteLink.value?.title}
          </span>{" "}
          is removed from your page immediately, along with its click count.
          This cannot be undone.
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (deleteLinkOpen.value = false)}
        >
          Cancel
        </Button>
        <Form q:slot="footer" action={deleteBioLink}>
          <input type="hidden" name="id" value={pendingDeleteLink.value?.id} />
          <Button
            type="submit"
            variant="danger"
            loading={deleteBioLink.isRunning}
          >
            Delete link
          </Button>
        </Form>
      </Dialog>
    </Page>
  );
});

export const head: DocumentHead = {
  title: "Bio page - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Build a public page linking everywhere people can find you.",
    },
  ],
};
