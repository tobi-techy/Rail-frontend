import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useUnreadCount } from '@/api/hooks';
import { Notification03Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export function NotificationBell({ size = 22, color = '#111' }: NotificationBellProps) {
  const { data } = useUnreadCount();
  const unreadCount = data?.unread_count ?? 0;

  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={8} className="relative">
      <HugeiconsIcon icon={Notification03Icon} size={size} color={color} strokeWidth={1.8} />
      {unreadCount > 0 && (
        <View className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-coral-red/100 items-center justify-center px-1">
          <Text className="text-white text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default NotificationBell;
