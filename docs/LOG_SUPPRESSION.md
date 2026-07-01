# Log Suppression Configuration

This document explains the log suppression system implemented to reduce console noise during development.

## Quick Toggle

Set in `.env`:

```bash
# Enable log suppression (reduces console noise)
EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS=true

# Set minimum log level (debug | info | warn | error)
LOG_LEVEL=warn
```

## What Gets Suppressed

### 1. Console Warnings (`console.warn`)

- **Require cycle warnings**: Circular dependency notifications (e.g., `api/client.ts -> stores/authStore.ts -> ...`)
- **Layout warnings**: Missing route warnings (e.g., "No route named 'ai-chat' exists")
- **Module resolution warnings**: When fallback resolution succeeds
- **InteractionManager deprecation**: React Native deprecation notices

### 2. Sentry Logs

- **Integration installation logs**: "Integration installed: X" messages
- **Debug logs**: Sentry internal debug output
- **Tracing in dev**: Performance tracing disabled in development

### 3. Metro Bundler

- **Progress updates**: Bundle progress bars and percentage logs (when `EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS=true`)

### 4. Custom Logger (via `LOG_LEVEL`)

- **DEBUG logs**: Suppressed when `LOG_LEVEL=warn` or `LOG_LEVEL=error`
- **INFO logs**: Suppressed when `LOG_LEVEL=warn` or `LOG_LEVEL=error`
- **WARN logs**: Suppressed when `LOG_LEVEL=error`

## Files Modified

1. **`.env`**: Added `EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS` and updated `LOG_LEVEL`
2. **`utils/logSuppressor.ts`**: New utility that wraps `console.warn` and `console.log`
3. **`app/_layout.tsx`**: Calls `installLogSuppressor()` at app startup
4. **`lib/sentry.ts`**: Disabled debug logging and dev tracing
5. **`lib/logger.ts`**: Added `LOG_LEVEL` filtering
6. **`metro.config.js`**: Suppresses bundler progress when flag is set

## Usage

### Enable Suppression (Default)

```bash
EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS=true
LOG_LEVEL=warn
```

### Disable Suppression (Full Logs)

```bash
EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS=false
LOG_LEVEL=debug
```

### Restore Original Console (for Debugging)

```typescript
import { restoreConsole } from '@/utils/logSuppressor';

// Temporarily restore all logs
restoreConsole();
```

## Log Levels

| Level   | Shows                    |
| ------- | ------------------------ |
| `debug` | DEBUG, INFO, WARN, ERROR |
| `info`  | INFO, WARN, ERROR        |
| `warn`  | WARN, ERROR              |
| `error` | ERROR only               |

## Patterns Suppressed

The following regex patterns are filtered:

```typescript
const SUPPRESSED_PATTERNS = [
  /Require cycle:/i,
  /\[Layout children\].*No route named/i,
  /Sentry Logger.*Integration installed/i,
  /InteractionManager has been deprecated/i,
  /Attempted to import the module.*which is.*listed in the "exports"/i,
  /which is not listed in the "exports".*Falling back to file-based resolution/i,
];
```

## Important Notes

1. **Error logs are never suppressed**: `console.error()` always outputs
2. **Production unaffected**: Suppression only applies in `__DEV__` mode
3. **Sentry still captures**: Errors still go to Sentry in production
4. **No data loss**: Suppressed logs are simply not printed; app behavior unchanged

## Troubleshooting

### "I need to see require cycle warnings"

```bash
EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS=false
```

### "I want all debug logs back"

```bash
LOG_LEVEL=debug
```

### "Metro bundler is too quiet"

```bash
EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS=false
```
