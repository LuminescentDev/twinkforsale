import {
  component$,
  useSignal,
  useStore,
  $,
  useComputed$,
} from "@builder.io/qwik";
import {
  routeLoader$,
  server$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import {
  Link2,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-icons-qwik";
import { isValidHttpUrl } from "~/lib/url-utils";
import {
  api,
  serverAuth,
  ApiError,
  type ShortLinkListItem,
} from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { useToast } from "~/lib/toast-store";
import {
  formatRelativeDate,
  formatAbsoluteDate,
  describeExpiry,
} from "~/lib/file-kinds";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  Button,
  IconButton,
  CopyButton,
  Field,
  Input,
  CodeInput,
  Badge,
  Callout,
  EmptyState,
  Dialog,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  TdMeta,
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

  return {
    links,
    origin: requestEvent.url.origin,
    maxShort: settings?.maxShortLinks ?? 500,
    isApproved: user.isApproved,
  };
});

export const createShortLink = server$(async function (payload: {
  url: string;
  code?: string;
  expiresDays?: number | null;
  maxClicks?: number | null;
}): Promise<
  | { ok: true; code: string }
  | { ok: false; field: "url" | "code" | null; message: string }
> {
  const url = (payload.url || "").trim();
  if (!isValidHttpUrl(url)) {
    return {
      ok: false,
      field: "url",
      message: "Enter a full URL starting with http:// or https://",
    };
  }

  try {
    const result = await api.shortLinks.create(
      {
        url,
        code: payload.code?.trim() || undefined,
        expiresDays:
          typeof payload.expiresDays === "number"
            ? payload.expiresDays
            : undefined,
        maxClicks:
          typeof payload.maxClicks === "number" ? payload.maxClicks : undefined,
      },
      { cookie: this.request.headers.get("cookie") },
    );
    return { ok: true, code: result.code ?? "" };
  } catch (err) {
    if (err instanceof ApiError) {
      const body = (err.body ?? {}) as { error?: string; code?: string };
      if (err.status === 409 && body.error === "duplicate_url") {
        return {
          ok: false,
          field: "url",
          message: `This URL already has a short link: /l/${body.code ?? ""}`,
        };
      }
      const message = body.error || err.message;
      if (err.status === 429) {
        return {
          ok: false,
          field: null,
          message: "You have reached your short link limit.",
        };
      }
      if (/code already/i.test(message)) {
        return {
          ok: false,
          field: "code",
          message: "That code is already taken.",
        };
      }
      if (/custom code/i.test(message)) {
        return {
          ok: false,
          field: "code",
          message: "Codes may use letters, numbers, hyphens and underscores.",
        };
      }
      return { ok: false, field: null, message };
    }
    return {
      ok: false,
      field: null,
      message:
        err instanceof Error ? err.message : "Could not create the link.",
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
  const toast = useToast();

  const links = useStore<{ items: ShortLinkListItem[] }>({
    items: [...data.value.links],
  });

  // The form is the whole point of an empty collection, so it starts open there
  // and stays collapsed once there is something to manage.
  const formOpen = useSignal(data.value.links.length === 0);
  const advancedOpen = useSignal(false);

  const url = useSignal("");
  const code = useSignal("");
  const expiresDays = useSignal("");
  const maxClicks = useSignal("");
  const creating = useSignal(false);
  const urlError = useSignal("");
  const codeError = useSignal("");

  const pendingDelete = useSignal<ShortLinkListItem | null>(null);
  const deleteOpen = useSignal(false);
  const deleteBusy = useSignal(false);

  const remaining = useComputed$(
    () => data.value.maxShort - links.items.length,
  );

  const submit = $(async () => {
    urlError.value = "";
    codeError.value = "";

    if (!url.value.trim()) {
      urlError.value = "Enter the address you want to shorten.";
      return;
    }

    creating.value = true;
    const result = await createShortLink({
      url: url.value.trim(),
      code: code.value.trim() || undefined,
      expiresDays: expiresDays.value ? Number(expiresDays.value) : null,
      maxClicks: maxClicks.value ? Number(maxClicks.value) : null,
    });
    creating.value = false;

    if (!result.ok) {
      if (result.field === "url") urlError.value = result.message;
      else if (result.field === "code") codeError.value = result.message;
      else toast.error("Could not create the short link", result.message);
      return;
    }

    links.items = [
      {
        id: result.code,
        code: result.code,
        url: url.value.trim(),
        clicks: 0,
        maxClicks: maxClicks.value ? Number(maxClicks.value) : null,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        lastClicked: null,
      },
      ...links.items,
    ];

    url.value = "";
    code.value = "";
    expiresDays.value = "";
    maxClicks.value = "";
    advancedOpen.value = false;
    formOpen.value = false;
    toast.success(
      "Short link created",
      `${data.value.origin}/l/${result.code}`,
    );
  });

  const confirmDelete = $(async () => {
    const target = pendingDelete.value;
    if (!target) return;
    deleteBusy.value = true;
    try {
      await deleteShortLink(target.id);
      links.items = links.items.filter((l) => l.id !== target.id);
      deleteOpen.value = false;
      toast.success(`Deleted /${target.code}`);
    } catch (error) {
      toast.error(
        "Could not delete the short link",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    } finally {
      deleteBusy.value = false;
    }
  });

  const shortUrl = (linkCode: string) => `${data.value.origin}/l/${linkCode}`;

  const form = (
    <Surface class="mb-5">
      <div class="grid gap-4">
        <Field
          label="Destination"
          for="link-url"
          error={urlError.value}
          help="The address people land on after following the short link."
          required
        >
          <Input
            id="link-url"
            type="url"
            inputMode="url"
            placeholder="https://example.com/a/long/address"
            value={url.value}
            aria-invalid={urlError.value ? true : undefined}
            onInput$={(_, el) => {
              url.value = el.value;
              urlError.value = "";
            }}
          />
        </Field>

        <div>
          <button
            type="button"
            onClick$={() => (advancedOpen.value = !advancedOpen.value)}
            aria-expanded={advancedOpen.value}
            aria-controls="link-advanced"
            class="focus-ring rounded-control text-ink-muted hover:text-ink inline-flex items-center gap-1.5 py-1 text-[13px]"
          >
            {advancedOpen.value ? (
              <ChevronUp class="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown class="h-4 w-4" aria-hidden="true" />
            )}
            Advanced options
          </button>

          {advancedOpen.value && (
            <div id="link-advanced" class="mt-3 grid gap-4 sm:grid-cols-3">
              <Field
                label="Custom code"
                for="link-code"
                error={codeError.value}
                help="Leave empty for a generated code."
              >
                <CodeInput
                  id="link-code"
                  placeholder="my-link"
                  value={code.value}
                  onInput$={(_, el) => {
                    code.value = el.value;
                    codeError.value = "";
                  }}
                />
              </Field>
              <Field
                label="Expires after"
                for="link-expires"
                help="Days. Empty means never."
              >
                <Input
                  id="link-expires"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Never"
                  value={expiresDays.value}
                  onInput$={(_, el) => (expiresDays.value = el.value)}
                />
              </Field>
              <Field
                label="Click limit"
                for="link-clicks"
                help="Stops working after this many clicks."
              >
                <Input
                  id="link-clicks"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Unlimited"
                  value={maxClicks.value}
                  onInput$={(_, el) => (maxClicks.value = el.value)}
                />
              </Field>
            </div>
          )}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button variant="primary" loading={creating.value} onClick$={submit}>
            Create short link
          </Button>
          {links.items.length > 0 && (
            <Button variant="ghost" onClick$={() => (formOpen.value = false)}>
              Cancel
            </Button>
          )}
          <span class="text-ink-muted ml-auto text-xs">
            {remaining.value} of {data.value.maxShort} remaining
          </span>
        </div>
      </div>
    </Surface>
  );

  return (
    <Page>
      <PageHeader title="Short Links">
        {!formOpen.value && (
          <Button
            q:slot="actions"
            variant="primary"
            onClick$={() => (formOpen.value = true)}
          >
            Create short link
          </Button>
        )}
      </PageHeader>

      {!data.value.isApproved && (
        <Callout tone="warning" title="Account pending approval" class="mb-4">
          Short links stay disabled until an administrator approves your
          account.
        </Callout>
      )}

      {formOpen.value && form}

      {links.items.length === 0 ? (
        !formOpen.value && (
          <Surface flush>
            <EmptyState
              icon={Link2}
              title="No short links yet"
              description="Turn a long address into a short, shareable one."
            >
              <Button
                variant="primary"
                onClick$={() => (formOpen.value = true)}
              >
                Create short link
              </Button>
            </EmptyState>
          </Surface>
        )
      ) : (
        <Section>
          {/* Desktop table */}
          <Surface flush class="hidden overflow-hidden md:block">
            <Table label="Your short links" minWidth="820px">
              <Thead>
                <Tr hover={false}>
                  <Th class="w-40">Short link</Th>
                  <Th>Destination</Th>
                  <Th class="w-28">Clicks</Th>
                  <Th class="w-28">Created</Th>
                  <Th class="w-36">Limits</Th>
                  <Th class="w-36 text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {links.items.map((link) => {
                  const expiry = describeExpiry(link.expiresAt);
                  const exhausted =
                    link.maxClicks !== null && link.clicks >= link.maxClicks;
                  return (
                    <Tr key={link.id}>
                      <Td class="font-mono">/l/{link.code}</Td>
                      <Td class="max-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.url}
                          class="focus-ring text-ink hover:text-accent-text block truncate rounded-[4px]"
                        >
                          {link.url}
                        </a>
                      </Td>
                      <Td class="tabular-nums">
                        {link.clicks.toLocaleString()}
                        {link.lastClicked && (
                          <span class="text-ink-muted block text-xs">
                            last {formatRelativeDate(link.lastClicked)}
                          </span>
                        )}
                      </Td>
                      <TdMeta title={formatAbsoluteDate(link.createdAt)}>
                        {formatRelativeDate(link.createdAt)}
                      </TdMeta>
                      <Td>
                        <div class="flex flex-wrap gap-1">
                          {expiry && (
                            <Badge
                              tone={expiry === "Expired" ? "error" : "warning"}
                            >
                              {expiry}
                            </Badge>
                          )}
                          {link.maxClicks !== null && (
                            <Badge tone={exhausted ? "error" : "neutral"}>
                              {link.clicks}/{link.maxClicks} clicks
                            </Badge>
                          )}
                          {!expiry && link.maxClicks === null && (
                            <span class="text-ink-muted text-xs">None</span>
                          )}
                        </div>
                      </Td>
                      <Td class="text-right">
                        <div class="flex items-center justify-end gap-1">
                          <CopyButton
                            value={shortUrl(link.code)}
                            label="Copy"
                            variant="secondary"
                          />
                          <IconButton
                            size="sm"
                            variant="outline"
                            label={`Open /l/${link.code}`}
                            href={shortUrl(link.code)}
                            external
                          >
                            <ExternalLink class="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="danger"
                            label={`Delete /l/${link.code}`}
                            onClick$={() => {
                              pendingDelete.value = link;
                              deleteOpen.value = true;
                            }}
                          >
                            <Trash2 class="h-4 w-4" />
                          </IconButton>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Surface>

          {/* Compact rows below md */}
          <Surface flush class="overflow-hidden md:hidden">
            <ul class="divide-edge divide-y">
              {links.items.map((link) => {
                const expiry = describeExpiry(link.expiresAt);
                return (
                  <li key={link.id} class="px-3 py-2.5">
                    <div class="flex flex-wrap items-start gap-x-2.5 gap-y-2">
                      <div class="min-w-[9rem] flex-1">
                        <p class="text-ink truncate font-mono text-[13px] font-medium">
                          /l/{link.code}
                        </p>
                        <p
                          class="text-ink-muted mt-0.5 truncate text-xs"
                          title={link.url}
                        >
                          {link.url}
                        </p>
                        <p class="text-ink-muted mt-0.5 text-xs">
                          {link.clicks.toLocaleString()} clicks ·{" "}
                          {formatRelativeDate(link.createdAt)}
                          {expiry && (
                            <span
                              class={
                                expiry === "Expired"
                                  ? "text-danger"
                                  : "text-warning"
                              }
                            >
                              {" "}
                              · {expiry}
                            </span>
                          )}
                        </p>
                      </div>
                      <div class="ml-auto flex shrink-0 items-center gap-1">
                        <CopyButton
                          value={shortUrl(link.code)}
                          title={`Copy /l/${link.code}`}
                          variant="secondary"
                        />
                        <IconButton
                          size="sm"
                          variant="outline"
                          label={`Open /l/${link.code}`}
                          href={shortUrl(link.code)}
                          external
                        >
                          <ExternalLink class="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="danger"
                          label={`Delete /l/${link.code}`}
                          onClick$={() => {
                            pendingDelete.value = link;
                            deleteOpen.value = true;
                          }}
                        >
                          <Trash2 class="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Surface>
        </Section>
      )}

      <Dialog open={deleteOpen} title="Delete this short link?" size="sm">
        <p class="text-ink-muted text-[13px] leading-5">
          <span class="text-ink font-mono">/l/{pendingDelete.value?.code}</span>{" "}
          stops working immediately and anyone following it will get an error.
          This cannot be undone.
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (deleteOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="danger"
          loading={deleteBusy.value}
          onClick$={confirmDelete}
        >
          Delete link
        </Button>
      </Dialog>
    </Page>
  );
});

export const head: DocumentHead = {
  title: "Short Links - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Create and manage short links.",
    },
  ],
};
