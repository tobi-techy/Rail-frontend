import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useMarketStatus } from '@/api/hooks/useInvestment';

export function MarketClosedBanner() {
  const { data: market } = useMarketStatus();
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (!market || market.is_open || scheduledRef.current) return;

    scheduledRef.current = true;

    const scheduleNotification = async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.content.data?.type === 'market_open') {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }

      const nextOpen = new Date(market.next_open);
      if (nextOpen <= new Date()) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📈 Market is now open',
          body: 'Your investments are live. Check your Stash.',
          data: { type: 'market_open', screen: '/investment-stash' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextOpen },
      });
    };

    scheduleNotification().catch(console.warn);
  }, [market]);

  if (!market || market.is_open) return null;

  return (
    <View className="mx-4 mb-3 flex-row items-center gap-x-2 rounded-2xl bg-amber-50 px-4 py-3">
      <Text className="text-base">🔒</Text>
      <View className="flex-1">
        <Text className="font-subtitle text-[13px] text-amber-800">Market closed</Text>
        <Text className="font-body text-[12px] text-amber-600">Opens {market.next_open_et}</Text>
      </View>
    </View>
  );
}
