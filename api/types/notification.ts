// ============= Notification Types =============

import { PaginationParams, PaginatedResponse } from './common';

export interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface GetNotificationsRequest extends PaginationParams {
  type?: Notification['type'];
  unreadOnly?: boolean;
}

export interface GetNotificationsResponse extends PaginatedResponse<Notification> {}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}
