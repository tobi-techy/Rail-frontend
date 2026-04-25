import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/api/hooks';
import type { Notification } from '@/api/types/notification';
import { ArrowLeft01Icon, CheckUnread01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

function NotificationItem({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const timeAgo = formatTimeAgo(notification.created_at);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`border-b border-gray-100 px-4 py-4 ${!notification.read ? 'bg-blue-50/30' : 'bg-white'}`}
      activeOpacity={0.7}>
      <View className="mb-1 flex-row items-start justify-between">
        <Text
          className={`mr-3 flex-1 text-[15px] font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}
          numberOfLines={1}>
          {notification.title}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {!notification.read && <View className="h-2 w-2 rounded-full bg-blue-500" />}
          <Text className="text-[12px] text-gray-400">{timeAgo}</Text>
        </View>
      </View>
      <Text className="text-[14px] leading-5 text-gray-500" numberOfLines={2}>
        {notification.body}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="mb-1 text-lg font-semibold text-gray-900">No notifications yet</Text>
      <Text className="px-8 text-center text-gray-500">
        Deposits, investments, and account updates will appear here.
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = unreadData?.unread_count ?? 0;

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead.mutate(notification.id);
      }
      if (notification.action_url) {
        router.push(notification.action_url as any);
        return;
      }
      // Route by type field in data
      const type = (notification as any).data?.type ?? (notification as any).type;
      switch (type) {
        case 'deposit_confirmed':
        case 'allocation_complete':
        case 'allocation_failed':
          router.push('/(tabs)' as any);
          break;
        case 'investment_complete':
          router.push('/investment-stash' as any);
          break;
        case 'kyc_approved':
        case 'kyc_rejected':
          router.push('/kyc' as any);
          break;
        case 'card_transaction':
          router.push('/card' as any);
          break;
        case 'p2p_claimed':
        case 'p2p_received':
          router.push('/spending-stash' as any);
          break;
        case 'spending_warning':
        case 'spending_critical':
        case 'spending_depleted':
        case 'transaction_declined':
          router.push('/spending-stash' as any);
          break;
        case 'withdrawal_completed':
        case 'withdrawal_failed':
        case 'offramp_success':
        case 'offramp_failure':
          router.push('/spending-stash' as any);
          break;
        case 'morning_greeting':
          router.push('/(tabs)' as any);
          break;
        case 'spending_alert':
        case 'budget_pace_alert':
        case 'cash_runway_alert':
        case 'idle_money':
        case 'savings_milestone':
        case 'weekly_digest':
        case 'month_recap':
          router.push('/ai-chat' as any);
          break;
        default:
          break;
      }
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  }, [unreadCount, markAllAsRead]);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="-ml-2 p-2">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#111" />
            </TouchableOpacity>
          ),
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                className="flex-row items-center"
                disabled={markAllAsRead.isPending}>
                {markAllAsRead.isPending ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckUnread01Icon} size={18} color="#3B82F6" />
                    <Text className="ml-1 text-[14px] font-medium text-blue-500">Read all</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null,
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
          }>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
