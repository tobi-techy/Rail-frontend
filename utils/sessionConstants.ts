/**
 * Shared session timing constants — single source of truth for authStore + SessionManager
 *
 * SECURITY FIX (M-2): Reduced inactivity and session durations to fintech-appropriate values.
 * Previous: 7-day inactivity, 30-day session — far too long for a financial app.
 */

export const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours (was 7 days)
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (was 30 days)
export const PASSCODE_SESSION_MS = 5 * 60 * 1000; // 5 minutes (was 10 minutes)
export const ACCESS_TOKEN_REFRESH_MS = 55 * 60 * 1000; // 55 minutes (~5 min before 1h expiry)
export const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
export const HEALTH_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const MIN_TIMER_MS = 1000; // 1 second minimum for setTimeout
