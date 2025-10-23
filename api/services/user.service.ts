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
  GetNotificationsRequest,
  GetNotificationsResponse,
  MarkNotificationReadRequest,
  Enable2FAResponse,
  Verify2FARequest,
  Verify2FAResponse,
  GetDevicesResponse,
  RemoveDeviceRequest,
  ApiResponse,
} from '../types';

const USER_ENDPOINTS = {
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  SETTINGS: '/user/settings',
  UPDATE_SETTINGS: '/user/settings',
  KYC_SUBMIT: '/user/kyc/submit',
  KYC_STATUS: '/user/kyc/status',
  NOTIFICATIONS: '/user/notifications',
  MARK_READ: '/user/notifications/read',
  ENABLE_2FA: '/user/2fa/enable',
  VERIFY_2FA: '/user/2fa/verify',
  DISABLE_2FA: '/user/2fa/disable',
  DEVICES: '/user/devices',
  REMOVE_DEVICE: '/user/devices/:id',
};

export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<ApiResponse<User>>(USER_ENDPOINTS.PROFILE);
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<ApiResponse<User>>(USER_ENDPOINTS.UPDATE_PROFILE, data);
  },

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    return apiClient.get<ApiResponse<UserSettings>>(USER_ENDPOINTS.SETTINGS);
  },

  /**
   * Update user settings
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    return apiClient.put<ApiResponse<UserSettings>>(USER_ENDPOINTS.UPDATE_SETTINGS, data);
  },

  /**
   * Submit KYC verification
   */
  async submitKYC(data: KYCVerificationRequest): Promise<KYCVerificationResponse> {
    // If images are base64, use regular post
    // If images are files, use uploadFile helper
    return apiClient.post<ApiResponse<KYCVerificationResponse>>(
      USER_ENDPOINTS.KYC_SUBMIT,
      data
    );
  },

  /**
   * Get KYC verification status
   */
  async getKYCStatus(): Promise<KYCStatusResponse> {
    return apiClient.get<ApiResponse<KYCStatusResponse>>(USER_ENDPOINTS.KYC_STATUS);
  },

  /**
   * Get notifications
   */
  async getNotifications(params?: GetNotificationsRequest): Promise<GetNotificationsResponse> {
    return apiClient.get<ApiResponse<GetNotificationsResponse>>(
      USER_ENDPOINTS.NOTIFICATIONS,
      { params }
    );
  },

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(data: MarkNotificationReadRequest): Promise<void> {
    return apiClient.post(USER_ENDPOINTS.MARK_READ, data);
  },

  /**
   * Enable 2FA
   */
  async enable2FA(): Promise<Enable2FAResponse> {
    return apiClient.post<ApiResponse<Enable2FAResponse>>(USER_ENDPOINTS.ENABLE_2FA);
  },

  /**
   * Verify 2FA code
   */
  async verify2FA(data: Verify2FARequest): Promise<Verify2FAResponse> {
    return apiClient.post<ApiResponse<Verify2FAResponse>>(USER_ENDPOINTS.VERIFY_2FA, data);
  },

  /**
   * Disable 2FA
   */
  async disable2FA(code: string): Promise<void> {
    return apiClient.post(USER_ENDPOINTS.DISABLE_2FA, { code });
  },

  /**
   * Get user devices
   */
  async getDevices(): Promise<GetDevicesResponse> {
    return apiClient.get<ApiResponse<GetDevicesResponse>>(USER_ENDPOINTS.DEVICES);
  },

  /**
   * Remove a device
   */
  async removeDevice(data: RemoveDeviceRequest): Promise<void> {
    return apiClient.delete(
      USER_ENDPOINTS.REMOVE_DEVICE.replace(':id', data.deviceId)
    );
  },
};

export default userService;
