/**
 * Shared session timing constants — single source of truth for authStore + SessionManager
 *
 * The auth session is intentionally long-lived. Short-lived access tokens are refreshed
 * in the background, while passcode/biometrics provide the regular local re-auth gate.
 */

export const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const PASSCODE_SESSION_MS = 10 * 60 * 1000; // 10 minutes
export const BACKGROUND_PASSCODE_GRACE_MS = 3 * 60 * 1000; // 3 minutes
export const ACCESS_TOKEN_REFRESH_MS = 55 * 60 * 1000; // 55 minutes (~5 min before 1h expiry)
export const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
export const HEALTH_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const MIN_TIMER_MS = 1000; // 1 second minimum for setTimeout
export const BACKGROUND_LOCK_GRACE_MS = 60 * 1000; // 1 minute grace before locking on background

/** Format a lockout duration (seconds) as "Xm Ys" when >= 60s, "Xs" otherwise. */
export function formatLockoutTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
