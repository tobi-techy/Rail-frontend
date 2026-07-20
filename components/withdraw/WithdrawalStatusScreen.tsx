import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { playUISound } from '@/lib/uiSounds';
import { Button } from '@/components/ui';
import { Confetti } from '@/components/ai/Confetti';
import { AnimatedStatusIcon } from './AnimatedStatusIcon';

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
  // Confetti burst controller — a second wave re-fires ~1.3s in so success
  // feels like a genuine celebration rather than a single puff.
  const [burstKey, setBurstKey] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (status === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playUISound('transactionSuccess');
      const t = setTimeout(() => setBurstKey((k) => k + 1), 1300);
      return () => clearTimeout(t);
    }
    if (status === 'failed') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [status]);

  const goHome = onDone ?? (() => router.replace('/(tabs)' as never));

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return { title: title ?? 'Sent successfully', showConfetti: true };
      case 'failed':
        return { title: title ?? 'Transfer failed', showConfetti: false };
      case 'pending':
        return { title: title ?? 'Processing', showConfetti: false };
    }
  };

  const config = getStatusConfig();

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      {config.showConfetti && !reduceMotion && (
        <>
          <Confetti burstKey={burstKey} intensity="epic" count={150} />
          <Confetti burstKey={burstKey + 1000} intensity="epic" count={110} />
        </>
      )}

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Animated line status icon (isocons style) */}
        <View className="mb-8">
          <AnimatedStatusIcon status={status} size={148} />
        </View>

        {/* Amount */}
        {amount && (
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            className="font-mono-semibold text-balance-lg text-charcoal-primary"
            style={{ letterSpacing: -2 }}>
            {amount}
          </Animated.Text>
        )}

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(400)}
          className="mt-4 font-subtitle text-[20px] text-charcoal-primary">
          {config.title}
        </Animated.Text>

        {/* Recipient */}
        {recipient && (
          <Animated.Text
            entering={FadeIn.delay(400).duration(300)}
            className="mt-2 font-body text-body text-ash">
            to {recipient}
          </Animated.Text>
        )}

        {/* Message */}
        {message && (
          <Animated.Text
            entering={FadeIn.delay(450).duration(300)}
            className="mt-6 max-w-sm text-center font-body text-body leading-6 text-ash">
            {message}
          </Animated.Text>
        )}
      </View>

      {/* Actions */}
      <Animated.View entering={FadeInUp.delay(250).duration(250)} className="px-6 pb-6">
        {status === 'failed' && onRetry ? (
          <View className="flex-row gap-3">
            <Button title="Try again" variant="black" onPress={onRetry} size="large" flex />
            <Button title="Go home" variant="ghost" onPress={goHome} size="large" flex />
          </View>
        ) : (
          <Button title="Done" variant="black" onPress={goHome} size="large" />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
