import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  Alert01Icon,
} from '@hugeicons/core-free-icons';
import type { HubAction } from '@/stores/miriamHubStore';

interface Props {
  action: HubAction;
  onPress?: () => void;
}

const statusConfig: Record<
  string,
  { icon: any; color: string; bg: string; label: string }
> = {
  confirmed: {
    icon: CheckmarkCircle01Icon,
    color: '#00C853',
    bg: '#E8F5E9',
    label: 'Done',
  },
  pending: {
    icon: Clock01Icon,
    color: '#FF9800',
    bg: '#FFF3E0',
    label: 'Pending',
  },
  scheduled: {
    icon: Clock01Icon,
    color: '#2196F3',
    bg: '#E3F2FD',
    label: 'Scheduled',
  },
  failed: {
    icon: Alert01Icon,
    color: '#EF4444',
    bg: '#FEE2E2',
    label: 'Failed',
  },
};

export function ActionLogCard({ action, onPress }: Props) {
  const config = statusConfig[action.status] ?? statusConfig.pending;
  const date = new Date(action.createdAt);

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="bg-white rounded-xl border border-black/[0.06] mb-2 overflow-hidden">
      <Pressable
        onPress={onPress}
        className="p-3.5 flex-row items-center gap-3"
        accessibilityRole="button"
        accessibilityLabel={`${action.description}, ${config.label}`}>
        <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: config.bg }}>
          <HugeiconsIcon icon={config.icon} size={18} color={config.color} />
        </View>
        <View className="flex-1">
          <Text className="font-body-medium text-sm text-text-primary" numberOfLines={1}>
            {action.description}
          </Text>
          <Text className="font-body text-xs text-text-tertiary mt-0.5">
            {date.toLocaleDateString()} · {config.label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
