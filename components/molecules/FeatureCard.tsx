import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Card } from '../atoms/Card';
import { colors, typography } from '../../design/tokens';

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
    <Card padding="large" className={`items-center text-center ${className || ''}`} {...props}>
      <View className="mb-4">{icon}</View>

      <Text
        className="text-text-primary text-center mb-2"
        style={{ fontFamily: typography.fonts.headline2, fontSize: 18, color: colors.text.primary }}
      >
        {title}
      </Text>

      <Text
        className="text-text-secondary text-center"
        style={{ fontFamily: typography.fonts.body, fontSize: 16, color: colors.text.secondary, lineHeight: 24 }}
      >
        {description}
      </Text>
    </Card>
  );
};
