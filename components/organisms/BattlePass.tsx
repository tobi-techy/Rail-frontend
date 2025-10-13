import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { Icon } from '../atoms/Icon';
import { RewardClaimAnimation } from '../atoms/RewardClaimAnimation';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';

export interface BattlePassTier {
  id: string;
  level: number;
  reward: string;
  isUnlocked: boolean;
  isClaimed: boolean;
  isPremium?: boolean;
  icon?: string;
}

export interface BattlePassProps {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  tiers: BattlePassTier[];
  hasPremium?: boolean;
  onTierPress?: (tier: BattlePassTier) => void;
  onUpgradePress?: () => void;
  onRewardClaim?: (tier: BattlePassTier) => Promise<boolean>;
  className?: string;
  testID?: string;
}

export const BattlePass: React.FC<BattlePassProps> = ({
  currentLevel,
  currentXP,
  xpToNextLevel,
  totalXP,
  tiers,
  hasPremium = false,
  onTierPress,
  onUpgradePress,
  onRewardClaim,
  className,
  testID,
}) => {
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [claimedReward, setClaimedReward] = useState<BattlePassTier | null>(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  const progressPercentage = totalXP > 0 ? (currentXP / totalXP) * 100 : 0;

  const handleTierPress = async (tier: BattlePassTier) => {
    const canClaim = tier.isUnlocked && !tier.isClaimed;
    
    if (canClaim && onRewardClaim) {
      setIsClaimingReward(true);
      try {
        const success = await onRewardClaim(tier);
        if (success) {
          setClaimedReward(tier);
          setShowRewardAnimation(true);
        }
      } catch (error) {
        console.error('Failed to claim reward:', error);
      } finally {
        setIsClaimingReward(false);
      }
    } else if (onTierPress) {
      onTierPress(tier);
    }
  };

  const handleAnimationComplete = () => {
    setShowRewardAnimation(false);
    setClaimedReward(null);
  };

  const renderTier = (tier: BattlePassTier) => {
    const isActive = tier.level === currentLevel;
    const canClaim = tier.isUnlocked && !tier.isClaimed;
    const isCurrentlyClaiming = isClaimingReward && claimedReward?.id === tier.id;

    return (
      <TouchableOpacity
        key={tier.id}
        onPress={() => handleTierPress(tier)}
        disabled={!onTierPress && !onRewardClaim}
        className="items-center mx-2"
        accessibilityRole={onTierPress || onRewardClaim ? 'button' : undefined}
        accessibilityLabel={`Tier ${tier.level}, ${tier.reward}, ${tier.isClaimed ? 'claimed' : tier.isUnlocked ? 'available' : 'locked'}`}
      >
        <View
          className={`relative items-center justify-center w-16 h-16 rounded-full mb-2 ${isCurrentlyClaiming ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: tier.isUnlocked
              ? tier.isPremium
                ? colors.accent.limeGreen
                : colors.primary.lavender
              : colors.surface.card,
            borderWidth: isActive ? 3 : 1,
            borderColor: isActive
              ? colors.primary.lavender
              : tier.isUnlocked
              ? colors.border.primary
              : colors.border.secondary,
            opacity: isCurrentlyClaiming ? 0.7 : 1,
          }}
        >
          {tier.isClaimed && (
            <View
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.semantic.success }}
            >
              <Icon
                name="checkmark"
                library="ionicons"
                size={12}
                color={colors.text.onPrimary}
              />
            </View>
          )}

          {canClaim && (
            <View
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full items-center justify-center animate-pulse"
              style={{ backgroundColor: colors.accent.limeGreen }}
            >
              <Icon
                name="gift"
                library="ionicons"
                size={12}
                color={colors.text.onPrimary}
              />
            </View>
          )}

          <Icon
            name={tier.icon || (tier.isPremium ? 'diamond' : 'trophy')}
            library="ionicons"
            size={24}
            color={tier.isUnlocked ? colors.text.onPrimary : colors.text.tertiary}
          />
        </View>

        <Text
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: 10,
            fontWeight: typography.weights.bold,
            color: isActive ? colors.primary.lavender : colors.text.secondary,
            textAlign: 'center',
          }}
        >
          {tier.level}
        </Text>

        <Text
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.caption.size,
            color: colors.text.tertiary,
            textAlign: 'center',
            marginTop: spacing.xs,
          }}
          numberOfLines={2}
        >
          {tier.reward}
        </Text>

        {tier.isPremium && !hasPremium && (
          <View
            className="absolute top-0 left-0 right-0 bottom-0 rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.overlay,
            }}
          >
            <Icon
              name="lock-closed"
              library="ionicons"
              size={16}
              color={colors.text.onPrimary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Card className={`p-4 ${className || ''}`} testID={testID}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text
            style={{
              fontFamily: typography.fonts.primary,
              fontSize: typography.styles.h3.size,
              fontWeight: typography.weights.bold,
              color: colors.text.primary,
            }}
          >
            Battle Pass
          </Text>
          <Text
            style={{
              fontFamily: typography.fonts.secondary,
              fontSize: typography.styles.body.size,
              color: colors.text.secondary,
            }}
          >
            Level {currentLevel}
          </Text>
        </View>

        {!hasPremium && onUpgradePress && (
          <TouchableOpacity
            onPress={onUpgradePress}
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.accent.limeGreen }}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to premium battle pass"
          >
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.weights.semibold,
                color: colors.text.onPrimary,
              }}
            >
              Upgrade
            </Text>
          </TouchableOpacity>
        )}

        {hasPremium && (
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.accent.limeGreen }}
          >
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.weights.semibold,
                color: colors.text.onPrimary,
              }}
            >
              PREMIUM
            </Text>
          </View>
        )}
      </View>

      {/* Progress */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            style={{
              fontFamily: typography.fonts.secondary,
              fontSize: typography.styles.label.size,
              fontWeight: typography.weights.medium,
              color: colors.text.primary,
            }}
          >
            {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </Text>
          
          <Text
            style={{
              fontFamily: typography.fonts.secondary,
              fontSize: typography.styles.label.size,
              fontWeight: typography.weights.semibold,
              color: colors.primary.lavender,
            }}
          >
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        
        <ProgressBar
          progress={progressPercentage}
          height={8}
          progressColor={colors.primary.lavender}
          backgroundColor={colors.surface.card}
        />
      </View>

      {/* Tiers */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingHorizontal: spacing.sm }}
      >
        {tiers.map(renderTier)}
      </ScrollView>

      {/* Reward Claim Animation */}
      <RewardClaimAnimation
        isVisible={showRewardAnimation}
        rewardText={claimedReward?.reward || ''}
        rewardIcon={claimedReward?.icon || (claimedReward?.isPremium ? 'diamond' : 'trophy')}
        onAnimationComplete={handleAnimationComplete}
        testID="battle-pass-reward-animation"
      />
    </Card>
  );
};