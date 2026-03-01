/**
 * Notification Types
 */

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  image_url?: string;
  action_url?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  limit: number;
  offset: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface RegisterDeviceTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  app_version?: string;
  device_model?: string;
  os_version?: string;
}
