import { Sentry } from './sentry';
import { sanitizeObject, sanitizeForLog } from '@/utils/logSanitizer';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

const isProduction = !__DEV__;

function shouldSendToSentry(level: LogLevel): boolean {
  return isProduction && (level === 'error' || level === 'warn');
}

function log(level: LogLevel, message: string, context?: LogContext | Error) {
  const sanitizedMessage = sanitizeForLog(message);

  // Dev: log to console
  if (__DEV__) {
    const data =
      context instanceof Error
        ? { error: context.message, stack: context.stack }
        : context
          ? sanitizeObject(context)
          : undefined;

    console[level](sanitizedMessage, data ?? '');
    return;
  }

  // Production: send to Sentry
  if (shouldSendToSentry(level)) {
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
    Sentry.captureException(error, {
      tags: { component: context?.component, action: context?.action },
      extra: context ? sanitizeObject(context) : undefined,
    });
  },
};

/** Initialize global error handlers - call once at app startup */
export function initGlobalErrorHandlers() {
  if (isProduction) {
    // Unhandled promise rejections
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      Sentry.captureException(error, {
        tags: { fatal: String(isFatal), handler: 'global' },
      });
      originalHandler?.(error, isFatal);
    });
  }
}
