/**
 * Notification API Service
 */

import apiClient from '../client';
import type {
  NotificationsResponse,
  UnreadCountResponse,
  RegisterDeviceTokenRequest,
} from '../types/notification';

const ENDPOINTS = {
  NOTIFICATIONS: '/v1/notifications',
  UNREAD_COUNT: '/v1/notifications/unread-count',
  MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
  MARK_ALL_READ: '/v1/notifications/read-all',
  DEVICE_TOKEN: '/v1/devices/token',
};

export const notificationService = {
  /**
   * Get paginated notifications
   */
  async getNotifications(limit = 20, offset = 0): Promise<NotificationsResponse> {
    return apiClient.get<NotificationsResponse>(
      `${ENDPOINTS.NOTIFICATIONS}?limit=${limit}&offset=${offset}`
    );
  },

  /**
   * Get unread notification count for badge
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>(ENDPOINTS.UNREAD_COUNT);
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return apiClient.post(ENDPOINTS.MARK_READ(notificationId));
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.post(ENDPOINTS.MARK_ALL_READ);
  },

  /**
   * Register device push token
   */
  async registerDeviceToken(data: RegisterDeviceTokenRequest): Promise<void> {
    return apiClient.post(ENDPOINTS.DEVICE_TOKEN, data);
  },

  /**
   * Unregister device push token
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.DEVICE_TOKEN, { data: { token } });
  },
};

export default notificationService;
