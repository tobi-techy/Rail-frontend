import { Sentry, isSentryInitialized } from './sentry';
import { sanitizeObject, sanitizeForLog } from '@/utils/logSanitizer';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

const isProduction = !__DEV__;
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function shouldSendToSentry(level: LogLevel): boolean {
  return isProduction && isSentryInitialized() && (level === 'error' || level === 'warn');
}

function log(level: LogLevel, message: string, context?: LogContext | Error) {
  // Check if this log level should be output
  if (!shouldLog(level)) {
    return;
  }

  const sanitizedMessage = sanitizeForLog(message);

  // Dev: log to console
  if (__DEV__) {
    let data;
    if (context instanceof Error) {
      // SECURITY: Sanitize stack traces to prevent path/internal info leakage
      const sanitizedStack = context.stack
        ? context.stack
            .split('\n')
            .map((line) => {
              // Remove absolute file paths, keep only filename
              return line.replace(/\/.*\//g, '').replace(/\\.*\\/g, '');
            })
            .join('\n')
        : undefined;
      data = { error: context.message, stack: sanitizedStack };
    } else {
      data = context ? sanitizeObject(context) : undefined;
    }

    console[level](sanitizedMessage, data ? JSON.stringify(data, null, 2) : '');
    return;
  }

  // Production: send to Sentry (only if initialized)
  if (shouldSendToSentry(level)) {
    try {
      if (context instanceof Error) {
        Sentry.captureException(context, {
          tags: { level },
          extra: { message: sanitizedMessage },
        });
      } else {
        Sentry.captureMessage(sanitizedMessage, {
          level: level === 'error' ? 'error' : 'warning',
          tags: { component: context?.component, action: context?.action },
          extra: context ? sanitizeObject(context) : undefined,
        });
      }
    } catch (sentryError) {
      // Silently ignore Sentry errors to prevent cascading failures

      console.error('[Logger] Sentry capture failed:', sentryError);
    }
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, errorOrContext?: Error | LogContext) =>
    log('error', message, errorOrContext),

  /** Capture exception directly to Sentry */
  captureException: (error: Error, context?: LogContext) => {
    if (__DEV__) {
      console.error('[Exception]', error.message, context ?? '');
      return;
    }
    if (!isSentryInitialized()) {
      console.error('[Exception]', error.message, context ?? '');
      return;
    }
    try {
      Sentry.captureException(error, {
        tags: { component: context?.component, action: context?.action },
        extra: context ? sanitizeObject(context) : undefined,
      });
    } catch (sentryError) {
      console.error('[Logger] captureException failed:', sentryError);
    }
  },
};

/** Initialize global error handlers - call once at app startup */
export function initGlobalErrorHandlers() {
  if (isProduction) {
    // Unhandled promise rejections
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        if (isSentryInitialized()) {
          Sentry.captureException(error, {
            tags: { fatal: String(isFatal), handler: 'global' },
          });
        }
      } catch (sentryError) {
        console.error('[Logger] Global error handler Sentry capture failed:', sentryError);
      }
      originalHandler?.(error, isFatal);
    });
  }
}
