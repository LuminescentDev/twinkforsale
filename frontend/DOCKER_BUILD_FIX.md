# Docker Build Hanging Fix

## Problem

The Docker build was getting stuck after the Qwik build completed successfully, hanging on the message:
```
Note: Make sure that you are serving the built files with proper cache headers.
```

## Root Cause

The **Winston Loki logger** (`src/lib/logger.ts`) was being initialized during the build process when modules were being bundled. The Loki transport was attempting to connect to a Loki server that doesn't exist during Docker build time, causing it to hang indefinitely.

### Why This Happened:

1. `logger.ts` creates a Winston logger with Loki transport at module import time
2. During `pnpm run build.server`, Vite processes all SSR modules
3. When the logger module is imported, it tries to initialize the Loki transport
4. The Loki transport attempts to establish a connection
5. No Loki server exists during build → connection hangs → build hangs

## Solution

### 1. Skip Loki During Build Time

**File**: `frontend/src/lib/logger.ts`

Added build-time detection:
```typescript
const isBuild = process.env.npm_lifecycle_event?.includes('build') || 
                process.env.VITE_BUILD === 'true';
```

Modified Loki transport initialization:
```typescript
// Add Loki transport if URL is configured and NOT during build
if (lokiUrl && lokiUrl !== 'disabled' && !isBuild) {
  try {
    transports.push(new LokiTransport({
      // ... config
      timeout: 3000, // 3 second timeout
    }));
  } catch (err) {
    console.warn('Failed to initialize Loki transport:', err);
  }
} else if (isBuild) {
  console.log('[Logger] Skipping Loki transport during build');
}
```

**Key Changes:**
- ✅ Check `isBuild` flag before initializing Loki
- ✅ Wrap in try-catch for safety
- ✅ Add timeout to prevent infinite hangs
- ✅ Log message when skipping during build

### 2. Set Build Environment Variable

**File**: `frontend/Dockerfile`

Added explicit build flag:
```dockerfile
# Build the application
ENV VITE_BUILD=true
RUN pnpm run deploy && echo "✅ Build completed successfully"
```

This ensures the logger knows it's running during a build.

### 3. Improved Dockerfile

Also made other improvements:
- Better layer caching (copy package files first)
- Progress indicators with `echo` statements
- Frozen lockfile for consistency
- Explicit port exposure

## Testing

Rebuild the Docker image:

```bash
cd frontend
docker build -t twinkforsale-frontend . --progress=plain --no-cache
```

You should now see:
```
[Logger] Skipping Loki transport during build
✓ built in 9.28s
✅ Build completed successfully
✅ Entrypoint configured
```

And the build should complete in under 2 minutes instead of hanging.

## Runtime Behavior

- **During Build**: Loki transport is skipped, only console logging
- **During Runtime**: Loki transport is initialized and logs are sent to Loki (if `LOKI_URL` is set)

## Prevention

To prevent similar issues in the future:

1. **Lazy initialization**: Initialize expensive resources (network connections, etc.) lazily, not at module import time
2. **Build detection**: Always check if code is running during build vs runtime
3. **Timeouts**: Always set timeouts on network operations
4. **Error handling**: Wrap initialization in try-catch blocks

## Related Files

- ✅ `frontend/src/lib/logger.ts` - Added build detection
- ✅ `frontend/Dockerfile` - Added `VITE_BUILD` env var
- ✅ `frontend/src/routes/plugin@logging.ts` - Uses the logger (no changes needed)
- ✅ `frontend/src/middleware/logging.ts` - Uses the logger (no changes needed)

## Verification

After rebuilding, verify Loki still works at runtime:

1. Start the container
2. Check logs: `docker logs twinkforsale-frontend`
3. Verify Loki receives logs: `curl 'http://localhost:3100/loki/api/v1/query?query={app="twinkforsale-frontend"}&limit=10'`
