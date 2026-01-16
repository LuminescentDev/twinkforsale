import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, Form, routeAction$, z, zod$, type RequestEvent } from "@builder.io/qwik-city";
import type { DocumentHead, RequestEventLoader, RequestEventAction } from "@builder.io/qwik-city";
import { Search, Edit, Save, X, Settings } from "lucide-icons-qwik";
import { DEFAULT_BIO_LIMITS } from "~/lib/bio-limits";

const API_BASE_URL = process.env.API_URL || "http://localhost:5000/api";

async function serverRequest<T>(
  requestEvent: RequestEvent | RequestEventLoader | RequestEventAction,
  endpoint: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const cookies = requestEvent.request.headers.get("cookie") || "";

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const useAdminBioLimitsData = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");

  if (!user?.isAdmin) {
    throw requestEvent.redirect(302, "/");
  }

  const data = await serverRequest<{
    users: Array<{
      id: string;
      name?: string | null;
      email: string;
      isApproved: boolean;
      bioUsername?: string | null;
      bioLinksCount: number;
      limits: {
        maxBioLinks?: number | null;
        maxUsernameLength?: number | null;
        maxDisplayNameLength?: number | null;
        maxDescriptionLength?: number | null;
        maxUrlLength?: number | null;
        maxLinkTitleLength?: number | null;
        maxIconLength?: number | null;
      };
    }>;
  }>(requestEvent, "/admin/bio-limits");

  return {
    users: data.users.map(user => ({
      ...user,
      // Show effective limits (user override or default)
      effectiveLimits: {
        maxBioLinks: user.limits?.maxBioLinks ?? DEFAULT_BIO_LIMITS.maxBioLinks,
        maxUsernameLength: user.limits?.maxUsernameLength ?? DEFAULT_BIO_LIMITS.maxUsernameLength,
        maxDisplayNameLength: user.limits?.maxDisplayNameLength ?? DEFAULT_BIO_LIMITS.maxDisplayNameLength,
        maxDescriptionLength: user.limits?.maxDescriptionLength ?? DEFAULT_BIO_LIMITS.maxDescriptionLength,
        maxUrlLength: user.limits?.maxUrlLength ?? DEFAULT_BIO_LIMITS.maxUrlLength,
        maxLinkTitleLength: user.limits?.maxLinkTitleLength ?? DEFAULT_BIO_LIMITS.maxLinkTitleLength,
        maxIconLength: user.limits?.maxIconLength ?? DEFAULT_BIO_LIMITS.maxIconLength,
      },
    })),
    defaultLimits: DEFAULT_BIO_LIMITS,
  };
});

export const useUpdateUserBioLimits = routeAction$(
  async (values, requestEvent) => {
    const user = requestEvent.sharedMap.get("user");
    if (!user) {
      return requestEvent.fail(401, { message: "Not authenticated" });
    }

    if (!user.isAdmin) {
      return requestEvent.fail(403, { message: "Admin access required" });
    }

    const limitsUpdate: any = {};
    
    // Only update fields that are provided and different from defaults
    if (values.maxBioLinks !== DEFAULT_BIO_LIMITS.maxBioLinks) {
      limitsUpdate.maxBioLinks = values.maxBioLinks;
    }
    if (values.maxUsernameLength !== DEFAULT_BIO_LIMITS.maxUsernameLength) {
      limitsUpdate.maxUsernameLength = values.maxUsernameLength;
    }
    if (values.maxDisplayNameLength !== DEFAULT_BIO_LIMITS.maxDisplayNameLength) {
      limitsUpdate.maxDisplayNameLength = values.maxDisplayNameLength;
    }
    if (values.maxDescriptionLength !== DEFAULT_BIO_LIMITS.maxDescriptionLength) {
      limitsUpdate.maxDescriptionLength = values.maxDescriptionLength;
    }
    if (values.maxUrlLength !== DEFAULT_BIO_LIMITS.maxUrlLength) {
      limitsUpdate.maxUrlLength = values.maxUrlLength;
    }
    if (values.maxLinkTitleLength !== DEFAULT_BIO_LIMITS.maxLinkTitleLength) {
      limitsUpdate.maxLinkTitleLength = values.maxLinkTitleLength;
    }
    if (values.maxIconLength !== DEFAULT_BIO_LIMITS.maxIconLength) {
      limitsUpdate.maxIconLength = values.maxIconLength;
    }

    await serverRequest(requestEvent, `/admin/bio-limits/${values.userId}`, {
      method: "PUT",
      body: JSON.stringify(limitsUpdate),
    });

    return { success: true, message: "Bio limits updated successfully" };
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
    user.bioUsername?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Bio Limits Management
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage bio service limits for individual users
        </p>
      </div>

      {/* Default Limits Info */}
      <div class="mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 p-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-800 dark:text-blue-200">
          <Settings class="h-5 w-5" />
          Global Default Limits
        </h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxBioLinks}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">Bio Links</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxUsernameLength}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">Username</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxDisplayNameLength}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">Display Name</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxDescriptionLength}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">Description</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxUrlLength}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">URL Length</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxLinkTitleLength}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">Link Title</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.value.defaultLimits.maxIconLength}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400">Icon</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div class="mb-6">
        <div class="relative">
          <Search class="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search users by name, email, or bio username..."
            class="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Users Table */}
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  User
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Bio Links
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Username Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Display Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Desc Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  URL Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Link Title Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Icon Len
                </th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredUsers.map((user) => (
                <tr key={user.id} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4">
                    <div>
                      <div class="font-medium text-gray-900 dark:text-gray-100">
                        {user.name || "No name"}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                      {user.bioUsername && (
                        <div class="text-sm text-blue-600 dark:text-blue-400">
                          @{user.bioUsername}
                        </div>
                      )}
                      <div class="text-xs text-gray-400">
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
                            class="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                          >
                            <Save class="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick$={() => (editingUser.value = null)}
                            class="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700"
                          >
                            <X class="h-4 w-4" />
                          </button>
                        </div>
                      </Form>
                    </td>
                  ) : (
                    <>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxBioLinks !== DEFAULT_BIO_LIMITS.maxBioLinks ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxBioLinks}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxUsernameLength !== DEFAULT_BIO_LIMITS.maxUsernameLength ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxUsernameLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxDisplayNameLength !== DEFAULT_BIO_LIMITS.maxDisplayNameLength ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxDisplayNameLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxDescriptionLength !== DEFAULT_BIO_LIMITS.maxDescriptionLength ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxDescriptionLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxUrlLength !== DEFAULT_BIO_LIMITS.maxUrlLength ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxUrlLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxLinkTitleLength !== DEFAULT_BIO_LIMITS.maxLinkTitleLength ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxLinkTitleLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class={user.effectiveLimits.maxIconLength !== DEFAULT_BIO_LIMITS.maxIconLength ? "font-bold text-orange-600 dark:text-orange-400" : ""}>
                          {user.effectiveLimits.maxIconLength}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          onClick$={() => (editingUser.value = user.id)}
                          class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
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
          <p class="text-gray-500 dark:text-gray-400">No users found matching your search.</p>
        </div>
      )}
    </div>
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
