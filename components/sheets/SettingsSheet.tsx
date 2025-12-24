import React from 'react';
import { View, Text, Switch } from 'react-native';
import { BottomSheet } from './BottomSheet';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  preview?: React.ReactNode;
  toggleLabel?: string;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  children?: React.ReactNode;
}

export function SettingsSheet({
  visible,
  onClose,
  title,
  subtitle,
  preview,
  toggleLabel,
  toggleValue,
  onToggleChange,
  children,
}: SettingsSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header - left aligned */}
      <View className="mb-4 pr-8">
        <Text className="font-subtitle text-xl text-text-primary">{title}</Text>
        {subtitle && (
          <Text className="mt-1 font-caption text-[15px] leading-5 text-text-secondary">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Preview card */}
      {preview && <View className="mb-4 rounded-md bg-surface p-4">{preview}</View>}

      {/* Custom content */}
      {children}

      {/* Toggle */}
      {toggleLabel && onToggleChange && (
        <View className="mt-2 flex-row items-center justify-between py-4">
          <Text className="font-body text-base text-text-primary">{toggleLabel}</Text>
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: '#E5E5E5', true: '#121212' }}
            thumbColor="#FFFFFF"
          />
        </View>
      )}
    </BottomSheet>
  );
}
