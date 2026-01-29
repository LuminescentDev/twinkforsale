# Frontend Logging with Loki

This frontend now has **Winston + Loki** integration for centralized logging, matching the backend's Serilog setup.

## Setup

### 1. Environment Configuration

Add to your `.env` file:

```env
# Grafana Loki URL (optional)
# If not set or set to "disabled", only console logging will be used
LOKI_URL="http://localhost:3100"

# Or for Docker:
# LOKI_URL="http://loki:3100"
```

### 2. Docker Compose (Optional)

If you want to run Loki locally with Docker:

```yaml
# Add to docker/docker-compose.yml
loki:
  image: grafana/loki:2.9.0
  ports:
    - "3100:3100"
  command: -config.file=/etc/loki/local-config.yaml
  volumes:
    - loki_data:/loki

grafana:
  image: grafana/grafana:10.0.0
  ports:
    - "3001:3000"
  environment:
    - GF_AUTH_ANONYMOUS_ENABLED=true
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
  volumes:
    - grafana_data:/var/lib/grafana
```

Then add volumes:
```yaml
volumes:
  loki_data:
  grafana_data:
```

## Usage

### Automatic HTTP Request Logging

All HTTP requests are automatically logged via the `plugin@logging.ts` middleware. No code changes needed!

Example log output:
```
2024-01-20 10:30:45 [info]: → GET /dashboard
2024-01-20 10:30:45 [info]: ← GET /dashboard 200 (45ms)
```

### Manual Logging

Import the logger anywhere in your server-side code:

```typescript
import logger from '~/lib/logger';

// Basic logging
logger.info('User logged in successfully');
logger.warn('Rate limit approaching');
logger.error('Database connection failed');
logger.debug('Cache hit for key: user:123');

// Structured logging with metadata
logger.info('File uploaded', {
  userId: '123',
  fileName: 'image.png',
  fileSize: 1024000,
  mimeType: 'image/png',
});

// Error logging with stack traces
try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : String(error),
    context: { userId, operation: 'upload' },
  });
}
```

### Helper Functions

The logger provides several helper functions for common logging scenarios:

#### 1. Log Errors

```typescript
import { logError } from '~/lib/logger';

try {
  await riskyOperation();
} catch (error) {
  logError(error, 'Failed to process upload', {
    userId: user.id,
    fileName: file.name,
  });
}
```

#### 2. Log User Actions

```typescript
import { logUserAction } from '~/lib/logger';

logUserAction(user.id, 'created_api_key', {
  keyName: 'ShareX API Key',
  expiresAt: '2024-12-31',
});

logUserAction(user.id, 'deleted_upload', {
  uploadId: upload.id,
  fileName: upload.fileName,
});
```

#### 3. Log API Calls

```typescript
import { logApiCall } from '~/lib/logger';

const startTime = Date.now();
const response = await fetch(backendUrl);
const duration = Date.now() - startTime;

logApiCall('/api/uploads', 'POST', response.status, duration, {
  userId: user.id,
  fileSize: formData.get('file')?.size,
});
```

## Log Levels

- **error**: System errors, failed operations, exceptions
- **warn**: Warning conditions, deprecated usage, soft errors
- **info**: General application flow, user actions (default)
- **debug**: Detailed diagnostic information

In production, only `info` and above are logged.  
In development, all levels including `debug` are logged.

## Querying Logs in Grafana

### 1. Access Grafana

Navigate to `http://localhost:3001` (or your Grafana URL)

### 2. Add Loki Data Source

1. Go to Configuration → Data Sources
2. Add Loki with URL: `http://loki:3100`
3. Save & Test

### 3. Explore Logs

Use LogQL queries:

```logql
// All frontend logs
{app="twinkforsale-frontend"}

// Only errors
{app="twinkforsale-frontend"} |= "level=error"

// Logs from specific user
{app="twinkforsale-frontend"} | json | userId="123"

// Slow requests (> 1 second)
{app="twinkforsale-frontend"} | json | duration > 1000

// Filter by environment
{app="twinkforsale-frontend", env="production"}

// Search for specific text
{app="twinkforsale-frontend"} |= "upload failed"

// Logs from last 5 minutes
{app="twinkforsale-frontend"} [5m]
```

### 4. Create Dashboards

Example panels:

**Request Rate:**
```logql
sum(rate({app="twinkforsale-frontend"}[5m])) by (level)
```

