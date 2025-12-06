import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
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

export interface BattlePassCardProps {
  title: string;
  duration: string;
  progress: number;
  total: number;
  rewardText: string;
  avatarUrl?: string;
  onPress?: () => void;
  className?: string;
}

export const BattlePassCard: React.FC<BattlePassCardProps> = ({
  title,
  duration,
  progress,
  total,
  rewardText,
  avatarUrl,
  onPress,
  className,
}) => {
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={className}
    >
      <Card
        variant="default"
        padding="medium"
        style={[
          shadows.md,
          {
            backgroundColor: colors.primary.lavender,
            borderWidth: 0,
          },
          {paddingTop: spacing.xxl}
        ]}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
          }}
        >
          {/* Left side: Month tag and title */}
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <View
              style={{
                backgroundColor: colors.background.main,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                alignSelf: 'flex-start',
                marginBottom: spacing.xs,
              }}
            >
              <Text className="font-body-medium text-body-xs text-text-primary uppercase">
                {duration}
              </Text>
            </View>
            
            <Text 
              className="font-display text-heading-md text-text-on-primary mb-1"
              style={{ marginBottom: spacing.xs }}
            >
              {title}
            </Text>
            
            <Text className="font-body text-body-sm text-text-on-primary opacity-90">
              {duration} DAYS
            </Text>
          </View>

          {/* Right side: Avatar */}
          {avatarUrl && (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.background.main,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.sm,
              }}
            >
              <Image
                source={{ uri: avatarUrl }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                }}
              />
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View
          style={{
            backgroundColor: colors.background.main,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.sm,
          }}
        >
          <Text 
            className="font-body-medium text-body-sm text-text-primary"
            style={{ marginBottom: spacing.xs }}
          >
            {rewardText}
          </Text>
          
          <View style={{ marginBottom: spacing.xs }}>
            <ProgressBar
              progress={progressPercentage}
              height={8}
              progressColor={colors.accent.limeGreen}
              backgroundColor={colors.surface.card}
            />
          </View>
          
          <Text className="font-body text-body-xs text-text-secondary">
            {progress} / {total}
          </Text>
        </View>

        {/* Milestone Icons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {[1, 2, 3].map((milestone) => (
            <View
              key={milestone}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.text.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name="lock"
                library="ionicons"
                size={12}
                color={colors.background.main}
              />
            </View>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
};
