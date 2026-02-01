import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const SENTRY_ALLOW_FAILURE = process.env.SENTRY_ALLOW_FAILURE === 'true';

export function initSentry() {
  // Check if Sentry DSN is properly configured
  if (!SENTRY_DSN || SENTRY_DSN.includes('your-sentry-dsn') || SENTRY_DSN.includes('placeholder')) {
    if (__DEV__) {
      console.log('[Sentry] DSN not configured or using placeholder, skipping initialization');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: __DEV__,
      environment: __DEV__ ? 'development' : 'production',
      enableAutoSessionTracking: true,
      tracesSampleRate: __DEV__ ? 1.0 : 0.1, // Lower sample rate in production
      maxBreadcrumbs: 50, // Limit breadcrumbs to reduce memory usage
      beforeSend(event) {
        // Don't send events in development unless explicitly enabled
        if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV) {
          return null;
        }

        // Filter out certain errors that might be noise
        if (event.exception) {
          const errorValue = event.exception.values?.[0]?.value;
          if (
            errorValue &&
            (errorValue.includes('Network request failed') ||
              errorValue.includes('Timeout') ||
              errorValue.includes('AbortError'))
          ) {
            return null; // Don't send network errors to Sentry
          }
        }

        return event;
      },
      // Note: onFatalError is not available in this version of Sentry
      // The app will continue even if Sentry fails due to SENTRY_ALLOW_FAILURE
    });

    if (__DEV__) {
      console.log('[Sentry] Successfully initialized');
    }
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
    // Don't crash the app if Sentry fails to initialize
    if (!SENTRY_ALLOW_FAILURE) {
      throw error;
    }
  }
}

export { Sentry };
