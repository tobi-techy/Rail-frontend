import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { Button } from '../atoms/Button';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../design/tokens';

export interface QuestFeedCardProps {
  id: string;
  title: string;
  description: string;
  iconName: any;
  iconBackgroundColor?: string;
  onPress: (id: string) => void;
  className?: string;
}

export const QuestFeedCard: React.FC<QuestFeedCardProps> = ({
  id,
  title,
  description,
  iconName,
  iconBackgroundColor = `${colors.primary.lavender}20`,
  onPress,
  className,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      activeOpacity={0.8}
      className={className}
    >
      <Card
        variant="default"
        padding="small"
        style={[shadows.sm, { backgroundColor: colors.surface.card }]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side: Icon and Text */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginRight: spacing.md,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: iconBackgroundColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <Icon
                library="feather"
                name={iconName}
                size={28}
                color={colors.text.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: typography.fonts.primary,
                  fontSize: 18,
                  fontWeight: typography.weights.bold,
                  color: colors.text.primary,
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: 14,
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {description}
              </Text>
            </View>
          </View>

          {/* Right side: Button */}
          <Button
            title="Go"
            onPress={() => onPress(id)}
            variant="primary"
            size="small"
            style={{ backgroundColor: colors.text.primary, width: 70 }}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
};
