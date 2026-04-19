import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useNavigation, router } from 'expo-router';
import { useStation } from '@/api/hooks/useStation';
import { useAuthStore } from '@/stores/authStore';
import { invalidateQueries } from '@/api/queryClient';
import { formatCurrencyAmount } from '@/utils/currency';
import { ShieldKeyIcon, Key01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const fmt = (v: string | undefined) => formatCurrencyAmount(parseFloat(v ?? '0') || 0, 'USD');

const Profile = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const { data: station, refetch } = useStation();
  const user = useAuthStore((s) => s.user);

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), invalidateQueries.station()]);
    setRefreshing(false);
  }, [refetch]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className="items-start pl-[14px]">
          <Text className="font-body-bold text-[40px] font-bold text-[#000]">Portfolio</Text>
        </View>
      ),
      headerRight: () => (
        <View className="mr-[14px] h-10 w-10 items-center justify-center rounded-full bg-[#3d4db7]">
          <Text className="font-body-bold text-base text-white">{initials}</Text>
        </View>
      ),
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation, initials]);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your Account';

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }>
      <View className="gap-4 px-[14px] pb-8 pt-2">
        <Text className="font-body text-lg text-text-secondary">{name}</Text>

        <View className="gap-3 rounded-2xl bg-[#F5F5F5] p-5">
          <Text className="font-caption text-sm text-text-secondary">Total Balance</Text>
          <Text className="font-body-bold text-4xl font-bold text-[#000]">
            {fmt(station?.total_balance)}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-1 rounded-2xl bg-[#F5F5F5] p-4">
            <Text className="font-caption text-xs text-text-secondary">Spend</Text>
            <Text className="font-body-bold text-xl font-bold text-[#000]">
              {fmt(station?.spend_balance)}
            </Text>
          </View>
          <View className="flex-1 gap-1 rounded-2xl bg-[#F5F5F5] p-4">
            <Text className="font-caption text-xs text-text-secondary">Invest</Text>
            <Text className="font-body-bold text-xl font-bold text-[#000]">
              {fmt(station?.invest_balance)}
            </Text>
          </View>
        </View>

        {(station?.recent_activity?.length ?? 0) > 0 && (
          <View className="gap-2">
            <Text className="font-body-bold text-base font-semibold text-[#000]">
              Recent Activity
            </Text>
            {station?.recent_activity?.slice(0, 5).map((item) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between rounded-xl bg-[#F5F5F5] px-4 py-3">
                <Text className="font-body text-sm text-[#000]">{item.description}</Text>
                <Text className="font-body-bold text-sm font-semibold text-[#000]">
                  {fmt(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Security */}
        <View className="gap-2">
          <Text className="font-body-bold text-base font-semibold text-[#000]">Security</Text>
          <Pressable
            onPress={() => router.push('/whitelist' as never)}
            className="flex-row items-center rounded-2xl bg-[#F5F5F5] p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white">
              <HugeiconsIcon icon={ShieldKeyIcon} size={18} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="font-subtitle text-sm text-[#000]">Withdrawal Whitelist</Text>
              <Text className="mt-0.5 font-caption text-xs text-text-secondary">
                Manage approved withdrawal addresses
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9CA3AF" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/passkey-settings' as never)}
            className="flex-row items-center rounded-2xl bg-[#F5F5F5] p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white">
              <HugeiconsIcon icon={Key01Icon} size={18} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="font-subtitle text-sm text-[#000]">Passkeys</Text>
              <Text className="mt-0.5 font-caption text-xs text-text-secondary">
                Manage passkeys for fast authorization
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default Profile;
