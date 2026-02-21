/**
 * Analytics Utility
 * Centralized event tracking for PostHog
 */

import { usePostHog } from 'posthog-react-native';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/logger';

/**
 * Hook to access PostHog analytics
 */
export function useAnalytics() {
  const posthog = usePostHog();
  const user = useAuthStore((s) => s.user);

  return {
    /**
     * Track a custom event
     */
    track: (eventName: string, properties?: Record<string, any>) => {
      try {
        posthog?.capture(eventName, properties);
        if (__DEV__) {
          logger.debug(`[Analytics] Event tracked: ${eventName}`, properties);
        }
      } catch (error) {
        logger.error('[Analytics] Failed to track event', {
          component: 'Analytics',
          action: 'track-event-failed',
          eventName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    /**
     * Track screen view
     */
    trackScreen: (screenName: string, properties?: Record<string, any>) => {
      try {
        posthog?.screen(screenName, properties);
        if (__DEV__) {
          logger.debug(`[Analytics] Screen viewed: ${screenName}`, properties);
        }
      } catch (error) {
        logger.error('[Analytics] Failed to track screen', {
          component: 'Analytics',
          action: 'track-screen-failed',
          screenName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    /**
     * Identify user
     */
    identify: (userId: string, properties?: Record<string, any>) => {
      try {
        posthog?.identify(userId, properties);
        if (__DEV__) {
          logger.debug(`[Analytics] User identified: ${userId}`, properties);
        }
      } catch (error) {
        logger.error('[Analytics] Failed to identify user', {
          component: 'Analytics',
          action: 'identify-failed',
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    /**
     * Set user properties (traits)
     */
    setUserProperties: (properties: Record<string, any>) => {
      try {
        posthog?.setPersonProperties(properties);
        if (__DEV__) {
          logger.debug('[Analytics] User properties set', properties);
        }
      } catch (error) {
        logger.error('[Analytics] Failed to set user properties', {
          component: 'Analytics',
          action: 'set-properties-failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    /**
     * Get current user ID
     */
    getUserId: () => user?.id || null,
  };
}

// ── Event Names (Constants) ──────────────────────────────

export const ANALYTICS_EVENTS = {
  // Auth Events
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SIGN_IN_STARTED: 'sign_in_started',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  SIGN_OUT: 'sign_out',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_DISABLED: 'biometric_disabled',
  PASSCODE_CREATED: 'passcode_created',

  // Balance & Wallet Events
  BALANCE_VIEWED: 'balance_viewed',
  WALLET_SYNCED: 'wallet_synced',
  TRANSFER_INITIATED: 'transfer_initiated',
  TRANSFER_COMPLETED: 'transfer_completed',
  TRANSFER_FAILED: 'transfer_failed',

  // Funding Events
  DEPOSIT_INITIATED: 'deposit_initiated',
  DEPOSIT_COMPLETED: 'deposit_completed',
  WITHDRAW_INITIATED: 'withdraw_initiated',
  WITHDRAW_COMPLETED: 'withdraw_completed',

  // Allocation Events
  ALLOCATION_ENABLED: 'allocation_enabled',
  ALLOCATION_DISABLED: 'allocation_disabled',
  SPENDING_STASH_VIEWED: 'spending_stash_viewed',
  INVESTMENT_STASH_VIEWED: 'investment_stash_viewed',

  // KYC Events
  KYC_VERIFICATION_STARTED: 'kyc_verification_started',
  KYC_VERIFICATION_COMPLETED: 'kyc_verification_completed',
  KYC_VERIFICATION_FAILED: 'kyc_verification_failed',

  // Navigation Events
  SCREEN_VIEWED: 'screen_viewed',
  BUTTON_PRESSED: 'button_pressed',
  LINK_CLICKED: 'link_clicked',

  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  NETWORK_ERROR: 'network_error',

  // Engagement Events
  HELP_REQUESTED: 'help_requested',
  SETTINGS_OPENED: 'settings_opened',
  TRANSACTION_HISTORY_VIEWED: 'transaction_history_viewed',
} as const;

// ── Property Names (Constants) ──────────────────────────

export const ANALYTICS_PROPERTIES = {
  // User properties
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  ACCOUNT_STATUS: 'account_status',
  ACCOUNT_AGE: 'account_age_days',

  // Transaction properties
  AMOUNT: 'amount',
  CURRENCY: 'currency',
  TRANSACTION_TYPE: 'transaction_type',
  TRANSACTION_ID: 'transaction_id',
  ERROR_CODE: 'error_code',
  ERROR_MESSAGE: 'error_message',

  // Screen/Navigation properties
  SCREEN_NAME: 'screen_name',
  PREVIOUS_SCREEN: 'previous_screen',

  // Feature properties
  FEATURE_NAME: 'feature_name',
  FEATURE_ENABLED: 'feature_enabled',

  // Time properties
  TIMESTAMP: 'timestamp',
  DURATION_MS: 'duration_ms',
} as const;
