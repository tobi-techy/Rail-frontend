import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { Tick02Icon, InformationCircleIcon, Alert02Icon } from '@/lib/icons';
import type { ConfidenceLevel } from '@/utils/aiTrust';

interface Props {
  level: ConfidenceLevel;
  label: string;
  explanation: string;
  sourceCount?: number;
  onPress?: () => void;
}

const levelConfig: Record<ConfidenceLevel, { icon: any; color: string; bg: string }> = {
  high: {
    icon: Tick02Icon,
    color: '#00c454',
    bg: '#E8F5E9',
  },
  medium: {
    icon: InformationCircleIcon,
    color: '#FF9800',
    bg: '#FFF3E0',
  },
  low: {
    icon: Alert02Icon,
    color: '#ff2b3a',
    bg: '#fff1f2',
  },
};

export function ConfidenceBadge({ level, label, explanation, sourceCount, onPress }: Props) {
  const config = levelConfig[level];

  return (
    <Pressable
      onPress={onPress}
      className="mt-3 flex-row items-center gap-2 self-start rounded-full px-3 py-1.5"
      style={{ backgroundColor: config.bg }}
      accessibilityRole="button"
      accessibilityLabel={`Confidence: ${label}. ${explanation}`}>
      <HugeiconsIcon icon={config.icon} size={14} color={config.color} />
      <Text className="font-body-medium text-xs" style={{ color: config.color }}>
        {label}
      </Text>
      {sourceCount !== undefined && sourceCount > 0 && (
        <Text className="ml-1 font-body text-xs text-text-tertiary">
          · {sourceCount} source{sourceCount > 1 ? 's' : ''}
        </Text>
      )}
    </Pressable>
  );
}
