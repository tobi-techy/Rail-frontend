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
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Shield,
  TrendingUp,
  Gift,
} from 'lucide-react-native';

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/api/hooks';
import type { Notification } from '@/api/types/notification';

// Simple time ago formatter
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

const getNotificationIcon = (type: string) => {
  const iconProps = { size: 20, strokeWidth: 1.8 };
  switch (type) {
    case 'deposit_confirmed':
    case 'deposit':
      return <ArrowDownLeft {...iconProps} color="#10B981" />;
    case 'withdrawal_completed':
    case 'withdrawal_success':
    case 'withdrawal':
      return <ArrowUpRight {...iconProps} color="#F59E0B" />;
    case 'withdrawal_failed':
      return <ArrowUpRight {...iconProps} color="#EF4444" />;
    case 'p2p_sent':
    case 'p2p_received':
      return <Users {...iconProps} color="#8B5CF6" />;
    case 'security':
      return <Shield {...iconProps} color="#EF4444" />;
    case 'milestone':
    case 'portfolio':
      return <TrendingUp {...iconProps} color="#3B82F6" />;
    case 'offramp_success':
      return <Gift {...iconProps} color="#10B981" />;
    default:
      return <Bell {...iconProps} color="#6B7280" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'deposit_confirmed':
    case 'deposit':
    case 'offramp_success':
      return 'bg-emerald-50';
    case 'withdrawal_completed':
    case 'withdrawal_success':
    case 'withdrawal':
      return 'bg-amber-50';
    case 'withdrawal_failed':
    case 'security':
      return 'bg-red-50';
    case 'p2p_sent':
    case 'p2p_received':
      return 'bg-violet-50';
    case 'milestone':
    case 'portfolio':
      return 'bg-blue-50';
    default:
      return 'bg-gray-50';
  }
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
      className={`flex-row items-start p-4 border-b border-gray-100 ${
        !notification.read ? 'bg-blue-50/30' : 'bg-white'
      }`}
      activeOpacity={0.7}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getNotificationColor(
          notification.type
        )}`}
      >
        {getNotificationIcon(notification.type)}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className={`font-medium text-[15px] flex-1 ${
              !notification.read ? 'text-gray-900' : 'text-gray-700'
            }`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read && <View className="w-2 h-2 rounded-full bg-blue-500 ml-2" />}
        </View>
        <Text className="text-gray-600 text-[14px] leading-5" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-gray-400 text-[12px] mt-1.5">{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
        <Bell size={28} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 font-semibold text-lg mb-1">No notifications yet</Text>
      <Text className="text-gray-500 text-center px-8">
        When you receive deposits, withdrawals, or other updates, they&apos;ll appear here.
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
      // Navigate based on action_url or type if needed
      if (notification.action_url) {
        router.push(notification.action_url as any);
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
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft size={22} color="#111" />
            </TouchableOpacity>
          ),
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                className="flex-row items-center"
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <CheckCheck size={18} color="#3B82F6" />
                    <Text className="text-blue-500 font-medium ml-1 text-[14px]">Read all</Text>
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
          }
        >
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
