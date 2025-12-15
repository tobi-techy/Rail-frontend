import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { Icon } from '../atoms/Icon';
import { colors, typography, spacing, shadows } from '../../design/tokens';

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
  rewardColor = colors.primary.accent,
  onPress,
  className,
}) => {
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;
  const isCompleted = progress >= total;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className={className}>
      <Card
        padding="medium"
        style={[
          shadows.card,
          {
            backgroundColor: colors.background.main,
            borderWidth: 1,
            borderColor: colors.background.surface,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text
              style={{
                fontFamily: typography.fonts.subtitle,
                fontSize: 16,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>

            <View style={{ marginBottom: spacing.xs }}>
              <ProgressBar
                progress={progressPercentage}
                height={6}
                progressColor={isCompleted ? colors.semantic.success : colors.primary.accent}
                backgroundColor={colors.background.surface}
              />
            </View>

            <Text style={{ fontFamily: typography.fonts.caption, fontSize: 12, color: colors.text.secondary }}>
              {progress} / {total}
            </Text>
          </View>

          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: rewardColor,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.card,
            }}
          >
            <Icon name={rewardIcon} library="ionicons" size={20} color="#FFFFFF" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
