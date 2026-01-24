import React from 'react';
import { View, Text, Switch } from 'react-native';
import { BottomSheet } from './BottomSheet';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  illustration?: React.ReactNode;
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
  illustration,
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
      {/* Illustration */}
      {illustration && <View className="mb-4 items-center">{illustration}</View>}

      {/* Header - left aligned when no illustration, centered with illustration */}
      <View className={`mb-4 pr-8 ${illustration ? 'items-center' : ''}`}>
        <Text
          className={`font-subtitle text-xl text-text-primary ${illustration ? 'text-center' : ''}`}>
          {title}
        </Text>
        {subtitle && (
          <Text
            className={`mt-1 font-caption text-[15px] leading-5 text-text-secondary ${illustration ? 'text-center' : ''}`}>
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
          <Text className="font-subtitle text-lg text-text-primary">{toggleLabel}</Text>
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
