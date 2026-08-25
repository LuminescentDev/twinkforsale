import { component$, useSignal, useComputed$, $ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  Form,
  z,
  zod$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Users, SearchX } from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { DEFAULT_BIO_LIMITS } from "~/lib/bio-limits";
import {
  PageHeader,
  Surface,
  Button,
  Badge,
  Field,
  Input,
  SearchField,
  CollectionToolbar,
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

interface AdminBioLimitUser {
  id: string;
  name: string | null;
  email: string;
  isApproved: boolean;
  bioUsername?: string | null;
  bioLinksCount?: number;
  limits?: Partial<typeof DEFAULT_BIO_LIMITS>;
}

export const useAdminBioLimitsData = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);

  // Prefer the dedicated bio-limits endpoint; fall back to the users list.
  const bioLimits = (await api.admin.bioLimits(auth).catch(() => null)) as {
    users?: AdminBioLimitUser[];
  } | null;

  let sourceUsers: AdminBioLimitUser[];
  if (bioLimits?.users) {
    sourceUsers = bioLimits.users;
  } else {
    const { users } = await api.admin.users(auth).catch(() => ({ users: [] }));
    sourceUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isApproved: u.isApproved,
    }));
  }

  return {
    users: sourceUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isApproved: user.isApproved,
      bioUsername: user.bioUsername ?? null,
      bioLinksCount: user.bioLinksCount ?? 0,
      /** The user's override, or the service default when unset. */
      effectiveLimits: {
        maxBioLinks: user.limits?.maxBioLinks ?? DEFAULT_BIO_LIMITS.maxBioLinks,
        maxUsernameLength:
          user.limits?.maxUsernameLength ??
          DEFAULT_BIO_LIMITS.maxUsernameLength,
        maxDisplayNameLength:
          user.limits?.maxDisplayNameLength ??
          DEFAULT_BIO_LIMITS.maxDisplayNameLength,
        maxDescriptionLength:
          user.limits?.maxDescriptionLength ??
          DEFAULT_BIO_LIMITS.maxDescriptionLength,
        maxUrlLength:
          user.limits?.maxUrlLength ?? DEFAULT_BIO_LIMITS.maxUrlLength,
        maxLinkTitleLength:
          user.limits?.maxLinkTitleLength ??
          DEFAULT_BIO_LIMITS.maxLinkTitleLength,
        maxIconLength:
          user.limits?.maxIconLength ?? DEFAULT_BIO_LIMITS.maxIconLength,
      },
      hasOverride: Boolean(user.limits && Object.keys(user.limits).length > 0),
    })),
    defaultLimits: DEFAULT_BIO_LIMITS,
  };
});

export const useUpdateUserBioLimits = routeAction$(
  async (values, requestEvent) => {
    const { userId, ...limits } = values;
    try {
      await api.admin.updateBioLimits(userId, limits, serverAuth(requestEvent));
      return { success: true, message: "Bio limits updated." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not update the limits.",
      });
    }
  },
  zod$({
    userId: z.string(),
    maxBioLinks: z.coerce.number().min(1).max(100),
    maxUsernameLength: z.coerce.number().min(3).max(50),
    maxDisplayNameLength: z.coerce.number().min(1).max(100),
    maxDescriptionLength: z.coerce.number().min(1).max(5000),
    maxUrlLength: z.coerce.number().min(10).max(1000),
    maxLinkTitleLength: z.coerce.number().min(1).max(200),
    maxIconLength: z.coerce.number().min(1).max(50),
  }),
);

const LIMIT_FIELDS = [
  {
    key: "maxBioLinks",
    label: "Links",
    help: "How many links a page may hold.",
  },
  { key: "maxUsernameLength", label: "Username length", help: "Characters." },
  {
    key: "maxDisplayNameLength",
    label: "Display name length",
    help: "Characters.",
  },
  {
    key: "maxDescriptionLength",
    label: "Introduction length",
    help: "Characters.",
  },
  { key: "maxUrlLength", label: "URL length", help: "Characters." },
  {
    key: "maxLinkTitleLength",
    label: "Link title length",
    help: "Characters.",
  },
  { key: "maxIconLength", label: "Icon value length", help: "Characters." },
] as const;

