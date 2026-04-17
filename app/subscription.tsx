import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, ImageBackground } from 'react-native';
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
  ['Streaks & challenges', true, true],
  ['XP, levels & badges', true, true],
  ['Basic AI insights', true, true],
  ['Virtual debit card', true, true],
  ['Unlimited AI agent', false, true],
  ['Higher cashback', false, true],
  ['Custom physical card', false, true],
  ['Spending analytics', false, true],
  ['Leaderboard access', false, true],
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
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleSubscribe = () => {
    impact();
    const plan = billing === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    const desc = billing === 'yearly' ? '$49.99/year ($4.17/mo)' : '$4.99/month';
    Alert.alert('Subscribe to Rail Pro', `${desc} from your spend balance.\nCancel anytime.`, [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Subscribe',
        onPress: async () => {
          try {
            await subscribeMutation.mutateAsync(plan as any);
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
    <ImageBackground
      source={require('@/assets/pro-bg.png')}
      resizeMode="cover"
      imageStyle={{ opacity: 0.06 }}
      className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 justify-between px-5">
          {/* ── Top ────────────────────────────────────────────── */}
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
              <View className="mt-1 self-start rounded-sm bg-[#00C853] px-2.5 py-1">
                <Text className="font-mono-bold text-[10px] text-black">PRO</Text>
              </View>
              <Text className="mt-3 font-heading text-[30px] leading-[1.05] text-white">
                Unlock your{'\n'}full potential.
              </Text>
            </Animated.View>
          </View>

          {/* ── Comparison table ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
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
              <View key={i} className="flex-row items-center border-t border-white/[0.05] py-2">
                <Text className="flex-1 font-body text-[12px] text-gray-300">{feature}</Text>
                <View className="w-14 items-center">
                  {free ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} color="#00C853" />
                  ) : (
                    <HugeiconsIcon icon={LockIcon} size={11} color="#4B5563" />
                  )}
                </View>
                <View className="w-14 items-center">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} color="#00C853" />
                </View>
              </View>
            ))}
          </Animated.View>

          {/* ── Bottom: toggle + price + CTA ───────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)} className="pb-2">
            {isPro && sub ? (
              <>
                <View className="mb-4 self-center rounded-full bg-[#00C853]/15 px-4 py-1.5">
                  <Text className="font-mono-medium text-small text-[#00C853]">
                    {sub.status === 'cancelled' ? 'Active until period end' : "You're Pro"}
                  </Text>
                </View>
                {sub.status !== 'cancelled' && (
                  <Pressable
                    className="items-center rounded-full border border-white/10 py-4"
                    onPress={handleCancel}
                    disabled={cancelMutation.isPending}>
                    {cancelMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="font-button text-body text-gray-400">
                        Cancel subscription
                      </Text>
                    )}
                  </Pressable>
                )}
              </>
            ) : (
              <>
                {/* Billing toggle */}
                <View className="mb-4 flex-row items-center justify-center gap-2">
                  <Pressable
                    onPress={() => {
                      impact();
                      setBilling('monthly');
                    }}
                    className={`rounded-full px-5 py-2.5 ${billing === 'monthly' ? 'bg-white' : 'bg-white/[0.06]'}`}>
                    <Text
                      className={`font-button text-small ${billing === 'monthly' ? 'text-black' : 'text-gray-400'}`}>
                      Monthly
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      impact();
                      setBilling('yearly');
                    }}
                    className={`flex-row items-center gap-2 rounded-full px-5 py-2.5 ${billing === 'yearly' ? 'bg-white' : 'bg-white/[0.06]'}`}>
                    <Text
                      className={`font-button text-small ${billing === 'yearly' ? 'text-black' : 'text-gray-400'}`}>
                      Yearly
                    </Text>
                    {billing === 'yearly' && (
                      <View className="rounded-full bg-[#00C853] px-2 py-0.5">
                        <Text className="font-mono-bold text-[9px] text-black">-17%</Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                {/* Price */}
                <View className="mb-1 items-center">
                  <View className="flex-row items-end">
                    {billing === 'monthly' ? (
                      <>
                        <Text className="font-mono-bold text-[40px] leading-none text-white">
                          $4
                        </Text>
                        <Text className="mb-1 font-mono-semibold text-headline-3 text-gray-500">
                          .99
                        </Text>
                        <Text className="mb-1.5 ml-1 font-body text-small text-gray-600">/mo</Text>
                      </>
                    ) : (
                      <>
                        <Text className="font-mono-bold text-[40px] leading-none text-white">
                          $49
                        </Text>
                        <Text className="mb-1 font-mono-semibold text-headline-3 text-gray-500">
                          .99
                        </Text>
                        <Text className="mb-1.5 ml-1 font-body text-small text-gray-600">/yr</Text>
                      </>
                    )}
                  </View>
                  {billing === 'yearly' ? (
                    <Text className="mt-1 font-mono text-[11px] text-gray-500">
                      $4.17/mo · <Text className="text-[#00C853]">Save $9.89</Text>
                    </Text>
                  ) : (
                    <Text className="mt-1 font-mono text-[11px] text-gray-500">
                      $59.88/yr at monthly price
                    </Text>
                  )}
                </View>

                {/* CTA */}
                <AnimatedPressable
                  style={btnStyle}
                  className="mt-3 items-center rounded-full bg-white py-4"
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
                <Text className="mt-2.5 text-center font-body text-[10px] text-gray-600">
                  From your spend balance · Cancel anytime
                </Text>
              </>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
