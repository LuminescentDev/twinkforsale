# Fix Sign-In Button Issue

## The Problem

Clicking the "Get Started" button just reloads the page instead of redirecting to Discord OAuth.

## Root Cause

The sign-in action is trying to redirect but the redirect might not be working due to how Qwik handles external redirects in globalActions.

## Solutions

### Solution 1: Use Direct Link Instead of Form (Recommended)

Change the sign-in button from a form submission to a direct link.

**Edit:** `frontend/src/routes/index.tsx`

**Find (around line 116-128):**
```tsx
<Form action={signInAction} q:slot="end">
  <input type="hidden" name="providerId" value="discord" />
  <input
    type="hidden"
    name="options.redirectTo"
    value={loc.url.pathname + loc.url.search}
  />{" "}
  <button class="btn-cute mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
    <User class="h-5 w-5" />
    Get Started
  </button>
</Form>
```

**Replace with:**
```tsx
<a
  href={`${import.meta.env.VITE_API_URL?.replace(/\/+$/, '').replace(/\/api$/, '') || 'http://localhost:5000'}/api/auth/discord`}
  class="btn-cute mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
>
  <User class="h-5 w-5" />
  Get Started
</a>
```

### Solution 2: Fix the globalAction (Alternative)

If you want to keep the form approach, the action needs to return a redirect response properly.

**Edit:** `frontend/src/routes/plugin@auth.ts`

**Find:**
```typescript
export const useSignIn = globalAction$(async (_, requestEvent) => {
  const rawApiUrl = requestEvent.env.get("API_URL") || "http://localhost:5000";
  const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  const redirectUrl = `${apiUrl}/api/auth/discord`;
  console.log("Sign in redirect URL:", redirectUrl);
  throw requestEvent.redirect(302, redirectUrl);
});
```

**Replace with:**
```typescript
export const useSignIn = globalAction$(async (_, requestEvent) => {
  const rawApiUrl = requestEvent.env.get("API_URL") || "http://localhost:5000";
  const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  const redirectUrl = `${apiUrl}/api/auth/discord`;
  
  // Return a response that triggers a redirect on the client
  return {
    redirect: redirectUrl
  };
});
```

Then update the frontend to handle the response:

```tsx
<Form 
  action={signInAction}
  onSubmitCompleted$={(event) => {
    if (event.detail.value?.redirect) {
      window.location.href = event.detail.value.redirect;
    }
  }}
>
  {/* form content */}
</Form>
```

### Solution 3: Use Window Location (Simplest for Testing)

Add a simple script to the button:

```tsx
<button
  onClick$={() => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '').replace(/\/api$/, '') || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/discord`;
  }}
  class="btn-cute mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
>
  <User class="h-5 w-5" />
  Get Started
</button>
```

## Recommended Approach

**Use Solution 1** (direct link) because:
- ✅ Simplest and most reliable
- ✅ No form submission needed
- ✅ Works with any external OAuth provider
- ✅ Standard OAuth flow pattern

## After Fixing

1. **Rebuild frontend:**
   ```bash
   cd frontend
   pnpm build
   ```

2. **Redeploy frontend** (if using Docker, restart container)

3. **Test:** Click "Get Started" - should redirect to Discord OAuth

## Verifying Discord OAuth is Working

After clicking "Get Started", you should:

1. Be redirected to Discord's OAuth page
2. See "twink.forsale wants to access your Discord account"
3. Click "Authorize"
4. Be redirected back to your site

If you get an error at Discord, check:
- Discord OAuth app is configured correctly
- Redirect URI in Discord app settings matches: `https://tfsbackend.bwmp.dev/api/auth/callback`
- Discord Client ID and Secret are correct in `backend/appsettings.json`

## Quick Test

Test the OAuth URL directly in your browser:
```
https://tfsbackend.bwmp.dev/api/auth/discord
```

Should redirect you to Discord OAuth consent screen.

If it doesn't work, check backend logs for errors.
