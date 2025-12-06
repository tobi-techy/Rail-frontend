import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { colors, borderRadius, spacing } from '../../design/tokens';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'quest';
  padding?: 'none' | 'small' | 'medium' | 'large';
  motion?: any; // Add this to accept motion props
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  motion,
  className,
  children,
  style,
  ...props
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.xxl,
        };
      case 'quest':
        return {
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.xl,
        };
      default:
        return {
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.xxl,
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'small':
        return { padding: 12 };
      case 'medium':
        return { padding: spacing.md };
      case 'large':
        return { padding: spacing.lg };
      default:
        return { padding: spacing.md };
    }
  };

  const combinedStyle = [getVariantStyles(), getPaddingStyles(), style];

  // Use MotiView if motion props are provided, otherwise use a regular View
  const Component = motion ? MotiView : View;

  return (
    <Component
      {...(motion || {})}
      className={className}
      style={combinedStyle}
      {...props}
    >
      {children}
    </Component>
  );
};
