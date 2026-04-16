import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSubscription,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
} from '@/api/hooks/useGameplay';

const FREE_FEATURES = [
  'Automatic 70/30 split',
  'Deposit streak tracking',
  'XP & level system',
  'Onboarding challenges',
  'Balance milestones',
  '2 AI insights per week',
];

const PRO_FEATURES = [
  'All streak types',
  'Weekly & monthly challenges',
  'Full badge collection',
  'Leaderboard access',
  'Unlimited AI financial agent',
  'Priority support',
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { data: subData, refetch } = useSubscription();
  const subscribeMutation = useSubscribeMutation();
  const cancelMutation = useCancelSubscriptionMutation();

  const isPro = subData?.is_pro ?? false;
  const sub = subData?.subscription;

  const handleSubscribe = () => {
    Alert.alert(
      'Subscribe to Rail Pro',
      '$4.99/month charged from your spend balance. Cancel anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            try {
              await subscribeMutation.mutateAsync();
              await refetch();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to subscribe');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Rail Pro',
      'Your access continues until the end of the current billing period.',
      [
        { text: 'Keep Pro', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync();
              await refetch();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to cancel');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-2 pt-3">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="font-body text-body text-text-secondary">← Back</Text>
          </Pressable>
          <Text className="font-heading text-headline-2 text-text-primary">Rail Pro</Text>
          <Text className="mt-1 font-body text-body text-text-secondary">
            Level up your financial game
          </Text>
        </View>

        {/* Price */}
        <View className="mx-5 mt-4 items-center rounded-3xl bg-black px-5 py-6">
          <Text className="font-mono-bold text-[48px] text-white">$4.99</Text>
          <Text className="font-body text-caption text-gray-400">
            per month · from your spend balance
          </Text>
          {isPro && sub && (
            <View className="mt-3 rounded-full bg-[#00C853]/20 px-3 py-1">
              <Text className="font-mono-medium text-small text-[#00C853]">
                {sub.status === 'cancelled' ? 'Active until period end' : 'Active'}
              </Text>
            </View>
          )}
        </View>

        {/* Pro features */}
        <View className="mx-5 mt-6">
          <Text className="mb-3 font-subtitle text-subtitle text-text-primary">Pro includes</Text>
          {PRO_FEATURES.map((f) => (
            <View key={f} className="mb-2.5 flex-row items-center gap-3">
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#00C853]">
                <Text className="text-[10px] text-white">✓</Text>
              </View>
              <Text className="font-body text-body text-text-primary">{f}</Text>
            </View>
          ))}
        </View>

        {/* Free features */}
        <View className="mx-5 mt-5">
          <Text className="mb-3 font-subtitle text-subtitle text-text-secondary">Free tier</Text>
          {FREE_FEATURES.map((f) => (
            <View key={f} className="mb-2 flex-row items-center gap-3">
              <View className="h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                <Text className="text-[10px] text-gray-500">✓</Text>
              </View>
              <Text className="font-body text-body text-text-secondary">{f}</Text>
            </View>
          ))}
        </View>

        {/* Action button */}
        <View className="mx-5 mt-6">
          {isPro ? (
            sub?.status !== 'cancelled' ? (
              <Pressable
                className="items-center rounded-2xl border border-gray-200 py-4"
                onPress={handleCancel}
                disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="font-button text-body text-text-secondary">
                    Cancel subscription
                  </Text>
                )}
              </Pressable>
            ) : (
              <View className="items-center rounded-2xl bg-surface py-4">
                <Text className="font-body text-body text-text-secondary">
                  Cancelled — active until period end
                </Text>
              </View>
            )
          ) : (
            <Pressable
              className="items-center rounded-2xl bg-black py-4"
              onPress={handleSubscribe}
              disabled={subscribeMutation.isPending}>
              {subscribeMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-button text-body text-white">
                  Subscribe to Pro — $4.99/mo
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
