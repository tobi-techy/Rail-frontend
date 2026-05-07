import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { Confetti } from '@/components/atoms/Confetti';
import { CheckmarkCircle02Icon, Cancel01Icon, Clock01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

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

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckmarkCircle02Icon,
          iconColor: '#00C853',
          iconBg: '#E8F5E9',
          title: title ?? 'Sent successfully',
          showConfetti: true,
        };
      case 'failed':
        return {
          icon: Cancel01Icon,
          iconColor: '#EF4444',
          iconBg: '#FEF2F2',
          title: title ?? 'Transfer failed',
          showConfetti: false,
        };
      case 'pending':
        return {
          icon: Clock01Icon,
          iconColor: '#F59E0B',
          iconBg: '#FFF7ED',
          title: title ?? 'Processing',
          showConfetti: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {config.showConfetti && <Confetti />}

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Status Icon */}
        <Animated.View 
          entering={FadeIn.delay(100).duration(400)} 
          className="mb-8 size-24 items-center justify-center rounded-full"
          style={{ backgroundColor: config.iconBg }}
        >
          <HugeiconsIcon icon={config.icon} size={44} color={config.iconColor} strokeWidth={2} />
        </Animated.View>

        {/* Amount */}
        {amount && (
          <Animated.Text 
            entering={FadeInDown.delay(200).duration(400)} 
            className="font-mono-semibold text-balance-lg text-charcoal-primary"
            style={{ letterSpacing: -2 }}
          >
            {amount}
          </Animated.Text>
        )}

        {/* Title */}
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(400)} 
          className="mt-4 font-headline text-headline-1 text-charcoal-primary"
        >
          {config.title}
        </Animated.Text>

        {/* Recipient */}
        {recipient && (
          <Animated.Text 
            entering={FadeIn.delay(400).duration(300)} 
            className="mt-2 font-body text-body text-ash"
          >
            to {recipient}
          </Animated.Text>
        )}

        {/* Message */}
        {message && (
          <Animated.Text 
            entering={FadeIn.delay(450).duration(300)} 
            className="mt-6 max-w-sm text-center font-body text-body leading-6 text-ash"
          >
            {message}
          </Animated.Text>
        )}
      </View>

      {/* Actions */}
      <Animated.View 
        entering={SlideInUp.delay(500).duration(400)} 
        className="px-6 pb-6"
      >
        {status === 'failed' && onRetry ? (
          <View className="flex-row gap-3">
            <Button 
              title="Try again" 
              variant="black" 
              onPress={onRetry}
              size="large"
              flex
            />
            <Button 
              title="Go home" 
              variant="ghost" 
              onPress={goHome}
              size="large"
              flex
            />
          </View>
        ) : (
          <Button 
            title="Done" 
            variant="black" 
            onPress={goHome}
            size="large"
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
