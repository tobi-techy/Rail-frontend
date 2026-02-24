import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN || SENTRY_DSN.includes('your-sentry-dsn') || SENTRY_DSN.includes('placeholder')) {
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: __DEV__,
      environment: __DEV__ ? 'development' : 'production',
      enableAutoSessionTracking: true,
      tracesSampleRate: __DEV__ ? 1.0 : 0.1,
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
    });
  } catch (error) {
    if (__DEV__) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }
}

export { Sentry };
