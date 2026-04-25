import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CustomerServiceIcon,
  Cancel01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

interface Props {
  reason: string;
  onEscalate?: () => void;
  onDismiss?: () => void;
}

export function HumanEscalationBanner({ reason, onEscalate, onDismiss }: Props) {
  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOut.duration(200)}
      className="bg-blue-50 rounded-xl border border-blue-100 p-3.5 mt-3">
      <View className="flex-row items-start gap-2.5">
        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center shrink-0">
          <HugeiconsIcon icon={CustomerServiceIcon} size={16} color="#2196F3" />
        </View>
        <View className="flex-1">
          <Text className="font-body-medium text-sm text-blue-800">
            This action may need human review
          </Text>
          <Text className="font-body text-xs text-blue-600 mt-0.5">{reason}</Text>
          <View className="flex-row gap-3 mt-2.5">
            <Pressable
              onPress={() => {
                onEscalate?.();
                Linking.openURL('mailto:support@userail.money');
              }}
              className="flex-row items-center gap-1"
              accessibilityRole="button"
              accessibilityLabel="Escalate to support">
              <Text className="font-body-medium text-xs text-primary">Get help</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="#FF2E01" />
            </Pressable>
            <Pressable
              onPress={onDismiss}
              className="flex-row items-center gap-1"
              accessibilityRole="button"
              accessibilityLabel="Dismiss escalation banner">
              <Text className="font-body-medium text-xs text-text-tertiary">Dismiss</Text>
              <HugeiconsIcon icon={Cancel01Icon} size={12} color="#B5B5B5" />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
