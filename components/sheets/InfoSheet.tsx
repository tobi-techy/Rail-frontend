import React from 'react';
import { View, Text } from 'react-native';
import { BottomSheet } from './BottomSheet';

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
}

interface InfoSheetProps {
  visible: boolean;
  onClose: () => void;
  image?: React.ReactNode;
  title: string;
  subtitle?: string;
  rows?: InfoRowProps[];
  children?: React.ReactNode;
}

export function InfoSheet({
  visible,
  onClose,
  image,
  title,
  subtitle,
  rows,
  children,
}: InfoSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="items-center pr-8">
        {/* Image/Card */}
        {image && <View className="mb-4">{image}</View>}

        {/* Title */}
        <Text className="text-center font-subtitle text-xl text-text-primary">{title}</Text>

        {/* Subtitle */}
        {subtitle && (
          <Text className="mt-1 text-center font-caption text-[15px] text-text-secondary">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Info Rows */}
      {rows && rows.length > 0 && (
        <View className="mt-6">
          {rows.map((row, index) => (
            <View key={index} className="flex-row items-center justify-between py-3">
              <Text className="font-caption text-[15px] text-text-secondary">{row.label}</Text>
              {typeof row.value === 'string' ? (
                <Text className="font-body text-[15px] text-text-primary">{row.value}</Text>
              ) : (
                row.value
              )}
            </View>
          ))}
        </View>
      )}

      {/* Custom content */}
      {children}
    </BottomSheet>
  );
}
