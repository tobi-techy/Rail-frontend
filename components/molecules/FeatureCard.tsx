import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Card } from '../atoms/Card';
import { colors, typography, spacing } from '../../design/tokens';

export interface FeatureCardProps extends ViewProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className,
  ...props
}) => {
  return (
    <Card
      variant="default"
      padding="large"
      className={`items-center text-center ${className || ''}`}
      {...props}
    >
      {/* Icon Container */}
      <View className="mb-4">
        {icon}
      </View>

      {/* Title */}
      <Text 
        className="font-bold text-h3 text-text-primary text-center mb-2"
        style={{
          fontFamily: typography.fonts.primary,
          fontSize: typography.styles.h3.size,
          color: colors.text.primary,
        }}
      >
        {title}
      </Text>

      {/* Description */}
      <Text 
        className="font-body text-body text-text-secondary text-center"
        style={{
          fontFamily: typography.fonts.secondary,
          fontSize: typography.styles.body.size,
          color: colors.text.secondary,
          lineHeight: typography.styles.body.size * typography.lineHeights.normal,
        }}
      >
        {description}
      </Text>
    </Card>
  );
};