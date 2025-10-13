import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../design/tokens';
import { Icon } from '../atoms/Icon';

export interface SpendableBalanceProps extends TouchableOpacityProps {
  balance: number;
  currency?: string;
  isLoading?: boolean;
  onAddFunds?: () => void;
  onViewDetails?: () => void;
  className?: string;
  testID?: string;
}

export const SpendableBalance: React.FC<SpendableBalanceProps> = ({
  balance,
  currency = 'USD',
  isLoading = false,
  onAddFunds,
  onViewDetails,
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
      onPress={onViewDetails}
      disabled={!onViewDetails}
      {...props}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
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
          Available for withdrawal
        </Text>

        {onViewDetails && (
          <Icon
            name="chevron-forward"
            library="ionicons"
            size={16}
            color={colors.text.secondary}
          />
        )}
      </View>

      {/* Balance Display */}
      <View style={{ marginBottom: spacing.lg }}>
        {isLoading ? (
          <View style={{
            backgroundColor: colors.surface.light,
            height: 40,
            borderRadius: borderRadius.md,
            marginBottom: spacing.sm
          }} />
        ) : (
          <Text
            style={[
              {
                fontFamily: typography.fonts.primary,
                fontSize: typography.styles.h1.size,
                fontWeight: typography.styles.h1.weight,
              },
              { color: colors.text.primary }
            ]}
          >
            {formatCurrency(balance)}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={{  gap: spacing.md }}>
        {onAddFunds && (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary.lavender,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onAddFunds}
            testID={`${testID}-add-funds`}
          >
            <Icon
              name="add"
              library="ionicons"
              size={20}
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
              Add Funds
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.accent.limeGreen,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {/* Handle spend action */}}
          testID={`${testID}-spend`}
        >
          <Icon
            name="card"
            library="ionicons"
            size={20}
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
            Spend
          </Text>
        </TouchableOpacity>
      </View>

      {/* Low Balance Warning */}
      {balance < 10 && !isLoading && (
        <View style={{
          backgroundColor: colors.semantic.warning + '20', // 20% opacity
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginTop: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Icon
            name="warning"
            library="ionicons"
            size={16}
            color={colors.semantic.warning}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
                flex: 1,
              },
              { color: colors.semantic.warning }
            ]}
          >
            Low balance. Add funds to continue spending.
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
