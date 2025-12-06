/**
 * Passcode API Service
 * Handles passcode creation, verification, update, and removal
 */

import apiClient from '../client';
import type {
  PasscodeStatus,
  CreatePasscodeRequest,
  CreatePasscodeResponse,
  UpdatePasscodeRequest,
  UpdatePasscodeResponse,
  VerifyPasscodeRequest,
  VerifyPasscodeResponse,
  DeletePasscodeRequest,
  DeletePasscodeResponse,
} from '../types';

const PASSCODE_ENDPOINTS = {
  BASE: '/v1/security/passcode',
  VERIFY: '/v1/security/passcode/verify',
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
   * @returns Verification result with tokens (auth and/or session)
   */
  async verifyPasscode(data: VerifyPasscodeRequest): Promise<VerifyPasscodeResponse> {
    return apiClient.post<VerifyPasscodeResponse>(PASSCODE_ENDPOINTS.VERIFY, data);
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
