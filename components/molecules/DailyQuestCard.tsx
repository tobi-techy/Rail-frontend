import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { Icon } from '../atoms/Icon';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../design/tokens';

export interface DailyQuestCardProps {
  id: string;
  title: string;
  progress: number;
  total: number;
  rewardIcon?: string;
  rewardColor?: string;
  onPress?: () => void;
  className?: string;
}

export const DailyQuestCard: React.FC<DailyQuestCardProps> = ({
  id,
  title,
  progress,
  total,
  rewardIcon = 'gift',
  rewardColor = colors.accent.limeGreen,
  onPress,
  className,
}) => {
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;
  const isCompleted = progress >= total;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={className}
    >
      <Card
        variant="default"
        padding="medium"
        style={[
          shadows.sm,
          {
            backgroundColor: colors.background.main,
            borderWidth: 1,
            borderColor: colors.border.primary,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side: Title and Progress */}
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text
              className="font-body-medium text-body-base text-text-primary"
              style={{ marginBottom: spacing.xs }}
              numberOfLines={2}
            >
              {title}
            </Text>
            
            <View style={{ marginBottom: spacing.xs }}>
              <ProgressBar
                progress={progressPercentage}
                height={6}
                progressColor={isCompleted ? colors.semantic.success : colors.primary.lavender}
                backgroundColor={colors.surface.card}
              />
            </View>
            
            <Text className="font-heading text-body-xs text-text-secondary">
              {progress} / {total}
            </Text>
          </View>

          {/* Right side: Reward Icon */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: rewardColor,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.sm,
            }}
          >
            <Icon
              name={rewardIcon}
              library="ionicons"
              size={20}
              color={colors.text.onAccent}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
