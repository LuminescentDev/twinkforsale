import { component$, useSignal, useComputed$, $ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Users, SearchX, ShieldCheck, Clock } from "lucide-icons-qwik";
import { api, serverAuth, type AdminUserDto } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import { formatRelativeDate, formatAbsoluteDate } from "~/lib/file-kinds";
import { useToast } from "~/lib/toast-store";
import {
  PageHeader,
  Section,
  Surface,
  Button,
  Badge,
  Field,
  Input,
  Select,
  SearchField,
  CollectionToolbar,
  SummaryList,
  EmptyState,
  Dialog,
  Table,
  Thead,
  Tbody,
  Th,
  SortHeader,
  Tr,
  Td,
  TdMeta,
} from "~/components/ui";

const DEFAULT_STORAGE_LIMIT = 10_737_418_240;

export const useAdminUsers = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const currentUser = await getCurrentUser(auth);
  if (!currentUser) throw requestEvent.redirect(302, "/");
  if (!currentUser.isAdmin) throw requestEvent.redirect(302, "/dashboard");

  const usersRes = await api.admin.users(auth).catch(() => ({ users: [] }));

  return {
    users: usersRes.users ?? [],
    currentUserId: currentUser.id,
    baseStorageLimit: DEFAULT_STORAGE_LIMIT,
  };
});

export const useUpdateUser = routeAction$(async (data, requestEvent) => {
  if (!data.userId) {
    return { success: false, error: "No user selected." };
  }

  const parseLimit = (val: unknown): number | null | undefined => {
    if (typeof val !== "string") return undefined;
    if (val.trim() === "") return null; // explicit reset to the default
    const n = parseInt(val, 10);
    return !isNaN(n) && n > 0 ? n : undefined;
  };

  try {
    await api.admin.updateUser(
      data.userId as string,
      {
        isApproved:
          typeof data.isApproved === "boolean" ? data.isApproved : undefined,
        isAdmin: typeof data.isAdmin === "boolean" ? data.isAdmin : undefined,
        maxUploads: parseLimit(data.maxUploads) ?? undefined,
        maxFileSize: parseLimit(data.maxFileSize) ?? undefined,
        maxStorageLimit: parseLimit(data.maxStorageLimit),
      },
      serverAuth(requestEvent),
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "The update did not go through.",
    };
  }
});

type SortKey = "createdAt" | "name" | "email" | "uploads" | "storage";

