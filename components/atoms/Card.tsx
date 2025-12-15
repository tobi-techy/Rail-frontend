import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../design/tokens';

export interface CardProps extends ViewProps {
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padding = 'medium',
  className,
  children,
  style,
  ...props
}) => {
  const paddingValue = {
    none: 0,
    small: spacing.sm,
    medium: spacing.md,
    large: spacing.lg,
  }[padding];

  const cardStyle: ViewStyle = {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: paddingValue,
    ...shadows.card,
  };

  return (
    <View className={className} style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
};
