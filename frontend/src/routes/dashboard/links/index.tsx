import { component$, useSignal, $, useComputed$ } from "@builder.io/qwik";
import { routeLoader$, server$, type DocumentHead } from "@builder.io/qwik-city";
import { isValidHttpUrl } from "~/lib/url-utils";
import { useAlert } from "~/lib/use-alert";
import { Link2 as ChainIcon, ExternalLink, Trash2 } from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import {
  Badge,
  Button,
  Callout,
  CopyButton,
  EmptyState,
  FieldLabel,
  IconButton,
  Input,
  PageHeader,
  Panel,
} from "~/components/ui";

export const useLinks = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const [linksRes, settings] = await Promise.all([
    api.shortLinks.list(auth).catch(() => ({ links: [] })),
    api.settings.get(auth).catch(() => null),
  ]);

  const links = linksRes.links ?? [];
  const maxShort = settings?.maxShortLinks ?? 500;

  return {
    user,
    links,
    origin: requestEvent.url.origin,
    maxShort,
    count: links.length,
  };
});

export const createShortLink = server$(async function (payload: {
  url: string;
  code?: string;
  expiresDays?: number | null;
  maxClicks?: number | null;
}): Promise<
  | { ok: true; code: string }
  | { ok: false; reason: string; message: string; existingCode?: string }
> {
  const url = (payload.url || "").trim();
  if (!isValidHttpUrl(url)) {
    return { ok: false, reason: "INVALID_URL", message: "Invalid URL. Must start with http(s)://" };
  }

  try {
    const result = await api.shortLinks.create(
      {
        url,
        code: payload.code?.trim() || undefined,
        expiresDays:
          typeof payload.expiresDays === "number" ? payload.expiresDays : undefined,
        maxClicks:
          typeof payload.maxClicks === "number" ? payload.maxClicks : undefined,
      },
      { cookie: this.request.headers.get("cookie") },
    );
    return { ok: true, code: result.code ?? "" };
  } catch (err) {
    if (err instanceof ApiError) {
      const body = (err.body ?? {}) as { error?: string; code?: string };
      // The backend flags a duplicate URL with error "duplicate_url" + the code.
      if (err.status === 409 && body.error === "duplicate_url") {
        return {
          ok: false,
          reason: "DUPLICATE_URL",
          message: "URL already shortened",
          existingCode: body.code,
        };
      }
      const message = body.error || err.message;
      // Map backend messages/status onto the UI's reason codes.
      const reason =
        err.status === 429
          ? "LIMIT_EXCEEDED"
          : /code already/i.test(message)
            ? "CODE_TAKEN"
            : /custom code/i.test(message)
              ? "CODE_INVALID"
              : /invalid url/i.test(message)
                ? "INVALID_URL"
                : "UNKNOWN";
      return { ok: false, reason, message };
    }
    return {
      ok: false,
      reason: "UNKNOWN",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
});

export const deleteShortLink = server$(async function (id: string) {
  await api.shortLinks.delete(id, {
    cookie: this.request.headers.get("cookie"),
  });
  return { success: true };
});

export default component$(() => {
  const data = useLinks();
  const url = useSignal("");
  const code = useSignal("");
  const expiresDays = useSignal<number | "">("");
  const maxClicks = useSignal<number | "">("");
  const creating = useSignal(false);
  const alerts = useAlert();

  const remaining = useComputed$(() => data.value.maxShort - data.value.count);

  const submitCreate = $(async () => {
    if (!url.value.trim()) {
      alerts.error("Missing URL", "Please enter a URL to shorten.");
      return;
    }
    if (!isValidHttpUrl(url.value.trim())) {
      alerts.error("Invalid URL", "The URL must start with http:// or https://");
      return;
    }
    if (code.value.trim() && !/^[a-zA-Z0-9_-]{3,32}$/.test(code.value.trim())) {
      alerts.error("Invalid Code", "Custom code must be 3-32 characters and only include letters, numbers, - or _.");
      return;
    }
    creating.value = true;
    try {
      const result = await createShortLink({
        url: url.value.trim(),
        code: code.value.trim() || undefined,
        expiresDays: typeof expiresDays.value === 'number' ? expiresDays.value : undefined,
        maxClicks: typeof maxClicks.value === 'number' ? maxClicks.value : undefined,
      });

      if (result?.ok) {
        alerts.success("Link Created", "Your short link was created successfully.");
        window.location.reload();
      } else if (result) {
        switch (result.reason) {
          case 'LIMIT_EXCEEDED':
            alerts.error("Limit Reached", `You've reached your short link limit (${data.value.maxShort}). Delete some links or request a higher limit.`);
            break;
          case 'INVALID_URL':
            alerts.error("Invalid URL", "Please provide a valid URL starting with http(s)://");
            break;
          case 'DUPLICATE_URL': {
            const codeFound = result.existingCode;
            const shortUrl = codeFound ? `${data.value.origin}/l/${codeFound}` : "(unknown)";
            alerts.error("Already Shortened", `You already have a short link for this URL: ${shortUrl}`);
            break;
          }
          case 'CODE_TAKEN':
            alerts.error("Code Taken", "That custom code is already in use. Try another.");
            break;
          case 'CODE_INVALID':
            alerts.error("Invalid Code", "Custom code must be 3-32 characters and only include letters, numbers, - or _.");
            break;
          case 'NOT_APPROVED':
            alerts.error("Not Approved", "Your account must be approved before creating short links.");
            break;
          case 'NOT_AUTHENTICATED':
          case 'USER_NOT_FOUND':
          default:
            alerts.error("Creation Failed", result.message || "Failed to create short link");
        }
      } else {
        alerts.error("Creation Failed", "Failed to create short link");
      }
    } finally {
      creating.value = false;
    }
  });

  const handleDelete = $(async (id: string) => {
    const confirmed = await alerts.confirmAsync("Delete Link", "Are you sure you want to delete this short link? This cannot be undone.");
    if (!confirmed) return;
    try {
      await deleteShortLink(id);
      alerts.success("Deleted", "Short link removed.");
      window.location.reload();
    } catch (e: any) {
      alerts.error("Delete Failed", String(e?.message || "Failed to delete"));
    }
  });

  return (
    <>
      <PageHeader
        align="left"
        title="Short Links"
        icon={ChainIcon}
        subtitle="Create and manage your cute short URLs under /l/<code>"
      />

      {!data.value.user.isApproved && (
        <Callout tone="warning" title="Account Pending Approval" class="mb-6 sm:mb-8">
          You cannot create short links until approved by an administrator.
        </Callout>
      )}

      {data.value.user.isApproved && (
        <Panel
          title="Create New Short Link"
          icon={ChainIcon}
          class="mb-6 sm:mb-8"
        >
          <Badge q:slot="actions" status={remaining.value > 0 ? "accent" : "warning"}>
            {remaining.value} remaining
          </Badge>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <FieldLabel>Destination URL</FieldLabel>
              <Input
                type="url"
                placeholder="https://example.com/very/long/url"
                value={url.value}
                onInput$={(e) => (url.value = (e.target as HTMLInputElement).value)}
              />
            </div>
            <div>
              <FieldLabel>Custom code (optional)</FieldLabel>
              <Input
                type="text"
                placeholder="e.g. cute-bunny-123"
                value={code.value}
                onInput$={(e) => (code.value = (e.target as HTMLInputElement).value)}
              />
            </div>
            <div>
              <FieldLabel>Expires in days (optional)</FieldLabel>
              <Input
                type="number"
                placeholder="Never"
                value={expiresDays.value as any}
                onInput$={(e) => {
                  const v = (e.target as HTMLInputElement).value;
                  expiresDays.value = v === "" ? "" : Number(v);
                }}
                min={1}
              />
            </div>
            <div class="sm:col-span-2">
              <FieldLabel>Max clicks (optional)</FieldLabel>
              <Input
                type="number"
                placeholder="Unlimited"
                value={maxClicks.value as any}
                onInput$={(e) => {
                  const v = (e.target as HTMLInputElement).value;
                  maxClicks.value = v === "" ? "" : Number(v);
                }}
                min={1}
              />
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <Button onClick$={submitCreate} disabled={!url.value.trim() || creating.value}>
              {creating.value ? (
                "Creating…"
              ) : (
                <>
                  <ChainIcon class="h-4 w-4" />
                  Create Link
                </>
              )}
            </Button>
          </div>
        </Panel>
      )}

      <Panel title="Your Short Links" icon={ChainIcon} flush>
        {data.value.links.length === 0 ? (
          <EmptyState
            icon={ChainIcon}
            title="No short links yet~"
            description="Create your first one above!"
            class="px-4 sm:px-6"
          />
        ) : (
          <div class="divide-theme-card-border/60 divide-y">
            {data.value.links.map((link: any) => {
              const shortUrl = `${data.value.origin}/l/${link.code}`;
              return (
                <div
                  key={link.id}
                  class="hover:bg-theme-bg-tertiary/20 flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <a
                        href={shortUrl}
                        target="_blank"
                        class="text-theme-accent-secondary font-medium break-all hover:underline"
                      >
                        {shortUrl}
                      </a>
                      <CopyButton value={shortUrl} />
                    </div>
                    <div class="text-theme-text-muted mt-1 truncate text-xs sm:text-sm">
                      → {link.url}
                    </div>
                    <div class="text-theme-text-muted mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge status="neutral">{link.clicks} clicks</Badge>
                      <Badge status="neutral">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </Badge>
                      {link.expiresAt && (
                        <Badge status="warning">
                          Expires {new Date(link.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                      {typeof link.maxClicks === "number" && (
                        <Badge status="info">Max {link.maxClicks}</Badge>
                      )}
                    </div>
                  </div>
                  <div class="flex items-center gap-1 self-end sm:self-auto">
                    <IconButton href={shortUrl} external title="Open link">
                      <ExternalLink class="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="danger"
                      title="Delete link"
                      onClick$={() => handleDelete(link.id)}
                    >
                      <Trash2 class="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
});

export const head: DocumentHead = {
  title: "Short Links - twink.forsale",
  meta: [{ name: "description", content: "Create and manage URL shortener links." }],
};