export default component$(() => {
  const data = useAdminBioLimitsData();
  const updateLimits = useUpdateUserBioLimits();

  const search = useSignal("");
  const editing = useSignal<(typeof data.value.users)[number] | null>(null);
  const editOpen = useSignal(false);

  const visible = useComputed$(() => {
    const query = search.value.trim().toLowerCase();
    if (!query) return data.value.users;
    return data.value.users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.bioUsername?.toLowerCase().includes(query),
    );
  });

  const openEditor = $((user: (typeof data.value.users)[number]) => {
    editing.value = user;
    editOpen.value = true;
  });

  return (
    <>
      <PageHeader
        title="Bio limits"
        description={`Per-account overrides for bio pages. Accounts without an override use the service defaults: ${data.value.defaultLimits.maxBioLinks} links, ${data.value.defaultLimits.maxDescriptionLength}-character introduction.`}
      />

      {updateLimits.value?.failed && (
        <Callout tone="danger" title="Could not update the limits" class="mb-4">
          {updateLimits.value.message}
        </Callout>
      )}

      <CollectionToolbar class="mb-3">
        <SearchField
          value={search}
          label="Search accounts"
          placeholder="Name, email or bio username"
          class="min-w-[11rem] flex-1 sm:max-w-sm"
          resultSummary={`${visible.value.length} of ${data.value.users.length} accounts shown`}
        />
      </CollectionToolbar>

      {visible.value.length === 0 ? (
        <Surface flush>
          <EmptyState
            icon={data.value.users.length === 0 ? Users : SearchX}
            title={
              data.value.users.length === 0
                ? "No accounts yet"
                : "No accounts match"
            }
            description={
              data.value.users.length === 0
                ? "Accounts appear here once people sign in."
                : `${data.value.users.length} accounts are hidden by the current search.`
            }
          >
            {data.value.users.length > 0 && (
              <Button variant="secondary" onClick$={() => (search.value = "")}>
                Clear search
              </Button>
            )}
          </EmptyState>
        </Surface>
      ) : (
        <>
          <Surface flush class="hidden overflow-hidden lg:block">
            <Table label="Bio limits by account" minWidth="820px">
              <Thead>
                <Tr hover={false}>
                  <Th>Account</Th>
                  <Th class="w-32">Bio page</Th>
                  <Th class="w-24">Links</Th>
                  <Th class="w-32">Introduction</Th>
                  <Th class="w-28">Limits</Th>
                  <Th class="w-20 text-right">Edit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.value.map((user) => (
                  <Tr key={user.id}>
                    <Td class="max-w-0">
                      <p class="text-ink truncate font-medium">
                        {user.name || "Unnamed"}
                      </p>
                      <p class="text-ink-muted truncate text-xs">
                        {user.email}
                      </p>
                    </Td>
                    <TdMeta class="font-mono">
                      {user.bioUsername ? `/${user.bioUsername}` : "Not set"}
                    </TdMeta>
                    <Td class="tabular-nums">
                      {user.bioLinksCount} / {user.effectiveLimits.maxBioLinks}
                    </Td>
                    <TdMeta class="tabular-nums">
                      {user.effectiveLimits.maxDescriptionLength} chars
                    </TdMeta>
                    <Td>
                      <Badge tone={user.hasOverride ? "accent" : "neutral"}>
                        {user.hasOverride ? "Custom" : "Default"}
                      </Badge>
                    </Td>
                    <Td class="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick$={() => openEditor(user)}
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Surface>

          <Surface flush class="overflow-hidden lg:hidden">
            <ul class="divide-edge divide-y">
              {visible.value.map((user) => (
                <li key={user.id} class="flex items-start gap-2.5 px-3 py-2.5">
                  <div class="min-w-0 flex-1">
                    <p class="text-ink truncate text-[13px] font-medium">
                      {user.name || "Unnamed"}
                    </p>
                    <p class="text-ink-muted truncate text-xs">{user.email}</p>
                    <p class="text-ink-muted mt-0.5 text-xs">
                      {user.bioLinksCount} / {user.effectiveLimits.maxBioLinks}{" "}
                      links ·{" "}
                      {user.bioUsername
                        ? `/${user.bioUsername}`
                        : "no bio page"}
                    </p>
                    <div class="mt-1.5">
                      <Badge tone={user.hasOverride ? "accent" : "neutral"}>
                        {user.hasOverride ? "Custom limits" : "Default limits"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick$={() => openEditor(user)}
                  >
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          </Surface>
        </>
      )}

      <Dialog
        open={editOpen}
        title={`Bio limits for ${editing.value?.name || editing.value?.email || "account"}`}
        description="These replace the service defaults for this account only."
      >
        {editing.value && (
          <LimitsForm
            user={editing.value}
            defaults={data.value.defaultLimits}
            action={updateLimits}
            onCancel$={$(() => (editOpen.value = false))}
          />
        )}
      </Dialog>
    </>
  );
});

/** Extracted so the non-null account is captured once, not per field. */
const LimitsForm = component$<{
  user: {
    id: string;
    effectiveLimits: Record<string, number>;
  };
  defaults: Record<string, number>;
  action: any;
  onCancel$: any;
}>(({ user, defaults, action, onCancel$ }) => (
  <Form action={action} class="grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="userId" value={user.id} />
    {LIMIT_FIELDS.map((field) => (
      <Field
        key={field.key}
        label={field.label}
        for={`limit-${field.key}`}
        help={`${field.help} Default ${defaults[field.key]}.`}
      >
        <Input
          id={`limit-${field.key}`}
          name={field.key}
          type="number"
          min="1"
          inputMode="numeric"
          value={user.effectiveLimits[field.key]}
        />
      </Field>
    ))}
    <div class="flex justify-end gap-2 sm:col-span-2">
      <Button variant="secondary" onClick$={onCancel$}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" loading={action.isRunning}>
        Save limits
      </Button>
    </div>
  </Form>
));

export const head: DocumentHead = {
  title: "Bio limits - Admin - twink.forsale",
};
