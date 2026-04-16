import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  FireIcon,
  Target01Icon,
  Award01Icon,
  AiChat01Icon,
  CrownIcon,
  HeadsetIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  useSubscription,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
} from '@/api/hooks/useGameplay';
import { useHaptics } from '@/hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRO_FEATURES = [
  { icon: FireIcon, title: 'All streak types', desc: 'Deposit, no-spend, stash growth & round-up' },
  {
    icon: Target01Icon,
    title: 'Weekly & monthly challenges',
    desc: 'New goals every week to keep you sharp',
  },
  { icon: Award01Icon, title: 'Full badge collection', desc: 'Unlock all 10 achievement badges' },
  {
    icon: AiChat01Icon,
    title: 'Unlimited AI insights',
    desc: 'Personalized financial guidance anytime',
  },
  { icon: CrownIcon, title: 'Leaderboard access', desc: 'See how you rank against other builders' },
  { icon: HeadsetIcon, title: 'Priority support', desc: 'Get help faster when you need it' },
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
    Alert.alert('Cancel Rail Pro?', "You'll keep access until the end of your billing period.", [
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pb-2 pt-3">
          <Pressable
            onPress={() => {
              impact();
              router.back();
            }}
            className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-surface"
            hitSlop={12}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#000" />
          </Pressable>
        </View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-5 pt-4">
          <Text className="font-heading text-headline-1 text-text-primary">
            Build wealth{'\n'}like you mean it.
          </Text>
          <Text className="mt-3 font-body text-body text-text-secondary">
            Rail Pro turns your money habits into a game you actually want to play.
          </Text>
        </Animated.View>

        {/* Price card */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} className="mx-5 mt-6">
          <View className="items-center rounded-3xl bg-black px-6 py-8">
            <View className="flex-row items-end">
              <Text className="font-mono-bold text-display-lg text-white">$4</Text>
              <Text className="mb-2 font-mono-semibold text-headline-2 text-gray-400">.99</Text>
            </View>
            <Text className="mt-1 font-body text-caption text-gray-500">
              per month from your spend balance
            </Text>
            {isPro && sub && (
              <View className="mt-4 rounded-full bg-[#00C853]/15 px-4 py-1.5">
                <Text className="font-mono-medium text-small text-[#00C853]">
                  {sub.status === 'cancelled' ? 'Active until period end' : "You're Pro"}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Features */}
        <View className="mt-8 px-5">
          <Text className="mb-4 font-subtitle text-subtitle text-text-primary">
            Everything in Pro
          </Text>
          {PRO_FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              entering={FadeInDown.delay(160 + i * 50).duration(400)}
              className="mb-4 flex-row items-start">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-surface">
                <HugeiconsIcon icon={f.icon} size={22} color="#000" />
              </View>
              <View className="flex-1 pt-0.5">
                <Text className="font-subtitle text-body text-text-primary">{f.title}</Text>
                <Text className="mt-0.5 font-body text-small text-text-secondary">{f.desc}</Text>
              </View>
              <View className="pt-1">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#00C853" />
              </View>
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} className="mt-4 px-5">
          {isPro ? (
            sub?.status !== 'cancelled' ? (
              <Pressable
                className="items-center rounded-full border border-gray-200 py-5"
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
              <View className="items-center rounded-full bg-surface py-5">
                <Text className="font-body text-body text-text-secondary">
                  Cancelled — active until period end
                </Text>
              </View>
            )
          ) : (
            <AnimatedPressable
              style={btnStyle}
              className="items-center rounded-full bg-black py-5"
              onPress={handleSubscribe}
              onPressIn={() => {
                btnScale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
              }}
              onPressOut={() => {
                btnScale.value = withSpring(1, { damping: 20, stiffness: 300 });
              }}
              disabled={subscribeMutation.isPending}>
              {subscribeMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-button text-button-lg text-white">Subscribe — $4.99/mo</Text>
              )}
            </AnimatedPressable>
          )}
        </Animated.View>

        {!isPro && (
          <Animated.View entering={FadeInDown.delay(560).duration(400)} className="mt-4 px-5">
            <Text className="text-center font-body text-small text-text-tertiary">
              Charged monthly from your spend balance.{'\n'}Cancel anytime — no questions asked.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
