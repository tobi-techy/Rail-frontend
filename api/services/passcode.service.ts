/**
 * Passcode API Service
 * Handles passcode creation, verification, update, and removal
 *
 * SECURITY: Implements rate limiting to prevent brute force attacks
 */

import apiClient from '../client';
import { passcodeRateLimiter } from '../../utils/passcodeRateLimiter';
import { useAuthStore } from '../../stores/authStore';
import { logger } from '../../lib/logger';
import type {
  PasscodeStatus,
  CreatePasscodeRequest,
  CreatePasscodeResponse,
  UpdatePasscodeRequest,
  UpdatePasscodeResponse,
  VerifyPasscodeRequest,
  PasscodeLoginRequest,
  VerifyPasscodeResponse,
  DeletePasscodeRequest,
  DeletePasscodeResponse,
} from '../types';

const PASSCODE_ENDPOINTS = {
  BASE: '/v1/security/passcode',
  VERIFY: '/v1/security/passcode/verify',
  LOGIN: '/v1/auth/passcode-login',
};

export const passcodeService = {
  /**
   * Get passcode status for authenticated user
   * @returns Current passcode status including lock status and failed attempts
   */
  async getStatus(): Promise<PasscodeStatus> {
    return apiClient.get<PasscodeStatus>(PASSCODE_ENDPOINTS.BASE);
  },

  /**
   * Create a new 4-digit passcode
   * Requires passcode and confirmPasscode to match
   * @returns Message and passcode status
   */
  async createPasscode(data: CreatePasscodeRequest): Promise<CreatePasscodeResponse> {
    return apiClient.post<CreatePasscodeResponse>(PASSCODE_ENDPOINTS.BASE, data);
  },

  /**
   * Update existing passcode
   * Requires current passcode verification
   * @returns Message and updated passcode status
   */
  async updatePasscode(data: UpdatePasscodeRequest): Promise<UpdatePasscodeResponse> {
    return apiClient.put<UpdatePasscodeResponse>(PASSCODE_ENDPOINTS.BASE, data);
  },

  /**
   * Verify passcode - dual purpose endpoint
   * 1. Authentication: Returns access/refresh tokens for app login
   * 2. Authorization: Returns session token for sensitive operations (withdrawals)
   * Increments failed attempts on incorrect passcode
   * SECURITY: Rate limited to prevent brute force attacks
   * @returns Verification result with tokens (auth and/or session)
   */
  async verifyPasscode(data: VerifyPasscodeRequest): Promise<VerifyPasscodeResponse> {
    const userId = useAuthStore.getState().user?.id || 'unknown';

    // Check rate limiting
    const allowance = passcodeRateLimiter.checkAllowance(userId);
    if (!allowance.canAttempt) {
      const remainingSeconds = Math.ceil((allowance.remainingMs || 0) / 1000);
      const message = `Too many passcode attempts. Try again in ${remainingSeconds} seconds.`;

      logger.warn('[PasscodeService] Passcode attempt blocked by rate limiter', {
        component: 'PasscodeService',
        action: 'rate-limited',
        userId,
        remainingSeconds,
      });

      throw new Error(message);
    }

    try {
      const response = await apiClient.post<VerifyPasscodeResponse>(
        PASSCODE_ENDPOINTS.VERIFY,
        data
      );

      // Success - clear rate limiter record
      passcodeRateLimiter.recordSuccessfulAttempt(userId);

      logger.debug('[PasscodeService] Passcode verified successfully', {
        component: 'PasscodeService',
        action: 'verify-success',
      });

      return response;
    } catch (error) {
      // Failed attempt - record it
      const backoffDelay = passcodeRateLimiter.recordFailedAttempt(userId);
      const attemptInfo = passcodeRateLimiter.getAttemptInfo(userId);

      logger.warn('[PasscodeService] Passcode verification failed', {
        component: 'PasscodeService',
        action: 'verify-failed',
        userId,
        attempts: attemptInfo.attempts,
        attemptsRemaining: attemptInfo.attemptsRemaining,
        backoffDelayMs: backoffDelay,
      });

      // If locked out, add that to error
      if (attemptInfo.isLocked) {
        const lockoutSeconds = attemptInfo.lockoutRemainingSeconds || 300;
        const lockoutError = new Error(
          `Too many failed attempts. Account locked for ${lockoutSeconds} seconds.`
        );
        (lockoutError as any).isLockedOut = true;
        throw lockoutError;
      }

      throw error;
    }
  },

  /**
   * Verify passcode for users without a valid bearer token (re-login flow).
   * Requires refresh_token plus a stable identifier (email or phone) from persisted user state.
   */
  async passcodeLogin(data: PasscodeLoginRequest): Promise<VerifyPasscodeResponse> {
    return apiClient.post<VerifyPasscodeResponse>(PASSCODE_ENDPOINTS.LOGIN, data);
  },

  /**
   * Remove/disable passcode
   * Requires current passcode for confirmation
   * @returns Message and updated status
   */
  async deletePasscode(data: DeletePasscodeRequest): Promise<DeletePasscodeResponse> {
    return apiClient.delete<DeletePasscodeResponse>(PASSCODE_ENDPOINTS.BASE, { data });
  },
};

export default passcodeService;
