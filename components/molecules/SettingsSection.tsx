import React from 'react';
import { View, Text, ViewProps } from 'react-native';

export interface SettingsSectionProps extends ViewProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  className,
  ...props
}) => {
  return (
    <View className={`mb-4 px-4 ${className || ''}`} {...props}>
      <Text
        className="mb-2 px-1 font-caption text-caption uppercase text-text-secondary"
        maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl bg-white shadow-subtle">{children}</View>
    </View>
  );
};
