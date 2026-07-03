import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, Form, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Search, Edit, Save, X, Settings } from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { DEFAULT_BIO_LIMITS } from "~/lib/bio-limits";
import { PageContainer, PageHeader } from "~/components/ui";

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
  const admin = await getCurrentUser(auth);
  if (!admin) {
    throw requestEvent.redirect(302, "/");
  }
  if (!admin.isAdmin) {
    throw requestEvent.redirect(302, "/dashboard");
  }

  // Prefer the dedicated bio-limits endpoint; fall back to the users list.
  const bioLimits = (await api.admin
    .bioLimits(auth)
    .catch(() => null)) as { users?: AdminBioLimitUser[] } | null;

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
      settings: { bioUsername: user.bioUsername ?? null },
      bioLinksCount: user.bioLinksCount ?? 0,
      // Show effective limits (user override or default)
      effectiveLimits: {
        maxBioLinks: user.limits?.maxBioLinks ?? DEFAULT_BIO_LIMITS.maxBioLinks,
        maxUsernameLength:
          user.limits?.maxUsernameLength ?? DEFAULT_BIO_LIMITS.maxUsernameLength,
        maxDisplayNameLength:
          user.limits?.maxDisplayNameLength ??
          DEFAULT_BIO_LIMITS.maxDisplayNameLength,
        maxDescriptionLength:
          user.limits?.maxDescriptionLength ??
          DEFAULT_BIO_LIMITS.maxDescriptionLength,
        maxUrlLength: user.limits?.maxUrlLength ?? DEFAULT_BIO_LIMITS.maxUrlLength,
        maxLinkTitleLength:
          user.limits?.maxLinkTitleLength ??
          DEFAULT_BIO_LIMITS.maxLinkTitleLength,
        maxIconLength:
          user.limits?.maxIconLength ?? DEFAULT_BIO_LIMITS.maxIconLength,
      },
    })),
    defaultLimits: DEFAULT_BIO_LIMITS,
  };
});

export const useUpdateUserBioLimits = routeAction$(
  async (values, requestEvent) => {
    const { userId, ...limits } = values;
    try {
      await api.admin.updateBioLimits(userId, limits, serverAuth(requestEvent));
      return { success: true, message: "Bio limits updated successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Failed to update bio limits",
      });
    }
  },
  zod$({
    userId: z.string(),
    maxBioLinks: z.number().min(1).max(100),
    maxUsernameLength: z.number().min(3).max(50),
    maxDisplayNameLength: z.number().min(1).max(100),
    maxDescriptionLength: z.number().min(1).max(5000),
    maxUrlLength: z.number().min(10).max(1000),
    maxLinkTitleLength: z.number().min(1).max(200),
    maxIconLength: z.number().min(1).max(50),
  }),
);