**Error Rate:**
```logql
sum(rate({app="twinkforsale-frontend"} |= "level=error" [5m]))
```

**P95 Response Time:**
```logql
quantile_over_time(0.95, {app="twinkforsale-frontend"} | json | unwrap duration [5m])
```

**Top Error Messages:**
```logql
topk(10, 
  count_over_time({app="twinkforsale-frontend"} |= "level=error" [1h])
)
```

## Labels

All logs include these labels:

- `app`: "twinkforsale-frontend"
- `env`: "development" | "production"
- `service`: "frontend"
- `level`: "info" | "warn" | "error" | "debug"

Additional metadata in log messages:
- `userId`: User ID (when authenticated)
- `userEmail`: User email (when authenticated)
- `method`: HTTP method
- `path`: Request path
- `statusCode`: HTTP status code
- `duration`: Request duration in milliseconds
- `error`: Error details with stack trace

## Performance

- **Batching**: Logs are sent to Loki in batches every 5 seconds
- **Async**: Non-blocking log writes
- **Conditional**: Loki transport only active if `LOKI_URL` is set
- **Fallback**: Always logs to console even if Loki is unavailable

## Troubleshooting

### Logs not appearing in Loki

1. Check Loki is running: `curl http://localhost:3100/ready`
2. Check environment variable: `echo $LOKI_URL`
3. Check console for connection errors
4. Verify network connectivity from frontend container to Loki

### Console shows Loki connection errors

```
Loki connection error: ECONNREFUSED
```

**Solution**: 
- Loki might not be running
- Check `LOKI_URL` is correct
- In Docker, use service name: `http://loki:3100`
- Locally, use: `http://localhost:3100`

### Want to disable Loki temporarily

Set in `.env`:
```env
LOKI_URL="disabled"
```

Or just remove/comment out the `LOKI_URL` variable.

## Integration with Backend Logs

Your frontend logs will appear alongside backend logs in Grafana:

```logql
// All logs from both frontend and backend
{app=~"twinkforsale.*"}

// Compare error rates
sum(rate({app=~"twinkforsale.*"} |= "level=error" [5m])) by (app)

// Trace a request across services
{app=~"twinkforsale.*"} | json | userId="123" | line_format "{{.app}}: {{.message}}"
```

## Best Practices

1. **Use appropriate log levels**
   - `error`: Actual errors that need attention
   - `warn`: Things that might become problems
   - `info`: Important state changes, user actions
   - `debug`: Detailed diagnostics (filtered out in production)

2. **Add context with metadata**
   ```typescript
   // Good
   logger.info('Upload completed', { userId, fileName, fileSize });
   
   // Bad
   logger.info('Upload completed');
   ```

3. **Don't log sensitive data**
   ```typescript
   // Bad - logs password
   logger.info('User login', { username, password });
   
   // Good - no sensitive data
   logger.info('User login', { userId, username });
   ```

4. **Use structured logging**
   ```typescript
   // Good - structured, queryable
   logger.info('API call failed', {
     endpoint: '/api/upload',
     statusCode: 500,
     duration: 1200,
   });
   
   // Bad - unstructured
   logger.info(`API call to /api/upload failed with 500 after 1200ms`);
   ```

## Example: Monitoring File Uploads

```typescript
// In your upload handler
import logger, { logUserAction, logError } from '~/lib/logger';

export const onPost: RequestHandler = async ({ request, env }) => {
  const startTime = Date.now();
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  logger.info('Upload started', {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });

  try {
    // ... upload logic ...
    
    const duration = Date.now() - startTime;
    logUserAction(userId, 'uploaded_file', {
      fileName: file.name,
      fileSize: file.size,
      duration,
    });
    
    logger.info('Upload completed', {
      fileName: file.name,
      shortCode: result.shortCode,
      duration,
    });
  } catch (error) {
    logError(error, 'Upload failed', {
      fileName: file.name,
      fileSize: file.size,
    });
    throw error;
  }
};
```

Then query in Grafana:
```logql
// All uploads
{app="twinkforsale-frontend"} |= "uploaded_file"

// Failed uploads
{app="twinkforsale-frontend"} |= "Upload failed"

// Slow uploads (> 5 seconds)
{app="twinkforsale-frontend"} |= "Upload completed" | json | duration > 5000
```

---

Now your frontend logs are centralized in Loki alongside your backend logs! 🎉
