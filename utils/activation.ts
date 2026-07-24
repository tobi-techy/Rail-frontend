/**
 * Activation Metric Tracker
 *
 * Tracks the "activation moment" for Rail — the set of actions that predict
 * long-term retention. Based on PostHog's activation metric methodology:
 *
 * 1. Define candidate activation events (deposit, card use, stash, auto-invest)
 * 2. Test which combination predicts 3-month retention
 * 3. Track when users complete the activation sequence
 *
 * For Rail, the activation hypothesis is:
 *   "User who completes first deposit + first card transaction within 14 days
 *    are significantly more likely to be active 3 months later."
 *
 * Events tracked:
 *   - activation_step_completed: each step in the activation funnel
 *   - activation_achieved: all steps complete within the window
 *   - activation_window_expired: user didn't activate in time
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/logger';

const ACTIVATION_KEY = '@rail_activation_state';
const ACTIVATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface ActivationState {
  signupAt: string;
  firstDepositAt: string | null;
  firstCardTransactionAt: string | null;
  firstStashTransferAt: string | null;
  firstAutoInvestAt: string | null;
  activatedAt: string | null;
}

const STEPS = [
  'first_deposit',
  'first_card_transaction',
  'first_stash_transfer',
  'first_auto_invest',
] as const;

/**
 * Get the current activation state for the user.
 */
export async function getActivationState(): Promise<ActivationState | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Initialize activation tracking when a new user signs up.
 */
export async function initActivationTracking(signupAt: string): Promise<void> {
  try {
    const state: ActivationState = {
      signupAt,
      firstDepositAt: null,
      firstCardTransactionAt: null,
      firstStashTransferAt: null,
      firstAutoInvestAt: null,
      activatedAt: null,
    };
    await AsyncStorage.setItem(ACTIVATION_KEY, JSON.stringify(state));
  } catch {
    // Storage failure should never block signup
  }
}

/**
 * Record an activation step and check if the user has fully activated.
 * Returns true if this step completed the activation sequence.
 */
export async function recordActivationStep(
  step: (typeof STEPS)[number],
  track: (event: string, props?: Record<string, any>) => void,
  setUserProperties?: (props: Record<string, any>) => void
): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVATION_KEY);
    if (!raw) return false;

    const state: ActivationState = JSON.parse(raw);
    if (state.activatedAt) return false; // already activated

    const now = new Date().toISOString();
    const stepKey = `${step}At` as keyof ActivationState;
    if (state[stepKey]) return false; // already completed this step

    (state as any)[stepKey] = now;
    await AsyncStorage.setItem(ACTIVATION_KEY, JSON.stringify(state));

    // Track the step completion
    const completedSteps = STEPS.filter((s) => {
      const key = `${s}At` as keyof ActivationState;
      return state[key] !== null;
    });

    track('activation_step_completed', {
      step,
      steps_completed: completedSteps.length,
      steps_total: STEPS.length,
      all_steps: completedSteps,
    });

    // Check if all steps are complete
    if (completedSteps.length === STEPS.length) {
      const signupTime = new Date(state.signupAt).getTime();
      const nowTime = Date.now();
      const daysToActivate = Math.round((nowTime - signupTime) / (24 * 60 * 60 * 1000));

      // Check if within activation window
      if (nowTime - signupTime <= ACTIVATION_WINDOW_MS) {
        state.activatedAt = now;
        await AsyncStorage.setItem(ACTIVATION_KEY, JSON.stringify(state));

        track('activation_achieved', {
          days_to_activate: daysToActivate,
          steps_completed: completedSteps,
          within_window: true,
        });

        setUserProperties?.({
          lifecycle_stage: 'activated',
          activated_at: now,
          days_to_activate: daysToActivate,
        });

        logger.info('[Activation] User activated', {
          daysToActivate,
          steps: completedSteps,
        });
        return true;
      } else {
        track('activation_achieved', {
          days_to_activate: daysToActivate,
          steps_completed: completedSteps,
          within_window: false,
        });
        return false;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if activation window has expired for a user.
 * Call this periodically (e.g., on app open after 14 days).
 */
export async function checkActivationWindow(
  track: (event: string, props?: Record<string, any>) => void
): Promise<void> {
  try {
    const state = await getActivationState();
    if (!state || state.activatedAt) return;

    const signupTime = new Date(state.signupAt).getTime();
    if (Date.now() - signupTime > ACTIVATION_WINDOW_MS) {
      const completedSteps = STEPS.filter((s) => {
        const key = `${s}At` as keyof ActivationState;
        return state[key] !== null;
      });

      track('activation_window_expired', {
        days_since_signup: Math.round((Date.now() - signupTime) / (24 * 60 * 60 * 1000)),
        steps_completed: completedSteps.length,
        steps_total: STEPS.length,
      });
    }
  } catch {
    // Non-critical
  }
}