export default component$(() => {
  const data = useAdminUsers();
  const updateUser = useUpdateUser();
  const toast = useToast();

  const search = useSignal("");
  const statusFilter = useSignal("all");
  const roleFilter = useSignal("all");
  const sortKey = useSignal<SortKey>("createdAt");
  const sortDir = useSignal<"asc" | "desc">("desc");

  /** Locally applied changes, so the table reflects an action immediately. */
  const overrides = useSignal<Record<string, Partial<AdminUserDto>>>({});
  const editing = useSignal<AdminUserDto | null>(null);
  const editOpen = useSignal(false);
  const maxUploads = useSignal("");
  const maxFileSize = useSignal("");
  const maxStorageLimit = useSignal("");

  const users = useComputed$(() =>
    data.value.users.map((u) => ({ ...u, ...(overrides.value[u.id] ?? {}) })),
  );

  const pendingCount = useComputed$(
    () => users.value.filter((u) => !u.isApproved).length,
  );

  const visible = useComputed$(() => {
    const query = search.value.trim().toLowerCase();
    let list = users.value;

    if (query) {
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query),
      );
    }
    if (statusFilter.value === "approved")
      list = list.filter((u) => u.isApproved);
    if (statusFilter.value === "pending")
      list = list.filter((u) => !u.isApproved);
    if (roleFilter.value === "admin") list = list.filter((u) => u.isAdmin);
    if (roleFilter.value === "member") list = list.filter((u) => !u.isAdmin);

    const dir = sortDir.value === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey.value) {
        case "name":
          return (a.name || "").localeCompare(b.name || "") * dir;
        case "email":
          return a.email.localeCompare(b.email) * dir;
        case "uploads":
          return (a.uploads - b.uploads) * dir;
        case "storage":
          return (Number(a.storageUsed) - Number(b.storageUsed)) * dir;
        default:
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            dir
          );
      }
    });
  });

  const toggleSort = $((key: SortKey) => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    } else {
      sortKey.value = key;
      sortDir.value = key === "name" || key === "email" ? "asc" : "desc";
    }
  });

  const applyChange = $(
    async (
      user: AdminUserDto,
      patch: { isApproved?: boolean; isAdmin?: boolean },
    ) => {
      const result = await updateUser.submit({ userId: user.id, ...patch });
      if (result.value.success) {
        overrides.value = {
          ...overrides.value,
          [user.id]: { ...(overrides.value[user.id] ?? {}), ...patch },
        };
        const label = user.name || user.email;
        if (patch.isApproved === true) toast.success(`Approved ${label}`);
        else if (patch.isApproved === false) toast.success(`Revoked ${label}`);
        else if (patch.isAdmin === true)
          toast.success(`${label} is now an admin`);
        else if (patch.isAdmin === false)
          toast.success(`${label} is now a member`);
      } else {
        toast.error("Could not update the account", result.value.error);
      }
    },
  );

  const openLimits = $((user: AdminUserDto) => {
    editing.value = user;
    maxUploads.value = "";
    maxFileSize.value = "";
    maxStorageLimit.value = "";
    editOpen.value = true;
  });

  const saveLimits = $(async () => {
    const user = editing.value;
    if (!user) return;
    const result = await updateUser.submit({
      userId: user.id,
      maxUploads: maxUploads.value,
      maxFileSize: maxFileSize.value,
      maxStorageLimit: maxStorageLimit.value,
    });
    if (result.value.success) {
      editOpen.value = false;
      toast.success(`Limits updated for ${user.name || user.email}`);
    } else {
      toast.error("Could not update the limits", result.value.error);
    }
  });

  const totalStorage = users.value.reduce(
    (sum, u) => sum + Number(u.storageUsed),
    0,
  );

  return (
    <>
      <PageHeader title="Users" />

      <SummaryList
        label="Account totals"
        class="mb-4"
        items={[
          { label: "Accounts", value: users.value.length },
          {
            label: "Awaiting approval",
            value: pendingCount.value,
          },
          {
            label: "Administrators",
            value: users.value.filter((u) => u.isAdmin).length,
          },
          { label: "Storage used", value: formatBytes(totalStorage, 1) },
        ]}
      />

      <CollectionToolbar class="mb-3">
        <SearchField
          value={search}
          label="Search accounts"
          placeholder="Name, email or ID"
          class="min-w-[11rem] flex-1"
          resultSummary={`${visible.value.length} of ${users.value.length} accounts shown`}
        />
        <div class="w-[9rem] shrink-0">
          <label class="sr-only" for="status-filter">
            Filter by status
          </label>
          <Select
            id="status-filter"
            value={statusFilter.value}
            onChange$={(_, el) => (statusFilter.value = el.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Awaiting approval</option>
            <option value="approved">Approved</option>
          </Select>
        </div>
        <div class="w-[8.5rem] shrink-0">
          <label class="sr-only" for="role-filter">
            Filter by role
          </label>
          <Select
            id="role-filter"
            value={roleFilter.value}
            onChange$={(_, el) => (roleFilter.value = el.value)}
          >
            <option value="all">All roles</option>
            <option value="admin">Administrators</option>
            <option value="member">Members</option>
          </Select>
        </div>
      </CollectionToolbar>

      {pendingCount.value > 0 && statusFilter.value === "all" && (
        <p class="text-ink-muted mb-3 text-[13px]">
          {pendingCount.value} account{pendingCount.value === 1 ? "" : "s"}{" "}
          awaiting approval.{" "}
          <button
            type="button"
            onClick$={() => (statusFilter.value = "pending")}
            class="focus-ring text-accent-text rounded-[4px] underline underline-offset-2"
          >
            Show only those
          </button>
        </p>
      )}

      {visible.value.length === 0 ? (
        <Surface flush>
          <EmptyState
            icon={users.value.length === 0 ? Users : SearchX}
            title={
              users.value.length === 0 ? "No accounts yet" : "No accounts match"
            }
            description={
              users.value.length === 0
                ? "Accounts appear here once people sign in for the first time."
                : `${users.value.length} accounts are hidden by the current search and filters.`
            }
          >
            {users.value.length > 0 && (
              <Button
                variant="secondary"
                onClick$={() => {
                  search.value = "";
                  statusFilter.value = "all";
                  roleFilter.value = "all";
                }}
              >
                Clear search and filters
              </Button>
            )}
          </EmptyState>
        </Surface>
      ) : (
        <>
          {/* Desktop comparison table */}
          <Surface flush class="hidden overflow-hidden lg:block">
            <Table label="User accounts" minWidth="900px">
              <Thead>
                <Tr hover={false}>
                  <SortHeader
                    active={sortKey.value === "name"}
                    direction={sortDir.value}
                    onClick$={() => toggleSort("name")}
                  >
                    Account
                  </SortHeader>
                  <Th class="w-32">Status</Th>
                  <SortHeader
                    class="w-24"
                    active={sortKey.value === "uploads"}
                    direction={sortDir.value}
                    onClick$={() => toggleSort("uploads")}
                  >
                    Files
                  </SortHeader>
                  <SortHeader
                    class="w-28"
                    active={sortKey.value === "storage"}
                    direction={sortDir.value}
                    onClick$={() => toggleSort("storage")}
                  >
                    Storage
                  </SortHeader>
                  <Th class="w-20">Keys</Th>
                  <SortHeader
                    class="w-28"
                    active={sortKey.value === "createdAt"}
                    direction={sortDir.value}
                    onClick$={() => toggleSort("createdAt")}
                  >
                    Joined
                  </SortHeader>
                  <Th class="w-[19rem] text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.value.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <div class="flex min-w-0 items-center gap-2.5">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            width="28"
                            height="28"
                            class="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            class="bg-surface-subtle text-ink-muted border-edge flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold"
                          >
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div class="min-w-0">
                          <p class="text-ink truncate font-medium">
                            {user.name || "Unnamed"}
                          </p>
                          <p class="text-ink-muted truncate text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div class="flex flex-wrap gap-1">
                        <Badge
                          tone={user.isApproved ? "success" : "warning"}
                          icon={user.isApproved ? ShieldCheck : Clock}
                        >
                          {user.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        {user.isAdmin && <Badge tone="accent">Admin</Badge>}
                      </div>
                    </Td>
                    <Td class="tabular-nums">
                      {user.uploads.toLocaleString()}
                    </Td>
                    <TdMeta>{formatBytes(Number(user.storageUsed), 1)}</TdMeta>
                    <TdMeta class="tabular-nums">{user.apiKeys}</TdMeta>
                    <TdMeta title={formatAbsoluteDate(user.createdAt)}>
                      {formatRelativeDate(user.createdAt)}
                    </TdMeta>
                    <Td class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={user.isApproved ? "secondary" : "primary"}
                          onClick$={() =>
                            applyChange(user, { isApproved: !user.isApproved })
                          }
                        >
                          {user.isApproved ? "Revoke" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={user.id === data.value.currentUserId}
                          title={
                            user.id === data.value.currentUserId
                              ? "You cannot change your own role."
                              : undefined
                          }
                          onClick$={() =>
                            applyChange(user, { isAdmin: !user.isAdmin })
                          }
                        >
                          {user.isAdmin ? "Remove admin" : "Make admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick$={() => openLimits(user)}
                        >
                          Limits
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Surface>

          {/* Below lg: priority fields, with editing moved into the dialog */}
          <Surface flush class="overflow-hidden lg:hidden">
            <ul class="divide-edge divide-y">
              {visible.value.map((user) => (
                <li key={user.id} class="px-3 py-2.5">
                  <div class="flex items-start gap-2.5">
                    <div class="min-w-0 flex-1">
                      <p class="text-ink truncate text-[13px] font-medium">
                        {user.name || "Unnamed"}
                      </p>
                      <p class="text-ink-muted truncate text-xs">
                        {user.email}
                      </p>
                      <p class="text-ink-muted mt-0.5 text-xs">
                        {user.uploads} files ·{" "}
                        {formatBytes(Number(user.storageUsed), 1)} ·{" "}
                        {formatRelativeDate(user.createdAt)}
                      </p>
                      <div class="mt-1.5 flex flex-wrap gap-1">
                        <Badge
                          tone={user.isApproved ? "success" : "warning"}
                          icon={user.isApproved ? ShieldCheck : Clock}
                        >
                          {user.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        {user.isAdmin && <Badge tone="accent">Admin</Badge>}
                      </div>
                    </div>
                    <div class="flex shrink-0 flex-col gap-1">
                      <Button
                        size="sm"
                        variant={user.isApproved ? "secondary" : "primary"}
                        onClick$={() =>
                          applyChange(user, { isApproved: !user.isApproved })
                        }
                      >
                        {user.isApproved ? "Revoke" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick$={() => openLimits(user)}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Surface>
        </>
      )}

      <Dialog
        open={editOpen}
        title={`Limits for ${editing.value?.name || editing.value?.email || "account"}`}
        description="Leave a field empty to keep the current value; enter 0 or clear storage to reset it to the default."
      >
        <div class="grid gap-4">
          <Field
            label="Maximum files"
            for="limit-uploads"
            help="How many files this account may hold at once."
          >
            <Input
              id="limit-uploads"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Unchanged"
              value={maxUploads.value}
              onInput$={(_, el) => (maxUploads.value = el.value)}
            />
          </Field>
          <Field
            label="Maximum file size"
            for="limit-filesize"
            help="In bytes. 10485760 is 10 MB."
          >
            <Input
              id="limit-filesize"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Unchanged"
              value={maxFileSize.value}
              onInput$={(_, el) => (maxFileSize.value = el.value)}
            />
          </Field>
          <Field
            label="Storage limit"
            for="limit-storage"
            help={`In bytes. Empty resets to the default of ${formatBytes(data.value.baseStorageLimit, 0)}.`}
          >
            <Input
              id="limit-storage"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Unchanged"
              value={maxStorageLimit.value}
              onInput$={(_, el) => (maxStorageLimit.value = el.value)}
            />
          </Field>

          {editing.value && (
            <Section title="Current usage">
              <dl class="border-edge divide-edge rounded-surface bg-surface-subtle divide-y border px-3">
                <div class="flex justify-between py-1.5">
                  <dt class="text-ink-muted text-[13px]">Files</dt>
                  <dd class="text-ink text-[13px]">{editing.value.uploads}</dd>
                </div>
                <div class="flex justify-between py-1.5">
                  <dt class="text-ink-muted text-[13px]">Storage used</dt>
                  <dd class="text-ink text-[13px]">
                    {formatBytes(Number(editing.value.storageUsed), 1)}
                  </dd>
                </div>
                <div class="flex justify-between py-1.5">
                  <dt class="text-ink-muted text-[13px]">API keys</dt>
                  <dd class="text-ink text-[13px]">{editing.value.apiKeys}</dd>
                </div>
              </dl>
            </Section>
          )}
        </div>

        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (editOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="primary"
          loading={updateUser.isRunning}
          onClick$={saveLimits}
        >
          Save limits
        </Button>
      </Dialog>
    </>
  );
});

export const head: DocumentHead = {
  title: "Users - Admin - twink.forsale",
};
