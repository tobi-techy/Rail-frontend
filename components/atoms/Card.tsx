import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  children: React.ReactNode;
}

const paddingClasses = {
  none: '',
  small: 'p-sm',
  medium: 'p-md',
  large: 'p-lg',
} as const;

export const Card: React.FC<CardProps> = ({
  padding = 'medium',
  className,
  children,
  ...props
}) => (
  <View
    className={`rounded-md bg-surface shadow-card ${paddingClasses[padding]} ${className || ''}`}
    {...props}>
    {children}
  </View>
);