export default component$(() => {
  const data = useAdminBioLimitsData();
  const updateLimits = useUpdateUserBioLimits();
  const editingUser = useSignal<string | null>(null);
  const searchQuery = useSignal("");
  const filteredUsers = data.value.users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.settings?.bioUsername?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        title="Bio Limits Management"
        icon={Settings}
        align="left"
        subtitle="Manage bio service limits for individual users"
      />

      {/* Default Limits Info */}
      <div class="mb-6 rounded-xl border border-theme-info/30 bg-theme-info/10 p-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-theme-info">
          <Settings class="h-5 w-5" />
          Global Default Limits
        </h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxBioLinks}
            </div>
            <div class="text-xs text-theme-info">Bio Links</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxUsernameLength}
            </div>
            <div class="text-xs text-theme-info">Username</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxDisplayNameLength}
            </div>
            <div class="text-xs text-theme-info">Display Name</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxDescriptionLength}
            </div>
            <div class="text-xs text-theme-info">Description</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxUrlLength}
            </div>
            <div class="text-xs text-theme-info">URL Length</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxLinkTitleLength}
            </div>
            <div class="text-xs text-theme-info">Link Title</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-theme-info">
              {data.value.defaultLimits.maxIconLength}
            </div>
            <div class="text-xs text-theme-info">Icon</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div class="mb-6">
        <div class="relative">
          <Search class="absolute left-3 top-3 h-5 w-5 text-theme-text-muted" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search users by name, email, or bio username..."
            class="w-full rounded-xl border border-theme-card-border bg-theme-bg-secondary/40 py-3 pl-10 pr-4 text-theme-text-primary focus:border-theme-accent-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/30"
          />
        </div>
      </div>

      {/* Users Table */}
      <div class="overflow-hidden rounded-xl border border-theme-card-border bg-theme-bg-secondary/40 shadow-lg">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-theme-bg-tertiary/40">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  User
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Bio Links
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Username Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Display Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Desc Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  URL Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Link Title Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Icon Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-theme-card-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} class="hover:bg-theme-bg-tertiary/20">
                  <td class="px-6 py-4">
                    <div>
                      <div class="font-medium text-theme-text-primary">
                        {user.name || "No name"}
                      </div>
                      <div class="text-sm text-theme-text-muted">
                        {user.email}
                      </div>
                      {user.settings?.bioUsername && (
                        <div class="text-sm text-theme-info">
                          @{user.settings.bioUsername}
                        </div>
                      )}
                      <div class="text-xs text-theme-text-muted">
                        {user.bioLinksCount} bio links
                      </div>
                    </div>
                  </td>                  {editingUser.value === user.id ? (
                    <td class="px-6 py-4" colSpan={8}>
                      <Form action={updateLimits}>
                        <input type="hidden" name="userId" value={user.id} />
                        <div class="grid grid-cols-7 gap-2">
                          <input
                            type="number"
                            name="maxBioLinks"
                            value={user.effectiveLimits.maxBioLinks}
                            min="1"
                            max="100"
                            class="w-16 rounded px-2 py-1 text-center text-sm"
                          />
                          <input
                            type="number"
                            name="maxUsernameLength"
                            value={user.effectiveLimits.maxUsernameLength}
                            min="3"
                            max="50"
                            class="w-16 rounded px-2 py-1 text-center text-sm"
                          />
                          <input
                            type="number"
                            name="maxDisplayNameLength"
                            value={user.effectiveLimits.maxDisplayNameLength}
                            min="1"
                            max="100"
                            class="w-16 rounded px-2 py-1 text-center text-sm"
                          />
                          <input
                            type="number"
                            name="maxDescriptionLength"
                            value={user.effectiveLimits.maxDescriptionLength}
                            min="1"
                            max="5000"
                            class="w-20 rounded px-2 py-1 text-center text-sm"
                          />
                          <input
                            type="number"
                            name="maxUrlLength"
                            value={user.effectiveLimits.maxUrlLength}
                            min="10"
                            max="1000"
                            class="w-20 rounded px-2 py-1 text-center text-sm"
                          />
                          <input
                            type="number"
                            name="maxLinkTitleLength"
                            value={user.effectiveLimits.maxLinkTitleLength}
                            min="1"
                            max="200"
                            class="w-16 rounded px-2 py-1 text-center text-sm"
                          />
                          <input
                            type="number"
                            name="maxIconLength"
                            value={user.effectiveLimits.maxIconLength}
                            min="1"
                            max="50"
                            class="w-16 rounded px-2 py-1 text-center text-sm"
                          />
                        </div>
                        <div class="flex gap-2 justify-center mt-2">
                          <button
                            type="submit"
                            class="rounded bg-theme-success px-2 py-1 text-xs text-white hover:bg-theme-success"
                          >
                            <Save class="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick$={() => (editingUser.value = null)}
                            class="rounded bg-theme-bg-tertiary px-2 py-1 text-xs text-white hover:bg-theme-bg-tertiary/30"
                          >
                            <X class="h-4 w-4" />
                          </button>
                        </div>
                      </Form>
                    </td>
                  ) : (
                    <>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxBioLinks !== DEFAULT_BIO_LIMITS.maxBioLinks ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxBioLinks}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxUsernameLength !== DEFAULT_BIO_LIMITS.maxUsernameLength ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxUsernameLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxDisplayNameLength !== DEFAULT_BIO_LIMITS.maxDisplayNameLength ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxDisplayNameLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxDescriptionLength !== DEFAULT_BIO_LIMITS.maxDescriptionLength ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxDescriptionLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxUrlLength !== DEFAULT_BIO_LIMITS.maxUrlLength ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxUrlLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxLinkTitleLength !== DEFAULT_BIO_LIMITS.maxLinkTitleLength ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxLinkTitleLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxIconLength !== DEFAULT_BIO_LIMITS.maxIconLength ? "font-bold text-theme-warning" : ""}>
                          {user.effectiveLimits.maxIconLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          onClick$={() => (editingUser.value = user.id)}
                          class="rounded bg-theme-info px-2 py-1 text-xs text-white hover:bg-theme-info"
                        >
                          <Edit class="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div class="py-12 text-center">
          <p class="text-theme-text-muted">No users found matching your search.</p>
        </div>
      )}
    </PageContainer>
  );
});

export const head: DocumentHead = {
  title: "Bio Limits Management - Admin",
  meta: [
    {
      name: "description",
      content: "Manage bio service limits for users",
    },
  ],
};
