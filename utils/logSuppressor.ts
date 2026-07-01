/**
 * Log suppression utility to reduce console noise in development
 */

const SUPPRESS_WARNINGS = process.env.EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS === 'true';

// Original console methods
const originalConsole = {
  warn: console.warn,
  log: console.log,
  debug: console.debug,
};

// Patterns to suppress
const SUPPRESSED_PATTERNS = [
  // Require cycle warnings
  /Require cycle:/i,
  // Layout children warnings (missing routes)
  /\[Layout children\].*No route named/i,
  // Sentry integration logs
  /Sentry Logger.*Integration installed/i,
  // InteractionManager deprecation
  /InteractionManager has been deprecated/i,
  // Module resolution warnings (when fallback succeeds)
  /Attempted to import the module.*which is.*listed in the "exports"/i,
  /which is not listed in the "exports".*Falling back to file-based resolution/i,
];

function shouldSuppress(message: string): boolean {
  if (!SUPPRESS_WARNINGS) return false;
  return SUPPRESSED_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Install log suppressor. Call once at app startup (before any other logging).
 */
export function installLogSuppressor() {
  if (!SUPPRESS_WARNINGS) return;

  // Suppress console.warn
  console.warn = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (!shouldSuppress(message)) {
      originalConsole.warn(...args);
    }
  };

  // Suppress console.log for known patterns
  console.log = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (!shouldSuppress(message)) {
      originalConsole.log(...args);
    }
  };

  // Keep DEBUG logs controlled by LOG_LEVEL
  const logLevel = process.env.LOG_LEVEL || 'info';
  if (logLevel === 'warn' || logLevel === 'error') {
    console.debug = () => {}; // Suppress DEBUG logs
  }
}

/**
 * Restore original console methods (for testing/debugging)
 */
export function restoreConsole() {
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
  console.debug = originalConsole.debug;
}
