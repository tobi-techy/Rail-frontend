import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { Icon } from '../atoms/Icon';
import { RewardClaimAnimation } from '../atoms/RewardClaimAnimation';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';

export interface QuestProgressProps {
  title: string;
  description: string;
  progress: number; // 0-100
  totalSteps: number;
  currentStep: number;
  reward?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeRemaining?: string;
  isCompleted?: boolean;
  canClaimReward?: boolean;
  onPress?: () => void;
  onRewardClaim?: () => Promise<boolean>;
  className?: string;
  testID?: string;
}

export const QuestProgress: React.FC<QuestProgressProps> = ({
  title,
  description,
  progress,
  totalSteps,
  currentStep,
  reward,
  difficulty = 'medium',
  timeRemaining,
  isCompleted = false,
  canClaimReward = false,
  onPress,
  onRewardClaim,
  className,
  testID,
}) => {
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  const handleRewardClaim = async () => {
    if (!onRewardClaim || !canClaimReward) return;
    
    setIsClaimingReward(true);
    try {
      const success = await onRewardClaim();
      if (success) {
        setShowRewardAnimation(true);
      }
    } catch (error) {
      console.error('Failed to claim quest reward:', error);
    } finally {
      setIsClaimingReward(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowRewardAnimation(false);
  };
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return colors.semantic.success;
      case 'hard':
        return colors.semantic.danger;
      default:
        return colors.semantic.warning;
    }
  };

  const getDifficultyIcon = () => {
    switch (difficulty) {
      case 'easy':
        return 'star';
      case 'hard':
        return 'flame';
      default:
        return 'trophy';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Quest: ${title}, ${progress}% complete`}
    >
      <Card className={`p-4 ${className || ''}`}>
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text
              style={{
                fontFamily: typography.fonts.primary,
                fontSize: typography.styles.h3.size,
                fontWeight: typography.weights.bold,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              }}
            >
              {title}
            </Text>
            
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.body.size,
                color: colors.text.secondary,
                lineHeight: typography.lineHeights.normal * typography.styles.body.size,
              }}
            >
              {description}
            </Text>
          </View>

          {/* Difficulty Badge */}
          <View
            className="flex-row items-center px-2 py-1 rounded-full"
            style={{
              backgroundColor: getDifficultyColor(),
            }}
          >
            <Icon
              name={getDifficultyIcon()}
              library="ionicons"
              size={12}
              color={colors.text.onPrimary}
            />
            <Text
              className="ml-1"
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: 10,
                fontWeight: typography.weights.semibold,
                color: colors.text.onPrimary,
                textTransform: 'uppercase',
              }}
            >
              {difficulty}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.weights.medium,
                color: colors.text.primary,
              }}
            >
              Progress: {currentStep}/{totalSteps}
            </Text>
            
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.weights.semibold,
                color: colors.primary.lavender,
              }}
            >
              {progress}%
            </Text>
          </View>
          
          <ProgressBar
            progress={progress}
            height={8}
            progressColor={colors.primary.lavender}
            backgroundColor={colors.surface.card}
          />
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {reward && (
              <View className="flex-row items-center mr-4">
                <Icon
                  name="gift"
                  library="ionicons"
                  size={16}
                  color={colors.accent.limeGreen}
                />
                <Text
                  className="ml-1"
                  style={{
                    fontFamily: typography.fonts.secondary,
                    fontSize: typography.styles.caption.size,
                    fontWeight: typography.weights.medium,
                    color: colors.text.secondary,
                  }}
                >
                  {reward}
                </Text>
              </View>
            )}

            {timeRemaining && (
              <View className="flex-row items-center">
                <Icon
                  name="time"
                  library="ionicons"
                  size={16}
                  color={colors.text.tertiary}
                />
                <Text
                  className="ml-1"
                  style={{
                    fontFamily: typography.fonts.secondary,
                    fontSize: typography.styles.caption.size,
                    color: colors.text.tertiary,
                  }}
                >
                  {timeRemaining}
                </Text>
              </View>
            )}
          </View>

          {/* Reward Claim Button */}
          {canClaimReward && isCompleted && reward && (
            <TouchableOpacity
              onPress={handleRewardClaim}
              disabled={isClaimingReward}
              className={`px-3 py-2 rounded-full flex-row items-center ${isClaimingReward ? 'opacity-70' : ''}`}
              style={{
                backgroundColor: colors.accent.limeGreen,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Claim reward: ${reward}`}
            >
              {isClaimingReward ? (
                <Icon
                  name="hourglass"
                  library="ionicons"
                  size={14}
                  color={colors.text.onPrimary}
                />
              ) : (
                <Icon
                  name="gift"
                  library="ionicons"
                  size={14}
                  color={colors.text.onPrimary}
                />
              )}
              <Text
                className="ml-1"
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.weights.semibold,
                  color: colors.text.onPrimary,
                }}
              >
                {isClaimingReward ? 'Claiming...' : 'Claim'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reward Claim Animation */}
        <RewardClaimAnimation
          isVisible={showRewardAnimation}
          rewardText={reward || ''}
          rewardIcon="gift"
          onAnimationComplete={handleAnimationComplete}
          testID="quest-reward-animation"
        />
      </Card>
    </TouchableOpacity>
  );
};