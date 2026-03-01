/**
 * Notification Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (limit: number, offset: number) => [...NOTIFICATION_KEYS.all, 'list', limit, offset] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/**
 * Hook to fetch notifications
 */
export function useNotifications(limit = 20, offset = 0) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(limit, offset),
    queryFn: () => notificationService.getNotifications(limit, offset),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch unread count for badge
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount });
    },
  });
}

/**
 * Hook to register device token
 */
export function useRegisterDeviceToken() {
  return useMutation({
    mutationFn: notificationService.registerDeviceToken,
  });
}
