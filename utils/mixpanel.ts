/**
 * Mixpanel Analytics Utility
 * Dual-tracking alongside PostHog for product analytics
 */

import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';
import { logger } from '@/lib/logger';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

let mixpanel: Mixpanel | null = null;

/**
 * Initialize Mixpanel. Call once at app startup.
 */
export async function initMixpanel(): Promise<void> {
  if (!MIXPANEL_TOKEN) {
    if (__DEV__) logger.warn('[Mixpanel] No token set, analytics disabled');
    return;
  }
  try {
    mixpanel = new Mixpanel(MIXPANEL_TOKEN, true);
    await mixpanel.init();
    mixpanel.registerSuperProperties({ platform: Platform.OS });
    if (__DEV__) logger.debug('[Mixpanel] Initialized');
  } catch (error) {
    logger.error('[Mixpanel] Init failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track an event in Mixpanel.
 */
export function mpTrack(event: string, properties?: Record<string, any>): void {
  if (!mixpanel) return;
  try {
    mixpanel.track(event, properties);
    if (__DEV__) logger.debug(`[Mixpanel] ${event}`, properties);
  } catch (error) {
    logger.error('[Mixpanel] Track failed', { event, error });
  }
}

/**
 * Identify a user in Mixpanel.
 */
export function mpIdentify(userId: string): void {
  if (!mixpanel) return;
  try {
    mixpanel.identify(userId);
  } catch (error) {
    logger.error('[Mixpanel] Identify failed', { userId, error });
  }
}

/**
 * Set user profile properties.
 */
export function mpSetProfile(properties: Record<string, any>): void {
  if (!mixpanel) return;
  try {
    mixpanel.getPeople().set(properties);
  } catch (error) {
    logger.error('[Mixpanel] Set profile failed', { error });
  }
}

/**
 * Increment a numeric profile property.
 */
export function mpIncrement(property: string, value: number = 1): void {
  if (!mixpanel) return;
  try {
    mixpanel.getPeople().increment(property, value);
  } catch (error) {
    logger.error('[Mixpanel] Increment failed', { property, error });
  }
}

/**
 * Track revenue on user profile.
 */
export function mpTrackRevenue(amount: number, properties?: Record<string, any>): void {
  if (!mixpanel) return;
  try {
    mixpanel.getPeople().trackCharge(amount, properties ?? {});
  } catch (error) {
    logger.error('[Mixpanel] Revenue failed', { amount, error });
  }
}

/**
 * Set a super property (sent with every event).
 */
export function mpSetSuperProperties(properties: Record<string, any>): void {
  if (!mixpanel) return;
  try {
    mixpanel.registerSuperProperties(properties);
  } catch (error) {
    logger.error('[Mixpanel] Super properties failed', { error });
  }
}

/**
 * Reset Mixpanel on logout.
 */
export function mpReset(): void {
  if (!mixpanel) return;
  try {
    mixpanel.reset();
  } catch (error) {
    logger.error('[Mixpanel] Reset failed', { error });
  }
}

/**
 * Start timing an event (call mpTrack with same name to record duration).
 */
export function mpTimeEvent(event: string): void {
  if (!mixpanel) return;
  try {
    mixpanel.timeEvent(event);
  } catch (error) {
    logger.error('[Mixpanel] Time event failed', { event, error });
  }
}
