import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let sentryInitialized = false;

export function initSentry() {
  if (sentryInitialized) {
    return;
  }

  if (!SENTRY_DSN || SENTRY_DSN.includes('your-sentry-dsn') || SENTRY_DSN.includes('placeholder')) {
    sentryInitialized = true;
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: false, // Disable debug logging even in dev to reduce noise
      environment: __DEV__ ? 'development' : 'production',
      enableAutoSessionTracking: true,
      tracesSampleRate: __DEV__ ? 0 : 0.1, // No tracing in dev
      maxBreadcrumbs: 50,
      beforeSend(event) {
        if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV) {
          return null;
        }

        if (event.exception) {
          const errorValue = event.exception.values?.[0]?.value;
          if (
            errorValue &&
            (errorValue.includes('Network request failed') ||
              errorValue.includes('Timeout') ||
              errorValue.includes('AbortError'))
          ) {
            return null;
          }
        }

        return event;
      },
      integrations: (integrations) => {
        // Reduce console spam from integration installation logs
        return integrations.map((integration) => {
          // Disable verbose logging from integrations
          if ('_options' in integration && typeof integration._options === 'object') {
            (integration._options as Record<string, unknown>).logLevel = 'error';
          }
          return integration;
        });
      },
    });
    sentryInitialized = true;
  } catch (error) {
    sentryInitialized = true; // Mark as initialized even on failure
    if (__DEV__) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }
}

export function isSentryInitialized() {
  return sentryInitialized;
}

export { Sentry };
