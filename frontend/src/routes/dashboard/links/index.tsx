import { component$, useSignal, $, useComputed$ } from "@builder.io/qwik";
import { routeLoader$, server$, type DocumentHead } from "@builder.io/qwik-city";
import { isValidHttpUrl } from "~/lib/url-utils";
import { useAlert } from "~/lib/use-alert";
import { createServerApi } from "~/lib/api/server";
import { shortLinks as shortLinksApi } from "~/lib/api/client";

export const useLinks = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  try {
    const api = createServerApi(requestEvent);
    const links = await api.shortLinks.list();

    const origin = requestEvent.url.origin;
    const maxShort = user.settings?.maxShortLinks ?? 500;
    const count = links.length;

    return { user, links, origin, maxShort, count };
  } catch (error) {
    console.error("Failed to load short links:", error);
    throw requestEvent.redirect(302, "/");
  }
});

export const createShortLink = server$(async function (payload: {
  url: string;
  code?: string;
}): Promise<
  | { ok: true; code: string }
  | { ok: false; reason: string; message: string; existingCode?: string }
> {
  try {
    const user = this.sharedMap.get("user");
    if (!user) {
      return { ok: false, reason: "NOT_AUTHENTICATED", message: "Not authenticated" };
    }

    if (!user.isApproved) {
      return { ok: false, reason: "NOT_APPROVED", message: "Account pending approval." };
    }

    const url = (payload.url || "").trim();
    if (!isValidHttpUrl(url)) {
      return { ok: false, reason: "INVALID_URL", message: "Invalid URL. Must start with http(s)://" };
    }

    const result = await shortLinksApi.create({
      url,
      customCode: payload.code?.trim() || undefined,
    });

    return { ok: true, code: result.code };
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Unknown error';
    // Try to parse common error reasons
    if (message.includes("limit")) {
      return { ok: false, reason: "LIMIT_EXCEEDED", message };
    }
    if (message.includes("already") || message.includes("duplicate")) {
      return { ok: false, reason: "DUPLICATE_URL", message };
    }
    if (message.includes("taken") || message.includes("exists")) {
      return { ok: false, reason: "CODE_TAKEN", message };
    }
    return { ok: false, reason: "UNKNOWN", message };
  }
});

export const deleteShortLink = server$(async function (id: string) {
  const user = this.sharedMap.get("user");
  if (!user) throw new Error("Not authenticated");

  try {
    await shortLinksApi.delete(id);
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Link not found or access denied");
  }
});

export default component$(() => {
  const data = useLinks();
  const url = useSignal("");
  const code = useSignal("");
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

  const copy = $(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alerts.success("Copied", "Short URL copied to clipboard.");
    } catch {
      alerts.error("Copy Failed", "Couldn't copy to clipboard. Try manually selecting the text.");
    }
  });

  return (
    <>
      <div class="mb-6 text-center sm:mb-8">
        <h1 class="text-gradient-cute mb-3 text-3xl font-bold sm:text-4xl">Short Links</h1>
        <p class="text-theme-text-secondary px-4 text-base sm:text-lg">
          Create and manage your cute short URLs under <code>/l/&lt;code&gt;</code> ✨
        </p>
      </div>

      {!data.value.user.isApproved && (
        <div class="bg-theme-secondary/10 border-theme-accent-secondary text-theme-text-primary mb-6 rounded-xl border p-4 sm:mb-8 sm:p-6">
          <div class="text-center">
            <h3 class="mb-2 text-lg font-semibold">Account Pending Approval</h3>
            <p class="text-theme-text-secondary text-sm">You cannot create short links until approved by an administrator.</p>
          </div>
        </div>
      )}

      {data.value.user.isApproved && (
        <div class="card-cute mb-6 rounded-3xl p-4 sm:mb-8 sm:p-6">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-gradient-cute text-lg font-bold sm:text-xl">Create New Short Link</h2>
            <span class="text-theme-text-secondary text-sm">Remaining: {remaining.value}</span>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              placeholder="https://example.com/very/long/url"
              class="glass text-theme-text-primary placeholder:theme-text-muted focus:ring-theme-accent-primary/50 flex-1 rounded-full px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:outline-none sm:px-6 sm:text-base"
              value={url.value}
              onInput$={(e) => (url.value = (e.target as HTMLInputElement).value)}
            />
            <input
              type="text"
              placeholder="Custom code (optional)"
              class="glass text-theme-text-primary placeholder:theme-text-muted focus:ring-theme-accent-primary/50 rounded-full px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:outline-none sm:w-48 sm:px-6 sm:text-base"
              value={code.value}
              onInput$={(e) => (code.value = (e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="mt-4 flex justify-end">
            <button
              onClick$={submitCreate}
              disabled={!url.value.trim() || creating.value}
              class="btn-cute text-theme-text-primary rounded-full px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {creating.value ? "Creating…" : "Create Link ✨"}
            </button>
          </div>
        </div>
      )}

      <div class="card-cute rounded-3xl p-4 sm:p-6">
        <h2 class="text-gradient-cute mb-4 text-lg font-bold sm:text-xl">Your Short Links</h2>

        {data.value.links.length === 0 ? (
          <div class="py-10 text-center">
            <div class="mb-2 text-4xl">🔗</div>
            <p class="text-theme-text-secondary">No short links yet~ Create your first one above!</p>
          </div>
        ) : (
          <div class="space-y-3">
            {data.value.links.map((link) => {
              const shortUrl = link.shortUrl || `${data.value.origin}/l/${link.code}`;
              return (
                <div key={link.id} class="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <a href={shortUrl} target="_blank" class="text-theme-accent-secondary hover:underline break-all">{shortUrl}</a>
                      <button onClick$={() => copy(shortUrl)} class="text-xs underline">Copy</button>
                    </div>
                    <div class="text-theme-text-secondary mt-1 text-xs break-all sm:text-sm">
                      → {link.targetUrl}
                    </div>
                    <div class="text-theme-text-secondary mt-1 text-xs sm:text-sm">
                      Clicks: {link.clickCount} · Created: {new Date(link.createdAt).toLocaleDateString()}
                      {link.expiresAt ? ` · Expires: ${new Date(link.expiresAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 self-end sm:self-auto">
                    <a href={shortUrl} target="_blank" class="text-theme-accent-secondary hover:bg-theme-bg-tertiary/20 rounded-full px-3 py-1 text-sm">Open</a>
                    <button onClick$={() => handleDelete(link.id)} class="text-theme-accent-primary hover:bg-theme-accent-primary/20 rounded-full px-3 py-1 text-sm">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Short Links - twink.forsale",
  meta: [{ name: "description", content: "Create and manage URL shortener links." }],
};
