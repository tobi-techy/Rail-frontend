/**
 * Session Engagement Tracker
 *
 * Tracks DAU/MAU signals, return visits, and feature stickiness
 * for PostHog churn analysis and retention dashboards.
 *
 * Based on PostHog tutorials:
 * - Churn rate: lifecycle charts need daily/weekly/monthly active signals
 * - Feature retention: stickiness charts need per-feature usage counts
 * - Power users: need frequency thresholds to define cohorts
 * - DAU/MAU: need daily active user events
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalytics } from '@/utils/analytics';

const LAST_SESSION_KEY = '@rail_last_session_at';
const SESSION_COUNT_KEY = '@rail_session_count_7d';
const SESSION_COUNT_30D_KEY = '@rail_session_count_30d';
const FEATURE_USE_PREFIX = '@rail_feature_use_';
const WEEK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Fires once per app open to track session-level engagement signals.
 * Call in the root layout after auth is confirmed.
 */
export function useSessionEngagement() {
  const { track, setUserProperties } = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    (async () => {
      try {
        const now = Date.now();
        const nowIso = new Date().toISOString();

        // ── DAU signal ───────────────────────────────────
        track('app_session_started', {
          platform: require('react-native').Platform.OS,
          timestamp: nowIso,
        });

        // ── Return visit detection ───────────────────────
        const lastSessionStr = await AsyncStorage.getItem(LAST_SESSION_KEY);
        if (lastSessionStr) {
          const lastSession = parseInt(lastSessionStr, 10);
          const gapMs = now - lastSession;

          if (gapMs >= WEEK_WINDOW_MS) {
            // Returned after 7+ day gap → churn risk recovery
            track('return_visit', {
              gap_days: Math.round(gapMs / (24 * 60 * 60 * 1000)),
              was_dormant: gapMs >= 30 * 24 * 60 * 60 * 1000,
            });
          }
        }

        // ── Session frequency (rolling 7d / 30d) ─────────
        const raw7d = await AsyncStorage.getItem(SESSION_COUNT_KEY);
        const raw30d = await AsyncStorage.getItem(SESSION_COUNT_30D_KEY);
        const parsed7d = raw7d
          ? (JSON.parse(raw7d) as { count: number; windowStart: number })
          : null;
        const parsed30d = raw30d
          ? (JSON.parse(raw30d) as { count: number; windowStart: number })
          : null;

        const count7d =
          parsed7d && now - parsed7d.windowStart < WEEK_WINDOW_MS ? parsed7d.count + 1 : 1;
        const count30d =
          parsed30d && now - parsed30d.windowStart < MONTH_WINDOW_MS ? parsed30d.count + 1 : 1;

        const window7d =
          parsed7d && now - parsed7d.windowStart < WEEK_WINDOW_MS ? parsed7d.windowStart : now;
        const window30d =
          parsed30d && now - parsed30d.windowStart < MONTH_WINDOW_MS ? parsed30d.windowStart : now;

        await AsyncStorage.setItem(
          SESSION_COUNT_KEY,
          JSON.stringify({ count: count7d, windowStart: window7d })
        );
        await AsyncStorage.setItem(
          SESSION_COUNT_30D_KEY,
          JSON.stringify({ count: count30d, windowStart: window30d })
        );
        await AsyncStorage.setItem(LAST_SESSION_KEY, now.toString());

        // ── Weekly / monthly active signals ──────────────
        if (count7d >= 3) {
          track('weekly_active', { sessions_in_7d: count7d });
        }
        if (count30d >= 5) {
          track('monthly_active', { sessions_in_30d: count30d });
        }

        // ── Set person properties for cohort building ────
        setUserProperties({
          sessions_last_7d: count7d,
          sessions_last_30d: count30d,
          last_session_at: nowIso,
          dau_mau_ratio: count30d > 0 ? Math.round((count7d / 7 / (count30d / 30)) * 100) : 0,
        });
      } catch {
        // Storage failures should never block the app
      }
    })();
  }, [track, setUserProperties]);
}

/**
 * Track feature usage for stickiness analysis.
 * Call this whenever a user interacts with a key feature.
 *
 * Features are counted per rolling 7-day window.
 * After 3+ uses, the user qualifies as a "repeat user" of that feature,
 * which PostHog can use for stickiness charts and power user cohorts.
 */
export async function trackFeatureUse(
  track: (event: string, props?: Record<string, any>) => void,
  featureName: string
): Promise<void> {
  try {
    const now = Date.now();
    const key = `${FEATURE_USE_PREFIX}${featureName}`;
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as { count: number; windowStart: number }) : null;

    const count = parsed && now - parsed.windowStart < WEEK_WINDOW_MS ? parsed.count + 1 : 1;
    const windowStart =
      parsed && now - parsed.windowStart < WEEK_WINDOW_MS ? parsed.windowStart : now;

    await AsyncStorage.setItem(key, JSON.stringify({ count, windowStart }));

    // Always track the usage event
    track('feature_used', {
      feature_name: featureName,
      use_count: count,
      is_first_use: count === 1,
    });

    // Fire repeat-use signal at thresholds
    if (count === 3) {
      track('feature_repeat_use', {
        feature_name: featureName,
        use_count: count,
      });
    }
  } catch {
    // Storage failures should never block the app
  }
}
