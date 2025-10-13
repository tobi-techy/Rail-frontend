import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../design/tokens';
import { Icon } from '../atoms/Icon';

export interface RoundUpAccumulationProps extends TouchableOpacityProps {
  totalSaved: number;
  monthlyGoal?: number;
  currency?: string;
  onWithdraw?: () => void;
  onSetGoal?: () => void;
  className?: string;
  testID?: string;
}

export const RoundUpAccumulation: React.FC<RoundUpAccumulationProps> = ({
  totalSaved,
  monthlyGoal,
  currency = 'USD',
  onWithdraw,
  onSetGoal,
  className,
  testID,
  style,
  ...props
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getProgressPercentage = () => {
    if (!monthlyGoal || monthlyGoal === 0) return 0;
    return Math.min((totalSaved / monthlyGoal) * 100, 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          ...shadows.sm,
        },
        style,
      ]}
      className={className}
      testID={testID}
      disabled={!props.onPress}
      {...props}
    >
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.lg 
      }}>
        <View>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
              },
              { color: colors.text.secondary }
            ]}
          >
            ROUND-UP SAVINGS
          </Text>
          <Text
            style={[
              {
                fontFamily: typography.fonts.primary,
                fontSize: typography.styles.h2.size,
                fontWeight: typography.styles.h2.weight,
                marginTop: spacing.xs,
              },
              { color: colors.text.primary }
            ]}
          >
            {formatCurrency(totalSaved)}
          </Text>
        </View>

        <View style={{
          backgroundColor: colors.accent.limeGreen + '20', // 20% opacity
          borderRadius: borderRadius.full,
          padding: spacing.md,
        }}>
          <Icon
            name="trending-up"
            library="ionicons"
            size={24}
            color={colors.accent.limeGreen}
          />
        </View>
      </View>

      {/* Progress Bar (if goal is set) */}
      {monthlyGoal && monthlyGoal > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: spacing.xs 
          }}>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                },
                { color: colors.text.secondary }
              ]}
            >
              Monthly Goal Progress
            </Text>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                },
                { color: colors.text.secondary }
              ]}
            >
              {Math.round(progressPercentage)}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{
            backgroundColor: colors.surface.light,
            height: 8,
            borderRadius: borderRadius.sm,
            overflow: 'hidden',
          }}>
            <View style={{
              backgroundColor: colors.accent.limeGreen,
              height: '100%',
              width: `${progressPercentage}%`,
              borderRadius: borderRadius.sm,
            }} />
          </View>

          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
                marginTop: spacing.xs,
              },
              { color: colors.text.secondary }
            ]}
          >
            Goal: {formatCurrency(monthlyGoal)}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {onWithdraw && totalSaved > 0 && (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.surface.light,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onWithdraw}
            testID={`${testID}-withdraw`}
          >
            <Icon
              name="arrow-down"
              library="ionicons"
              size={16}
              color={colors.text.primary}
              style={{ marginRight: spacing.xs }}
            />
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.label.size,
                  fontWeight: typography.styles.label.weight,
                },
                { color: colors.text.primary }
              ]}
            >
              Withdraw
            </Text>
          </TouchableOpacity>
        )}

        {onSetGoal && (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: monthlyGoal ? colors.surface.light : colors.primary.lavender,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onSetGoal}
            testID={`${testID}-set-goal`}
          >
            <Icon
              name={monthlyGoal ? "settings" : "target"}
              library="ionicons"
              size={16}
              color={monthlyGoal ? colors.text.primary : colors.text.primary}
              style={{ marginRight: spacing.xs }}
            />
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.label.size,
                  fontWeight: typography.styles.label.weight,
                },
                { color: monthlyGoal ? colors.text.primary : colors.text.primary }
              ]}
            >
              {monthlyGoal ? 'Edit Goal' : 'Set Goal'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Achievement Badge */}
      {monthlyGoal && progressPercentage >= 100 && (
        <View style={{
          backgroundColor: colors.accent.limeGreen + '20', // 20% opacity
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginTop: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Icon
            name="trophy"
            library="ionicons"
            size={20}
            color={colors.accent.limeGreen}
            style={{ marginRight: spacing.md }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.primary,
                  fontSize: typography.styles.label.size,
                  fontWeight: typography.styles.label.weight,
                },
                { color: colors.accent.limeGreen }
              ]}
            >
              Goal Achieved! 🎉
            </Text>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                },
                { color: colors.text.secondary }
              ]}
            >
              You've reached your monthly savings goal
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};