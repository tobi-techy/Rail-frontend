import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { Confetti } from '@/components/atoms/Confetti';
import { CheckmarkCircle02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ActivityIndicator } from 'react-native';

export type WithdrawalStatusType = 'success' | 'pending' | 'failed';

interface WithdrawalStatusScreenProps {
  status: WithdrawalStatusType;
  title?: string;
  message?: string;
  amount?: string;
  recipient?: string;
  onDone?: () => void;
  onRetry?: () => void;
}

export function WithdrawalStatusScreen({
  status,
  title,
  message,
  amount,
  recipient,
  onDone,
  onRetry,
}: WithdrawalStatusScreenProps) {
  useEffect(() => {
    if (status === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (status === 'failed') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [status]);

  const goHome = onDone ?? (() => router.replace('/(tabs)' as never));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {status === 'success' && <Confetti />}

      <View className="flex-1 items-center justify-center px-8">
        {status === 'success' && (
          <>
            <Animated.View entering={FadeIn.delay(100).duration(300)} className="mb-6 size-20 items-center justify-center rounded-full bg-[#ECFDF5]">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} color="#10B981" />
            </Animated.View>
            {amount && (
              <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="font-mono-semibold text-[36px] text-text-primary" style={{ letterSpacing: -1 }}>
                {amount}
              </Animated.Text>
            )}
            <Animated.Text entering={FadeInDown.delay(300).duration(400)} className="mt-3 font-subtitle text-[20px] text-text-primary">
              {title ?? 'Withdrawal sent'}
            </Animated.Text>
            {recipient && (
              <Animated.Text entering={FadeIn.delay(400).duration(300)} className="mt-2 text-center font-body text-[14px] text-text-secondary">
                to {recipient}
              </Animated.Text>
            )}
            {message && (
              <Animated.Text entering={FadeIn.delay(450).duration(300)} className="mt-2 text-center font-body text-[14px] leading-[20px] text-text-secondary">
                {message}
              </Animated.Text>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <Animated.View entering={FadeIn.delay(100).duration(300)} className="mb-6 size-20 items-center justify-center rounded-full bg-[#FEF2F2]">
              <HugeiconsIcon icon={Cancel01Icon} size={36} color="#EF4444" />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="font-subtitle text-[20px] text-text-primary">
              {title ?? 'Withdrawal failed'}
            </Animated.Text>
            <Animated.Text entering={FadeIn.delay(350).duration(300)} className="mt-3 text-center font-body text-[14px] leading-[20px] text-text-secondary">
              {message ?? 'Your funds have not been debited. Please try again.'}
            </Animated.Text>
          </>
        )}

        {status === 'pending' && (
          <>
            <Animated.View entering={FadeIn.delay(100).duration(300)} className="mb-6 size-20 items-center justify-center rounded-full bg-[#FFF7ED]">
              <ActivityIndicator size="small" color="#EA580C" />
            </Animated.View>
            {amount && (
              <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="font-mono-semibold text-[36px] text-text-primary" style={{ letterSpacing: -1 }}>
                {amount}
              </Animated.Text>
            )}
            <Animated.Text entering={FadeInDown.delay(300).duration(400)} className="mt-3 font-subtitle text-[20px] text-text-primary">
              {title ?? 'Processing'}
            </Animated.Text>
            <Animated.Text entering={FadeIn.delay(400).duration(300)} className="mt-2 text-center font-body text-[14px] leading-[20px] text-text-secondary">
              {message ?? 'Your withdrawal is being processed. This usually takes a few moments.'}
            </Animated.Text>
          </>
        )}
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} className="gap-3 px-5 pb-4">
        {status === 'failed' && onRetry && (
          <Button title="Try again" variant="black" onPress={onRetry} />
        )}
        <Button
          title={status === 'failed' && onRetry ? 'Go home' : 'Done'}
          variant={status === 'failed' && onRetry ? 'white' : 'black'}
          onPress={goHome}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
