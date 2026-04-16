import React from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Cancel01Icon, CheckmarkCircle01Icon, LockIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  useSubscription,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
} from '@/api/hooks/useGameplay';
import { useHaptics } from '@/hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ROWS: [string, boolean, boolean][] = [
  ['70/30 auto-split', true, true],
  ['Deposit streak', true, true],
  ['XP & levels', true, true],
  ['All streak types', false, true],
  ['Weekly challenges', false, true],
  ['Full badge collection', false, true],
  ['AI insights', false, true],
  ['Leaderboard', false, true],
  ['Priority support', false, true],
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { impact, notification } = useHaptics();
  const { data: subData, refetch } = useSubscription();
  const subscribeMutation = useSubscribeMutation();
  const cancelMutation = useCancelSubscriptionMutation();
  const isPro = subData?.is_pro ?? false;
  const sub = subData?.subscription;
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleSubscribe = () => {
    impact();
    Alert.alert('Subscribe to Rail Pro', '$4.99/month from your spend balance.\nCancel anytime.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Subscribe',
        onPress: async () => {
          try {
            await subscribeMutation.mutateAsync();
            await refetch();
            notification('success');
          } catch (e: any) {
            notification('error');
            Alert.alert("Couldn't subscribe", e?.message ?? 'Check your spend balance.');
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    impact();
    Alert.alert('Cancel Rail Pro?', 'Access continues until your billing period ends.', [
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
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between px-5">
        {/* ── Top: close + headline ────────────────────────────── */}
        <View>
          <View className="flex-row justify-end pt-2">
            <Pressable
              onPress={() => {
                impact();
                router.back();
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              hitSlop={12}>
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#fff" />
            </Pressable>
          </View>
          <Animated.View entering={FadeInDown.duration(350)}>
            <View className="mt-2 self-start rounded-sm bg-[#00C853] px-2.5 py-1">
              <Text className="font-mono-bold text-[10px] text-black">PRO</Text>
            </View>
            <Text className="mt-3 font-heading text-[32px] leading-[1.05] text-white">
              Unlock your{'\n'}full potential.
            </Text>
          </Animated.View>
        </View>

        {/* ── Middle: comparison table ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mt-4">
          <View className="mb-2 flex-row items-center">
            <View className="flex-1" />
            <Text className="w-14 text-center font-mono text-[9px] tracking-[1.5px] text-gray-600">
              FREE
            </Text>
            <View className="w-14 items-center rounded-sm bg-[#00C853] py-0.5">
              <Text className="font-mono-bold text-[9px] text-black">PRO</Text>
            </View>
          </View>
          {ROWS.map(([feature, free, pro], i) => (
            <View key={i} className="flex-row items-center border-t border-white/[0.05] py-2.5">
              <Text className="flex-1 font-body text-[13px] text-gray-300">{feature}</Text>
              <View className="w-14 items-center">
                {free ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#00C853" />
                ) : (
                  <HugeiconsIcon icon={LockIcon} size={12} color="#4B5563" />
                )}
              </View>
              <View className="w-14 items-center">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#00C853" />
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── Bottom: price + CTA ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="pb-2">
          {isPro && sub && (
            <View className="mb-4 self-center rounded-full bg-[#00C853]/15 px-4 py-1.5">
              <Text className="font-mono-medium text-small text-[#00C853]">
                {sub.status === 'cancelled' ? 'Active until period end' : "You're Pro"}
              </Text>
            </View>
          )}

          {!isPro && (
            <View className="mb-4 items-center">
              <View className="flex-row items-end">
                <Text className="font-mono-bold text-[44px] leading-none text-white">$4</Text>
                <Text className="mb-1 font-mono-semibold text-headline-3 text-gray-500">.99</Text>
                <Text className="mb-1.5 ml-1 font-body text-small text-gray-600">/mo</Text>
              </View>
            </View>
          )}

          {isPro ? (
            sub?.status !== 'cancelled' ? (
              <Pressable
                className="items-center rounded-full border border-white/10 py-4"
                onPress={handleCancel}
                disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-button text-body text-gray-400">Cancel subscription</Text>
                )}
              </Pressable>
            ) : null
          ) : (
            <>
              <AnimatedPressable
                style={btnStyle}
                className="items-center rounded-full bg-white py-4"
                onPress={handleSubscribe}
                onPressIn={() => {
                  btnScale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
                }}
                onPressOut={() => {
                  btnScale.value = withSpring(1, { damping: 20, stiffness: 300 });
                }}
                disabled={subscribeMutation.isPending}>
                {subscribeMutation.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="font-button text-button-lg text-black">Subscribe to Pro</Text>
                )}
              </AnimatedPressable>
              <Text className="mt-3 text-center font-body text-[11px] text-gray-600">
                From your spend balance · Cancel anytime
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
