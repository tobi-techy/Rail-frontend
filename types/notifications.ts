export type NotificationType =
  | 'transaction'
  | 'deposit'
  | 'withdrawal'
  | 'investment'
  | 'alert'
  | 'promo'
  | 'system';

export interface NotificationData {
  type: NotificationType;
  id?: string;
  route?: string;
  params?: Record<string, string>;
}

export interface NotificationPreferences {
  transactions: boolean;
  deposits: boolean;
  withdrawals: boolean;
  investments: boolean;
  alerts: boolean;
  promos: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  transactions: true,
  deposits: true,
  withdrawals: true,
  investments: true,
  alerts: true,
  promos: false,
};
