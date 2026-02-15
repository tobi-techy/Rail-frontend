/**
 * User API Service
 * Handles user profile, settings, KYC, and notifications
 */

import apiClient, { uploadFile } from '../client';
import type {
  User,
  UserSettings,
  UpdateSettingsRequest,
  KYCVerificationRequest,
  KYCVerificationResponse,
  KYCStatusResponse,
  Enable2FAResponse,
  Verify2FARequest,
  Verify2FAResponse,
  GetDevicesResponse,
  RemoveDeviceRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
  ApiResponse,
} from '../types';

const USER_ENDPOINTS = {
  PROFILE: '/v1/users/me',
  UPDATE_PROFILE: '/v1/users/me',
  CHANGE_PASSWORD: '/v1/users/me/change-password',
  DELETE_ACCOUNT: '/v1/users/me',
  ENABLE_2FA: '/v1/users/me/enable-2fa',
  DISABLE_2FA: '/v1/users/me/disable-2fa',
  SETTINGS: '/user/settings',
  UPDATE_SETTINGS: '/user/settings',
  KYC_SUBMIT: '/user/kyc/submit',
  KYC_STATUS: '/user/kyc/status',
  DEVICES: '/user/devices',
  REMOVE_DEVICE: '/user/devices/:id',
};

export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>(USER_ENDPOINTS.PROFILE);
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>(USER_ENDPOINTS.UPDATE_PROFILE, data);
  },

  /**
   * Change password (requires authentication)
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.post(USER_ENDPOINTS.CHANGE_PASSWORD, data);
  },

  /**
   * Delete account
   */
  async deleteAccount(data?: DeleteAccountRequest): Promise<void> {
    return apiClient.delete(USER_ENDPOINTS.DELETE_ACCOUNT, data ? { data } : undefined);
  },

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    return apiClient.get<UserSettings>(USER_ENDPOINTS.SETTINGS);
  },

  /**
   * Update user settings
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    return apiClient.put<UserSettings>(USER_ENDPOINTS.UPDATE_SETTINGS, data);
  },

  /**
   * Submit KYC verification
   */
  async submitKYC(data: KYCVerificationRequest): Promise<KYCVerificationResponse> {
    // If images are base64, use regular post
    // If images are files, use uploadFile helper
    return apiClient.post<KYCVerificationResponse>(USER_ENDPOINTS.KYC_SUBMIT, data);
  },

  /**
   * Get KYC verification status
   */
  async getKYCStatus(): Promise<KYCStatusResponse> {
    return apiClient.get<KYCStatusResponse>(USER_ENDPOINTS.KYC_STATUS);
  },

  /**
   * Enable 2FA
   * Returns QR code and backup codes for 2FA setup
   */
  async enable2FA(): Promise<Enable2FAResponse> {
    return apiClient.post<Enable2FAResponse>(USER_ENDPOINTS.ENABLE_2FA);
  },

  /**
   * Disable 2FA
   * Requires verification code to disable
   */
  async disable2FA(data: Verify2FARequest): Promise<void> {
    return apiClient.post(USER_ENDPOINTS.DISABLE_2FA, data);
  },

  /**
   * Get user devices
   */
  async getDevices(): Promise<GetDevicesResponse> {
    return apiClient.get<GetDevicesResponse>(USER_ENDPOINTS.DEVICES);
  },

  /**
   * Remove a device
   * SECURITY: Validate and sanitize deviceId before interpolation
   */
  async removeDevice(data: RemoveDeviceRequest): Promise<void> {
    // SECURITY: Validate deviceId format to prevent path traversal
    if (!data.deviceId || !/^[a-zA-Z0-9_-]+$/.test(data.deviceId)) {
      throw new Error('Invalid device ID format');
    }

    return apiClient.delete(USER_ENDPOINTS.REMOVE_DEVICE.replace(':id', data.deviceId));
  },
};

export default userService;
