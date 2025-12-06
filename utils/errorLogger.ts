import { Sentry } from '../lib/sentry';
import { sanitizeObject } from './logSanitizer';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  logError(error: Error | unknown, context?: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logData = {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (__DEV__) {
      console.error('[ErrorLogger]', sanitizeObject(logData));
    }

    // Send to Sentry in production
    if (!__DEV__ && error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          component: context?.component,
          action: context?.action,
        },
        extra: context?.metadata,
      });
    }
  }

  logApiError(error: any, endpoint: string, method: string): void {
    this.logError(error, {
      component: 'API',
      action: `${method} ${endpoint}`,
      metadata: {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorCode: error?.error?.code,
      },
    });
  }

  logAuthError(error: any, action: string): void {
    this.logError(error, {
      component: 'Auth',
      action,
      metadata: { errorCode: error?.error?.code },
    });
  }

  logWalletError(error: any, action: string): void {
    this.logError(error, {
      component: 'Wallet',
      action,
      metadata: { errorCode: error?.error?.code },
    });
  }

  logNavigationError(error: any, route: string): void {
    this.logError(error, {
      component: 'Navigation',
      action: `Navigate to ${route}`,
    });
  }
}

export const errorLogger = new ErrorLogger();
