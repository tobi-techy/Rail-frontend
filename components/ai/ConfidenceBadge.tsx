import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Tick02Icon,
  InformationCircleIcon,
  Alert02Icon,
} from '@hugeicons/core-free-icons';
import type { ConfidenceLevel } from '@/utils/aiTrust';

interface Props {
  level: ConfidenceLevel;
  label: string;
  explanation: string;
  sourceCount?: number;
  onPress?: () => void;
}

const levelConfig: Record<
  ConfidenceLevel,
  { icon: any; color: string; bg: string }
> = {
  high: {
    icon: Tick02Icon,
    color: '#00C853',
    bg: '#E8F5E9',
  },
  medium: {
    icon: InformationCircleIcon,
    color: '#FF9800',
    bg: '#FFF3E0',
  },
  low: {
    icon: Alert02Icon,
    color: '#EF4444',
    bg: '#FEE2E2',
  },
};

export function ConfidenceBadge({ level, label, explanation, sourceCount, onPress }: Props) {
  const config = levelConfig[level];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 mt-3 self-start rounded-full px-3 py-1.5"
      style={{ backgroundColor: config.bg }}
      accessibilityRole="button"
      accessibilityLabel={`Confidence: ${label}. ${explanation}`}>
      <HugeiconsIcon icon={config.icon} size={14} color={config.color} />
      <Text className="font-body-medium text-xs" style={{ color: config.color }}>
        {label}
      </Text>
      {sourceCount !== undefined && sourceCount > 0 && (
        <Text className="font-body text-xs text-text-tertiary ml-1">
          · {sourceCount} source{sourceCount > 1 ? 's' : ''}
        </Text>
      )}
    </Pressable>
  );
}
