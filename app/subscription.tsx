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
  Cancel01Icon,
  CheckmarkCircle01Icon,
  LockIcon,
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

// Comparison rows: [feature, free?, pro?]
const COMPARISON = [
  ['Automatic 70/30 split', true, true],
  ['Deposit streak', true, true],
  ['XP & levels', true, true],
  ['All streak types', false, true],
  ['Weekly challenges', false, true],
  ['Monthly challenges', false, true],
  ['Full badge collection', false, true],
  ['AI financial insights', false, true],
  ['Leaderboard access', false, true],
  ['Priority support', false, true],
] as const;

// Feature cards (Fuse-style)
const FEATURE_CARDS = [
  {
    icon: FireIcon,
    title: 'Every Streak Type',
    desc: "Track deposits, no-spend days, stash growth & round-ups. Break a streak? We'll remind you before it happens.",
  },
  {
    icon: Target01Icon,
    title: 'Weekly Challenges',
    desc: 'New goals every Monday that push you to deposit more, spend less, and build faster.',
  },
  {
    icon: AiChat01Icon,
    title: 'AI Financial Agent',
    desc: 'Personalized insights about your money habits, delivered twice a week.',
  },
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
    Alert.alert('Cancel Rail Pro?', 'Access continues until the end of your billing period.', [
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
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}>
        {/* ── Close button ─────────────────────────────────────── */}
        <View className="flex-row justify-end px-5 pt-3">
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

        {/* ── Hero headline — Check-inspired bold type ──────────── */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-5 pt-6">
          <View className="mb-3 self-start rounded-sm bg-[#00C853] px-2.5 py-1">
            <Text className="font-mono-bold text-small text-black">PRO</Text>
          </View>
          <Text className="font-heading text-[36px] leading-[1.05] text-white">
            Unlock your{'\n'}full potential.
          </Text>
          {isPro && sub && (
            <View className="mt-4 self-start rounded-full bg-[#00C853]/15 px-4 py-1.5">
              <Text className="font-mono-medium text-small text-[#00C853]">
                {sub.status === 'cancelled' ? 'Active until period end' : "You're Pro"}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Feature cards — Fuse-inspired ─────────────────────── */}
        <View className="mt-8 px-5">
          {FEATURE_CARDS.map((f, i) => (
            <Animated.View
              key={f.title}
              entering={FadeInDown.delay(80 + i * 60).duration(400)}
              className="mb-3 rounded-2xl bg-white/[0.06] px-5 py-5">
              <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <HugeiconsIcon icon={f.icon} size={20} color="#fff" />
              </View>
              <Text className="font-subtitle text-body text-white">{f.title}</Text>
              <Text className="mt-1 font-body text-small text-gray-400">{f.desc}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ── Comparison table — Check-inspired ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} className="mt-6 px-5">
          {/* Column headers */}
          <View className="mb-3 flex-row items-center">
            <View className="flex-1" />
            <Text className="w-16 text-center font-mono text-[10px] tracking-[2px] text-gray-500">
              FREE
            </Text>
            <View className="w-16 items-center rounded-sm bg-[#00C853] py-0.5">
              <Text className="font-mono-bold text-[10px] text-black">PRO</Text>
            </View>
          </View>
          {/* Rows */}
          {COMPARISON.map(([feature, free, pro], i) => (
            <View key={i} className="flex-row items-center border-t border-white/[0.06] py-3.5">
              <Text className="flex-1 font-body text-caption text-gray-300">{feature}</Text>
              <View className="w-16 items-center">
                {free ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#00C853" />
                ) : (
                  <HugeiconsIcon icon={LockIcon} size={14} color="#4B5563" />
                )}
              </View>
              <View className="w-16 items-center">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#00C853" />
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── Price + CTA ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(420).duration(400)} className="mt-10 px-5">
          <View className="mb-6 items-center">
            <View className="flex-row items-end">
              <Text className="font-mono-bold text-[52px] leading-none text-white">$4</Text>
              <Text className="mb-1.5 font-mono-semibold text-headline-2 text-gray-500">.99</Text>
              <Text className="mb-2 ml-1 font-body text-caption text-gray-500">/mo</Text>
            </View>
            <Text className="mt-1 font-body text-small text-gray-500">From your spend balance</Text>
          </View>

          {isPro ? (
            sub?.status !== 'cancelled' ? (
              <Pressable
                className="items-center rounded-full border border-white/10 py-5"
                onPress={handleCancel}
                disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-button text-body text-gray-400">Cancel subscription</Text>
                )}
              </Pressable>
            ) : (
              <View className="items-center rounded-full bg-white/5 py-5">
                <Text className="font-body text-body text-gray-500">
                  Cancelled — active until period end
                </Text>
              </View>
            )
          ) : (
            <AnimatedPressable
              style={btnStyle}
              className="items-center rounded-full bg-white py-5"
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
          )}

          {!isPro && (
            <Text className="mt-4 text-center font-body text-small text-gray-600">
              Cancel anytime. No questions asked.
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
